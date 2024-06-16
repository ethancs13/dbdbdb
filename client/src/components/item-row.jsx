import React from "react";
import "../css/Itemized.css";

const TableRows = ({ row, index, handleChange, deleteTableRows }) => {
  const {
    item,
    date,
    subTotal,
    cityTax,
    taxPercent,
    total,
    source,
    shippedFrom,
    shippedTo,
    billable,
  } = row;
  return (
    <div className="item-row">
      <div className="input-container">
        <label>Item</label>
        <input
          type="text"
          name="item"
          value={item}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <label>Date</label>
        <input
          type="date"
          name="date"
          value={date}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container amount-input-container">
        <label>Sub Total</label>
        <input
          type="number"
          name="subTotal"
          value={subTotal}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <label>City Tax</label>
        <input
          type="number"
          name="cityTax"
          value={cityTax}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <label>Tax Percent</label>
        <input
          type="number"
          name="taxPercent"
          value={taxPercent}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container amount-input-container">
        <label>Total</label>
        <input
          type="number"
          name="total"
          value={total}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <label>Source</label>
        <input
          type="text"
          name="source"
          value={source}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <label>Shipped From</label>
        <input
          type="text"
          name="shippedFrom"
          value={shippedFrom}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <label>Shipped To</label>
        <input
          type="text"
          name="shippedTo"
          value={shippedTo}
          className="input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container amount-input-container">
        <label>Billable</label>
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
      <button className="btn expense-delete" onClick={(e) => deleteTableRows(e,index)}>
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
};

export default TableRows;
