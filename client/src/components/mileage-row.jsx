import React from "react";

const MileageRow = ({ row, index, handleChange, deleteTableRows }) => {
  const { date, purpose, miles, billable, amount } = row;

  return (
    <tr>
      <td
      className="col w-5">
        <input
          type="date"
          name="date"
          value={date}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td
      className="col w-5">
        <input
          type="text"
          name="purpose"
          value={purpose}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td
      className="col w-5">
        <input
          type="number"
          name="miles"
          value={miles}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td
      className="col w-5">
        <select
          name="billable"
          value={billable}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </td>
      <td
      className="col w-5">
        <input
          type="number"
          name="amount"
          value={amount}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td
      className="col w-5">
        <button
          className="btn btn-primary"
          onClick={(evnt) => deleteTableRows(evnt, index)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

export default MileageRow;
