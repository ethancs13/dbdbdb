import React from "react";
import "../css/MileageTable.css";
// import "@fortawesome/fontawesome-free/css/all.min.css"; // Import Font Awesome

const MileageRow = ({ row, index, handleChange, deleteTableRows }) => {
  const { date, purpose, miles, billable, amount } = row;

  return (
    <div className="mileage-row">
      <div className="input-container">
        <label>Date</label>
        <input
          type="date"
          name="date"
          value={date}
          className="mileage-input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <label>Purpose</label>
        <input
          type="text"
          name="purpose"
          value={purpose}
          className="mileage-input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <label>Miles</label>
        <input
          type="number"
          name="miles"
          value={miles}
          className="mileage-input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <label>Billable</label>
        <select
          name="billable"
          value={billable}
          className="mileage-select"
          onChange={(e) => handleChange(index, e)}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      <div className="input-container">
        <label>Amount</label>
        <input
          type="number"
          name="amount"
          value={amount}
          className="mileage-input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <button className="btn expense-delete" onClick={(e) => deleteTableRows(e,index)}>
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
};

export default MileageRow;