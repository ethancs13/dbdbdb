// IMPORTS
// -------------------------------------------
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { promisify } = require("util");
const multer = require("multer");
const path = require("path");

// Load environment variables from .env file
dotenv.config();

// ------------- app_setup -------------
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [process.env.CLIENT_ORIGIN],
    methods: ["POST", "GET", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());

// PORT
const PORT = process.env.PORT || 3001;

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
});
db.connect((err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log("Connected to MySQL as ID " + db.threadId);
});

const queryAsync = promisify(db.query).bind(db);

// AUTH LOGIC
// ----------------------------------------------------
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Error: "You are not logged in." });
  } else {
    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
      if (err) {
        return res.json({ Error: err });
      } else {
        req.email = decoded.EMAIL;
        req.fn = decoded.FN.charAt(0).toUpperCase() + decoded.FN.slice(1);
        req.ln = decoded.LN.charAt(0).toUpperCase() + decoded.LN.slice(1);
        req.user_ID = decoded.user_ID;
        req.role = decoded.ROLE;
        next();
      }
    });
  }
};

// verify_user_route
app.get("/", verifyUser, (req, res) => {
  const email = req.email;
  const fn = req.fn;
  const ln = req.ln;
  let name = fn;
  ln ? (name += " " + ln) : (name += "");

  if (email === "djsroka@gmail.com") {
    return res.json({
      status: "rootUser",
      isAuthenticated: true,
      email,
      fn: req.fn,
      ln: req.ln,
      role: req.role,
    });
  }

  return res.json({
    status: "Success",
    isAuthenticated: true,
    email,
    fn: req.fn,
    ln: req.ln,
    role: req.role,
  });
});

app.get("/check-auth", verifyUser, (req, res) => {
  res.json({ isAuthenticated: true, role: "admin" });
});

app.get("/admin/users", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }

  try {
    const users = await queryAsync("SELECT * FROM USERS");
    res.json({ users: users || [], currentUser: req.user_ID });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Error fetching users");
  }
});

app.get("/admin/users/:id", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }

  const userId = req.params.id;
  try {
    const [user] = await queryAsync("SELECT * FROM USERS WHERE ID = ?", [
      userId,
    ]);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ Error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).send("Error fetching user");
  }
});

app.delete("/admin/users/:id", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }

  const userId = req.params.id;

  const queries = [
    "DELETE FROM expenses WHERE USER_ID = ?",
    "DELETE FROM files WHERE USER_ID = ?",
    "DELETE FROM foodexpenses WHERE USER_ID = ?",
    "DELETE FROM itemexpenses WHERE USER_ID = ?",
    "DELETE FROM mileageexpenses WHERE USER_ID = ?",
    "DELETE FROM users WHERE ID = ?",
  ];

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (let query of queries) {
      await queryAsync(query, [userId], connection);
    }

    await connection.commit();
    res.json({
      Status: "Success",
      message: "User and associated data deleted successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting user and associated data:", error);
    res.status(500).send("Error deleting user and associated data");
  } finally {
    connection.release();
  }
});

app.post("/admin/users", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }

  const { fn, ln, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    let userRole = role || "user";

    const sql =
      "INSERT INTO users (fn, ln, email, password, role) VALUES (?,?,?,?,?)";
    const values = [fn, ln, email, hashedPassword, userRole];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error(err);
        return res.json({ Error: "Error when inserting data" });
      }
      return res.json({ Status: "Success", insertId: result.insertId });
    });
  } catch (error) {
    console.error(error);
    return res.json({ Error: "Error when hashing password" });
  }
});

// MULTER STORAGE
// ----------------------------------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploads = multer({ storage: storage });

