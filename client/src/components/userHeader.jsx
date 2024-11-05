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

    axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/`).then((res) => {
      if (res.data.status === "Success") {
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
    const year = new Date().getFullYear();
    const options = [];
    for (let i = year - 2; i <= year + 1; i++) {
      options.push(i);
    }
    setYearOptions(options);
  }, []);

  const { rowsData, foodRowsData, itemRowsData, mileageRowsData, clearFormContext, uploadedFiles } =
    useContext(FormContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedMonth = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    // Submission logic here
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
