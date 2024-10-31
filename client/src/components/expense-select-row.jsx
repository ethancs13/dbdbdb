import React, { useEffect } from "react";
import "../css/GeneralTable.css";

const ExpenseSelectRow = ({ index, data, deleteRow, handleChange, expenseTypes }) => {
  const { type, billable, porCC, amount, comment, customer } = data;

  useEffect(() => {
    if (billable === "No") {
      handleChange(index, null, "customer");
    } else if (type !== "Other") {
      handleChange(index, null, "comment");
    }
  }, [billable, type, index, handleChange]);

  return (
    <div className="expense-row">
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

      <select
        className="expense-select"
        name="billable"
        value={billable}
        onChange={(event) => handleChange(index, event)}
      >
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>

      <select
        className="expense-select"
        name="porCC"
        value={porCC}
        onChange={(event) => handleChange(index, event)}
      >
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>

      <input
        className="expense-input"
        type="text"
        name="amount"
        value={amount}
        onChange={(event) => handleChange(index, event)}
      />

      {billable === "Yes" && (
        <input
          className="expense-input"
          type="text"
          name="customer"
          value={customer}
          maxLength="30"
          onChange={(event) => handleChange(index, event)}
        />
      )}

      {type === "Other" && (
        <input
          className="expense-input"
          type="text"
          name="comment"
          value={comment}
          onChange={(event) => handleChange(index, event)}
        />
      )}

      <button className="btn expense-delete" onClick={() => deleteRow(index)}>
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
};

export default ExpenseSelectRow;
