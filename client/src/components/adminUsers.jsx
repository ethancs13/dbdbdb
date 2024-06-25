import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/adminUsers.css";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:3001/admin/users", {
          withCredentials: true,
        });
        setUsers(response.data);
      } catch (err) {
        setError("Error fetching users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  const handleUserClick = (id) => {
    navigate(`/user/${id}`);
  };

  return (
    <div className="admin-dashboard">
      <h1>Registered Users</h1>
      <ul className="user-list">
        {users.map((user) => (
          <li className="user-item" key={user.ID} onClick={() => handleUserClick(user.ID)}>
            <div className="user-info">
              <span>{user.FN} {user.LN}</span>
              <span>({user.EMAIL})</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminUsers;
