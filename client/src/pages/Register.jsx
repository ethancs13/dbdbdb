import React, { useState } from "react";
import axios from 'axios';
import '../css/Auth.css'; // Import the register CSS file
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import AuthContext

export const Register = () => {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'process.env.SERVER_END_POINT';
    const navigate = useNavigate();

    const { login } = useAuth(); // Use the login method from AuthContext

    const [error, setError] = useState('');
    const [fn, setFn] = useState('');
    const [ln, setLn] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPass] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(`${apiBaseUrl}/signup`, { fn, ln, email, password });
            if (response.data.Status === 'Success') {
                try {
                    const loginResponse = await login(email, password);
                    if (loginResponse.status === 'success' || loginResponse.status === 'rootUser') {
                        setFn('');
                        setLn('');
                        setEmail('');
                        setPass('');
                        navigate('/');
                    } else {
                        setError('Error logging in after registration. Please try logging in manually.');
                    }
                } catch (err) {
                    console.error('Error during login request after registration:', err);
                    setError('An unexpected error occurred. Please try again.');
                }
            } else {
                setError('Error during registration. Please try again.');
            }
        } catch (err) {
            console.error('Error during registration request:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="auth-form-container">
            <h2>Register</h2>
            {error && <div className="error-message">{error}</div>}
            <form className="register-form" onSubmit={handleSubmit}>
                <label className="register-label" htmlFor="fn">First Name</label>
                <input value={fn} onChange={(e) => setFn(e.target.value)} type="text" placeholder="John" id="fn" name="fn" />
                <label className="register-label" htmlFor="ln">Last Name</label>
                <input value={ln} onChange={(e) => setLn(e.target.value)} type="text" placeholder="Doe" id="ln" name="ln" />
                <label className="register-label" htmlFor="email">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="youremail@gmail.com" id="email" name="email" />
                <label className="register-label" htmlFor="password">Password</label>
                <input value={password} onChange={(e) => setPass(e.target.value)} type="password" placeholder="* * * * * * * *" id="password" name="password" />
                <button className="btn btn-primary" type="submit">Register</button>
            </form>
            <Link to="/login" className="link-btn">Already have an account? Login.</Link>
        </div>
    );
};
