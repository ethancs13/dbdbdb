import React, { useContext, useEffect, useState } from 'eact';
import { useAuth } from './AuthContext';
import { FormContext } from './FormContext';

const Admin = () => {
  const { isAdmin, user } = useAuth();
  const { rowsData, mileageRowsData, itemRowsData, foodRowsData } = useContext(FormContext);
  const [userData, setUserData] = useState({});

  useEffect(() => {
    if (isAdmin()) {
      const userData = {
        rowsData: rowsData.filter((row) => row.userId === user.id),
        mileageRowsData: mileageRowsData.filter((row) => row.userId === user.id),
        itemRowsData: itemRowsData.filter((row) => row.userId === user.id),
        foodRowsData: foodRowsData.filter((row) => row.userId === user.id),
      };
      setUserData(userData);
    }
  }, [isAdmin, user, rowsData, mileageRowsData, itemRowsData, foodRowsData]);

  if (!isAdmin()) {
    return <div>You do not have access to this page.</div>;
  }

  return (
    <div>
      <h1>Welcome, Admin!</h1>
      <h2>User Data:</h2>
      <ul>
        <li>
          <h3>Rows Data:</h3>
          <ul>
            {userData.rowsData.map((row, index) => (
              <li key={index}>
                <p>Type: {row.type}</p>
                <p>Billable: {row.billable? 'Yes' : 'No'}</p>
                <p>POR/CC: {row.porCC}</p>
                <p>Amount: {row.amount}</p>
                <p>Comment: {row.comment}</p>
              </li>
            ))}
          </ul>
        </li>
        <li>
          <h3>Mileage Rows Data:</h3>
          <ul>
            {userData.mileageRowsData.map((row, index) => (
              <li key={index}>
                <p>Date: {row.date}</p>
                <p>Purpose: {row.purpose}</p>
                <p>Miles: {row.miles}</p>
                <p>Billable: {row.billable? 'Yes' : 'No'}</p>
                <p>Amount: {row.amount}</p>
              </li>
            ))}
          </ul>
        </li>
        <li>
          <h3>Item Rows Data:</h3>
          <ul>
            {userData.itemRowsData.map((row, index) => (
              <li key={index}>
                <p>Purchase Date: {row.purchaseDate}</p>
                <p>Item: {row.item}</p>
                <p>Sub Total: {row.subTotal}</p>
                <p>City Tax: {row.cityTax}</p>
                <p>Tax Percent: {row.taxPercent}</p>
                <p>Total: {row.total}</p>
                <p>Retailer: {row.retailer}</p>
                <p>Shipped From: {row.shippedFrom}</p>
                <p>Shipped To: {row.shippedTo}</p>
                <p>Billable: {row.billable? 'Yes' : 'No'}</p>
                <p>POR/CC: {row.porCC? 'Yes' : 'No'}</p>
              </li>
            ))}
          </ul>
        </li>
        <li>
          <h3>Food Rows Data:</h3>
          <ul>
            {userData.foodRowsData.map((row, index) => (
              <li key={index}>
                <p>Purchase Date: {row.purchaseDate}</p>
                <p>Amount: {row.amount}</p>
                <p>Location: {row.location}</p>
                <p>Persons: {row.persons}</p>
                <p>Title: {row.title}</p>
                <p>Purpose: {row.purpose}</p>
                <p>Billable: {row.billable? 'Yes' : 'No'}</p>
                <p>POR/CC: {row.porCC? 'Yes' : 'No'}</p>
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default Admin;