app.get("/user", verifyUser, (req, res) => {
  const userId = req.user_ID;

  const queries = {
    expenses:
      "SELECT ID, USER_ID, TYPE, BILLABLE, PORCC, AMOUNT, COMMENT, MONTH FROM EXPENSES WHERE USER_ID = ?",
    files: "SELECT ID, USER_ID, NAME, PATH, MONTH FROM FILES WHERE USER_ID = ?",
    food: "SELECT ID, USER_ID, DATE, AMOUNT, LOCATION, MONTH FROM FOODEXPENSES WHERE USER_ID = ?",
    items:
      "SELECT ID, USER_ID, ITEM, DATE, SUBTOTAL, MONTH FROM ITEMEXPENSES WHERE USER_ID = ?",
    mileage:
      "SELECT ID, USER_ID, DATE, PURPOSE, MILES, MONTH FROM MILEAGEEXPENSES WHERE USER_ID = ?",
  };

  const queryDatabase = (query, params) => {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  };

  Promise.all([
    queryDatabase(queries.expenses, [userId]),
    queryDatabase(queries.files, [userId]),
    queryDatabase(queries.food, [userId]),
    queryDatabase(queries.items, [userId]),
    queryDatabase(queries.mileage, [userId]),
  ])
    .then((results) => {
      const [expenses, files, food, items, mileage] = results;
      const groupedData = groupByMonthYear({
        expenses,
        files,
        food,
        items,
        mileage,
      });
      res.json(groupedData);
    })
    .catch((err) => {
      console.error("Error fetching data:", err);
      res.status(500).send("Error fetching data");
    });
});

const groupByMonthYear = (data) => {
  const grouped = {};

  const addToGroup = (item, monthYear, category) => {
    if (!grouped[monthYear]) {
      grouped[monthYear] = {
        expenses: [],
        files: [],
        food: [],
        items: [],
        mileage: [],
      };
    }
    grouped[monthYear][category].push(item);
  };

  const categorizeByMonthYear = (items, category) => {
    items.forEach((item) => {
      const date = new Date(item["MONTH"]);
      const newDate = new Date(
        date.setMonth(date.getMonth() + 1)
      ).toLocaleDateString("default", { month: "long", year: "numeric" });
      addToGroup(item, newDate, category);
    });
  };

  categorizeByMonthYear(data.expenses, "expenses");
  categorizeByMonthYear(data.files, "files");
  categorizeByMonthYear(data.food, "food");
  categorizeByMonthYear(data.items, "items");
  categorizeByMonthYear(data.mileage, "mileage");

  const sortedGrouped = Object.fromEntries(
    Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  );
  return sortedGrouped;
};

