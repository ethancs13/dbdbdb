import React from "react";
import TableRows from "./item-row";
import "../css/Table.css";

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
    <div>
      <table className="table_container">
        <thead>
          <tr className="table_header">
            <th>
              <h3>Itemized Purchases</h3>
            </th>
            <th className="add-row">
              <button className="btn btn-primary" onClick={addItemRow}>New Row</button>
            </th>
          </tr>
          <tr
          className="item-table-heading-container">
            <th className="col w-10">Item</th>
            <th className="col w-10">Date</th>
            <th className="col w-10">Sub Total</th>
            <th className="col w-10">City Tax</th>
            <th className="col w-10">Tax Percent</th>
            <th className="col w-10">Total</th>
            <th className="col w-10">Source</th>
            <th className="col w-10">Shipped From</th>
            <th className="col w-10">Shipped To</th>
            <th className="col w-10">Billable</th>
            <th className="col w-10"></th>
          </tr>
        </thead>
        <tbody>
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
            <tr>
              <td colSpan="8">No data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AddDeleteTableRows;
