import React from "react";
import TableRows from "./item-row";
import "../css/Table.css";

function AddDeleteTableRows({ data, addItemRow, deleteItemRow, updateItemRow }) {

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
              <button onClick={addItemRow}>New Row</button>
            </th>
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
