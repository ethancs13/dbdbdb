import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FormContext } from "../context/FormContext";
import "../css/Summary.css";

const Summary = () => {
  const { rowsData } = useContext(FormContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Added state for isAdmin

  const navigate = useNavigate();

  useEffect(() => {
    axios.defaults.withCredentials = true;

    // Check user authentication and role
    axios.get("http://localhost:3001/").then((res) => {
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

  return (
    <div className="summary-container">
      <div className="summary-sections-container">
        <div className="summary-section">
          <div className="summary-headers-container">
            <div className="summary-header">Type</div>
            <div className="summary-header">Billable?</div>
            <div className="summary-header">PoR CC used?</div>
            <div className="summary-header">Amount</div>
            <div className="summary-header">Comment</div>
            {rowsData.some(row => row.billable === "Yes") && (
              <div className="summary-header">Customer</div>
            )}
          </div>
          <div className="summary-box">
            {rowsData.length > 0 ? (
              rowsData.map((row, index) => (
                <div className="summary-box-item" key={index}>
                  <div className="summary-box-item-row">
                    <div className="w20">{row.type}</div>
                    <div className="w20">{row.billable}</div>
                    <div className="w20">{row.porCC}</div>
                    <div className="w20">{row.amount}</div>
                    <div className="w20" style={{textWrap: "wrap"}}>{row.comment}</div>
                    {row.billable === "Yes" && (
                      <div className="w20">{row.customer}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No expenses added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
