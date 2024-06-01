import React from "react";

const MileageRow = ({ row, index, handleChange, deleteTableRows }) => {
  const { date, miles, purpose, billable } = row;

  return (
    <tr>
      <td>
        <input
          type="date"
          name="date"
          value={date}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td>
        <input
          type="text"
          name="purpose"
          value={purpose}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td>
        <input
          type="number"
          name="miles"
          value={miles}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td>
        <select
          name="billable"
          value={billable}
          onChange={(e) => handleChange(index, e)}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </td>
      <td>
        <button onClick={(evnt) => deleteTableRows(evnt, index)}>Delete</button>
      </td>
    </tr>
  );
};

export default MileageRow;
