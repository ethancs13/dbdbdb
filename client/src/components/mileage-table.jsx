import React from "react";
import "../css/GeneralTable.css";
import MileageRow from "./mileage-row";

const MileageTable = ({
  data,
  addMileageRow,
  deleteMileageRow,
  updateMileageRows,
}) => {
  const handleChange = (index, evnt) => {
    evnt.preventDefault();
    const { name, value, type, checked } = evnt.target;
    const newValue = type === "checkbox" ? checked : value;
    updateMileageRows(index, name, newValue);
  };

  return (
    <div className="mileage-table-container">
      <div className="table-header">
        <h4>Mileage</h4>
      </div>
      <div className="mileage-table">
        <div className="mileage-table-header">
          <span>Date</span>
          <span>Purpose</span>
          <span>Miles</span>
          <span>Billable</span>
          <span>Amount</span>
          <span></span>
        </div>
        <div className="table-container">
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
            <div className="no-data">No data available</div>
          )}
        </div>
      </div>
      <button className="btn btn-primary add-row" onClick={addMileageRow}>
        New Row
      </button>
    </div>
  );
};

export default MileageTable;
