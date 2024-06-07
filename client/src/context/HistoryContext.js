// context/HistoryContext.js
import axios from 'axios';
import { createContext, useState, useEffect } from 'react';

const HistoryContext = createContext();

const HistoryProvider = ({ children }) => {
  const [historyData, setHistoryData] = useState({});

  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:3001/user', {
        withCredentials: true,
      });
      const historyData = response.data;
      setHistoryData(historyData);
    } catch (error) {
      console.error('Error fetching user info:', error);
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

export { HistoryContext, HistoryProvider };
