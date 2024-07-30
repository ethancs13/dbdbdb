import React, { useState, useEffect } from "react";
import axios from "axios";
import CalendarWidget from "../components/CalendarWidget";
import GoogleSignIn from "../components/GoogleSignIn"; // Import the GoogleSignIn component
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "../css/adminUsers.css";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
  });
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
  const [googleToken, setGoogleToken] = useState(""); // Add state to store Google token
  const [addUserButtonText, setAddUserButtonText] = useState("Add User");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState(null);
  const [deletingUsers, setDeletingUsers] = useState({}); // Track deletion state for each user

  useEffect(() => {
    fetchUsers();
    fetchExpenseTypes();
    fetchAllSubmissions();
    fetchMileageRates();
  }, []);

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

  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8); // Generates a random 8-character password
  };

  const handleAddUser = async () => {
    const tempPassword = generateRandomPassword();
    const userWithPassword = { ...newUser, password: tempPassword };

    if (!googleToken || !newUser.email) {
      setAddUserError("Error: Requires Google Authentication.");
      setAddUserButtonText("Add User");
      setTimeout(() => setAddUserError(null), 3000);
      return;
    }

    setIsAddingUser(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/admin/users`,
        userWithPassword,
        { withCredentials: true }
      );
      console.log("User added response:", response.data); // Logging
      setNewUser({ firstName: "", lastName: "", email: "", role: "user" });
      fetchUsers();

      // Send email after user is added
      console.log("sending email");
      await sendEmail(newUser.email, googleToken, tempPassword); // Include tempPassword
      setAddUserButtonText("Added");
      setTimeout(() => setAddUserButtonText("Add User"), 1000);
    } catch (err) {
      console.error("Error adding user:", err);
      setAddUserError("Error adding user.");
      setTimeout(() => setAddUserError(null), 3000);
    } finally {
      setIsAddingUser(false);
    }
  };

  const sendEmail = (userEmail, token, tempPassword) => {
    return axios
      .post(`${process.env.REACT_APP_SERVER_END_POINT}/send-email`, {
        token: token,
        email: userEmail,
        tempPassword: tempPassword, // Include tempPassword
      })
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(response.statusText);
        }
        return response.data;
      })
      .then((data) => console.log(data))
      .catch((error) => {
        console.error("Error:", error);
        setAddUserError("Error sending email.");
        setTimeout(() => setAddUserError(null), 3000);
      });
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
      .then((response) => {
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

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div
      className="admin-dashboard"
      style={{ display: "flex", flexWrap: "wrap" }}
    >
      <h1 style={{ width: "100%", padding: "1rem" }}>Admin Dashboard</h1>

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
      <GoogleSignIn onSignIn={(token) => setGoogleToken(token)} />
    </div>
  );
};

export default Admin;
