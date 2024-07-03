import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true); // Add a loading state
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("https://server-production-82d5.up.railway.app:3001/", {
          withCredentials: true,
        });
        console.log("Data: ", response.data);
        setIsAuthenticated(response.data.isAuthenticated);
        setUserRole(response.data.role);
      } catch (error) {
        setIsAuthenticated(false);
        setUserRole(null);
      } finally {
        setLoading(false); // Set loading to false after the check is complete
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "https://server-production-82d5.up.railway.app:3001/login",
        { email, password },
        { withCredentials: true }
      );
      if (response.data.Status === "Success") {
        setIsAuthenticated(true);
        setUserRole("user");
        return { status: "success" };
      } else if (response.data.Status === "rootUser") {
        setIsAuthenticated(true);
        setUserRole("admin");
        return { status: "rootUser" };
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
    await axios.get("https://server-production-82d5.up.railway.app:3001/logout", { withCredentials: true });
    setIsAuthenticated(false);
    setUserRole(null);
    console.log("Navigating to login...");
    navigate("/login");
  };

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while checking authentication
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
