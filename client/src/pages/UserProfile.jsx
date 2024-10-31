import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/UserProfile.css"; // Add your own styling

const UserProfile = () => {
  const userId = localStorage.getItem("userId");

  // Prioritize custom uploaded image over Google profile image
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("customProfileImage") ||
      localStorage.getItem("googleProfileImage") ||
      "/default-profile.png"
  );

  const [firstName, setFirstName] = useState("First Name");
  const [lastName, setLastName] = useState("Last Name");
  const [email, setEmail] = useState("user@example.com");
  const [newImage, setNewImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    // Update profile image based on any changes in local storage
    const updateProfileImage = () => {
      const storedCustomImage = localStorage.getItem("customProfileImage");
      setProfileImage(
        storedCustomImage ||
          localStorage.getItem("googleProfileImage") ||
          "/default-profile.png"
      );
    };

    window.addEventListener("storage", updateProfileImage);
    return () => {
      window.removeEventListener("storage", updateProfileImage);
    };
  }, []);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    // If user uploads a new image, send it to the server
    if (newImage) {
      const formData = new FormData();
      formData.append("profileImage", newImage);
      formData.append("userId", userId); // Include user ID in formData

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_SERVER_END_POINT}/upload-profile-image`, // Endpoint to handle image upload
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        const newImageUrl = response.data.imageUrl;
        setProfileImage(newImageUrl);
        localStorage.setItem("customProfileImage", newImageUrl); // Store the custom uploaded image
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }

    // Save other details to the server (if applicable)
    try {
      await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/update-profile`,
        { userId, firstName, lastName, email } // Include userId in the payload
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
          src={previewImage || profileImage} // Use preview if available, else use saved profile image
          alt="Profile"
          style={{ borderRadius: "50%", width: "150px", height: "150px" }}
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