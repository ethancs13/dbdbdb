import React from "react";
import "../css/GeneralTable.css";
// import "@fortawesome/fontawesome-free/css/all.min.css"; // Import Font Awesome

const ExpenseSelectRow = ({ index, data, deleteRow, handleChange }) => {
  const { type, billable, porCC, amount, comment } = data;

  return (
    <div className="expense-row" style={{}}>
      <div className="input-container">
        <label>Type</label>
        <select
          className="expense-select"
          name="type"
          value={type}
          onChange={(event) => handleChange(index, event)}
        >
          <option value="cell">Cell Phone</option>
          <option value="broadband">Broadband</option>
          <option value="business landline">Business Land Line</option>
          <option value="Long Distance">Long Distance</option>
          <option value="Itemized Business Meals">
            Itemized Business Meals
          </option>
          <option value="Entertainment">Entertainment</option>
          <option value="Parking">Parking</option>
          <option value="Tolls">Tolls</option>
          <option value="Mileage">Mileage</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="input-container amount-input-container">
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
      <div className="input-container amount-input-container">
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
      <div className="input-container amount-input-container">
        <label>Amount</label>
        <input
          className="expense-input"
          type="text"
          name="amount"
          value={amount}
          onChange={(event) => handleChange(index, event)}
        />
      </div>
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
