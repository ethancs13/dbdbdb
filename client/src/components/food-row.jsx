import React from "react";
import "../css/FoodTable.css";
// import "@fortawesome/fontawesome-free/css/all.min.css"; // Import Font Awesome

const FoodRow = ({ row, index, handleChange, deleteTableRows }) => {
  const { date, amount, location, persons, type, purpose, billable, porCC } =
    row;

  return (
    <div className="food-row">
      <div className="input-container">
        <label>Date</label>
        <input
          type="date"
          name="date"
          value={date}
          onChange={(e) => handleChange(index, e)}
          className="food-input"
        />
      </div>
      <div className="input-container amount-input-container">
        <label>Amount</label>
        <input
          type="text"
          name="amount"
          value={amount}
          onChange={(e) => handleChange(index, e)}
          className="food-input"
        />
      </div>
      <div className="input-container">
        <label>Location</label>
        <input
          type="text"
          name="location"
          value={location}
          onChange={(e) => handleChange(index, e)}
          className="food-input"
        />
      </div>
      <div className="input-container amount-input-container">
        <label>Persons</label>
        <input
          type="number"
          name="persons"
          value={persons}
          onChange={(e) => handleChange(index, e)}
          className="food-input"
        />
      </div>
      <div className="input-container">
        <label>Type</label>
        <input
          type="text"
          name="type"
          value={type}
          onChange={(e) => handleChange(index, e)}
          className="food-input"
        />
      </div>
      <div className="input-container">
        <label>Purpose</label>
        <input
          type="text"
          name="purpose"
          value={purpose}
          onChange={(e) => handleChange(index, e)}
          className="food-input"
        />
      </div>
      <div className="input-container amount-input-container">
        <label>Billable</label>
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
      <div className="input-container amount-input-container">
        <label>PorCC</label>
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

      <button className="btn expense-delete" onClick={(e) => deleteTableRows(e, index)}>
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
};

export default FoodRow;