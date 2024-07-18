import React, { useState } from "react";
import '../css/Auth.css'; // Import the login CSS file
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import AuthContext

export const Login = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, setToken } = useAuth(); // Use the login method from AuthContext
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, pass);
      if (result.status === 'success' || result.status === 'rootUser') {
        navigate('/');
      } else if (result.status === 'ChangePassword') {
        setToken(result.token);
        navigate('/change-password');
      } else {
        setError('Incorrect username or password. Please try again.');
      }
    } catch (err) {
      console.error('Error during login request:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-label" htmlFor="email">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="youremail@gmail.com"
          id="email"
          name="email"
          required
        />
        <label className="login-label" htmlFor="password">Password</label>
        <input
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          type={showPassword ? 'text' : 'password'}
          id="password"
          name="password"
          required
        />
        <div className="show-password">
          <input
            type="checkbox"
            id="show-password"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
          />
          <label htmlFor="show-password">Show Password</label>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
      <Link to="/signup" className="link-btn">Don't have an account? Signup.</Link>
    </div>
  );
};
