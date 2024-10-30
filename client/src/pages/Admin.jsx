import React, { useState, useEffect } from "react";
import axios from "axios";
import CalendarWidget from "../components/CalendarWidget";
import GoogleSignIn from "../components/GoogleSignIn";
import DatePicker from "react-datepicker"; // Import DatePicker for date selection
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "../css/adminUsers.css";
import "react-datepicker/dist/react-datepicker.css";

const Admin = () => {
  // State management
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [users, setUsers] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
  });
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("googleProfileImage") || null
  );
  const [newMileageRate, setNewMileageRate] = useState({
    rate: "",
    startDate: "",
    endDate: "",
  });
  const [newExpenseType, setNewExpenseType] = useState("");
  const [allSubmissions, setAllSubmissions] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [mileageRates, setMileageRates] = useState([]);
  const [googleToken, setGoogleToken] = useState("");
  const [addUserButtonText, setAddUserButtonText] = useState("Add User");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState(null);
  const [deletingUsers, setDeletingUsers] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchExpenseTypes();
    fetchAllSubmissions();
    fetchMileageRates();
  }, []);

  // Function to handle export data request
  const handleExport = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_END_POINT}/download-excel`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          responseType: "blob", // Important for file download
        }
      );

      // Trigger file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "export.xlsx"); // Updated file extension
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  // Data fetching functions
  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/users`,
        { withCredentials: true }
      );
      setUsers(response.data.users);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchExpenseTypes = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/expense-types`,
        { withCredentials: true }
      );
      const normalizedData = response.data.map((item) => ({
        id: item.ID,
        type: item.TYPE,
        orderIndex: item.ORDER_INDEX,
        createdAt: item.CREATED_AT,
      }));
      setExpenseTypes(normalizedData);
    } catch (err) {
      console.error("Error fetching expense types:", err);
    }
  };

  const fetchAllSubmissions = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/all-submissions`,
        { withCredentials: true }
      );
      setAllSubmissions(response.data);
    } catch (err) {
      console.error("Error fetching all submissions:", err);
    }
  };

  const fetchMileageRates = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/mileage-rates`,
        { withCredentials: true }
      );
      setMileageRates(response.data);
    } catch (err) {
      console.error("Error fetching mileage rates:", err);
    }
  };

  // Utility functions
  const generateRandomPassword = () => Math.random().toString(36).slice(-8);

  const capitalizeFirstLetter = (string) =>
    string.charAt(0).toUpperCase() + string.slice(1);

  const calculateTotalAmount = (categories) => {
    let total = 0;
    Object.values(categories).forEach((items) => {
      if (Array.isArray(items)) {
        items.forEach((item) => {
          if (item.amount) {
            total += parseFloat(item.amount);
          } else if (item.AMOUNT) {
            total += parseFloat(item.AMOUNT);
          }
        });
      }
    });
    return total.toFixed(2);
  };

  // Handlers for user management
  const handleAddUser = async () => {
    setIsAddingUser(true);
    const tempPassword = generateRandomPassword();
    const userWithPassword = {
      ...newUser,
      password: tempPassword,
      idToken: googleToken,
    };

    if (!googleToken) {
      setIsAddingUser(false);
      alert("Google token is missing. Please sign in again.");
      return;
    }

    try {
      const userIdResponse = await axios.get(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/user-id`
      );

      const userId = userIdResponse.data.ID;
      await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/refresh-token`,
        {
          id: userId,
        }
      );

      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/users`,
        userWithPassword,
        { withCredentials: true }
      );

      if (response.status === 200 && response.data.status === "Success") {
        setNewUser({
          firstName: "",
          lastName: "",
          email: "",
          role: "user",
        });
        sendEmail(newUser.email, googleToken, tempPassword);
      } else {
        alert(response.data.Error);
      }
    } catch (err) {
      console.error("Error adding user:", err);
      alert("Error adding user. Please try again.");
    } finally {
      setIsAddingUser(false);
    }
  };

  const sendEmail = async (userEmail, token, tempPassword) => {
    console.log("Sending email with the following details:", {
      userEmail,
      token,
      tempPassword,
    });

    try {
      const userIdResponse = await axios.get(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/user-id`
      );
      const userId = userIdResponse.data.ID;

      const refreshTokenResponse = await axios.get(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/refresh-token`,
        {
          id: userId,
        }
      );

      const refreshToken = refreshTokenResponse.data.refresh_token;

      await axios.post(`${process.env.REACT_APP_SERVER_END_POINT}/send-email`, {
        token: token,
        email: userEmail,
        tempPassword: tempPassword,
        refreshToken: refreshToken,
      });

      console.log("Email sent successfully.");
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    setDeletingUsers((prevState) => ({ ...prevState, [userId]: true }));
    try {
      await axios.delete(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/users/${userId}`,
        { withCredentials: true }
      );
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
    } finally {
      setDeletingUsers((prevState) => ({ ...prevState, [userId]: false }));
    }
  };

  // Handlers for mileage rates
  const handleAddMileageRate = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/mileage-rates`,
        newMileageRate,
        { withCredentials: true }
      );
      setNewMileageRate({ rate: "", startDate: "", endDate: "" });
      fetchMileageRates();
    } catch (err) {
      console.error("Error adding mileage rate:", err);
    }
  };

  // Handlers for submissions
  const handleUpdateSubmission = async (submissionId, updatedData) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/submissions/${submissionId}`,
        updatedData,
        { withCredentials: true }
      );
      fetchAllSubmissions();
    } catch (err) {
      console.error("Error updating submission:", err);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(expenseTypes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setExpenseTypes(items);

    axios
      .post(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/update-expense-types-order`,
        items,
        { withCredentials: true }
      )
      .then(() => {
        console.log("Order updated successfully");
      })
      .catch((error) => {
        console.error("Error updating order:", error);
      });
  };

  const handleAddExpenseType = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/expense-types`,
        { type: newExpenseType },
        { withCredentials: true }
      );
      setNewExpenseType("");
      fetchExpenseTypes();
    } catch (err) {
      console.error("Error adding expense type:", err);
    }
  };

  const handleDeleteExpenseType = async (id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/expense-types/${id}`,
        { withCredentials: true }
      );
      fetchExpenseTypes();
    } catch (err) {
      console.error("Error deleting expense type:", err);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  const renderCategory = (category, items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return <div className="no-items">No items available</div>;
    }

    return items.map((item, index) => (
      <div key={index} className="item-container">
        {Object.entries(item)
          .filter(
            ([key]) =>
              key.toLowerCase() !== "id" && key.toLowerCase() !== "user_id"
          )
          .map(([key, value]) => (
            <div key={key} className="item">
              <strong>{key}:</strong> {value}
            </div>
          ))}
      </div>
    ));
  };

  return (
    <div
      className="admin-dashboard"
      style={{ display: "flex", flexWrap: "wrap" }}
    >
      {/* Export Data Section */}
      <section
        className="export-data-section"
        style={{ width: "100%", marginBottom: "20px" }}
      >
        <h3>Export Data</h3>
        <div className="export-data-controls">
          <label>Start Month</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="yyyy-MM" // Set the desired format for display
            showMonthYearPicker // Enables only month and year selection
            placeholderText="Select start month"
            className="date-picker-input"
          />
          <label>End Month</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="yyyy-MM" // Set the desired format for display
            showMonthYearPicker // Enables only month and year selection
            placeholderText="Select end month"
            className="date-picker-input"
          />
          <button className="export-button" onClick={handleExport}>
            Run
          </button>
        </div>
      </section>

      <section className="mileage-rates">
        <h2>IRS Mileage Rate</h2>
        <div className="add-mileage-rate">
          <input
            type="text"
            placeholder="$/Mile"
            value={newMileageRate.rate}
            onChange={(e) =>
              setNewMileageRate({ ...newMileageRate, rate: e.target.value })
            }
          />
          <div style={{ display: "flex" }}>
            <CalendarWidget
              selectedDate={newMileageRate.startDate}
              onDateChange={(date) =>
                setNewMileageRate({ ...newMileageRate, startDate: date })
              }
            />
            <CalendarWidget
              selectedDate={newMileageRate.endDate}
              onDateChange={(date) =>
                setNewMileageRate({ ...newMileageRate, endDate: date })
              }
            />
          </div>
          <button
            className="admin-expense-types-btn-add"
            onClick={handleAddMileageRate}
          >
            Add Mileage Rate
          </button>
        </div>

        <div className="current-mileage-rates">
          <h3>Current Mileage Rates</h3>
          {mileageRates.length === 0 ? (
            <p>No mileage rates available.</p>
          ) : (
            <ul>
              {mileageRates.map((rate) => (
                <li key={rate.ID}>
                  <strong>Rate:</strong> ${rate.RATE} /mile
                  <br />
                  <strong>Start Date:</strong>{" "}
                  {new Date(rate.START_DATE).toLocaleDateString()}
                  <br />
                  <strong>End Date:</strong>{" "}
                  {rate.END_DATE
                    ? new Date(rate.END_DATE).toLocaleDateString()
                    : "N/A"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="expense-types">
        <h2>Expense Types</h2>
        <div className="add-expense-type">
          <input
            type="text"
            placeholder="New Expense Type"
            value={newExpenseType}
            onChange={(e) => setNewExpenseType(e.target.value)}
          />
          <button
            className="admin-expense-types-btn-add"
            onClick={handleAddExpenseType}
          >
            Add Expense Type
          </button>
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="expenseTypes">
            {(provided) => (
              <ul
                className="expense-type-list"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {expenseTypes.map((type, index) => (
                  <Draggable
                    key={type.id.toString()}
                    draggableId={type.id.toString()}
                    index={index}
                  >
                    {(provided) => (
                      <li
                        className="expense-type-list-item"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        {type.type}
                        <button
                          className="admin-expense-types-btn-del"
                          onClick={() => handleDeleteExpenseType(type.id)}
                        >
                          Delete
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </section>

      <section className="users">
        <div className="add-user-form">
          <h2>Add User</h2>
          {addUserError && <div className="error-message">{addUserError}</div>}
          <input
            type="text"
            placeholder="First Name"
            value={newUser.firstName}
            onChange={(e) =>
              setNewUser({ ...newUser, firstName: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Last Name"
            value={newUser.lastName}
            onChange={(e) =>
              setNewUser({ ...newUser, lastName: e.target.value })
            }
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            className="admin-expense-types-btn-add"
            onClick={handleAddUser}
            disabled={isAddingUser}
          >
            {addUserButtonText}
          </button>
        </div>

        <ul className="user-list">
          <h2>Users</h2>
          {users.map((user) => (
            <li className="user-item" key={user.ID}>
              <div className="user-info">
                <span onClick={() => handleUserClick(user)}>
                  {capitalizeFirstLetter(user.FN)}{" "}
                  {capitalizeFirstLetter(user.LN)} ({user.EMAIL})
                </span>
              </div>
              <button
                className="admin-expense-types-btn-del"
                onClick={() => handleDeleteUser(user.ID)}
                disabled={deletingUsers[user.ID]}
              >
                {deletingUsers[user.ID] ? "Deleting..." : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="submissions">
        <h2>Previous Submissions</h2>
        {selectedUser ? (
          <div>
            <h3>
              Submissions for {capitalizeFirstLetter(selectedUser.FN)}{" "}
              {capitalizeFirstLetter(selectedUser.LN)}
            </h3>

            <div>
              {selectedUser && allSubmissions[selectedUser.ID] ? (
                Object.entries(allSubmissions[selectedUser.ID]).map(
                  ([yyyymm, categories]) => {
                    const totalAmount = calculateTotalAmount(categories);
                    return (
                      <details key={yyyymm} className="history-entry">
                        <summary className="history-summary">
                          {yyyymm} - Total Amount: ${totalAmount}
                        </summary>
                        {Object.entries(categories).map(([category, items]) => (
                          <div key={category} className="category-container">
                            <h4 className="category-title">
                              {category.charAt(0).toUpperCase() +
                                category.slice(1)}
                            </h4>
                            {renderCategory(category, items)}
                          </div>
                        ))}
                      </details>
                    );
                  }
                )
              ) : (
                <p>No submissions found.</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            {Object.entries(allSubmissions).map(([userId, userSubmissions]) => (
              <details key={userId} className="user-submissions">
                <summary className="user-summary">
                  {capitalizeFirstLetter(
                    users.find((user) => user.ID === parseInt(userId)).FN
                  )}{" "}
                  {capitalizeFirstLetter(
                    users.find((user) => user.ID === parseInt(userId)).LN
                  )}
                </summary>
                {Object.entries(userSubmissions).map(([yyyymm, categories]) => {
                  const totalAmount = calculateTotalAmount(categories);
                  return (
                    <details key={yyyymm} className="history-entry">
                      <summary className="history-summary">
                        {yyyymm} - Total Amount: ${totalAmount}
                      </summary>
                      {Object.entries(categories).map(([category, items]) => (
                        <div key={category} className="category-container">
                          <h4 className="category-title">
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </h4>
                          {renderCategory(category, items)}
                        </div>
                      ))}
                    </details>
                  );
                })}
              </details>
            ))}
          </div>
        )}
        {selectedSubmission && (
          <div className="edit-submission">
            <h3>Edit Submission</h3>
            <input
              type="text"
              value={selectedSubmission.type}
              onChange={(e) =>
                setSelectedSubmission({
                  ...selectedSubmission,
                  title: e.target.value,
                })
              }
            />
            <CalendarWidget
              selectedDate={selectedSubmission.date}
              onDateChange={(date) =>
                setSelectedSubmission({ ...selectedSubmission, date })
              }
            />
            <button
              onClick={() =>
                handleUpdateSubmission(
                  selectedSubmission.id,
                  selectedSubmission
                )
              }
            >
              Update Submission
            </button>
          </div>
        )}
      </section>

      {/* Add the GoogleSignIn component */}
      <GoogleSignIn
        profileImage={(imageURL) => setProfileImage(imageURL)}
        onSignIn={({ idToken }) => setGoogleToken(idToken)}
      />
    </div>
  );
};

export default Admin;
