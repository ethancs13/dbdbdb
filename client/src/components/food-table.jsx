import React from "react";
import FoodRow from "./food-row";

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
        <h4>Food & Beverage</h4>
      </div>
      <div className="food-table">
        <div className="food-table-header">
          <span>Date</span>
          <span>Amount</span>
          <span>Location</span>
          <span>Persons</span>
          <span>Type</span>
          <span>Purpose</span>
          <span>Billable</span>
          <span>PorCC</span>
          <span></span>
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
      <button className="btn btn-primary add-row" onClick={addFoodRow}>
        New Row
      </button>
    </div>
  );
};

export default FoodTable;
