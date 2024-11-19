import React, { useEffect, useState } from "react";
import axios from "axios";

const MileageRow = ({ row, index, handleChange, deleteTableRows }) => {
  const { date, purpose, miles, billable, amount } = row;
  const [mileageRates, setMileageRates] = useState([]);

  // Fetch mileage rates when the component mounts and when the date changes
  useEffect(() => {
    if (date) {
      fetchMileageRates();
    }
  }, [date]);

  // Automatically calculate the amount whenever miles or date changes
  useEffect(() => {
    if (date && miles) {
      calculateAmount();
    }
  }, [date, miles, mileageRates]);

  const fetchMileageRates = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/user/mileage-rates`);
      setMileageRates(response.data);
    } catch (error) {
      console.error("Error fetching mileage rates:", error);
    }
  };

  const calculateAmount = () => {
    const rate = mileageRates.find((rate) => new Date(rate.START_DATE) <= new Date(date));
    const calculatedAmount = rate ? miles * rate.RATE : 0;

    // Create a synthetic event for the amount field and pass it to handleChange
    const amountEvent = {
      target: {
        name: "amount",
        value: calculatedAmount,
      },
      preventDefault: () => {}, // Ensure preventDefault is callable
    };
    handleChange(index, amountEvent);
  };

  return (
    <div className="mileage-row">
      <div className="input-container">
        <input
          type="date"
          name="date"
          value={date}
          className="mileage-input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <input
          type="text"
          name="purpose"
          value={purpose}
          className="mileage-input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <input
          type="number"
          name="miles"
          value={miles}
          className="mileage-input"
          onChange={(e) => handleChange(index, e)}
        />
      </div>
      <div className="input-container">
        <select
          name="billable"
          value={billable}
          className="mileage-select"
          onChange={(e) => handleChange(index, e)}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      <div className="input-container">
        <input
          type="none"
          name="amount"
          value={amount || ""}
          className="mileage-input"
          readOnly
        />
      </div>
      <div className="input-container">
        <button className="btn expense-delete" onClick={(e) => deleteTableRows(e, index)}>
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
};

export default MileageRow;
