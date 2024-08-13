// IMPORTS
// -------------------------------------------
import express from "express";
import mysql from "mysql";
import cors from "cors";
import axios from "axios";
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
import { OAuth2Client } from "google-auth-library";
import bodyParser from "body-parser";
import session from "express-session";
import { google } from "googleapis";

// Load environment variables from .env file
dotenv.config();

// Constants and Configuration
// -------------------------------------------
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

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.send",
];

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Generate random password
const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8);
};

// App Setup
// -------------------------------------------
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [process.env.CLIENT_ORIGIN],
    methods: ["POST", "GET", "DELETE"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Database Setup
// -------------------------------------------
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
});

pool.on("connection", (connection) => {
  logger.info(`New database connection established with ID: ${connection.threadId}`);
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

// Middleware for User Verification
// -------------------------------------------
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Error: "You are not logged in." });
  } else {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
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

// Utility Functions
// ----------------------------------------------------

// Function to refresh access tokens using Google OAuth2
async function refreshAccessToken(oAuth2Client) {
  try {
    const results = await queryAsync(
      "SELECT REFRESH_TOKEN FROM USERS WHERE EMAIL = 'djsroka@gmail.com'"
    );

    const refreshToken = results[0].REFRESH_TOKEN;
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oAuth2Client.refreshAccessToken();
    oAuth2Client.setCredentials(credentials);

    return credentials.access_token;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
}

// Utility function to group data by month and year
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

// GET Routes
// -------------------------------------------

app.get("/auth-url", (req, res) => {
  const state = Math.random().toString(36).substring(7);
  req.session.state = state;

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    include_granted_scopes: true,
    state: state,
  });

  res.json({ authUrl });
});

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

app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (code) {
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);

      if (tokens.refresh_token) {
        await axios.post(
          `${process.env.REACT_APP_SERVER_END_POINT}/admin/refresh-token`,
          {
            id: payload.sub,
          }
        );
        console.log("Refresh token stored:", tokens.refresh_token);
      } else {
        console.error("No refresh token received");
      }

      res.send("Authentication successful! You can close this window.");
    } catch (error) {
      console.error("Error during OAuth2 callback:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.status(400).send("No code provided");
  }
});

app.get("/reauth", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  res.redirect(authUrl);
});

app.get("/client-id", (req, res) => {
  res.json({ clientId: CLIENT_ID });
});

app.get("/admin/refresh-token", async (req, res) => {
  const { id } = req.query;
  try {
    const results = await queryAsync("SELECT REFRESH_TOKEN FROM USERS WHERE ID = ?", [id]);
    res.json(results[0]);
  } catch (error) {
    console.error("Error fetching refresh token:", error);
    res.status(500).send("Error fetching refresh token");
  }
});

app.get("/admin/user-id", async (req, res) => {
  try {
    const results = await queryAsync("SELECT ID FROM USERS WHERE EMAIL = 'djsroka@gmail.com'");
    res.json(results[0]);
  } catch (error) {
    console.error("Error fetching user ID:", error);
    res.status(500).send("Error fetching user ID");
  }
});

app.get("/admin/users", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }

  try {
    const users = await queryAsync("SELECT * FROM USERS");
    res.json({ users: users || [], currentUser: req.user_ID });
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    res.status(500).send("Error fetching users");
  }
});

