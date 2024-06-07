// IMPORTS
// -------------------------------------------
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

// bcrypt
const bcrypt = require("bcrypt");

// utils
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { promisify } = require("util");

// storage
const multer = require("multer");
// --------------------------------------------

// models
const userDataModel = require("./models/users");
const itemsModel = require("./models/itemExpenses");
const userModel = require("./models/expenses");
const foodModel = require("./models/foodExpenses");
const mileageModel = require("./models/mileageExpenses");
const path = require("path");

// ------------- app_setup -------------
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["POST", "GET"],
    credentials: true,
  })
);
app.use(cookieParser());

// PORT
const PORT = process.env.PORT || 3001;

// mysql_database_server_setup
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "por_db",
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

  const queries = {
    expenses:
      "SELECT ID, USER_ID, TYPE, BILLABLE, PORCC, AMOUNT, COMMENT FROM EXPENSES WHERE USER_ID = ?",
    files:
      "SELECT ID, USER_ID, NAME, PATH, CREATED_AT FROM FILES WHERE USER_ID = ?",
    food: "SELECT ID, USER_ID, DATE, AMOUNT, LOCATION FROM FOODEXPENSES WHERE USER_ID = ?",
    items:
      "SELECT ID, USER_ID, ITEM, DATE, SUBTOTAL FROM ITEMEXPENSES WHERE USER_ID = ?",
    mileage:
      "SELECT ID, USER_ID, DATE, PURPOSE, MILES FROM MILEAGEEXPENSES WHERE USER_ID = ?",
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
      const groupedData = groupByMonth({
        expenses,
        files,
        food,
        items,
        mileage,
      });
      console.log(groupedData);
      res.json(groupedData);
    })
    .catch((err) => {
      console.error("Error fetching data:", err);
      res.status(500).send("Error fetching data");
    });
});

const groupByMonth = (data) => {
  const grouped = {};

  const addToGroup = (item, month, category) => {
    if (!grouped[month]) {
      grouped[month] = {
        expenses: [],
        files: [],
        food: [],
        items: [],
        mileage: [],
      };
    }
    grouped[month][category].push(item);
  };

  const categorizeByMonth = (items, category, dateField) => {
    items.forEach((item) => {
      // Parse the date and check if it's valid
      const date = new Date(item[dateField]);
      if (!isNaN(date.getTime())) {
        const month = date.toISOString().slice(0, 7);
        addToGroup(item, month, category);
      } else {
        console.error(`Invalid date: ${item[dateField]}`);
      }
    });
  };

  categorizeByMonth(data.expenses, "expenses", "CREATED_AT");
  categorizeByMonth(data.files, "files", "CREATED_AT");
  categorizeByMonth(data.food, "food", "CREATED_AT");
  categorizeByMonth(data.items, "items", "CREATED_AT"); 
  categorizeByMonth(data.mileage, "mileage", "CREATED_AT"); 

  return grouped;
};

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
          "INSERT INTO expenses (user_ID, type, billable, porCC, amount, comment) VALUES (?, ?, ?, ?, ?, ?)",
          [userId, type, billable, porCC, sanitizedAmount, comment]
        );
      }

      // Insert food data
      for (const row of foodData) {
        const dateObj = new Date(row.date);
        await queryAsync(
          "INSERT INTO foodExpenses (user_ID, date, amount, location, persons, title, purpose, billable, porCC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
          ]
        );
      }

      // Insert mileage data
      for (const row of mileageData) {
        const dateObj = new Date(row.date);
        await queryAsync(
          "INSERT INTO mileageExpenses (user_ID, date, purpose, miles, billable, amount) VALUES (?, ?, ?, ?, ?, ?)",
          [user_ID, dateObj, row.purpose, row.miles, row.billable, row.amount]
        );
      }

      // Insert item data
      for (const row of itemData) {
        const dateObj = new Date(row.date);
        await queryAsync(
          "INSERT INTO itemExpenses (user_ID, item, date, subTotal, cityTax, taxPercent, total, source, shippedFrom, shippedTo, billable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
          ]
        );
      }

      // Insert files data
      for (const file of filesData) {
        await queryAsync(
          "INSERT INTO files (user_ID, name, path) VALUES (?, ?, ?)",
          [user_ID, file.originalname, file.path]
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
