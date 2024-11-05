import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FormContext } from "../context/FormContext";
import "../css/Summary.css";

const Summary = () => {
  const { rowsData, itemRowsData, mileageRowsData, foodRowsData, uploadedFiles } = useContext(FormContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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

  return (
    <div className="summary-container">
      <div className="summary-sections-container">
        {/* Expenses Section */}
        <div className="summary-section">
          <h3>General</h3>
          <div className="summary-box">
            {rowsData.length > 0 ? (
              <div>
                <div className="summary-headers-container">
                  <div className="summary-header">Type</div>
                  <div className="summary-header">Billable?</div>
                  <div className="summary-header">PoR CC used?</div>
                  <div className="summary-header">Amount</div>
                  <div className="summary-header">Customer</div>
                  <div className="summary-header">Comment</div>
                </div>
                {rowsData.map((row, index) => (
                  <div className="summary-box-item" key={index}>
                    <div className="summary-box-item-row">
                      <div className="w20">{row.type}</div>
                      <div className="w20">{row.billable}</div>
                      <div className="w20">{row.porCC}</div>
                      <div className="w20">{row.amount}</div>
                      {row.billable === "Yes" ? (
                        <div className="w20">{row.customer}</div>
                      ) : (
                        <div className="w20"></div>
                      )}
                      <div className="w20" style={{ textWrap: "wrap" }}>
                        {row.comment}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No general expenses added yet.</p>
            )}
          </div>
        </div>

        {/* Item Expenses Section */}
        <div className="summary-section">
          <h3>Items</h3>
          <div className="summary-box">
            {itemRowsData.length > 0 ? (
              <div>
                <div className="summary-headers-container">
                  <div className="summary-header">Date</div>
                  <div className="summary-header">Item</div>
                  <div className="summary-header">Subtotal</div>
                  <div className="summary-header">City Tax</div>
                  <div className="summary-header">Tax Percent</div>
                  <div className="summary-header">Total</div>
                  <div className="summary-header">Retailer</div>
                  <div className="summary-header">City/State or Internet</div>
                  <div className="summary-header">City/State Shipped to</div>
                  <div className="summary-header">Billable?</div>
                  <div className="summary-header">PoR CC used?</div>
                </div>
                {itemRowsData.map((row, index) => (
                  <div className="summary-box-item" key={index}>
                    <div className="summary-box-item-row">
                      <div className="w10">{row.date}</div>
                      <div className="w10">{row.item}</div>
                      <div className="w10">{row.subTotal}</div>
                      <div className="w10">{row.cityTax}</div>
                      <div className="w10">{row.taxPercent}</div>
                      <div className="w10">{row.total}</div>
                      <div className="w10">{row.retailer}</div>
                      <div className="w10">{row.shippedFrom}</div>
                      <div className="w10">{row.shippedTo}</div>
                      <div className="w10">{row.billable}</div>
                      <div className="w10">{row.porCC}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No item expenses added yet.</p>
            )}
          </div>
        </div>

        {/* Mileage Expenses Section */}
        <div className="summary-section">
          <h3>Mileage</h3>
          <div className="summary-box">
            {mileageRowsData.length > 0 ? (
              <div>
                <div className="summary-headers-container">
                  <div className="summary-header">Date</div>
                  <div className="summary-header">Purpose</div>
                  <div className="summary-header">Miles</div>
                  <div className="summary-header">Billable?</div>
                  <div className="summary-header">Amount</div>
                </div>
                {mileageRowsData.map((row, index) => (
                  <div className="summary-box-item" key={index}>
                    <div className="summary-box-item-row">
                      <div className="w20">{row.date}</div>
                      <div className="w20">{row.purpose}</div>
                      <div className="w20">{row.miles}</div>
                      <div className="w20">{row.billable}</div>
                      <div className="w20">{row.amount}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No mileage expenses added yet.</p>
            )}
          </div>
        </div>

        {/* Food Expenses Section */}
        <div className="summary-section">
          <h3>Food</h3>
          <div className="summary-box">
            {foodRowsData.length > 0 ? (
              <div>
                <div className="summary-headers-container">
                  <div className="summary-header">Date</div>
                  <div className="summary-header">Amount</div>
                  <div className="summary-header">Location</div>
                  <div className="summary-header">Persons</div>
                  <div className="summary-header">Type</div>
                  <div className="summary-header">Purpose</div>
                  <div className="summary-header">Billable?</div>
                  <div className="summary-header">PoR CC used?</div>
                </div>
                {foodRowsData.map((row, index) => (
                  <div className="summary-box-item" key={index}>
                    <div className="summary-box-item-row">
                      <div className="w12">{row.date}</div>
                      <div className="w12">{row.amount}</div>
                      <div className="w12">{row.location}</div>
                      <div className="w12">{row.persons}</div>
                      <div className="w12">{row.type}</div>
                      <div className="w12">{row.purpose}</div>
                      <div className="w12">{row.billable}</div>
                      <div className="w12">{row.porCC}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No food expenses added yet.</p>
            )}
          </div>
        </div>

        {/* Uploaded Files Section */}
        <div className="summary-section">
          <h3>Uploaded Files</h3>
          <div className="summary-box">
            {uploadedFiles.length > 0 ? (
              <div>
                <div className="summary-headers-container">
                  <div className="summary-header">File Name</div>
                </div>
                {uploadedFiles.map((file, index) => (
                  <div className="summary-box-item" key={index}>
                    <div className="summary-box-item-row">
                      <div className="w100">{file.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No files uploaded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
