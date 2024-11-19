import React, { useContext, useState, useEffect } from "react";
import { FormContext } from "../context/FormContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LogoutButton from "./LogoutButton";
import "../css/userHeader.css";

const UserHeader = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [fn, setFn] = useState("");
  const [ln, setLn] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearOptions, setYearOptions] = useState([]);
  const [userEmail, setUserEmail] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    axios.defaults.withCredentials = true;

    // Check user authentication and role
    axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/`).then((res) => {
      if (res.data.status === "Success") {
        setIsAuthenticated(true);
        setEmail(res.data.email);
        setFn(res.data.fn);
        setLn(res.data.ln);
      } else if (res.data.status === "rootUser") {
        setIsAuthenticated(true);
        setEmail(res.data.email);
        setFn(res.data.fn);
        setLn(res.data.ln);
      } else {
        setIsAuthenticated(false);
        navigate("/login");
      }
    });
  }, [navigate]);

  useEffect(() => {
    const date = new Date();
    const year = date.getFullYear();
    const options = [];
    for (let i = year - 2; i <= year + 1; i++) {
      options.push(i);
    }
    setYearOptions(options);
  }, []);

  const { rowsData, foodRowsData, itemRowsData, mileageRowsData, clearFormContext, uploadedFiles } =
    useContext(FormContext);

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/user`, {
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
    return savedRows ? JSON.parse(savedRows) : "";
  });

  useEffect(() => {
    localStorage.setItem("expenseMonth", JSON.stringify(expenseMonth));
    console.log(expenseMonth);
  }, [expenseMonth]);

  const uploadData = async (formData) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/upload`,
        formData,
        {
          withCredentials: true,
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

    const formattedMonth = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    setExpenseMonth(formattedMonth);

    const formData = new FormData();
    formData.append("month", formattedMonth);
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
    <div className="user-header-wrapper">
      <div className="user-header-content">
        <div className="user-header-name-section">
          <h3 className="user-header-label">Name</h3>
          <div className="user-header-name">
            <h3>
              {fn} {ln}
            </h3>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="user-header-form">
          <h3 className="user-header-label">Expense Period</h3>
          <select
            className="user-header-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
          <select
            className="user-header-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button type="submit" className="user-header-submit-button">
            Submit Expenses
          </button>
        </form>
      </div>
      <LogoutButton />
    </div>
  );
};

export default UserHeader;
