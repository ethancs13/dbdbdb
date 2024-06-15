import React from "react";
import FoodRow from "./food-row";
import "../css/FoodTable.css";

const FoodTable = ({ data, addFoodRow, deleteFoodRow, updateFoodRow }) => {
  const handleChange = (index, evnt) => {
    evnt.preventDefault();
    const { name, value, type, checked } = evnt.target;
    const newValue = type === "checkbox" ? checked : value;
    updateFoodRow(index, name, newValue);
  };

  return (
    <div className="food-table-container">
      <div className="table-header">
        <h4>Food Expenses</h4>
        <button className="btn btn-primary add-row" onClick={addFoodRow}>
          New Row
        </button>
      </div>
      <div className="table-container">
        {data.length > 0 ? (
          data.map((row, index) => (
            <FoodRow
              key={index}
              row={row}
              index={index}
              handleChange={handleChange}
              deleteTableRows={deleteFoodRow}
            />
          ))
        ) : (
          <div className="no-data">No data available</div>
        )}
      </div>
    </div>
  );
};

export default FoodTable;
