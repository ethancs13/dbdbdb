import React, { useContext, useState, useEffect } from "react";
import { FormContext } from "../context/FormContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LogoutButton from "./LogoutButton";
import "../css/Header.css";

const userHeader = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [fn, setFn] = useState("");
  const [ln, setLn] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Default to current month
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearOptions, setYearOptions] = useState([]);
  const [userEmail, setUserEmail] = useState("");

  const formattedMonth = `${selectedYear}-${String(selectedMonth).padStart(
    2,
    "0"
  )}`;
  console.log(formattedMonth);

  const navigate = useNavigate();

  useEffect(() => {
    axios.defaults.withCredentials = true;

    // Check user authentication and role
    axios.get("process.env.SERVER_END_POINT/").then((res) => {
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

  const {
    rowsData,
    foodRowsData,
    itemRowsData,
    mileageRowsData,
    clearFormContext,
    uploadedFiles,
  } = useContext(FormContext);
  console.log();

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const response = await axios.get("process.env.SERVER_END_POINT/user", {
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
        "process.env.SERVER_END_POINT/upload",
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

    const formattedMonth = `${selectedYear}-${String(selectedMonth).padStart(
      2,
      "0"
    )}`;
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
    <div className="header-wrapper">
      <div className="expense_navigation_wrapper">
        <div>
          <h3 style={{ textAlign: "right", width: "12rem" }}>Name</h3>
          <div className="expense_navigation_name">
            <h3>
              {fn} {ln}
            </h3>
          </div>
        </div>
        <form onSubmit={(e) => handleSubmit(e)}>
          <h3>Expense Period</h3>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            <option value="0">January</option>
            <option value="1">February</option>
            <option value="2">March</option>
            <option value="3">April</option>
            <option value="4">May</option>
            <option value="5">June</option>
            <option value="6">July</option>
            <option value="7">August</option>
            <option value="8">September</option>
            <option value="9">October</option>
            <option value="10">November</option>
            <option value="11">December</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </form>
      </div>
      <div>
        <LogoutButton />
      </div>
    </div>
  );
};

export default userHeader;
