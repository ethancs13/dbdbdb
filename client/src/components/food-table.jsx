import React from "react";
import TableRows from "./food-row";
import "../css/Table.css";

const FoodTable = ({ data, addFoodRow, deleteFoodRow, updateFoodRow }) => {

  const handleChange = (index, evnt) => {
    evnt.preventDefault();
    const { name, value, type, checked } = evnt.target;
    const newValue = type === "checkbox" ? checked : value;
    updateFoodRow(index, name, newValue);
  };

  return (
    <div>
      <table className="table_container">
        <thead>
          <tr className="table_header">
            <th>
              <h1>Food Expenses</h1>
            </th>
            <th className="add-row">
              <button onClick={addFoodRow}>New Row</button>
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
                deleteTableRows={(evnt) => deleteFoodRow(evnt, index)}
                updateFoodRow={updateFoodRow}
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
export default FoodTable;
