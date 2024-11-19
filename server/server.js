// IMPORTS
// -------------------------------------------
import express from "express";
import fs from "fs";
import mysql from "mysql";
import ExcelJS from "exceljs";
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
import { parse } from "json2csv";

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
    // new winston.transports.File({ filename: "combined.log" }),
  ],
});

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Generate random password
const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8);
};

// App Setup
// -------------------------------------------
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(express.json());
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
    if (!items || !Array.isArray(items)) return; // Ensure data exists and is an array
    items.forEach((item) => {
      const date = new Date(item["MONTH"]);
      const newDate = new Date(date.setMonth(date.getMonth() + 1)).toLocaleDateString("default", {
        month: "long",
        year: "numeric",
      });
      addToGroup(item, newDate, category);
    });
  };

  // Call the categorization function for each data category
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

app.get("/get-all-expenses", verifyUser, async (req, res) => {
  try {
    const [expenses, files, food, items, mileage] = await Promise.all([
      queryAsync("SELECT * FROM EXPENSES"),
      queryAsync("SELECT * FROM FILES"),
      queryAsync("SELECT * FROM FOODEXPENSES"),
      queryAsync("SELECT * FROM ITEMEXPENSES"),
      queryAsync("SELECT * FROM MILEAGEEXPENSES"),
    ]);

    const allExpenses = {
      expenses,
      files,
      food,
      items,
      mileage,
    };

    res.json(allExpenses);
  } catch (error) {
    console.error("Error fetching all expenses:", error);
    res.status(500).send("Error fetching all expenses");
  }
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

  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    // Exchange the code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Decode the ID token to extract user info
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.OAUTH_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    });

    const payload = ticket.getPayload();
    const userId = payload.sub;

    // Store the refresh token in the database (only do this the first time)
    if (tokens.refresh_token) {
      await queryAsync(`UPDATE USERS SET REFRESH_TOKEN = ? WHERE ID = ?`, [
        tokens.refresh_token,
        userId,
      ]);
      console.log("Refresh token stored:", tokens.refresh_token);
    } else {
      console.error("No refresh token received");
    }

    res.send("Authentication successful! You can close this window.");
  } catch (error) {
    console.error("Error during OAuth2 callback:", error);
    res.status(500).send("Internal Server Error");
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
    expenses:
      "SELECT ID, USER_ID, TYPE, BILLABLE, PORCC, AMOUNT, COMMENT, MONTH FROM EXPENSES WHERE USER_ID = ?",
    files: "SELECT ID, USER_ID, NAME, PATH, MONTH FROM FILES WHERE USER_ID = ?",
    food: "SELECT ID, USER_ID, DATE, AMOUNT, LOCATION, MONTH FROM FOODEXPENSES WHERE USER_ID = ?",
    items: "SELECT ID, USER_ID, ITEM, DATE, SUBTOTAL, MONTH FROM ITEMEXPENSES WHERE USER_ID = ?",
    mileage:
      "SELECT ID, USER_ID, DATE, PURPOSE, MILES, MONTH FROM MILEAGEEXPENSES WHERE USER_ID = ?",
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

app.get("/user/mileage-rates", async (req, res) => {
  try {
    const mileageRates = await queryAsync("SELECT * FROM MILEAGE_RATES ORDER BY START_DATE DESC");
    console.log("Mileage Rates: ", mileageRates);
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

app.get("/google-profile", async (req, res) => {
  const accessToken = req.query.accessToken;
  console.log("Received Access Token:", accessToken);

  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" });
  }

  try {
    const response = await axios.get("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    res.json(response.data); // Send the profile data to the frontend
  } catch (error) {
    console.error(
      "Error fetching Google profile:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Failed to fetch profile from Google",
      details: error.message,
    });
  }
});

app.get("/user-profile", async (req, res) => {
  const userId = req.query.userId; // Assuming userId is sent in the query params

  try {
    const result = await queryAsync("SELECT PROFILE_IMG_URL FROM USERS WHERE ID = ?", [userId]);

    if (result.length > 0) {
      const profileImageUrl = result[0].profile_image_url;
      res.json({ profileImageUrl });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

app.get("/download-excel", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Please provide both start and end dates." });
  }

  try {
    // Format dates to match the database's date format
    const formattedStartDate = new Date(startDate).toISOString().slice(0, 7); // Format: YYYY-MM
    const formattedEndDate = new Date(endDate).toISOString().slice(0, 7); // Format: YYYY-MM

    // Queries for each table with a JOIN to get the expense type name and user's full name
    const tables = {
      expenses: `
        SELECT e.*, et.TYPE AS EXPENSE_TYPE, CONCAT(u.FN, ' ', u.LN) AS USER_NAME
        FROM EXPENSES e
        LEFT JOIN EXPENSE_TYPES et ON e.TYPE = et.ID
        LEFT JOIN USERS u ON e.USER_ID = u.ID
        WHERE e.MONTH BETWEEN ? AND ?
      `,
      files: `
        SELECT f.*, CONCAT(u.FN, ' ', u.LN) AS USER_NAME
        FROM FILES f
        LEFT JOIN USERS u ON f.USER_ID = u.ID
        WHERE f.MONTH BETWEEN ? AND ?
      `,
      food_expenses: `
        SELECT fe.*, CONCAT(u.FN, ' ', u.LN) AS USER_NAME
        FROM FOODEXPENSES fe
        LEFT JOIN USERS u ON fe.USER_ID = u.ID
        WHERE fe.MONTH BETWEEN ? AND ?
      `,
      item_expenses: `
        SELECT ie.*, CONCAT(u.FN, ' ', u.LN) AS USER_NAME
        FROM ITEMEXPENSES ie
        LEFT JOIN USERS u ON ie.USER_ID = u.ID
        WHERE ie.MONTH BETWEEN ? AND ?
      `,
      mileage_expenses: `
        SELECT me.*, CONCAT(u.FN, ' ', u.LN) AS USER_NAME
        FROM MILEAGEEXPENSES me
        LEFT JOIN USERS u ON me.USER_ID = u.ID
        WHERE me.MONTH BETWEEN ? AND ?
      `,
    };

    // Initialize a new workbook
    const workbook = new ExcelJS.Workbook();

    // Retrieve data for each table and add it to a separate sheet
    for (const [sheetName, query] of Object.entries(tables)) {
      const rows = await queryAsync(query, [formattedStartDate, formattedEndDate]);

      // If there’s data, add a new sheet for this table
      if (rows && rows.length > 0) {
        const worksheet = workbook.addWorksheet(
          sheetName.charAt(0).toUpperCase() + sheetName.slice(1)
        );

        // Ensure there are no undefined or problematic values in the rows
        const cleanRows = rows.map((row) => {
          return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value ?? ""]));
        });

        // Filter out unwanted columns: 'ID', 'USER_ID', and 'TYPE'
        const filteredKeys = Object.keys(cleanRows[0]).filter(
          (key) => key !== "ID" && key !== "USER_ID" && key !== "TYPE"
        );

        // Reorder columns to have 'USER_NAME' first, 'EXPENSE_TYPE' second, then the rest
        const orderedKeys = [
          "USER_NAME",
          "EXPENSE_TYPE",
          ...filteredKeys.filter((key) => key !== "USER_NAME" && key !== "EXPENSE_TYPE"),
        ];

        // Define columns based on the ordered keys
        worksheet.columns = orderedKeys.map((key) => ({ header: key, key }));

        // Add all rows to the sheet with only filtered data in the correct order
        cleanRows.forEach((row) => {
          const orderedRow = orderedKeys.reduce((acc, key) => {
            acc[key] = row[key];
            return acc;
          }, {});
          worksheet.addRow(orderedRow);
        });
      }
    }

    // Define Excel file name
    const fileName = "export.xlsx";

    // Set headers to ensure it's treated as an Excel file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Send the workbook to the response directly (ensure proper streaming)
    await workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error writing workbook to response:", error);
        res.status(500).json({ error: "Failed to write Excel file." });
      });
  } catch (error) {
    console.error("Error generating Excel file:", error);
    res.status(500).json({ error: "Failed to export data to Excel." });
  }
});

