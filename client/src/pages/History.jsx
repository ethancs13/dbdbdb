import React, { useContext } from "react";
import { HistoryContext } from "../context/HistoryContext";

const History = () => {
  const { historyData } = useContext(HistoryContext);

  const renderCategory = (category, items) => {
    return items.map((item, index) => (
      <div key={index}>
        {/* Render fields specific to each category */}
        {Object.entries(item).map(([key, value]) => (
          <div key={key}>{key}: {value}</div>
        ))}
      </div>
    ));
  };

  return (
    <div>
      {Object.entries(historyData).map(([month, categories]) => (
        <div key={month}>
          <h3>{month}</h3>
          {Object.entries(categories).map(([category, items]) => (
            <div key={category}>
              <h4>{category}</h4>
              {renderCategory(category, items)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default History;