app.get("/admin/users/:id", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }

  const userId = req.params.id;
  try {
    const [user] = await queryAsync("SELECT * FROM USERS WHERE ID = ?", [userId]);
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

app.get("/user", verifyUser, async (req, res) => {
  const userId = req.user_ID;

  const queries = {
    expenses: "SELECT ID, USER_ID, TYPE, BILLABLE, PORCC, AMOUNT, COMMENT, MONTH FROM EXPENSES WHERE USER_ID = ?",
    files: "SELECT ID, USER_ID, NAME, PATH, MONTH FROM FILES WHERE USER_ID = ?",
    food: "SELECT ID, USER_ID, DATE, AMOUNT, LOCATION, MONTH FROM FOODEXPENSES WHERE USER_ID = ?",
    items: "SELECT ID, USER_ID, ITEM, DATE, SUBTOTAL, MONTH FROM ITEMEXPENSES WHERE USER_ID = ?",
    mileage: "SELECT ID, USER_ID, DATE, PURPOSE, MILES, MONTH FROM MILEAGEEXPENSES WHERE USER_ID = ?",
  };

  try {
    const userQuery = await queryAsync("SELECT EMAIL FROM USERS WHERE ID = ?", [userId]);
    const email = userQuery[0]?.EMAIL;

    const [expenses, files, food, items, mileage] = await Promise.all([
      queryAsync(queries.expenses, [userId]),
      queryAsync(queries.files, [userId]),
      queryAsync(queries.food, [userId]),
      queryAsync(queries.items, [userId]),
      queryAsync(queries.mileage, [userId]),
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

app.get("/admin/expense-types", verifyUser, async (req, res) => {
  try {
    const results = await queryAsync("SELECT * FROM EXPENSE_TYPES ORDER BY ORDER_INDEX");
    res.json(results);
  } catch (error) {
    res.status(500).send("Error fetching expense types");
  }
});

app.get("/user/expense-types", verifyUser, async (req, res) => {
  try {
    const results = await queryAsync("SELECT * FROM EXPENSE_TYPES ORDER BY ORDER_INDEX");
    res.json(results);
  } catch (error) {
    res.status(500).send("Error fetching expense types");
  }
});

app.get("/admin/mileage-rates", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }

  try {
    const mileageRates = await queryAsync("SELECT * FROM MILEAGE_RATES ORDER BY START_DATE DESC");
    res.json(mileageRates);
  } catch (error) {
    console.error("Error fetching mileage rates:", error);
    res.status(500).send("Error fetching mileage rates");
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

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: "Success" });
});

// POST Routes
// -------------------------------------------

app.post("/verify-token", async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await oAuth2Client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    res.json({ message: "Token verified successfully", payload });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(500).send("Error verifying token");
  }
});

app.post("/exchange-token", async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await oAuth2Client.verifyIdToken({
      idToken,
      audience: process.env.OAUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    res.json({ payload });
  } catch (error) {
    res.status(500).json({ error: "Token exchange failed" });
  }
});

app.post("/refresh-token", verifyUser, async (req, res) => {
  try {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: `Failed to refresh token ${error}` });
  }
});

