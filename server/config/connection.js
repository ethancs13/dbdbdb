const mysql = require('mysql');

// Create a connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'mysqlinstance.cx46082i6vq9.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'tZzcPEMAO9ry!',
  database: 'POR_DB'
});

// Wrap the pool.query function in a promise for asynchronous handling
const queryAsync = (sql, values) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
      } else {
        console.log(results)
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