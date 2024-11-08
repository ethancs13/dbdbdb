import React, { useEffect } from "react";
import "../css/GeneralTable.css";

const ExpenseSelectRow = ({ index, data, deleteRow, handleChange, expenseTypes }) => {
  const { type, billable, porCC, amount, comment, customer } = data;

  useEffect(() => {
    // Only make changes if needed to prevent unnecessary updates
    if (billable === "No" && customer !== "") {
      handleChange(index, null, "customer");
    } else if (type !== "Other" && comment !== "") {
      handleChange(index, null, "comment");
    }
  }, [billable, type, customer, comment, index, handleChange]);

  return (
    <div className="expense-row">
      <div className="input-container">
        <select
          className="expense-select"
          name="type"
          value={type}
          onChange={(event) => handleChange(index, event)}
        >
          {expenseTypes.map((expenseType) => (
            <option key={expenseType.ID} value={expenseType.TYPE}>
              {expenseType.TYPE}
            </option>
          ))}
        </select>
      </div>

      <div className="input-container">
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
          <input
            className="expense-input"
            type="text"
            name="comment"
            value={comment}
            onChange={(event) => handleChange(index, event)}
          />
        </div>
      )}
      <div className="input-container">
        <button className="btn expense-delete" onClick={() => deleteRow(index)}>
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
};

export default ExpenseSelectRow;
