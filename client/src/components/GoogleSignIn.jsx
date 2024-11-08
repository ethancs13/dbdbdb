import React, { useState, useEffect } from "react";
import axios from "axios";

const GoogleSignIn = ({ onSignIn }) => {
  const [initialized, setInitialized] = useState(false);
  const [idToken, setIdToken] = useState(localStorage.getItem("idToken") || null);

  const verifyTokenWithServer = async (idToken) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER_END_POINT}/verify-token`, {
        idToken,
      });

      if (response.data && response.data.payload) {
        // console.log("Token is valid:", response.data.payload);
        onSignIn({ idToken, payload: response.data.payload });
      } else {
        // console.error("Token is invalid");
        localStorage.removeItem("idToken");
        window.google.accounts.id.prompt();
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      localStorage.removeItem("idToken");
      window.google.accounts.id.prompt();
    }
  };

  const handleGoogleSignIn = async (response) => {
    // console.log("Encoded JWT ID token:", response.credential);

    try {
      const tokenResponse = await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/exchange-token`,
        { idToken: response.credential }
      );

      const payload = tokenResponse.data.payload;
      // console.log("Payload:", payload);

      // Store tokens in localStorage
      localStorage.setItem("idToken", response.credential);
      setIdToken(response.credential);
      onSignIn({ idToken: response.credential, payload });

      // Store profile image in localStorage and emit a custom event to notify listeners
      localStorage.setItem("googleProfileImage", payload.picture);
    } catch (error) {
      console.error("Error exchanging token:", error);
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/client-id`);
        const clientId = response.data.clientId;

        if (clientId && window.google) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleSignIn,
            auto_select: true,
            cancel_on_tap_outside: false,
          });

          if (idToken) {
            // console.log("Using stored ID token:", idToken);
            verifyTokenWithServer(idToken);
          } else {
            window.google.accounts.id.prompt();
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
