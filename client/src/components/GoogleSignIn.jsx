import React, { useState, useEffect } from "react";
import axios from "axios";

const GoogleSignIn = ({ onSignIn, profileImage }) => {
  const [initialized, setInitialized] = useState(false);
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("googleAccessToken") || null
  );
  const [idToken, setIdToken] = useState(localStorage.getItem("idToken") || null);

  const verifyTokenWithServer = async (idToken) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/verify-token`,
        { idToken }
      );
      
      // If the token is valid, log in the user
      if (response.data && response.data.payload) {
        console.log("Token is valid:", response.data.payload);
        onSignIn({ idToken, payload: response.data.payload });
      } else {
        console.error("Token is invalid");
        localStorage.removeItem("idToken");
        localStorage.removeItem("googleAccessToken");
        window.google.accounts.id.prompt();
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      // Clear token and prompt login again
      localStorage.removeItem("idToken");
      localStorage.removeItem("googleAccessToken");
      window.google.accounts.id.prompt();
    }
  };

  const handleGoogleSignIn = async (response) => {
    console.log("Encoded JWT ID token:", response.credential);

    // Exchange the ID token for an access token (or directly use the ID token for verification)
    try {
      const tokenResponse = await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/exchange-token`,
        { idToken: response.credential }
      );

      const payload = tokenResponse.data.payload;
      console.log("Payload:", payload);

      // Store tokens in localStorage
      localStorage.setItem("idToken", response.credential);
      setIdToken(response.credential);
      onSignIn({
        idToken: response.credential,
        payload,
      });
      localStorage.setItem("googleProfileImage", tokenResponse.data.payload.picture);
      profileImage(tokenResponse.data.payload.picture);

      // Optionally, verify the token with the server
      verifyTokenWithServer(response.credential);
    } catch (error) {
      console.error("Error exchanging token:", error);
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_SERVER_END_POINT}/client-id`
        );
        const clientId = response.data.clientId;

        if (clientId && window.google) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleSignIn,
            auto_select: true, // Automatically select user if possible
            cancel_on_tap_outside: false,
          });

          // Check if a valid ID token is available before showing the login screen
          if (idToken) {
            console.log("Using stored ID token:", idToken);
            verifyTokenWithServer(idToken);
          } else {
            window.google.accounts.id.prompt(); // Show prompt if no valid token is found
          }

          setInitialized(true);
        } else {
          throw new Error("Client ID is undefined or Google is not loaded");
        }
      } catch (error) {
        console.error("Error fetching client ID:", error);
      }
    };

    if (!initialized) {
      if (typeof window.google !== "undefined") {
        initializeGoogleSignIn();
      } else {
        window.onload = initializeGoogleSignIn;
      }
    }
  }, [initialized, idToken, onSignIn]);

  return <div id="buttonDiv"></div>;
};

export default GoogleSignIn;
