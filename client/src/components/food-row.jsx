import React from "react";
import "../css/FoodTable.css";

const FoodRow = ({ row, index, handleChange, deleteTableRows }) => {
  const { date, amount, location, persons, type, purpose, billable, porCC } = row;

  return (
    <div className="food-row">
      <input
        type="text"
        name="date"
        value={row.date}
        onChange={(e) => handleChange(index, e)}
        className="food-input"
      />
      <input
        type="text"
        name="amount"
        value={amount}
        onChange={(e) => handleChange(index, e)}
        className="food-input"
      />

      <input
        type="text"
        name="location"
        value={location}
        onChange={(e) => handleChange(index, e)}
        className="food-input"
      />

      <input
        type="number"
        name="persons"
        value={persons}
        onChange={(e) => handleChange(index, e)}
        className="food-input"
      />

      <input
        type="text"
        name="type"
        value={type}
        onChange={(e) => handleChange(index, e)}
        className="food-input"
      />

      <input
        type="text"
        name="purpose"
        value={purpose}
        onChange={(e) => handleChange(index, e)}
        className="food-input"
      />

      <select
        name="billable"
        value={billable}
        onChange={(e) => handleChange(index, e)}
        className="food-select"
      >
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>

      <select
        name="porCC"
        value={porCC}
        onChange={(e) => handleChange(index, e)}
        className="food-select"
      >
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>

      <button className="btn expense-delete" onClick={(e) => deleteTableRows(e, index)}>
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
};

export default FoodRow;
