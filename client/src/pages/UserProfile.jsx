// UserProfile.jsx
import React, { useState } from 'react';
import axios from 'axios';
import "../css/UserProfile.css"; // Add your own styling

const UserProfile = () => {
  const [profileImage, setProfileImage] = useState(localStorage.getItem("googleProfileImage") || "");
  const [firstName, setFirstName] = useState("First Name");
  const [lastName, setLastName] = useState("Last Name");
  const [email, setEmail] = useState("user@example.com");
  const [newImage, setNewImage] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setNewImage(file);
  };

  const handleSaveProfile = async () => {
    // If user uploads a new image, send it to the server
    if (newImage) {
      const formData = new FormData();
      formData.append('profileImage', newImage);

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_SERVER_END_POINT}/upload-profile-image`, // Endpoint to handle image upload
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setProfileImage(response.data.imageUrl);
        localStorage.setItem("googleProfileImage", response.data.imageUrl); // Store the new image
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }

    // Save other details to the server (if applicable)
    try {
      await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/update-profile`,
        { firstName, lastName, email }
      );
      alert("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="user-profile">
      <h1>User Profile</h1>
      <div className="profile-image-section">
        <img
          src={profileImage}
          alt="Profile"
          style={{ borderRadius: '50%', width: '150px', height: '150px' }}
        />
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>

      <div className="profile-details">
        <label>
          First Name:
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label>
          Last Name:
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      </div>

      <button onClick={handleSaveProfile}>Save Profile</button>
    </div>
  );
};

export default UserProfile;
