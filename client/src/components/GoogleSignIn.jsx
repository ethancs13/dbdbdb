import React, { useState, useEffect } from "react";
import axios from "axios";

const GoogleSignIn = ({ onSignIn }) => {
  const [initialized, setInitialized] = useState(false);

  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_END_POINT}/refresh-token`,
        {
          refreshToken: refreshToken,
        }
      );

      const newAccessToken = response.data.access_token;
      console.log("New access token:", newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error("Error refreshing access token:", error);
    }
  };

  const accessToken = refreshAccessToken(); // Now it's okay to call refreshAccessToken

  const getGmailProfile = async () => {
    try {
      const response = await axios.get(
        "https://www.googleapis.com/gmail/v1/users/me/profile",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching Gmail profile:", error);
    }
  };

  // getGmailProfile();

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
            callback: async (response) => {
              console.log("Encoded JWT ID token:", response.credential);

              // Exchange the ID token for an access token
              try {
                const tokenResponse = await axios.post(
                  `${process.env.REACT_APP_SERVER_END_POINT}/exchange-token`,
                  {
                    idToken: response.credential,
                  }
                );

                const payload = tokenResponse.data.payload;
                console.log("Payload:", payload);

                onSignIn({ idToken: response.credential, payload });
              } catch (error) {
                console.error("Error verifying token:", error);
              }
            },
            auto_select: true,
            cancel_on_tap_outside: false,
          });

          window.google.accounts.id.prompt();
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
  }, [initialized, onSignIn]);

  return <div id="buttonDiv"></div>;
};

export default GoogleSignIn;
