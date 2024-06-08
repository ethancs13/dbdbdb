import React, { useContext } from "react";
import axios from "axios";
import { HistoryContext } from "../context/HistoryContext";

const History = () => {
  const { historyData } = useContext(HistoryContext);

  const renderCategory = (category, items) => {
    return items.map((item, index) => (
      <div key={index}>
        {Object.entries(item).map(([key, value]) => (
          <div key={key}>
            {key}: {value}
          </div>
        ))}
      </div>
    ));
  };

  const handleDeleteMonth = (monthYear, e) => {
    e.preventDefault();
    const date = new Date(monthYear);
    const yyyymm = date.getFullYear() + "-";
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month ranges from 0 to 11, so add 1 to get the correct month
    const yyyymmFormatted = yyyymm + month;

    console.log(yyyymmFormatted);

    axios
      .get("http://localhost:3001/api/user-id", {
        withCredentials: true,
      })
      .then((response) => {
        const user_Id = response.data.user_Id;
        console.log("response: ", response.data);

        return axios.delete(
          `http://localhost:3001/delete-month/${yyyymmFormatted}/${user_Id}`,
          {
            withCredentials: true,
          }
        );
      })
      .then((response) => {
        console.log(response.data.message);
        // Update the UI to reflect the deleted data
        // You might want to refresh the data here
      })
      .catch((error) => {
        console.error("There was an error deleting the data:", error);
      });
  };

  return (
    <div>
      {Object.entries(historyData).map(([yyyymm, categories]) => (
        <div key={yyyymm}>
          <h3>{yyyymm}</h3>
          {Object.entries(categories).map(([category, items]) => (
            <div key={category}>
              <h4>{category}</h4>
              {renderCategory(category, items)}
            </div>
          ))}
          <div>
            <button onClick={(e) => handleDeleteMonth(yyyymm, e)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default History;
