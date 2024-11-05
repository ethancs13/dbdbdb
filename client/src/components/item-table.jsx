import React from "react";
import TableRows from "./item-row";
import "../css/Itemized.css";

function AddDeleteTableRows({ data, addItemRow, deleteItemRow, updateItemRow }) {
  const handleChange = (index, evnt) => {
    evnt.preventDefault();
    const { name, value, type, checked } = evnt.target;
    const newValue = type === "checkbox" ? checked : value;
    updateItemRow(index, name, newValue);
  };

  return (
    <div className="itemized-table-container">
      <div className="table-header">
        <h4>Itemized</h4>
      </div>
      <div className="itemized-table">
        <div className="itemized-table-header">
          <span>Item</span>
          <span>Date</span>
          <span>Sub Total</span>
          <span>City Tax</span>
          <span>Tax Percent</span>
          <span>Total</span>
          <span>Retailer</span>
          <span>City/State or Internet</span>
          <span>City/State Shipped to</span>
          <span>Billable</span>
          <span></span>
        </div>
        <div className="table-container">
          {data.length > 0 ? (
            data.map((row, index) => (
              <TableRows
                key={index}
                row={row}
                index={index}
                handleChange={handleChange}
                deleteTableRows={(evnt) => deleteItemRow(evnt, index)}
              />
            ))
          ) : (
            <div className="no-data">No data available</div>
          )}
        </div>
      </div>
      <button className="btn btn-primary add-row" onClick={addItemRow}>
        New Row
      </button>
    </div>
  );
}

export default AddDeleteTableRows;
