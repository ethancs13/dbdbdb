const { queryAsync } = require('../config/connection');

function insertItemExpense(data, callback) {
    const sql = 'INSERT INTO ItemExpenses (user_id, item, date, subTotal, cityTax, taxPercent, total, source, shippedFrom, shippedTo, billable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [data.user_id, data.item, data.date, data.subTotal, data.cityTax, data.taxPercent, data.total, data.source, data.shippedFrom, data.shippedTo, data.billable];

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
    insertItemExpense,
};