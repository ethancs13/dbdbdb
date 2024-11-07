import React, { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";
import GoogleSignIn from "./GoogleSignIn";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../css/Header.css";

const adminHeader = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileImage, setProfileImage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    axios.defaults.withCredentials = true;

    // Check user authentication and role
    axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/`).then((res) => {
      if (res.data.status === "Success" || res.data.status === "rootUser") {
        setIsAuthenticated(true);
        setUserEmail(res.data.email);
        setIsAdmin(res.data.status === "rootUser");
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        navigate("/login");
      }
    });
  }, [navigate]);

  const handleGoogleSignIn = (data) => {
    if (data.payload) {
      setProfileImage(data.payload.picture);
    }
  };

  return (
    <div className="header-wrapper">
      <div className="header-left">
        <Link to="/" className="header-left-link">
          <h3 style={{ color: "#333" }}>Admin Panel</h3>
        </Link>
      </div>
      <div className="header-right">
        <LogoutButton />
        {isAdmin && (
          <div className="admin-profile">
            {profileImage ? (
              <img src={profileImage} alt="Google Profile" className="profile-image" />
            ) : (
              <GoogleSignIn onSignIn={handleGoogleSignIn} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default adminHeader;
