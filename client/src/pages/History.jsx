import React, { useContext } from "react";
import HistoryContext from "../context/HistoryContext";

const History = () => {
  const { historyData } = useContext(HistoryContext);
  console.log(historyData);
  // Use the user object here
  return <div>{/* Your history component code here */}</div>;
};

export default History;
