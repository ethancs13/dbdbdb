import React from "react";
import "../css/Table.css";
import MileageRow from "./mileage-row";

const MileageTable = ({ data, addMileageRow, deleteMileageRow, updateMileageRows }) => {
  
  const handleChange = (index, evnt) => {
    evnt.preventDefault();
    const { name, value, type, checked } = evnt.target;
    const newValue = type === "checkbox" ? checked : value;
    updateMileageRows(index, name, newValue);
  };

  return (
    <div>
      <table className="table_container">
        <thead>
          <tr className="table_header">
            <th>
              <h3>Mileage Expenses</h3>
            </th>
            <th className="add-row">
              <button onClick={addMileageRow}>New Row</button>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <MileageRow
                key={index}
                row={row}
                index={index}
                handleChange={handleChange}
                deleteTableRows={(evnt) => deleteMileageRow(evnt, index)}
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
};

export default MileageTable;
