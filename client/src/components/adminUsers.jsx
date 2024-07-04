import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CalendarWidget from './CalendarWidget';
import '../css/adminUsers.css';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [mileageRates, setMileageRates] = useState([]);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', role: 'user' });
  const [newMileageRate, setNewMileageRate] = useState({ rate: '', startDate: '', endDate: '' });
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchMileageRates();
    fetchSubmissions();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/admin/users`, { withCredentials: true });
      setUsers(response.data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchMileageRates = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/admin/mileage-rates`, { withCredentials: true });
      setMileageRates(response.data);
    } catch (err) {
      console.error('Error fetching mileage rates:', err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/admin/submissions`, { withCredentials: true });
      setSubmissions(response.data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  const handleAddUser = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_SERVER_END_POINT}/admin/users`, newUser, { withCredentials: true });
      setNewUser({ firstName: '', lastName: '', email: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_SERVER_END_POINT}/admin/users/${userId}`, { withCredentials: true });
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleAddMileageRate = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_SERVER_END_POINT}/admin/mileage-rates`, newMileageRate, { withCredentials: true });
      setNewMileageRate({ rate: '', startDate: '', endDate: '' });
      fetchMileageRates();
    } catch (err) {
      console.error('Error adding mileage rate:', err);
    }
  };

  const handleUpdateSubmission = async (submissionId, updatedData) => {
    try {
      await axios.put(`${process.env.REACT_APP_SERVER_END_POINT}/admin/submissions/${submissionId}`, updatedData, { withCredentials: true });
      fetchSubmissions();
    } catch (err) {
      console.error('Error updating submission:', err);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <section className="mileage-rates">
        <h2>IRS Mileage Rate</h2>
        <ul>
          {mileageRates.map(rate => (
            <li key={rate.id}>{rate.rate} $/Mile from {rate.startDate} to {rate.endDate}</li>
          ))}
        </ul>
        <div className="add-mileage-rate">
          <input
            type="text"
            placeholder="$/Mile"
            value={newMileageRate.rate}
            onChange={(e) => setNewMileageRate({ ...newMileageRate, rate: e.target.value })}
          />
          <CalendarWidget
            selectedDate={newMileageRate.startDate}
            onDateChange={(date) => setNewMileageRate({ ...newMileageRate, startDate: date })}
          />
          <CalendarWidget
            selectedDate={newMileageRate.endDate}
            onDateChange={(date) => setNewMileageRate({ ...newMileageRate, endDate: date })}
          />
          <button onClick={handleAddMileageRate}>Add Mileage Rate</button>
        </div>
      </section>

      <section className="users">
        <h2>Users</h2>
        <ul className="user-list">
          {users.map(user => (
            <li className="user-item" key={user.ID}>
              <div className="user-info">
                <span>{user.FN} {user.LN} ({user.EMAIL})</span>
              </div>
              <button onClick={() => handleDeleteUser(user.ID)}>Delete</button>
            </li>
          ))}
        </ul>
        <div className="add-user-form">
          <h2>Add User</h2>
          <input
            type="text"
            placeholder="First Name"
            value={newUser.firstName}
            onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={newUser.lastName}
            onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
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
          <button onClick={handleAddUser}>Add User</button>
        </div>
      </section>

      <section className="submissions">
        <h2>Previous Submissions</h2>
        <ul>
          {submissions.map(submission => (
            <li key={submission.id}>
              {submission.title} by {submission.userEmail} on {submission.date} <button onClick={() => setSelectedSubmission(submission)}>Edit</button>
            </li>
          ))}
        </ul>
        {selectedSubmission && (
          <div className="edit-submission">
            <h3>Edit Submission</h3>
            <input
              type="text"
              value={selectedSubmission.title}
              onChange={(e) => setSelectedSubmission({ ...selectedSubmission, title: e.target.value })}
            />
            <CalendarWidget
              selectedDate={selectedSubmission.date}
              onDateChange={(date) => setSelectedSubmission({ ...selectedSubmission, date })}
            />
            <button onClick={() => handleUpdateSubmission(selectedSubmission.id, selectedSubmission)}>Update Submission</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPage;
