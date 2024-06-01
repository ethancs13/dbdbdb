const { queryAsync } = require('../config/connection');

function insertUser(data, callback) {
    const sql = 'INSERT INTO Users (email, password, role) VALUES (?, ?)';
    const values = [data.email, data.password];

    queryAsync(sql, values)
        .then(results => {
            callback(null, results);
        })
        .catch(error => {
            console.error('Error executing query:', error);
            callback(error, null);
            throw error;
        });
}

module.exports = {
    insertUser,
};