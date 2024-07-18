// IMPORTS
// -------------------------------------------
import express from "express";
import mysql from "mysql";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { promisify } from "util";
import multer from "multer";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import winston from "winston";
import nodemailer from "nodemailer";

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
    clientId: process.env.OAUTH_CLIENTID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
  },
});

// Generate random password
const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8);
};

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

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
});

pool.on("connection", (connection) => {
  logger.info(
    `New database connection established with ID: ${connection.threadId}`
  );
});

pool.on("acquire", (connection) => {
  logger.info(`Connection ${connection.threadId} acquired`);
});

pool.on("release", (connection) => {
  logger.info(`Connection ${connection.threadId} released`);
});

pool.on("error", (err) => {
  logger.error(`Database connection error: ${err.message}`);
});

const queryAsync = promisify(pool.query).bind(pool);

const getConnectionAsync = promisify(pool.getConnection).bind(pool);

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
    logger.error("Access denied for non-admin user");
    return res.status(403).json({ Error: "Access denied" });
  }

  try {
    const users = await queryAsync("SELECT * FROM USERS");
    res.json({ users: users || [], currentUser: req.user_ID });
    logger.info("Fetched users successfully");
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    res.status(500).send("Error fetching users");
  }
});

app.get("/admin/users/:id", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    logger.error("Access denied for non-admin user");
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
    logger.error(`Error fetching user: ${error.message}`);
    res.status(500).send("Error fetching user");
  }
});

app.delete("/admin/users/:id", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    logger.error("Access denied for non-admin user");
    return res.status(403).json({ Error: "Access denied" });
  }

  const userId = req.params.id;

  const queries = [
    "DELETE FROM EXPENSES WHERE USER_ID = ?",
    "DELETE FROM FILES WHERE USER_ID = ?",
    "DELETE FROM FOODEXPENSES WHERE USER_ID = ?",
    "DELETE FROM ITEMEXPENSES WHERE USER_ID = ?",
    "DELETE FROM MILEAGEEXPENSES WHERE USER_ID = ?",
    "DELETE FROM USERS WHERE ID = ?",
  ];

  let connection;

  try {
    connection = await getConnectionAsync();
    await connection.beginTransaction();
    logger.info(`Transaction started for deleting user with ID: ${userId}`);

    for (let query of queries) {
      await queryAsync.call(connection, query, [userId]);
      logger.info(`Executed query: ${query}`);
    }

    await connection.commit();
    logger.info(`Transaction committed for deleting user with ID: ${userId}`);
    res.json({
      Status: "Success",
      message: "User and associated data deleted successfully",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      logger.error(
        `Transaction rollback for deleting user with ID: ${userId} due to error: ${error.message}`
      );
    }
    logger.error(`Error deleting user and associated data: ${error.message}`);
    res.status(500).send("Error deleting user and associated data");
  } finally {
    if (connection) {
      connection.release();
      logger.info(`Connection released after deleting user with ID: ${userId}`);
    }
  }
});

