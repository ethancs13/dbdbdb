// context/HistoryContext.js
import axios from "axios";
import { createContext, useState, useEffect } from "react";

const HistoryContext = createContext();

const HistoryProvider = ({ children }) => {
  const [historyData, setHistoryData] = useState({});

  const fetchHistoryData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/user`, {
        withCredentials: true,
      });
      console.log("Fetched History Data:", response.data); // Debugging information
      setHistoryData(response.data);
    } catch (error) {
      console.error("Error fetching user info:", error);
      setHistoryData(null);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  return (
    <HistoryContext.Provider
      value={{ historyData, setHistoryData, fetchHistoryData }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export { HistoryContext, HistoryProvider };
