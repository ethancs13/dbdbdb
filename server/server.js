// IMPORTS
// -------------------------------------------
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const dotenv = require("dotenv");

// bcrypt
const bcrypt = require("bcrypt");

// utils
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { promisify } = require("util");

// storage
const multer = require("multer");

// Load environment variables from .env file
dotenv.config();

// path
const path = require("path");

// ------------- app_setup -------------
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["POST", "GET", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());

// PORT
const PORT = process.env.PORT || 3001;

// mysql_database_server_setup
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE // Note the change from DB_NAME to DB_DATABASE
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
// logic_to_verify_jwt (json web token)
const verifyUser = (req, res, next) => {
  console.log("verifyUser middleware called");
  console.log("Cookies:", req.cookies);
  const token = req.cookies.token;

  if (!token) {
    console.log("No token found in cookies");
    return res.json({ Error: "You are not logged in." });
  } else {
    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
      console.log(decoded);
      if (err) {
        console.log("JWT verification error:", err);
        return res.json({ Error: err });
      } else {
        console.log("JWT verified successfully, decoded data:", decoded);
        req.email = decoded.EMAIL;
        req.fn = decoded.FN.charAt(0).toUpperCase() + decoded.FN.slice(1);
        req.ln = decoded.LN.charAt(0).toUpperCase() + decoded.LN.slice(1);
        req.user_ID = decoded.user_ID;
        next();
      }
    });
  }
};

// verify_user_route
app.get("/", verifyUser, (req, res) => {
  console.log("verifyUser passed control to route handler");
  const email = req.email;
  const fn = req.fn;
  const ln = req.ln;
  let name = fn;
  ln ? (name += " " + ln) : (name += "");

  console.log(`${name} has verified their password using ${email}.`);

  if (email === "test@test.com") {
    console.log("root user logged in");
    return res.json({
      status: "rootUser",
      email: email,
      fn: req.fn,
      ln: req.ln,
    });
  }

  return res.json({ status: "Success", email, fn: req.fn, ln: req.ln });
});
// AUTH LOGIC
// ----------------------------------------------------
app.get("/check-auth", verifyUser, (req, res) => {
  res.json({ isAuthenticated: true });
});

// MULTER STORAGE
// ----------------------------------------------------
// setup_storage_config
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
  console.log("userID", req.user_ID)

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
          console.log(results)
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
      var newDate = new Date(date.setMonth(date.getMonth() + 1)).toLocaleDateString('default', {month: 'long', year: 'numeric'});
      addToGroup(item, newDate, category);
    });
  };

  categorizeByMonthYear(data.expenses, "expenses");
  categorizeByMonthYear(data.files, "files");
  categorizeByMonthYear(data.food, "food");
  categorizeByMonthYear(data.items, "items");
  categorizeByMonthYear(data.mileage, "mileage");

  // Convert grouped object to array of [key, value] pairs, sort by key, and convert back to object
  const sortedGrouped = Object.fromEntries(
    Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  );
  console.log(sortedGrouped)
  return sortedGrouped;
};

