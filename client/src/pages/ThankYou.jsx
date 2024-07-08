import React from "react";

const ThankYou = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        marginTop: "4rem",
      }}
    >
      <h3>
        Success
        <i className="fas fa-check" style={{marginLeft: "10px"}}></i>
      </h3>

      <p>thank you</p>
    </div>
  );
};

export default ThankYou;
