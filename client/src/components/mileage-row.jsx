import React from "react";

const MileageRow = ({ row, index, handleChange, deleteTableRows }) => {
  const { date, purpose, miles, billable, amount } = row;

  return (
    <div className="mileage-row">
      <div className="input-container">
        <input
          type="date"
          name="date"
          value={date}
          className="mileage-input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <input
          type="text"
          name="purpose"
          value={purpose}
          className="mileage-input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <input
          type="number"
          name="miles"
          value={miles}
          className="mileage-input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
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
        <input
          type="number"
          name="amount"
          value={amount}
          className="mileage-input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <button className="btn expense-delete" onClick={(e) => deleteTableRows(e, index)}>
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
};

export default MileageRow;
