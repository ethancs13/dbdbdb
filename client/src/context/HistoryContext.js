import axios from "axios";
import { createContext, useState, useEffect } from "react";
const HistoryContext = createContext();

const HistoryProvider = ({ children }) => {
  const [historyData, setHistoryData] = useState(null);

  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:3001/user-info", {
        withCredentials: true,
      });
      const historyData = response.data;
      console.log(historyData);
      setHistoryData(historyData);
    } catch (error) {
      console.error("Error fetching user info:", error);
      setHistoryData(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <HistoryContext.Provider value={{ historyData }}>
      {children}
    </HistoryContext.Provider>
  );
};

export default HistoryProvider;