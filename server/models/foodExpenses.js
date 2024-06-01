const { queryAsync } = require('../config/connection');

function insertFoodExpense(data, callback) {
    const sql = 'INSERT INTO FoodExpenses (user_id, date, amount, persons, type, purpose, billable, porCC) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [data.user_id, data.date, data.amount, data.persons, data.type, data.purpose, data.billable, data.porCC];

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
    insertFoodExpense,
};