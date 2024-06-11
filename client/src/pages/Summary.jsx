import React, { useContext, useState, useEffect } from "react";
import { FormContext } from "../context/FormContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/Summary.css";

const Summary = () => {
  const {
    rowsData,
    foodRowsData,
    itemRowsData,
    mileageRowsData,
    clearFormContext,
    uploadedFiles,
  } = useContext(FormContext);
  console.log(uploadedFiles);

  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const response = await axios.get("http://localhost:3001/user", {
          withCredentials: true,
        });
        setUserEmail(response.data.email);
      } catch (error) {
        console.error("Error fetching user email:", error);
      }
    };

    fetchUserEmail();
  }, []);

  const [expenseMonth, setExpenseMonth] = useState(() => {
    const savedRows = localStorage.getItem("expenseMonth");
    return savedRows ? JSON.parse(savedRows) : [];
  });
  useEffect(() => {
    localStorage.setItem("expenseMonth", JSON.stringify(expenseMonth));
  }, [expenseMonth]);

  const uploadData = async (formData) => {
    try {
      const response = await axios.post(
        "http://localhost:3001/upload",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response;
    } catch (error) {
      console.error("Error uploading data:", error);
      throw error;
    }
  };

  const handleSuccess = (response) => {
    console.log(response);
    localStorage.removeItem("rowsData");
    clearFormContext();
    navigate("/thank-you");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(new Date(expenseMonth));
    const formData = new FormData();
    formData.append("month", expenseMonth);
    formData.append("email", userEmail);
    formData.append("rowsData", JSON.stringify(rowsData));
    formData.append("foodRowsData", JSON.stringify(foodRowsData));
    formData.append("itemRowsData", JSON.stringify(itemRowsData));
    formData.append("mileageRowsData", JSON.stringify(mileageRowsData));
    // Append each file to the FormData
    for (let i = 0; i < uploadedFiles.length; i++) {
      formData.append("uploadedFiles", uploadedFiles[i]);
    }

    try {
      const response = await uploadData(formData);
      handleSuccess(response);
      localStorage.removeItem("expenseMonth");
      setExpenseMonth("");
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="summary-container">
      <div className="summary-sections-container">
        <div className="summary-section">
          <h3>Month of Expenses</h3>
          <div className="summary-box">
            <input
              type="month"
              value={expenseMonth}
              onChange={(e) => setExpenseMonth(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="summary-section">
          <h3>General</h3>
          <div className="summary-box">
            {rowsData.length > 0 ? (
              rowsData.map((row, index) => (
                <div className="summary-box-item" key={index}>
                  <div className="row">
                    <div className="col3">{row.type}</div>
                    <div className="col2">{row.billable}</div>
                    <div className="col2">{row.porCC}</div>
                    <div className="col2">{row.amount}</div>
                    <div className="col3">{row.comment}</div>
                  </div>
                </div>
              ))
            ) : (
              <p>No expenses added yet.</p>
            )}
          </div>
        </div>
        <div className="summary-section">
          <h3>Food</h3>
          <div className="summary-box">
            {foodRowsData.length > 0 ? (
              foodRowsData.map((row, index) => (
                <div className="summary-box-item" key={index}>
                  <div className="row">
                    <div className="col4">{row.date}</div>
                    <div className="col2">{row.amount}</div>
                    <div className="col1">{row.persons}</div>
                    <div className="col1">{row.type}</div>
                    <div className="col2">{row.purpose}</div>
                    <div className="col1">{row.billable}</div>
                    <div className="col1">{row.porCC}</div>
                  </div>
                </div>
              ))
            ) : (
              <p>No food or beverage items added yet.</p>
            )}
          </div>
        </div>
        <div className="summary-section">
          <h3>Items</h3>
          <div className="summary-box">
            {itemRowsData.length > 0 ? (
              itemRowsData.map((row, index) => (
                <div className="summary-box-item" key={index}>
                  <div className="row">
                    <div className="col2">{row.item}</div>
                    <div className="col2">{row.date}</div>
                    <div className="col1">{row.subTotal}</div>
                    <div className="col1">{row.cityTax}</div>
                    <div className="col1">{row.taxPercent}</div>
                    <div className="col1">{row.total}</div>
                    <div className="col1">{row.source}</div>
                    <div className="col1">{row.shippedFrom}</div>
                    <div className="col1">{row.shippedTo}</div>
                    <div className="col1">{row.billable}</div>
                  </div>
                </div>
              ))
            ) : (
              <p>No itemized purchases added yet.</p>
            )}
          </div>
        </div>
        <div className="summary-section">
          <h3>Mileage</h3>
          <div className="summary-box">
            {mileageRowsData.length > 0 ? (
              mileageRowsData.map((row, index) => (
                <div className="summary-box-item" key={index}>
                  <div className="row">
                    <div className="col3">{row.date}</div>
                    <div className="col1">{row.amount}</div>
                    <div className="col1">{row.persons}</div>
                    <div className="col1">{row.type}</div>
                    <div className="col1">{row.total}</div>
                    <div className="col3">{row.purpose}</div>
                    <div className="col1">{row.billable}</div>
                    <div className="col1">{row.porCC}</div>
                  </div>
                </div>
              ))
            ) : (
              <p>No mileage expenses added yet.</p>
            )}
          </div>
        </div>
        <div className="summary-section">
          <h3>Files</h3>
          <div className="summary-box">
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map((file, index) => (
                <div className="summary-box-item" key={index}>
                  <div className="row">
                    <div className="col3">{file.name}</div>
                  </div>
                </div>
              ))
            ) : (
              <p>No files uploaded yet.</p>
            )}
          </div>
        </div>
      </div>

      <button type="submit">Submit</button>
    </form>
  );
};

export default Summary;
