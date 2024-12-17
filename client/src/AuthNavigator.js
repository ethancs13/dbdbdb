import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const AuthNavigator = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== "/signup") {
      // Redirect unauthenticated users to login
      navigate("/login");
    } else if (isAuthenticated && userRole === "admin" && location.pathname === "/admin") {
      const isGoogleSignedIn = localStorage.getItem("googleSignedIn");
      if (!isGoogleSignedIn) {
        navigate("/google-signin"); // Redirect to Google Sign-In
      }
    } else if (isAuthenticated && location.pathname === "/login") {
      // Redirect authenticated users from login page
      navigate(userRole === "admin" ? "/admin" : "/dashboard");
    }
  }, [isAuthenticated, userRole, navigate, location.pathname]);

  return <>{children}</>;
};

export default AuthNavigator;
