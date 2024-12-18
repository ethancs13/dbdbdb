import React from "react";
import "../css/GeneralTable.css";

const TableRows = ({ row, index, handleChange, deleteTableRows }) => {
  const {
    item,
    date,
    subTotal,
    cityTax,
    taxPercent,
    total,
    retailer,
    shippedFrom,
    shippedTo,
    billable,
  } = row;

  return (
    <div className="item-row">
      <div className="input-container">
        <input
          type="date"
          name="date"
          value={date}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>

      <div className="input-container">
        <input
          type="text"
          name="item"
          value={item}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>

      <div className="input-container">
        <input
          type="number"
          name="subTotal"
          value={subTotal}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>

      <div className="input-container">
        <input
          type="number"
          name="cityTax"
          value={cityTax}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        {" "}
        <input
          type="number"
          name="taxPercent"
          value={taxPercent}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <input
          type="number"
          name="total"
          value={total}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        {" "}
        <input
          type="text"
          name="retailer"
          value={retailer}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        {" "}
        <input
          type="text"
          name="shippedFrom"
          value={shippedFrom}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        {" "}
        <input
          type="text"
          name="shippedTo"
          value={shippedTo}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>

      <div className="input-container">
        <select
          name="billable"
          value={billable}
          className="select"
          onChange={(e) => handleChange(index, e)}
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

export default TableRows;