// POST Routes
// -------------------------------------------
// login route
app.post("/login", async (req, res) => {
  try {
    const [user] = await queryAsync("SELECT * FROM USERS WHERE EMAIL = ?", [req.body.email]);

    if (!user) {
      return res.status(401).send({ Status: "Unauthorized" });
    }

    const passwordMatch = await bcrypt.compare(req.body.password, user.PASSWORD);

    if (passwordMatch) {
      const { FN, LN, EMAIL, ID: user_ID, ROLE, tempPassword } = user;
      const token = jwt.sign({ FN, LN, EMAIL, user_ID, ROLE }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.cookie("token", token, { httpOnly: true });
      console.log(tempPassword, "temp pass");

      if (tempPassword) {
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
    await queryAsync("UPDATE USERS SET PASSWORD = ?, tempPassword = false WHERE ID = ?", [
      hashedPassword,
      req.user_ID,
    ]);
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

    const sql = "INSERT INTO USERS (fn, ln, email, password, role) VALUES (?,?,?,?,?)";
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
    const response = await axios
      .post("https://oauth2.googleapis.com/token", {
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        refresh_token: REFRESH_TOKEN,
        grant_type: "refresh_token",
      })
      .then((response) => {
        res.json(response.data);
      })
      .catch((error) => {
        if (error.response) {
          // Server responded with a status other than 2xx
          console.error("Error response from provider:", error.response.data);
          res.status(500).json({ error: `Provider error: ${error.response.data}` });
        } else if (error.request) {
          // No response was received
          console.error("No response received from provider:", error.request);
          res.status(500).json({ error: "No response received from provider" });
        } else {
          // Something else went wrong
          console.error("Error setting up request:", error.message);
          res.status(500).json({ error: `Request error: ${error.message}` });
        }
      });
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

    const sql =
      "INSERT INTO USERS (fn, ln, email, password, role, tempPassword) VALUES (?,?,?,?,?,?)";
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
    // Get the highest current order_index
    const results = await queryAsync("SELECT MAX(order_index) AS maxIndex FROM EXPENSE_TYPES");
    const maxIndex = results[0].maxIndex || 0;
    const newOrderIndex = maxIndex + 1;

    // Insert the new expense type with the new order_index
    await queryAsync("INSERT INTO EXPENSE_TYPES (type, order_index) VALUES (?, ?)", [
      type,
      newOrderIndex,
    ]);
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
      await queryAsync("UPDATE EXPENSE_TYPES SET ORDER_INDEX = ? WHERE id = ?", [
        i,
        expenseType.id,
      ]);
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

// Route to add mileage expense with auto calculation of amount
app.post("/user/mileage-expenses", verifyUser, async (req, res) => {
  const { user_ID, date, purpose, miles, billable } = req.body;

  if (!date || !miles || !purpose) {
    return res.status(400).json({ Error: "Date, miles, and purpose are required" });
  }

  try {
    // Fetch the applicable mileage rate for the given date
    const mileageRateQuery = `
      SELECT RATE 
      FROM MILEAGE_RATES 
      WHERE START_DATE <= ? AND (END_DATE IS NULL OR END_DATE >= ?) 
      ORDER BY START_DATE DESC 
      LIMIT 1
    `;
    const [mileageRate] = await queryAsync(mileageRateQuery, [date, date]);

    if (!mileageRate) {
      return res.status(404).json({ Error: "No applicable mileage rate found for the given date" });
    }

    const rate = parseFloat(mileageRate.RATE);
    const calculatedAmount = rate * parseFloat(miles);

    // Insert the mileage expense
    const insertMileageExpenseQuery = `
      INSERT INTO MILEAGEEXPENSES (USER_ID, DATE, PURPOSE, MILES, BILLABLE, AMOUNT)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await queryAsync(insertMileageExpenseQuery, [
      user_ID,
      date,
      purpose,
      miles,
      billable,
      calculatedAmount,
    ]);

    res.json({ status: "Success", message: "Mileage expense added successfully" });
  } catch (error) {
    console.error("Error adding mileage expense:", error);
    res.status(500).send("Error adding mileage expense");
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
    return res.json({ status: "Please log in first." });
  }

  const user_ID = req.user_ID;
  const checkUserQuery = "SELECT * FROM USERS WHERE ID = ?";

  try {
    const userResult = await queryAsync(checkUserQuery, [user_ID]);
    if (!userResult.length) {
      return res.status(404).json({ status: "User not found." });
    }

    // Parsing the JSON data from the request body
    const rowsData = JSON.parse(req.body.rowsData);
    const foodData = JSON.parse(req.body.foodRowsData);
    const mileageData = JSON.parse(req.body.mileageRowsData);
    const itemData = JSON.parse(req.body.itemRowsData);
    const monthData = req.body.month;
    const filesData = req.files || [];

    // Process and insert rows data
    for (const row of rowsData) {
      const { type, billable, porCC, amount, comment } = row;
      const sanitizedAmount = parseFloat(amount) || 0;

      // Fetch the ID from EXPENSE_TYPES where TYPE matches
      const expenseTypeResult = await queryAsync("SELECT ID FROM EXPENSE_TYPES WHERE TYPE = ?", [
        type,
      ]);

      if (!expenseTypeResult.length) {
        return res.status(400).json({ status: "Invalid expense type." });
      }

      const typeId = expenseTypeResult[0].ID;

      await queryAsync(
        "INSERT INTO EXPENSES (user_ID, type, billable, porCC, amount, comment, month) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [user_ID, typeId, billable, porCC, sanitizedAmount, comment, monthData]
      );
    }

    // Process and insert food data
    for (const food of foodData) {
      const { date, amount, location, persons, type, purpose, billable, porCC } = food;
      const sanitizedAmount = parseFloat(amount) || 0;

      await queryAsync(
        "INSERT INTO FOODEXPENSES (user_ID, date, amount, location, persons, type, purpose, billable, porCC, month) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          user_ID,
          date,
          sanitizedAmount,
          location,
          persons,
          type,
          purpose,
          billable,
          porCC,
          monthData,
        ]
      );
    }

    // Process and insert mileage data
    for (const mileage of mileageData) {
      const { date, purpose, miles, billable, amount } = mileage;
      const sanitizedAmount = parseFloat(amount) || 0;

      await queryAsync(
        "INSERT INTO MILEAGEEXPENSES (user_ID, date, purpose, miles, billable, amount, month) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [user_ID, date, purpose, miles, billable, sanitizedAmount, monthData]
      );
    }

    // Process and insert item data
    for (const item of itemData) {
      const {
        date,
        item: itemName,
        subTotal,
        cityTax,
        taxPercent,
        total,
        retailer,
        shippedFrom,
        shippedTo,
        billable,
      } = item;
      const sanitizedSubTotal = parseFloat(subTotal) || 0;
      const sanitizedCityTax = parseFloat(cityTax) || 0;
      const sanitizedTaxPercent = parseFloat(taxPercent) || 0;
      const sanitizedTotal = parseFloat(total) || 0;

      await queryAsync(
        "INSERT INTO ITEMEXPENSES (user_ID, date, item, subTotal, cityTax, taxPercent, total, retailer, shippedFrom, shippedTo, billable, month) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          user_ID,
          date,
          itemName,
          sanitizedSubTotal,
          sanitizedCityTax,
          sanitizedTaxPercent,
          sanitizedTotal,
          retailer,
          shippedFrom,
          shippedTo,
          billable,
          monthData,
        ]
      );
    }

    // Handling file uploads to AWS S3 and saving file paths in the database
    for (const file of filesData) {
      const uniqueFileName = `${file.originalname}-${Date.now().toString()}`;
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `files/${uniqueFileName}`,
        Body: file.buffer,
        ACL: "public-read",
      };

      const parallelUploads3 = new Upload({
        client: s3Client,
        params: uploadParams,
      });

      try {
        await parallelUploads3.done();
        console.log(`Uploaded file: ${uniqueFileName}`);

        // Save file information to the database
        await queryAsync("INSERT INTO FILES (user_ID, name, path, month) VALUES (?, ?, ?, ?)", [
          user_ID,
          file.originalname,
          `files/${uniqueFileName}`,
          monthData,
        ]);
      } catch (error) {
        console.error(`Error uploading file ${uniqueFileName}:`, error);
      }
    }

    // Return success status
    res.json({ status: "Success" });
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ status: "Error", error: "Database error" });
  }
});

app.post("/verify-token", async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await oAuth2Client.verifyIdToken({
      idToken,
      audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();

    // If token is valid, send back the payload
    res.json({ message: "Token verified successfully", payload });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(500).send("Error verifying token");
  }
});

// Route to handle profile image upload
app.post("/upload-profile-image", upload.single("profileImage"), async (req, res) => {
  const userId = req.body.userId; // Assuming userId is sent with the request

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const file = req.file;
  const uniqueFileName = `${file.originalname}-${Date.now().toString()}`;
  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `profile-images/${uniqueFileName}`, // Store in a 'profile-images' folder in the bucket
    Body: file.buffer,
    ACL: "public-read", // You can adjust the permissions as needed
  };

  try {
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    await parallelUploads3.done();
    const imageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/profile-images/${uniqueFileName}`;

    // Store imageUrl in the database
    await queryAsync("UPDATE USERS SET PROFILE_IMG_URL = ? WHERE id = ?", [imageUrl, userId]);

    res.json({ imageUrl });
  } catch (error) {
    console.error(`Error uploading file ${uniqueFileName}:`, error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

app.post("/update-profile", (req, res) => {
  const { firstName, lastName, email } = req.body;
  // Update user details in the database
  res.json({ message: "Profile updated successfully" });
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
    res.json({
      Status: "Success",
      message: "User and associated data deleted successfully",
    });
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

app.delete("/admin/mileage-rates/:id", verifyUser, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ Error: "Access denied" });
  }

  const item_id = req.params.id;

  try {
    const mileageRates = await queryAsync("DELETE FROM MILEAGE_RATES WHERE ID = ?", [item_id]);
    res.json(mileageRates);
  } catch (error) {
    console.error("Error fetching mileage rates:", error);
    res.status(500).send("Error fetching mileage rates");
  }
});

// Listen on PORT
// -------------------------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Now listening on port ${PORT}`));
