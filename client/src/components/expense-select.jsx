import React, { useContext } from "react";
import { FormContext } from "../context/FormContext";
import ExpenseSelectRow from "./expense-select-row";

const ExpenseSelect = () => {
  const { rowsData, addRow, deleteRow, updateRow } = useContext(FormContext);

  const handleChange = (index, evnt) => {
    console.log(evnt)
    evnt.preventDefault();
    const { name, value, type, checked } = evnt.target;
    const newValue = type === "checkbox" ? checked : value;
    updateRow(index, name, newValue);
  };

  return (
    <div>
      <table className="table_container">
        <thead>
          <tr className="table_header">
            <th>
              <h3>Expense Select</h3>
            </th>
            <th className="add-row">
              <button className="btn btn-primary" onClick={addRow}>New Row</button>
            </th>
          </tr>
        </thead>

        <tbody>
          {rowsData.map((data, index) => (
            <ExpenseSelectRow
              key={index}
              index={index}
              data={data}
              deleteRow={deleteRow}
              handleChange={handleChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseSelect;
