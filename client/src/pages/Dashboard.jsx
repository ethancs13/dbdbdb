import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TopNavigationBar from "../components/TopNavigationBar";
import "../css/App.css";

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [fn, setFn] = useState("");
  const [ln, setLn] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    axios.defaults.withCredentials = true;

    // Check user authentication and role
    axios.get("http://localhost:3001/").then((res) => {
      if (res.data.status === "Success") {
        setIsAuthenticated(true);
        setEmail(res.data.email);
        setFn(res.data.fn);
        setLn(res.data.ln);
      } else if (res.data.status === "rootUser") {
        setIsAdmin(true);
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

  const handleLogout = () => {
    axios
      .get("http://localhost:3001/logout")
      .then(() => {
        setIsAuthenticated(false);
        setIsAdmin(false);
        navigate("/login");
      })
      .catch((err) => console.log(err));
  };

  return (
    <div>
      <main className="main">
        {isAdmin ? (
          <div>
            <h1>Welcome, Admin!</h1>
          </div>
        ) : (
          <div>
            <h1>
              Welcome, {fn} {ln}
            </h1>
          </div>
        )}
        <button onClick={handleLogout}>Logout</button>
      </main>
    </div>
  );
};

export default Dashboard;
