import React from "react";
import "../css/GeneralTable.css";

const FoodRow = ({ row, index, handleChange, deleteTableRows }) => {
  const { date, amount, location, persons, type, purpose, billable, porCC } = row;

  return (
    <div className="food-row">
      <div className="input-container">
        {" "}
        <input
          type="date"
          name="date"
          value={row.date}
          onChange={(e) => handleChange(index, e)}
          className="food-input"
        />
      </div>
      <div className="input-container">
        {" "}
        <input
          type="text"
          name="amount"
          value={amount}
          onChange={(e) => handleChange(index, e)}
          className="food-input"
        />
      </div>
      <div className="input-container">
        {" "}
        <input
          type="text"
          name="location"
          value={location}
          onChange={(e) => handleChange(index, e)}
          className="food-input"
        />
      </div>
      <div className="input-container">
        {" "}
        <input
          type="number"
          name="persons"
          value={persons}
          onChange={(e) => handleChange(index, e)}
          className="food-input"
        />
      </div>
      <div className="input-container">
        {" "}
        <input
          type="text"
          name="type"
          value={type}
          onChange={(e) => handleChange(index, e)}
          className="food-input"
        />
      </div>
      <div className="input-container">
        {" "}
        <input
          type="text"
          name="purpose"
          value={purpose}
          onChange={(e) => handleChange(index, e)}
          className="food-input"
        />
      </div>
      <div className="input-container">
        {" "}
        <select
          name="billable"
          value={billable}
          onChange={(e) => handleChange(index, e)}
          className="food-select"
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      <div className="input-container">
        {" "}
        <select
          name="porCC"
          value={porCC}
          onChange={(e) => handleChange(index, e)}
          className="food-select"
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      <div className="input-container">
        <button className="btn expense-delete" onClick={(e) => deleteTableRows(e, index)}>
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
};

export default FoodRow;
