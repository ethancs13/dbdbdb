import React, { useContext } from "react";
import { FormContext } from "../context/FormContext";
import ExpenseSelectRow from "./expense-select-row";

const ExpenseSelect = () => {
  const { rowsData, addRow } = useContext(FormContext);

  return (
    <div>
      <table className="table_container">
        <thead>
          <tr className="table_header">
            <th>
              <h3>Expense Select</h3>
            </th>
            <th className="add-row">
              <button onClick={addRow}>New Row</button>
            </th>
          </tr>
        </thead>

        <tbody>
          {rowsData.map((data, index) => (
            <ExpenseSelectRow key={index} index={index} data={data} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseSelect;
