import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("http://localhost:3001/check-auth", {
          withCredentials: true,
        });
        setIsAuthenticated(response.data.isAuthenticated);
        setUserRole(response.data.role);
      } catch (error) {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "http://localhost:3001/login",
        { email, password },
        { withCredentials: true }
      );
      if (response.data.Status === "Success") {
        setIsAuthenticated(true);
        setUserRole(response.data.role);
        return { status: "success" };
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
        return { status: "error", message: response.data.Status };
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUserRole(null);
      return { status: "error", message: "An unexpected error occurred." };
    }
  };

  const logout = async () => {
    console.log("Logging out...");
    await axios.get("http://localhost:3001/logout", { withCredentials: true });
    setIsAuthenticated(false);
    setUserRole(null);
    console.log("Navigating to login...");
    navigate("/login"); // Navigate to login page on logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
