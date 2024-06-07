import React from "react";

const ExpenseSelectRow = ({ index, data, deleteRow, handleChange }) => {
  const { type, billable, porCC, amount, comment } = data;

  return (
    <tr>
      <td>
        <select
          className="col-3"
          name="type"
          value={type}
          onChange={handleChange}
        >
          <option value="cell">Cell Phone</option>
          <option value="broadband">Broadband</option>
          <option value="business landline">Business Land Line</option>
          <option value="Long Distance">Long Distance</option>
          <option value="Itemized Business Meals">
            Itemized Business Meals
          </option>
          <option value="Entertainment">Entertainment</option>
          <option value="Parking">Parking</option>
          <option value="Tolls">Tolls</option>
          <option value="Mileage">Mileage</option>
          <option value="Other">Other</option>
        </select>
      </td>
      <td>
        <select name="billable" value={billable} onChange={handleChange}>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </td>
      <td>
        <select name="porCC" value={porCC} onChange={handleChange}>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </td>
      <td>
        <input
          type="text"
          name="amount"
          value={amount}
          onChange={handleChange}
        />
      </td>
      {type === "Other" && (
        <td>
          <input
            type="text"
            name="comment"
            value={comment}
            onChange={handleChange}
          />
        </td>
      )}
      <td>
        <button onClick={() => deleteRow(index)}>
          Delete
        </button>
      </td>
    </tr>
  );
};

export default ExpenseSelectRow;