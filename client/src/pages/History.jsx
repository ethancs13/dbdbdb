import React, { useContext, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { HistoryContext } from "../context/HistoryContext";
import "../css/History.css";

const History = () => {
  const { historyData, setHistoryData, fetchHistoryData } = useContext(HistoryContext);
  const location = useLocation();

  useEffect(() => {
    fetchHistoryData();
  }, [location.pathname]);

  console.log("History Data:", historyData);

  const renderCategory = (category, items) => {
    return items.map((item, index) => (
      <div key={index} className="item-container">
        {Object.entries(item)
          .filter(([key, value]) => key.toLowerCase() !== 'id' && key.toLowerCase() !== 'user_id')
          .map(([key, value]) => (
            <div key={key} className="item">
              <strong>{key}:</strong> {value}
            </div>
          ))}
      </div>
    ));
  };

  const calculateTotalAmount = (categories) => {
    let total = 0;
    Object.values(categories).forEach((items) => {
      items.forEach((item) => {
        if (item.amount) {
          total += parseFloat(item.amount);
        } else if (item.AMOUNT) {
          total += parseFloat(item.AMOUNT);
        }
      });
    });
    return total.toFixed(2); // Ensure two decimal places
  };

  const handleDeleteMonth = (monthYear, e) => {
    e.preventDefault();
    const date = new Date(monthYear);
    const yyyymm = date.getFullYear() + "-";
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const yyyymmFormatted = yyyymm + month;

    console.log("Formatted Month-Year:", yyyymmFormatted);

    axios
      .get("http://localhost:3001/api/user-id", {
        withCredentials: true,
      })
      .then((response) => {
        const user_Id = response.data.user_Id;
        console.log("User ID response: ", response.data);

        return axios.delete(
          `http://localhost:3001/delete-month/${yyyymmFormatted}/${user_Id}`,
          {
            withCredentials: true,
          }
        );
      })
      .then((response) => {
        console.log("Delete response:", response.data.message);
        fetchHistoryData();
      })
      .catch((error) => {
        console.error("There was an error deleting the data:", error);
      });
  };

  if (!historyData || Object.keys(historyData).length === 0) {
    return (
      <div className="history-empty-container">
        <div className="history-box-item">Entries: 0</div>
      </div>
    );
  }

  return (
    <div className="history-container">
      {Object.entries(historyData).map(([yyyymm, categories]) => {
        const totalAmount = calculateTotalAmount(categories);
        return (
          <details key={yyyymm} className="history-entry">
            <summary className="history-summary">
              {yyyymm} - Total Amount: ${totalAmount}
            </summary>
            {Object.entries(categories).map(([category, items]) => (
              <div key={category} className="category-container">
                <h4 className="category-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                {Array.isArray(items) ? renderCategory(category, items) : <div>No items available</div>}
              </div>
            ))}
            <button className="delete-button" onClick={(e) => handleDeleteMonth(yyyymm, e)}>
              Delete
            </button>
          </details>
        );
      })}
    </div>
  );
};

export default History;
