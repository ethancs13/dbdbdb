import React from "react";
import { Link, useLocation } from "react-router-dom";
import BackButton from "./BackButton";
import "../css/userNavigation.css";

const adminNavigation = () => {
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
          to="/users"
          className={currentPath === "/" ? "active" : ""}
        >
          <button>Users</button>
        </Link>
      </div>
      <BackButton />
    </div>
  );
};

export default adminNavigation;