app.post("/send-email", async (req, res) => {
  const { email, tempPassword, token } = req.body;
  const refreshToken = token;

  if (!refreshToken) {
    return res.status(400).send("No refresh token available. Please re-authenticate.");
  }

  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  try {
    const accessToken = await refreshAccessToken(oAuth2Client);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.MAIL_USERNAME,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: refreshToken,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: email,
      subject: "Your Temporary Password",
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h3>Your account has been created.</h3>
            <div style="border: 1px solid #ccc; padding: 10px; width: fit-content; background-color: #f9f9f9;">
              <code style="font-size: 1.2em; ">Username: <a>${req.body.email}</a></code>
            </div>
            <div style="border: 1px solid #ccc; padding: 10px; width: fit-content; background-color: #f9f9f9;">
              <code style="font-size: 1.2em;">Password: ${tempPassword}</code>
            </div>
          </div>`,
    };

    const result = await transporter.sendMail(mailOptions);
    res.status(200).send("Email sent successfully: " + result.response);
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/admin/refresh-token", verifyUser, async (req, res) => {
  const { id } = req.body;
  try {
    await queryAsync(`UPDATE USERS SET REFRESH_TOKEN = '${REFRESH_TOKEN}' WHERE ID = ?`, [id]);
    res.json({ status: "Success" });
  } catch (error) {
    console.error("Error adding refresh token:", error);
    res.status(500).send("Error adding refresh token");
  }
});

app.post("/admin/users", async (req, res) => {
  const { firstName, lastName, email, role, password, idToken } = req.body;

  if (!idToken || !email) {
    return res.status(400).json({ Error: "Invalid token or missing user data" });
  }

  try {
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: idToken.toString(),
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({ Error: "Invalid token payload" });
    }

    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password || tempPassword, 10);
    const userRole = role || "user";

    const sql = "INSERT INTO USERS (fn, ln, email, password, role, tempPassword) VALUES (?,?,?,?,?,?)";
    const values = [firstName, lastName, email, hashedPassword, userRole, true];

    await queryAsync(sql, values);
    res.json({ status: "Success", message: "User added successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ Error: "Error creating user" });
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

app.post("/admin/update-expense-types-order", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }
  const expenseTypes = req.body;

  try {
    await queryAsync("START TRANSACTION");

    for (let i = 0; i < expenseTypes.length; i++) {
      const expenseType = expenseTypes[i];
      await queryAsync("UPDATE EXPENSE_TYPES SET ORDER_INDEX = ? WHERE id = ?", [i, expenseType.id]);
    }

    await queryAsync("COMMIT");
    res.json({ status: "Order updated successfully" });
  } catch (error) {
    await queryAsync("ROLLBACK");
    res.status(500).send("Error updating order");
  }
});

app.post("/admin/mileage-rates", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }

  const { rate, startDate, endDate } = req.body;

  if (!rate || !startDate || !endDate) {
    return res.status(400).json({ Error: "Rate, start date, and end date are required" });
  }

  try {
    const sql = "INSERT INTO MILEAGE_RATES (rate, start_date, end_date) VALUES (?, ?, ?)";
    const values = [rate, startDate, endDate];

    await queryAsync(sql, values);

    res.json({ status: "Success", message: "Mileage rate added successfully" });
  } catch (error) {
    res.status(500).send("Error adding mileage rate");
  }
});

// File Upload Routes
// -------------------------------------------

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.array("uploadedFiles"), verifyUser, async (req, res) => {
  if (!req.body.email) {
    return res.json({ status: "log in first." });
  }

  const user_ID = req.user_ID;
  const checkUserQuery = "SELECT * FROM USERS WHERE ID = ?";

  try {
    await queryAsync(checkUserQuery, [user_ID]);

    const rowsData = JSON.parse(req.body.rowsData);
    const foodData = JSON.parse(req.body.foodRowsData);
    const mileageData = JSON.parse(req.body.mileageRowsData);
    const itemData = JSON.parse(req.body.itemRowsData);
    const monthData = req.body.month;
    let filesData = req.files ? req.files : req.body.files;

    for (const row of rowsData) {
      const { type, billable, porCC, amount, comment } = row;
      const sanitizedAmount = parseFloat(amount) || 0;

      await queryAsync(
        "INSERT INTO EXPENSES (user_ID, type, billable, porCC, amount, comment, month) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [user_ID, type, billable, porCC, sanitizedAmount, comment, monthData]
      );
    }

    for (const file of filesData) {
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `files/${Date.now().toString()}-${file.originalname}`,
        Body: file.buffer,
        ACL: "public-read",
      };

      const parallelUploads3 = new Upload({ client: s3Client, params: uploadParams });
      await parallelUploads3.done();

      await queryAsync(
        "INSERT INTO FILES (user_ID, name, path, month) VALUES (?, ?, ?, ?)",
        [user_ID, file.originalname, `files/${Date.now().toString()}-${file.originalname}`, monthData]
      );
    }

    res.json({ status: "Success" });
  } catch (error) {
    res.status(500).json({ status: "Error", error: "Database error" });
  }
});

// DELETE Routes
// -------------------------------------------

app.delete("/admin/users/:id", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
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

    for (let query of queries) {
      await queryAsync.call(connection, query, [userId]);
    }

    await connection.commit();
    res.json({ Status: "Success", message: "User and associated data deleted successfully" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    res.status(500).send("Error deleting user and associated data");
  } finally {
    if (connection) {
      connection.release();
    }
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
      res.status(500).send({ message: "Error deleting data" });
    });
});

// Listen on PORT
// -------------------------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Now listening on port ${PORT}`));