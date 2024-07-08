// server/config/connection.js
const mysql = require('mysql');

// Create a connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
});

// Wrap the pool.query function in a promise for asynchronous handling
const queryAsync = (sql, values) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

// Close the pool when application exits
process.on('exit', () => {
  pool.end();
});

// Export the queryAsync function for use in other files
module.exports = { queryAsync };
