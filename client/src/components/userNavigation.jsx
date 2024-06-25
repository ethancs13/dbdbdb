import React from "react";
import { Link, useLocation } from "react-router-dom";
import BackButton from "./BackButton";
import "../css/userNavigation.css";

const userNavigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div
      className="expense_navigation_wrapper"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        width: "100%",
        padding: "0 2rem"
      }}
    >
      <div
        className="expense_navigation_container"
      >
        <Link to="/" className={currentPath === "/" ? "active" : ""}>
          <button>Summary</button>
        </Link>
        <Link
          to="/general"
          className={currentPath === "/general" ? "active" : ""}
        >
          <button>General</button>
        </Link>
        <Link
          to="/food-beverage"
          className={currentPath === "/food-beverage" ? "active" : ""}
        >
          <button>Food & Beverage</button>
        </Link>
        <Link
          to="/mileage"
          className={currentPath === "/mileage" ? "active" : ""}
        >
          <button>Mileage</button>
        </Link>
        <Link
          to="/itemized-purchases"
          className={currentPath === "/itemized-purchases" ? "active" : ""}
        >
          <button>Itemized Purchases</button>
        </Link>
        <Link
          to="/upload-files"
          className={currentPath === "/upload-files" ? "active" : ""}
        >
          <button>Upload Files</button>
        </Link>
        <Link
          to="/history"
          className={currentPath === "/history" ? "active" : ""}
        >
          <button>History</button>
        </Link>
      </div>
      <BackButton />
    </div>
  );
};

export default userNavigation;
