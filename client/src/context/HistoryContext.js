// context/HistoryContext.js
import axios from "axios";
import { createContext, useState, useEffect } from "react";

const HistoryContext = createContext();

const HistoryProvider = ({ children }) => {
  const [historyData, setHistoryData] = useState({});

  const fetchHistoryData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_END_POINT}/user`,
        {
          withCredentials: true,
        }
      );

      // Destructure email and other data you don't want to group by month and year
      const { email, ...rest } = response.data;

      // console.log("Fetched History Data:", rest); // Debugging information without email

      setHistoryData(rest); // Only set the data you need
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
