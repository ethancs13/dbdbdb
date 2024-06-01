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
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Error: "You are not logged in." });
  } else {
    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
      if (err) {
        return res.json({ Error: err });
      } else {
        req.email = decoded.email;
        req.fn = decoded.fn.charAt(0).toUpperCase() + decoded.fn.slice(1);
        req.ln = decoded.ln.charAt(0).toUpperCase() + decoded.ln.slice(1);
        req.user_ID = decoded.user_ID;
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

  return res.json({ status: "Success", email: email, fn: req.fn, ln: req.ln });
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
    cb(null, __dirname + "/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
// set_location_to_storage_config
const uploads = multer({ storage: storage });

app.get("/user-info", verifyUser, async (req, res) => {
  const email = req.email;
  try {
    const fetchUserId = await queryAsync(
      "SELECT ID FROM USERS WHERE EMAIL = ?",
      email
    )
    const userId = fetchUserId[0].ID

    // Query to retrieve historical data from the database
    const [expenseData] = await queryAsync(
      "SELECT * FROM EXPENSES WHERE USER_ID = ?",
      [userId]
    );
    const [itemData] = await queryAsync(
      "SELECT * FROM ITEMEXPENSES WHERE USER_ID = ?",
      [userId]
    );
    const [foodData] = await queryAsync(
      "SELECT * FROM FOODEXPENSES WHERE USER_ID = ?",
      [userId]
    );
    const [mileageData] = await queryAsync(
      "SELECT * FROM MILEAGEEXPENSES WHERE USER_ID = ?",
      [userId]
    );
    const [filesData] = await queryAsync(
      "SELECT * FROM FILES WHERE USER_ID = ?",
      [userId]
    );

    // Combine all data and send as response
    const historyData = {
      expenses: expenseData,
      items: itemData,
      food: foodData,
      mileage: mileageData,
      files: filesData,
    };
    console.log(historyData);
    res.json(historyData);
  } catch (error) {
    console.error("Error fetching history data:", error);
    res.status(500).json({ error: "Error fetching history data" });
  }
});

app.get("/user", async (req, res) => {
  console.log(req);
  try {
    // Query to retrieve historical data from the database
    const [expenseData] = await queryAsync(
      "SELECT * FROM EXPENSES WHERE EMAIL = ?",
      [EMAIL]
    );
    const [itemData] = await queryAsync(
      "SELECT * FROM ITEMEXPENSES WHERE EMAIL = ?",
      [req.id]
    );
    const [foodData] = await queryAsync(
      "SELECT * FROM FOODEXPENSES WHERE EMAIL = ?",
      [req.id]
    );
    const [mileageData] = await queryAsync(
      "SELECT * FROM MILEAGEEXPENSES WHERE EMAIL = ?",
      [req.id]
    );
    const [filesData] = await queryAsync(
      "SELECT * FROM FILES WHERE EMAIL = ?",
      [req.id]
    );

    // Combine all data and send as response
    const historyData = {
      expenses: expenseData,
      items: itemData,
      food: foodData,
      mileage: mileageData,
      files: filesData,
    };
    console.log(historyData);
    res.json(historyData);
  } catch (error) {
    console.error("Error fetching history data:", error);
    res.status(500).json({ error: "Error fetching history data" });
  }
});

// upload POST route to get files
app.post("/upload", uploads.array("files"), verifyUser, async (req, res) => {
  if (!req.body.email) {
    res.json({ status: "log in first." });
    return;
  }

  const user_ID = req.user_ID;
  const rowsData = req.body.rowsData;
  console.log("Rows Data:", rowsData);

  const foodData = req.body.foodRowsData;
  console.log("Food Data:", foodData);

  const mileageData = req.body.mileageRowsData;
  console.log("Mileage Data:", mileageData);

  const itemData = req.body.itemRowsData;
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
      await queryAsync(
        "INSERT INTO foodExpenses (user_ID, date, amount, location, persons, title, purpose, billable, porCC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          user_ID,
          row.date,
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
      await queryAsync(
        "INSERT INTO mileageExpenses (user_ID, date, miles, purpose, billable) VALUES (?, ?, ?, ?, ?)",
        [
          user_ID,
          row.date,
          row.amount,
          row.persons,
          row.type,
          row.purpose,
          row.billable,
          row.porCC,
        ]
      );
    }

    // Insert item data
    for (const row of itemData) {
      await queryAsync(
        "INSERT INTO itemExpenses (user_ID, item, date, subTotal, cityTax, taxPercent, total, source, shippedFrom, shippedTo, billable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          user_ID,
          row.item,
          row.date,
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
});

// LOGIN ROUTES
// ----------------------------------------------------
app.post("/login", async (req, res) => {
  try {
    const [user] = await queryAsync("SELECT * FROM users WHERE email =?", [
      req.body.email,
    ]);

    if (!user) {
      return res.send({ Status: "Unauthorized" });
    }

    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (passwordMatch) {
      const fn = user.fn;
      const ln = user.ln;
      const email = user.email;
      const user_ID = user.id;
      const role = user.role;
      const token = jwt.sign(
        { fn, ln, email, user_ID, role },
        "jwt-secret-key",
        { expiresIn: "1d" }
      );
      res.cookie("token", token);

      if (role === "admin") {
        return res.send({ Status: "rootUser" });
      } else {
        return res.send({ Status: "Success" });
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
