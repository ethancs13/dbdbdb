import React, { useContext, useState, useEffect } from "react";
import { FormContext } from "../context/FormContext";
import ExpenseSelectRow from "./expense-select-row";
import axios from "axios";
import "../css/GeneralTable.css";

const ExpenseSelect = () => {
  const { rowsData, addRow, deleteRow, updateRow } = useContext(FormContext);
  const [expenseTypes, setExpenseTypes] = useState([]);

  useEffect(() => {
    const fetchExpenseTypes = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_SERVER_END_POINT}/admin/expense-types`,
          {
            withCredentials: true,
          }
        );
        setExpenseTypes(response.data);
      } catch (error) {
        console.error("Error fetching expense types:", error);
      }
    };

    fetchExpenseTypes();
  }, []);

  const handleChange = (index, evnt, field) => {
    if (!evnt) {
      updateRow(index, field, "");
      return;
    }
    evnt.preventDefault();
    const { name, value, type, checked } = evnt.target;
    const newValue = type === "checkbox" ? checked : value;
    updateRow(index, name, newValue);
  };

  return (
    <div className="expense-table-container">
      <div className="table-header">
        <h4>Expenses</h4>
      </div>
      <div className="expense-table">
        <div className="expense-table-header">
          <span>Type</span>
          <span>Billable</span>
          <span>PorCC</span>
          <span>Amount</span>
        </div>
        <div className="table-container">
          {rowsData.length > 0 ? (
            rowsData.map((data, index) => (
              <ExpenseSelectRow
                key={index}
                index={index}
                data={data}
                deleteRow={deleteRow}
                handleChange={handleChange}
                expenseTypes={expenseTypes}
              />
            ))
          ) : (
            <div className="no-data">No data available</div>
          )}
        </div>
      </div>
      <button className="btn btn-primary add-row" onClick={addRow}>
        New Row
      </button>
    </div>
  );
};

export default ExpenseSelect;
