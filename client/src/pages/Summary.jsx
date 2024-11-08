import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FormContext } from "../context/FormContext";
import "../css/Summary.css";

const Summary = () => {
  const { rowsData, itemRowsData, mileageRowsData, foodRowsData, uploadedFiles } =
    useContext(FormContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [generalComments, setGeneralComments] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    axios.defaults.withCredentials = true;

    // Check user authentication and role
    axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/`).then((res) => {
      if (res.data.status === "Success") {
        setIsAuthenticated(true);
      } else if (res.data.status === "rootUser") {
        setIsAdmin(true);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        navigate("/login");
      }
    });
  }, [navigate]);

  useEffect(() => {
    const allExpenses = [...rowsData, ...itemRowsData, ...mileageRowsData, ...foodRowsData];

    const total = allExpenses.reduce((acc, expense) => acc + parseFloat(expense.amount || 0), 0);
    setTotalAmount(total);

    const billableTotal = allExpenses
      .filter((expense) => expense.billable === "Yes")
      .reduce((acc, expense) => acc + parseFloat(expense.amount || 0), 0);
    setInvoiceTotal(billableTotal);

    // Extract comments from the general tab
    const comments = rowsData.filter((row) => row.comment).map((row) => row.comment);
    setGeneralComments(comments);
  }, [rowsData, itemRowsData, mileageRowsData, foodRowsData]);

  const aggregateExpensesByCategory = () => {
    const categories = {};

    const addToCategory = (category, expense) => {
      if (!categories[category]) {
        categories[category] = {
          expenses: [],
          total: 0,
        };
      }
      // Correcting the `porCC` value to "N/A" if empty or null
      expense.porCC = expense.porCC || "n/a";
      categories[category].expenses.push(expense);
      categories[category].total += parseFloat(expense.amount || 0);
    };

    rowsData.forEach((expense) => addToCategory(expense.type, expense));
    itemRowsData.forEach((expense) => addToCategory("Itemized", expense));
    mileageRowsData.forEach((expense) => addToCategory("Mileage", expense));
    foodRowsData.forEach((expense) => addToCategory("Food & Beverage", expense));

    return categories;
  };

  const categories = aggregateExpensesByCategory();

  return (
    <div className="summary-container">
      <div className="summary-sections-container">
        {Object.keys(categories).map((category, index) => (
          <div className="summary-section" key={index}>
            <h3 className="summary-category-title">{category}</h3>
            <div className="summary-box">
              {categories[category].expenses.length > 0 ? (
                <div>
                  <div className="summary-headers-container">
                    <div className="summary-header">Type</div>
                    <div className="summary-header">Billable?</div>
                    <div className="summary-header">PoR CC used?</div>
                    <div className="summary-header">Amount</div>
                  </div>
                  {categories[category].expenses.map((expense, index) => (
                    <div className="summary-box-item" key={index}>
                      <div className="summary-box-item-row">
                        <div className="w20">{expense.type}</div>
                        <div className="w20">{expense.billable}</div>
                        <div className="w20">{expense.porCC}</div>
                        <div className="w20">{expense.amount}</div>
                      </div>
                    </div>
                  ))}
                  <div className="summary-category-total">
                    <div>
                      <strong>${categories[category].total.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <p>No expenses added yet.</p>
              )}
            </div>
          </div>
        ))}
        <div className="summary-total">
          <h3>Total Amount: ${totalAmount.toFixed(2)}</h3>
          <h3>Invoice Total (Billable): ${invoiceTotal.toFixed(2)}</h3>
        </div>
        {generalComments.length > 0 && (
          <div className="summary-comments">
            <h3>General Comments</h3>
            <ul>
              {generalComments.map((comment, index) => (
                <li key={index}>{comment}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;