app.post("/admin/users", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }

  const { firstName, lastName, email, role } = req.body;
  const tempPassword = generateRandomPassword();

  try {
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const userRole = role || "user";

    const sql =
      "INSERT INTO USERS (fn, ln, email, password, role, tempPassword) VALUES (?,?,?,?,?,?)";
    const values = [firstName, lastName, email, hashedPassword, userRole, true];

    await queryAsync(sql, values);

    // Send email with temporary password
    const mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: email,
      subject: "Your Temporary Password",
      text: `Your temporary password is: ${tempPassword}. Please log in and change your password immediately.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ Error: "Error sending email" });
      } else {
        return res.json({ Status: "Success", info });
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ Error: "Error creating user" });
  }
});

// MULTER STORAGE
// ----------------------------------------------------
// Configure AWS SDK
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get("/user", verifyUser, async (req, res) => {
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

  try {
    const userQuery = await queryAsync("SELECT EMAIL FROM USERS WHERE ID = ?", [
      userId,
    ]);
    const email = userQuery[0]?.EMAIL;

    const queryDatabase = (query, params) => {
      return new Promise((resolve, reject) => {
        pool.query(query, params, (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    };

    const [expenses, files, food, items, mileage] = await Promise.all([
      queryDatabase(queries.expenses, [userId]),
      queryDatabase(queries.files, [userId]),
      queryDatabase(queries.food, [userId]),
      queryDatabase(queries.items, [userId]),
      queryDatabase(queries.mileage, [userId]),
    ]);

    const groupedData = groupByMonthYear({
      expenses,
      files,
      food,
      items,
      mileage,
    });

    res.json({ email, ...groupedData });
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Error fetching data");
  }
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
      pool.query(queries[category], [month, user_Id], (err, results) => {
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
  const query = await pool.query(
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
  upload.array("uploadedFiles"),
  verifyUser,
  async (req, res) => {
    if (!req.body.email) {
      logger.error("Upload attempt without logging in");
      res.json({ status: "log in first." });
      return;
    }

    const user_ID = req.user_ID;
    const checkUserQuery = "SELECT * FROM USERS WHERE ID = ?";

    pool.query(checkUserQuery, [user_ID], (err, results) => {
      if (err) {
        logger.error(`Server error during user check: ${err.message}`);
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
          "INSERT INTO EXPENSES (user_ID, type, billable, porCC, amount, comment, month) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [userId, type, billable, porCC, sanitizedAmount, comment, monthData]
        );
        logger.info(`Inserted expense for user ID: ${userId}`);
      }

      // Continue for other data types...

      for (const file of filesData) {
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `files/${Date.now().toString()}-${file.originalname}`,
          Body: file.buffer,
          ACL: "public-read",
        };
        const parallelUploads3 = new Upload({
          client: s3Client,
          params: uploadParams,
        });

        await parallelUploads3.done();
        logger.info(`Uploaded file to S3: ${file.originalname}`);

        await queryAsync(
          "INSERT INTO FILES (user_ID, name, path, month) VALUES (?, ?, ?, ?)",
          [
            user_ID,
            file.originalname,
            `files/${Date.now().toString()}-${file.originalname}`,
            monthData,
          ]
        );
        logger.info(`Inserted file record for user ID: ${user_ID}`);
      }

      res.json({ status: "Success" });
    } catch (error) {
      logger.error(`Database error during upload: ${error.message}`);
      res.status(500).json({ status: "Error", error: "Database error" });
    }
  }
);

// LOGIN ROUTE
app.post("/login", async (req, res) => {
  try {
    const [user] = await queryAsync("SELECT * FROM USERS WHERE EMAIL = ?", [
      req.body.email,
    ]);

    if (!user) {
      return res.status(401).send({ Status: "Unauthorized" });
    }

    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.PASSWORD
    );

    if (passwordMatch) {
      const { FN, LN, EMAIL, ID: user_ID, ROLE, TEMP_PASSWORD } = user;
      const token = jwt.sign(
        { FN, LN, EMAIL, user_ID, ROLE },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.cookie("token", token, { httpOnly: true });

      if (TEMP_PASSWORD) {
        return res.send({ Status: "ChangePassword", token });
      } else if (ROLE === "admin") {
        return res.send({ Status: "rootUser", token });
      } else {
        return res.send({ Status: "Success", token });
      }
    } else {
      return res.status(401).send({ Status: "Unauthorized" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).send({ Status: "Error", Error: "Database error" });
  }
});

app.post("/change-password", verifyUser, async (req, res) => {
  const { newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await queryAsync(
      "UPDATE USERS SET PASSWORD = ?, TEMP_PASSWORD = false WHERE ID = ?",
      [hashedPassword, req.user_ID]
    );
    return res.json({ Status: "Success" });
  } catch (error) {
    console.error("Error changing password:", error);
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

    pool.query(sql, values, (err, result) => {
      if (err) {
        return res.json({ Error: "Error when inserting data" });
      }
      return res.json({ Status: "Success" });
    });
  } catch (error) {
    return res.json({ Error: "Error when hashing password" });
  }
});

// New route for managing expense types
app.get("/admin/expense-types", verifyUser, async (req, res) => {
  try {
    const results = await queryAsync(
      "SELECT * FROM EXPENSE_TYPES ORDER BY ORDER_INDEX"
    );
    res.json(results);
  } catch (error) {
    res.status(500).send("Error fetching expense types");
  }
});
app.get("/user/expense-types", verifyUser, async (req, res) => {
  try {
    const results = await queryAsync(
      "SELECT * FROM EXPENSE_TYPES ORDER BY ORDER_INDEX"
    );
    res.json(results);
  } catch (error) {
    res.status(500).send("Error fetching expense types");
  }
});

app.post("/admin/expense-types", verifyUser, async (req, res) => {
  const { type } = req.body;
  try {
    await queryAsync("INSERT INTO EXPENSE_TYPES (type) VALUES (?)", [type]);
    res.json({ status: "Success" });
  } catch (error) {
    res.status(500).send("Error adding expense type");
  }
});

app.delete("/admin/expense-types/:id", verifyUser, async (req, res) => {
  const { id } = req.params;
  try {
    await queryAsync("DELETE FROM EXPENSE_TYPES WHERE id = ?", [id]);
    res.json({ status: "Success" });
  } catch (error) {
    res.status(500).send("Error deleting expense type");
  }
});

app.post("/admin/update-expense-types-order", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }
  const expenseTypes = req.body;

  try {
    // Begin transaction
    await queryAsync("START TRANSACTION");

    // Update each expense type's order_index
    for (let i = 0; i < expenseTypes.length; i++) {
      const expenseType = expenseTypes[i];
      await queryAsync(
        "UPDATE EXPENSE_TYPES SET ORDER_INDEX = ? WHERE id = ?",
        [i, expenseType.id]
      );
    }

    // Commit transaction
    await queryAsync("COMMIT");
    res.json({ status: "Order updated successfully" });
  } catch (error) {
    // Rollback transaction in case of error
    await queryAsync("ROLLBACK");
    console.error("Error updating order:", error);
    res.status(500).send("Error updating order");
  }
});

// Define the /admin/mileage-rates route
app.get("/admin/mileage-rates", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }

  try {
    const mileageRates = await queryAsync(
      "SELECT * FROM MILEAGE_RATES ORDER BY START_DATE DESC"
    );
    res.json(mileageRates);
  } catch (error) {
    console.error("Error fetching mileage rates:", error);
    res.status(500).send("Error fetching mileage rates");
  }
});

app.post("/admin/mileage-rates", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }

  const { rate, startDate, endDate } = req.body;

  if (!rate || !startDate || !endDate) {
    return res
      .status(400)
      .json({ Error: "Rate, start date, and end date are required" });
  }

  try {
    const sql =
      "INSERT INTO MILEAGE_RATES (rate, start_date, end_date) VALUES (?, ?, ?)";
    const values = [rate, startDate, endDate];

    await queryAsync(sql, values);

    res.json({ status: "Success", message: "Mileage rate added successfully" });
  } catch (error) {
    console.error("Error adding mileage rate:", error);
    res.status(500).send("Error adding mileage rate");
  }
});

app.get("/admin/all-submissions", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }

  try {
    const [expenses, files, food, items, mileage] = await Promise.all([
      queryAsync("SELECT * FROM EXPENSES"),
      queryAsync("SELECT * FROM FILES"),
      queryAsync("SELECT * FROM FOODEXPENSES"),
      queryAsync("SELECT * FROM ITEMEXPENSES"),
      queryAsync("SELECT * FROM MILEAGEEXPENSES"),
    ]);

    const allSubmissions = {};

    const groupByUserAndMonth = (data, category) => {
      data.forEach((item) => {
        const userId = item.USER_ID;
        const date = new Date(item.MONTH);
        const monthYear = date.toLocaleDateString("default", {
          month: "long",
          year: "numeric",
        });

        if (!allSubmissions[userId]) {
          allSubmissions[userId] = {};
        }

        if (!allSubmissions[userId][monthYear]) {
          allSubmissions[userId][monthYear] = {
            expenses: [],
            files: [],
            food: [],
            items: [],
            mileage: [],
          };
        }

        allSubmissions[userId][monthYear][category].push(item);
      });
    };

    groupByUserAndMonth(expenses, "expenses");
    groupByUserAndMonth(files, "files");
    groupByUserAndMonth(food, "food");
    groupByUserAndMonth(items, "items");
    groupByUserAndMonth(mileage, "mileage");

    res.json(allSubmissions);
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    res.status(500).send("Error fetching all submissions");
  }
});

const groupByUser = (data) => {
  const grouped = {};

  const addToGroup = (item, userId, category) => {
    if (!grouped[userId]) {
      grouped[userId] = {
        expenses: [],
        files: [],
        food: [],
        items: [],
        mileage: [],
      };
    }
    grouped[userId][category].push(item);
  };

  const categorizeByUser = (items, category) => {
    items.forEach((item) => {
      const userId = item.USER_ID;
      addToGroup(item, userId, category);
    });
  };

  categorizeByUser(data.expenses, "expenses");
  categorizeByUser(data.files, "files");
  categorizeByUser(data.food, "food");
  categorizeByUser(data.items, "items");
  categorizeByUser(data.mileage, "mileage");

  return grouped;
};

// SIGN OUT ROUTES
// ----------------------------------------------------
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: "Success" });
});
// ----------------------------------------------------

app.listen(PORT, () => console.log(`Now listening on port ${PORT}`));
