import React, { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../css/Header.css";

const AdminHeader = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("customProfileImage") ||
    localStorage.getItem("googleProfileImage") ||
    ""
  );

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_SERVER_END_POINT}/user-profile`,
          { withCredentials: true }
        );

        if (response.data.profileImageUrl) {
          setProfileImage(response.data.profileImageUrl);
          localStorage.setItem("customProfileImage", response.data.profileImageUrl);
        } else {
          // If no custom profile image found, fallback to Google profile picture
          const googleImage = localStorage.getItem("googleProfileImage");
          if (googleImage) {
            setProfileImage(googleImage);
          }
        }
      } catch (error) {
        console.error("Error fetching profile image:", error);
      }
    };

    if (!localStorage.getItem("customProfileImage")) {
      fetchProfileImage();
    }
  }, []);

  useEffect(() => {
    axios.defaults.withCredentials = true;

    // Check user authentication and role
    axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/`).then((res) => {
      if (res.data.status === "Success" || res.data.status === "rootUser") {
        setIsAuthenticated(true);
        setUserEmail(res.data.email);
        setIsAdmin(res.data.status === "rootUser");

        // Prioritize custom profile image if available, otherwise use Google profile image
        const customImage = localStorage.getItem("customProfileImage");
        if (customImage) {
          setProfileImage(customImage);
        } else {
          setProfileImage(localStorage.getItem("googleProfileImage") || "/default-profile.png");
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        navigate("/login");
      }
    });
  }, [navigate]);

  useEffect(() => {
    // Listen for changes to local storage for profile image updates
    const handleStorageChange = (event) => {
      if (event.key === "customProfileImage" || event.key === "googleProfileImage") {
        const customImage = localStorage.getItem("customProfileImage");
        const googleImage = localStorage.getItem("googleProfileImage");

        setProfileImage(customImage || googleImage || "/default-profile.png");
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className="header-wrapper">
      <div className="header-left">
        <Link to="/" className="header-left-link">
          <h3 style={{ color: "#333" }}>Admin Panel</h3>
        </Link>
      </div>
      <div className="header-right">
        <LogoutButton />
        {isAuthenticated && profileImage && (
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
        )}
      </div>
    </div>
  );
};

export default AdminHeader;