// delete by month
app.delete("/delete-month/:month/:userId", (req, res) => {
  const user_Id = req.params.userId;
  const month = req.params.month;
  const queries = {
    expenses: `DELETE FROM EXPENSES WHERE MONTH = ? AND USER_ID = ?`,
    files: `DELETE FROM FILES WHERE MONTH = ? AND USER_ID = ?`,
    food: `DELETE FROM FOODEXPENSES WHERE MONTH = ? AND USER_ID = ?`,
    items: `DELETE FROM ITEMEXPENSES WHERE MONTH = ? AND USER_ID = ?`,
    mileage: `DELETE FROM MILEAGEEXPENSES WHERE MONTH = ? AND USER_ID = ?`,
  };

  let promises = Object.keys(queries).map((category) => {
    return new Promise((resolve, reject) => {
      db.query(queries[category], [month, user_Id], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  });

  Promise.all(promises)
    .then(() => {
      res.send({ message: `Data for ${month} deleted successfully` });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send({ message: "Error deleting data" });
    });
});

app.get("/api/user-id", verifyUser, async (req, res) => {
  const query = await db.query(
    "SELECT ID FROM USERS WHERE EMAIL = ?",
    res.req.email,
    (err, results) => {
      if (err) {
        console.error("Error getting user ID:", err);
      }
      res.json({ user_Id: results[0].ID });
    }
  );
});

// upload POST route to get files
app.post(
  "/upload",
  uploads.array("uploadedFiles"),
  verifyUser,
  async (req, res) => {
    if (!req.body.email) {
      res.json({ status: "log in first." });
      return;
    }

    const user_ID = req.user_ID;
    const checkUserQuery = "SELECT * FROM USERS WHERE ID = ?";
    db.query(checkUserQuery, [user_ID], (err, results) => {
    console.log(results)

      if (err) {
        return res.status(500).send("Server error");
      }
    });

    const rowsData = JSON.parse(req.body.rowsData);
    const foodData = JSON.parse(req.body.foodRowsData);
    const mileageData = JSON.parse(req.body.mileageRowsData);
    const itemData = JSON.parse(req.body.itemRowsData);
    const monthData = req.body.month;
    let filesData = req.files ? req.files : req.body.files;

    try {
      for (const row of rowsData) {
        const { type, billable, porCC, amount, comment } = row;
        const userId = req.user_ID;

        const sanitizedAmount = parseFloat(amount) || 0;

        await queryAsync(
          "INSERT INTO EXPENSES (USER_ID, TYPE, BILLABLE, PORCC, AMOUNT, COMMENT, MONTH) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [userId, type, billable, porCC, sanitizedAmount, comment, monthData]
        );
      }

      for (const row of foodData) {
        const dateObj = new Date(row.date);
        await queryAsync(
          "INSERT INTO FOODEXPENSES (USER_ID, DATE, AMOUNT, LOCATION, PERSONS, TITLE, PURPOSE, BILLABLE, PORCC, MONTH) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            user_ID,
            dateObj,
            row.amount,
            row.location,
            row.persons,
            row.title,
            row.purpose,
            row.billable,
            row.porCC,
            monthData,
          ]
        );
      }

      for (const row of mileageData) {
        const dateObj = new Date(row.date);
        await queryAsync(
          "INSERT INTO MILEAGEEXPENSES (USER_ID, DATE, PURPOSE, MILES, BILLABLE, AMOUNT, MONTH) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            user_ID,
            dateObj,
            row.purpose,
            row.miles,
            row.billable,
            row.amount,
            monthData,
          ]
        );
      }

      for (const row of itemData) {
        const dateObj = new Date(row.date);
        await queryAsync(
          "INSERT INTO ITEMEXPENSES (USER_ID, ITEM, DATE, SUBTOTAL, CITYTAX, TAXPERCENT, TOTAL, SOURCE, SHIPPEDFROM, SHIPPEDTO, BILLABLE, MONTH) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            user_ID,
            row.item,
            dateObj,
            row.subTotal,
            row.cityTax,
            row.taxPercent,
            row.total,
            row.source,
            row.shippedFrom,
            row.shippedTo,
            row.billable,
            monthData,
          ]
        );
      }

      for (const file of filesData) {
        await queryAsync(
          "INSERT INTO FILES (USER_ID, NAME, PATH, MONTH) VALUES (?, ?, ?, ?)",
          [user_ID, file.originalname, file.path, monthData]
        );
      }

      res.json({ status: "Success" });
    } catch (error) {
      res.status(500).json({ status: "Error", error: "Database error" });
    }
  }
);

// LOGIN ROUTE
app.post("/login", async (req, res) => {
  try {
    console.log("Login request received with email:", req.body.email);

    const [user] = await queryAsync("SELECT * FROM USERS WHERE EMAIL = ?", [
      req.body.email,
    ]);

    if (!user) {
      console.log("User not found");
      return res.status(401).send({ Status: "Unauthorized" });
    }

    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.PASSWORD
    );

    if (passwordMatch) {
      const { FN, LN, EMAIL, ID: user_ID, ROLE } = user;
      const token = jwt.sign(
        { FN, LN, EMAIL, user_ID, ROLE },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.cookie("token", token, { httpOnly: true });

      if (ROLE === "admin") {
        return res.send({ Status: "rootUser", token });
      } else {
        return res.send({ Status: "Success", token });
      }
    } else {
      console.log("Password mismatch");
      return res.status(401).send({ Status: "Unauthorized" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).send({ Status: "Error", Error: "Database error" });
  }
});

// SIGN UP ROUTES
// ----------------------------------------------------
app.post("/signup", async (req, res) => {
  const { fn, ln, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    let userRole = role || "user";
    if (email === "djsroka@gmail.com") {
      userRole = "admin";
    }

    const sql =
      "INSERT INTO USERS (fn, ln, email, password, role) VALUES (?,?,?,?,?)";
    const values = [fn, ln, email, hashedPassword, userRole];

    db.query(sql, values, (err, result) => {
      if (err) {
        return res.json({ Error: "Error when inserting data" });
      }
      return res.json({ Status: "Success" });
    });
  } catch (error) {
    return res.json({ Error: "Error when hashing password" });
  }
});

// SIGN OUT ROUTES
// ----------------------------------------------------
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: "Success" });
});
// ----------------------------------------------------

app.listen(PORT, () => console.log(`Now listening on port ${PORT}`));
