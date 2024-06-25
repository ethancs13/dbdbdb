import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/userDetail.css";

const UserDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/admin/users/${id}`, {
          withCredentials: true,
        });
        setUser(response.data);
      } catch (err) {
        setError("Error fetching user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-detail">
      {user && (
        <div>
          <h2>{user.FN} {user.LN}</h2>
          <p>Email: {user.EMAIL}</p>
          <p>Role: {user.ROLE}</p>
          <button onClick={() => {/* Add remove user logic */}}>Remove User</button>
          <button onClick={() => {/* Add user logic */}}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default UserDetail;
