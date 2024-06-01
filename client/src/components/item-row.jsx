import React from "react";

const TableRows = ({ row, index, handleChange, deleteTableRows }) => {
  const { item, date, subTotal, cityTax, taxPercent, total, source, shippedFrom, shippedTo, billable } = row;
  return (
    <tr>
      <td>
        <input
          type="text"
          name="item"
          value={item}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
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
          type="number"
          name="subTotal"
          value={subTotal}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td>
        <input
          type="number"
          name="cityTax"
          value={cityTax}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td>
        <input
          type="number"
          name="taxPercent"
          value={taxPercent}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td>
        <input
          type="number"
          name="total"
          value={total}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td>
        <input
          type="text"
          name="source"
          value={source}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td>
        <input
          type="text"
          name="shippedFrom"
          value={shippedFrom}
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td>
        <input
          type="text"
          name="shippedTo"
          value={shippedTo}
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

export default TableRows;
