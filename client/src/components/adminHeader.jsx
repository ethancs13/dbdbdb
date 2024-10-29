import React, { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../css/Header.css"; // Ensure your CSS handles alignment, including floating the profile image to the top right

const AdminHeader = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("customProfileImage") || // Check for custom image first
    localStorage.getItem("googleProfileImage") || // Fallback to Google image
    null
  );

  // Listen for updates to localStorage to reflect profile image changes immediately
  useEffect(() => {
    const handleStorageChange = () => {
      const customImage = localStorage.getItem("customProfileImage");
      const googleImage = localStorage.getItem("googleProfileImage");

      // Prioritize custom profile image
      if (customImage) {
        setProfileImage(customImage);
      } else if (googleImage) {
        setProfileImage(googleImage);
      }
    };

    // Listen for changes in localStorage
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

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

  return (
    <div className="header-wrapper">
      <div className="header-left">
        <Link to="/" className="header-left-link">
          <h3 style={{ color: "#333" }}>Admin Panel</h3>
        </Link>
      </div>
      <div className="header-right">
        <LogoutButton />
        {isAuthenticated && profileImage ? (
          <div className="user-profile-icon">
            <Link to="/profile">
              <img
                src={profileImage}
                alt="Profile"
                style={{
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  cursor: "pointer",
                }}
              />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminHeader;
