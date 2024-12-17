import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GoogleSignIn = ({ onSignIn }) => {
    const [initialized, setInitialized] = useState(false);
  
    const handleGoogleSignIn = async (response) => {
      try {
        const tokenResponse = await axios.post(
          `${process.env.REACT_APP_SERVER_END_POINT}/exchange-token`,
          { idToken: response.credential }
        );
  
        const payload = tokenResponse.data.payload;
        localStorage.setItem("idToken", response.credential);
        localStorage.setItem("googleProfileImage", payload.picture);
  
        onSignIn({ idToken: response.credential, payload });
      } catch (error) {
        console.error("Error exchanging token:", error);
      }
    };
  
    const initializeGoogleSignIn = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/client-id`);
        const clientId = response.data.clientId;
  
        if (clientId && window.google) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleSignIn,
            auto_select: false, // Disable auto sign-in
            cancel_on_tap_outside: false,
          });
  
          setInitialized(true);
        } else {
          throw new Error("Client ID is undefined or Google is not loaded");
        }
      } catch (error) {
        console.error("Error fetching client ID:", error);
      }
    };
  
    useEffect(() => {
      if (!initialized) {
        if (typeof window.google !== "undefined") {
          initializeGoogleSignIn();
        } else {
          window.onload = initializeGoogleSignIn;
        }
      }
    }, [initialized]);
  
    const handleSignInClick = () => {
      if (window.google) {
        window.google.accounts.id.prompt(); // Trigger manual prompt
      }
    };
  
    return (
      <div>
        <button onClick={handleSignInClick}>Sign In with Google</button>
      </div>
    );
  };
  
  export default GoogleSignIn;
  