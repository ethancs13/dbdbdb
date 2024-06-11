import React from "react";
import "../css/Table.css";

const TableRows = ({ row, index, handleChange, deleteTableRows }) => {
  const {
    item,
    date,
    subTotal,
    cityTax,
    taxPercent,
    total,
    source,
    shippedFrom,
    shippedTo,
    billable,
  } = row;
  return (
    <tr className="row item-row">
      <td className="col w-10">
        <input
          type="text"
          name="item"
          value={item}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td className="col w-10">
        <input
          type="date"
          name="date"
          value={date}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td className="col w-10">
        <input
          type="number"
          name="subTotal"
          value={subTotal}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td className="col w-10">
        <input
          type="number"
          name="cityTax"
          value={cityTax}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td className="col w-10">
        <input
          type="number"
          name="taxPercent"
          value={taxPercent}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td className="col w-10">
        <input
          type="number"
          name="total"
          value={total}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td className="col w-10">
        <input
          type="text"
          name="source"
          value={source}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td className="col w-10">
        <input
          type="text"
          name="shippedFrom"
          value={shippedFrom}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td className="col w-10">
        <input
          type="text"
          name="shippedTo"
          value={shippedTo}
          className="iw-5"
          onChange={(e) => handleChange(index, e)}
        />
      </td>
      <td className="col w-10">
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
      <td className="col w-10">
        <button className="btn btn-primary" onClick={(evnt) => deleteTableRows(evnt, index)}>Delete</button>
      </td>
    </tr>
  );
};

export default TableRows;