// delete by month
app.delete("/delete-month/:month/:userId", (req, res) => {
  const user_Id = req.params.userId;
  const month = req.params.month;
  console.log("Month:", month);
  console.log("ID:", user_Id);
  const queries = {
    expenses: `DELETE FROM EXPENSES WHERE MONTH = ? AND USER_ID = ?`,
    files: `DELETE FROM FILES WHERE MONTH = ? AND USER_ID = ?`,
    food: `DELETE FROM FOODEXPENSES WHERE MONTH = ? AND USER_ID = ?`,
    items: `DELETE FROM ITEMEXPENSES WHERE MONTH = ? AND USER_ID = ?`,
    mileage: `DELETE FROM MILEAGEEXPENSES WHERE MONTH = ? AND USER_ID = ?`,
  };

  let promises = Object.keys(queries).map((category) => {
    return new Promise((resolve, reject) => {
      console.log(month, user_Id);
      db.query(queries[category], [month, user_Id], (err, results) => {
        if (err) {
          reject(err);
        } else {
          console.log(results);
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
  // console.log("USER ID ROUTE", res.req.email, req.body);
  const query = await db.query(
    "SELECT ID FROM USERS WHERE EMAIL = ?",
    res.req.email,
    (err, results) => {
      if (err) {
        console.error("Error getting user ID:", err);
      }
      console.log(results);
      res.json({user_Id: results[0].ID})
    }
  );
  

});

// upload POST route to get files
app.post(
  "/upload",
  uploads.array("uploadedFiles"),
  verifyUser,
  async (req, res) => {
    console.log("upload", res.req.email);
    if (!req.body.email) {
      res.json({ status: "log in first." });
      return;
    }

    const user_ID = req.user_ID;
    const checkUserQuery = "SELECT * FROM users WHERE ID = ?";
    db.query(checkUserQuery, [user_ID], (err, results) => {
      if (err) {
        console.error("Error checking user:", err);
        return res.status(500).send("Server error");
      }
    });

    const rowsData = JSON.parse(req.body.rowsData);
    console.log("Rows Data:", rowsData);

    const foodData = JSON.parse(req.body.foodRowsData);
    console.log("Food Data:", foodData);

    const mileageData = JSON.parse(req.body.mileageRowsData);
    console.log("Mileage Data:", mileageData);

    const itemData = JSON.parse(req.body.itemRowsData);
    console.log("Item Data:", itemData);

    const monthData = req.body.month;
    console.log("Month:", monthData);

    if (req.files) {
      var filesData = req.files;
    } else {
      var filesData = req.body.files;
    }
    console.log("Files Data:", filesData);

    // Insert data into MySQL
    try {
      // Insert data into the database
      for (const row of rowsData) {
        const { type, billable, porCC, amount, comment } = row;
        const userId = req.user_ID; // Assuming user_ID is available in the request

        // Sanitize and validate amount
        const sanitizedAmount = parseFloat(amount) || 0;

        await queryAsync(
          "INSERT INTO expenses (user_ID, type, billable, porCC, amount, comment, month) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [userId, type, billable, porCC, sanitizedAmount, comment, monthData]
        );
      }

      // Insert food data
      for (const row of foodData) {
        const dateObj = new Date(row.date);
        await queryAsync(
          "INSERT INTO foodExpenses (user_ID, date, amount, location, persons, title, purpose, billable, porCC, month) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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

      // Insert mileage data
      for (const row of mileageData) {
        const dateObj = new Date(row.date);
        await queryAsync(
          "INSERT INTO mileageExpenses (user_ID, date, purpose, miles, billable, amount, month) VALUES (?, ?, ?, ?, ?, ?, ?)",
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

      // Insert item data
      for (const row of itemData) {
        const dateObj = new Date(row.date);
        await queryAsync(
          "INSERT INTO itemExpenses (user_ID, item, date, subTotal, cityTax, taxPercent, total, source, shippedFrom, shippedTo, billable, month) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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

      // Insert files data
      for (const file of filesData) {
        await queryAsync(
          "INSERT INTO files (user_ID, name, path, month) VALUES (?, ?, ?, ?)",
          [user_ID, file.originalname, file.path, monthData]
        );
      }

      res.json({ status: "Success" });
    } catch (error) {
      console.error("Error inserting data:", error);
      res.status(500).json({ status: "Error", error: "Database error" });
    }
  }
);

// LOGIN ROUTES
// ----------------------------------------------------
app.post("/login", async (req, res) => {
  try {
    const [user] = await queryAsync("SELECT * FROM USERS WHERE EMAIL =?", [
      req.body.email,
    ]);

    if (!user) {
      return res.send({ Status: "Unauthorized" });
    }

    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.PASSWORD
    );

    if (passwordMatch) {
      const { FN, LN, EMAIL, ID: user_ID, ROLE } = user;
      console.log("userData: ", user);
      console.log(FN, LN, EMAIL, user_ID, ROLE);
      const token = jwt.sign(
        { FN, LN, EMAIL, user_ID, ROLE },
        "jwt-secret-key",
        { expiresIn: "1d" }
      );

      res.cookie("token", token, { httpOnly: true });

      if (ROLE === "admin") {
        return res.send({ Status: "rootUser", token });
      } else {
        return res.send({ Status: "Success", token });
      }
    } else {
      return res.send({ Status: "Unauthorized" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ Status: "Error", Error: "Database error" });
  }
});
// ----------------------------------------------------

// SIGN UP ROUTES
// ----------------------------------------------------
app.post("/signup", async (req, res) => {
  const { fn, ln, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    let userRole = role || "user"; // Default to 'user' if role is not provided
    if (email === "djsroka@gmail.com") {
      userRole = "admin";
    }

    const sql =
      "INSERT INTO users (fn, ln, email, password, role) VALUES (?,?,?,?,?)";
    const values = [fn, ln, email, hashedPassword, userRole];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error(err);
        return res.json({ Error: "Error when inserting data" });
      }
      return res.json({ Status: "Success" });
    });
  } catch (error) {
    console.error(error);
    return res.json({ Error: "Error when hashing password" });
  }
});
// ----------------------------------------------------

// SIGN OUT ROUTES
// ----------------------------------------------------
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: "Success" });
});
// ----------------------------------------------------

app.listen(PORT, () => console.log("Now listening"));
