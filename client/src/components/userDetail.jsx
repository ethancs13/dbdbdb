import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/userDetail.css";

const userDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`process.env.SERVER_END_POINT/admin/users/${id}`, {
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

  const handleDelete = async () => {
    try {
      await axios.delete(`process.env.SERVER_END_POINT/admin/users/${id}`, {
        withCredentials: true,
      });
      navigate('/');
    } catch (err) {
      setError("Error deleting user");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-detail">
      {user && (
        <div>
          <h2>{user.FN} {user.LN}</h2>
          <p>Email: {user.EMAIL}</p>
          <p>Role: {user.ROLE}</p>
          <button onClick={handleDelete}>Remove User</button>
        </div>
      )}
    </div>
  );
};

export default userDetail;
