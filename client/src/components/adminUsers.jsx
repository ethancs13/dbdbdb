import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/adminUsers.css";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUser, setNewUser] = useState({ fn: "", ln: "", email: "", password: "", role: "user" });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:3001/admin/users", {
          withCredentials: true,
        });
        setUsers(response.data.users || []);
        setCurrentUser(response.data.currentUser);
      } catch (err) {
        setError("Error fetching users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:3001/admin/users", {
        withCredentials: true,
      });
      setUsers(response.data.users || []);
      setCurrentUser(response.data.currentUser);
    } catch (err) {
      setError("Error fetching users");
    }
  };

  const handleUserClick = (id) => {
    navigate(`/user/${id}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleAddUser = async () => {
    try {
      await axios.post("http://localhost:3001/admin/users", newUser, {
        withCredentials: true,
      });
      setNewUser({ fn: "", ln: "", email: "", password: "", role: "user" }); // Reset form
      fetchUsers(); // Refetch users to update the list
    } catch (err) {
      setError("Error adding user");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Registered Users</h1>
      <ul className="user-list">
        {users.filter(user => user.ID !== currentUser).map((user) => (
          <li className="user-item" key={user.ID} onClick={() => handleUserClick(user.ID)}>
            <div className="user-info">
              <span>{user.FN} {user.LN}</span>
              <span>({user.EMAIL})</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="add-user-form">
        <h2>Add New User</h2>
        <input
          type="text"
          name="fn"
          placeholder="First Name"
          value={newUser.fn}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="ln"
          placeholder="Last Name"
          value={newUser.ln}
          onChange={handleInputChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={newUser.email}
          onChange={handleInputChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={newUser.password}
          onChange={handleInputChange}
        />
        <select name="role" value={newUser.role} onChange={handleInputChange}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn btn-primary" onClick={handleAddUser}>Add User</button>
      </div>
    </div>
  );
};

export default AdminUsers;
