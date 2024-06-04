import React, { useEffect } from "react";

const FoodRow = ({ row, index, handleChange, deleteTableRows, updateFoodRow }) => {


  useEffect(() => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
    updateFoodRow(index, "date", row.date || formattedDate)
    updateFoodRow(index, "amount", row.amount || 0)
    updateFoodRow(index, "location", row.location || "empty")
    updateFoodRow(index, "persons", row.persons || 0)
    updateFoodRow(index, "type", row.type || "Not Selected")
    updateFoodRow(index, "purpose", row.purpose || "empty")
    updateFoodRow(index, "billable", row.billable || "No")
    updateFoodRow(index, "porCC", row.porCC || "No")
  }, [])

  const { date, amount, location, persons, type, purpose, billable, porCC } = row;
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
