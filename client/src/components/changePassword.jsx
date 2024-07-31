import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import '../css/Auth.css';

const changePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/change-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.Status === "Success") {
        alert("Password changed successfully");
        navigate('/');
      } else {
        setError("Failed to change password. Please try again.");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Change Password</h2>
      {error && <div className="error-message">{error}</div>}
      <form className="change-password-form" onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
        <label className="change-password-label" htmlFor="new-password">New Password</label>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          id="new-password"
          name="new-password"
          required
        />
        <label className="change-password-label" htmlFor="confirm-password">Confirm Password</label>
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          id="confirm-password"
          name="confirm-password"
          required
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default changePassword;
