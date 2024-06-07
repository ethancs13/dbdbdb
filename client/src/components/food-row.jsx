import React from "react";

const FoodRow = ({ row, index, handleChange, deleteTableRows }) => {
  const { date, amount, location, persons, type, purpose, billable, porCC } =
    row;
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
          name="amount"
          value={amount}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td>
        <input
          type="text"
          name="location"
          value={location}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td>
        <input
          type="number"
          name="persons"
          value={persons}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td>
        <input
          type="text"
          name="type"
          value={type}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td>
        <input
          type="number"
          name="purpose"
          value={purpose}
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
        <select
          name="porCC"
          value={porCC}
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

export default FoodRow;
