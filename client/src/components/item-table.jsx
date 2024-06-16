import React from "react";
import TableRows from "./item-row";
import "../css/Itemized.css";

function AddDeleteTableRows({
  data,
  addItemRow,
  deleteItemRow,
  updateItemRow,
}) {
  const handleChange = (index, evnt) => {
    evnt.preventDefault();
    const { name, value, type, checked } = evnt.target;
    const newValue = type === "checkbox" ? checked : value;
    updateItemRow(index, name, newValue);
  };

  return (
    <div className="itemized-table-container">
      <div className="table-header">
        <h4>Itemized Purchases</h4>
        <button className="btn btn-primary add-row" onClick={addItemRow}>
          New Row
        </button>
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
  );
}

export default AddDeleteTableRows;
