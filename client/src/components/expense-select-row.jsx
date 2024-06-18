import React, { useEffect } from "react";
import "../css/GeneralTable.css";

const ExpenseSelectRow = ({ index, data, deleteRow, handleChange }) => {
  const { type, billable, porCC, amount, comment, customer } = data;

  useEffect(() => {
    if(billable === "No") {
      handleChange(index, null, 'customer')
    } else if (type !== 'Other') {
      handleChange(index, null, 'comment')
    }
  }, [billable, type])

  return (
    <div className="expense-row">
      <div className="input-container">
        <label>Type</label>
        <select
          className="expense-select"
          name="type"
          value={type}
          onChange={(event) => handleChange(index, event)}
        >
          <option value="Cell">Cell Phone</option>
          <option value="Broadband">Broadband</option>
          <option value="Business Landline">Business Land Line</option>
          <option value="Long Distance">Long Distance</option>
          <option value="Itemized Business Meals">Itemized Business Meals</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Parking">Parking</option>
          <option value="Tolls">Tolls</option>
          <option value="Mileage">Mileage</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="input-container">
        <label>Billable</label>
        <select
          className="expense-select"
          name="billable"
          value={billable}
          onChange={(event) => handleChange(index, event)}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      <div className="input-container">
        <label>PorCC</label>
        <select
          className="expense-select"
          name="porCC"
          value={porCC}
          onChange={(event) => handleChange(index, event)}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      <div className="input-container">
        <label>Amount</label>
        <input
          className="expense-input"
          type="text"
          name="amount"
          value={amount}
          onChange={(event) => handleChange(index, event)}
        />
      </div>
      {billable === "Yes" && (
        <div className="input-container">
          <label>Customer</label>
          <input
            className="expense-input"
            type="text"
            name="customer"
            value={customer}
            maxLength="30"
            onChange={(event) => handleChange(index, event)}
          />
        </div>
      )}
      {type === "Other" && (
        <div className="input-container">
          <label>Comment</label>
          <input
            className="expense-input"
            type="text"
            name="comment"
            value={comment}
            onChange={(event) => handleChange(index, event)}
          />
        </div>
      )}
      <button className="btn expense-delete" onClick={() => deleteRow(index)}>
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
};

export default ExpenseSelectRow;
