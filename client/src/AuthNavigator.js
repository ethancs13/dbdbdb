import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const AuthNavigator = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== "/signup") {
      navigate("/login");
    } else if (isAuthenticated && location.pathname === "/login") {
      navigate("/");
    }
  }, [isAuthenticated, navigate, location.pathname]);

  return <>{children}</>;
};

export default AuthNavigator;