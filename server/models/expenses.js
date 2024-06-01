const { queryAsync } = require('../config/connection');

function insertExpense(data, callback) {
    const sql = 'INSERT INTO Expenses (user_id, type, billable, porCC, amount, comment) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [data.user_id, data.type, data.billable, data.porCC, data.amount, data.comment];

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
    insertExpense,
};