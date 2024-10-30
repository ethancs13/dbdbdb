import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/`, {
          withCredentials: true,
        });
        setIsAuthenticated(response.data.isAuthenticated);
        setUserRole(response.data.role);
      } catch (error) {
        setIsAuthenticated(false);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/login`,
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
      } else if (response.data.Status === "ChangePassword") {
        setIsAuthenticated(true);
        setUserRole("user");
        navigate('/change-password'); // Redirect to change-password
        return { status: "ChangePassword", token: response.data.token };
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
    await axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/logout`, { withCredentials: true });
    localStorage.clear("googleProfileImage");
    localStorage.clear("idToken");
    setIsAuthenticated(false);
    setUserRole(null);
    console.log("Navigating to login...");
    navigate("/login");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
