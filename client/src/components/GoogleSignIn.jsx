import React, { useState, useEffect } from "react";
import axios from "axios";

const GoogleSignIn = ({ onSignIn }) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeGoogleSignIn = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_END_POINT}/client-id`);
        const clientId = response.data.clientId;

        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            console.log("Encoded JWT ID token:", response.credential);
            onSignIn(response.credential);
          },
          auto_select: true, // Automatically select the account if possible
          cancel_on_tap_outside: false, // Prevents the prompt from being dismissed by clicking outside
        });

        google.accounts.id.prompt();
        setInitialized(true);
      } catch (error) {
        console.error("Error fetching client ID:", error);
      }
    };

    if (!initialized) {
      if (typeof google !== "undefined") {
        initializeGoogleSignIn();
      } else {
        window.onload = initializeGoogleSignIn;
      }
    }
  }, [initialized, onSignIn]);

  return <div id="buttonDiv"></div>;
};

export default GoogleSignIn;
