import React, { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/Header.css";


const adminHeader = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    axios.defaults.withCredentials = true;

    // Check user authentication and role
    axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/`).then((res) => {
      if (res.data.status === "Success") {
        setIsAuthenticated(true);
        setUserEmail(res.data.email);
      } else if (res.data.status === "rootUser") {
        setIsAdmin(true);
        setIsAuthenticated(true);
        setUserEmail(res.data.email);
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        navigate("/login");
      }
    });
  }, [navigate]);

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

  return (
    <div className="header-wrapper">
      <div>
        <LogoutButton />
      </div>
    </div>
  );
};

export default adminHeader;
