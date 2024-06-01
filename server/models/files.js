const { queryAsync } = require('../config/connection');

function insertFile(data, callback) {
    const sql = 'INSERT INTO Files (user_id, name, path) VALUES (?, ?, ?)';
    const values = [data.user_id, data.name, data.path];

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
    insertFile,
};