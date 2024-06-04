import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
  //   if (!isAuthenticated) {
  //     navigate("/login"); // Redirect to login page if not authenticated
  //     return;
  //   }

    const checkAuth = async () => {
      try {
        const response = await axios.get("http://localhost:3001/check-auth", {
          withCredentials: true,
        });
        setIsAuthenticated(response.data.isAuthenticated);
      } catch (error) {
        setIsAuthenticated(false);
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
        return { status: "success" };
      } else {
        setIsAuthenticated(false);
        return { status: "error", message: response.data.Status };
      }
    } catch (error) {
      setIsAuthenticated(false);
      return { status: "error", message: "An unexpected error occurred." };
    }
  };

  const logout = async () => {
    await axios.get("http://localhost:3001/logout", { withCredentials: true });
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
