import React from "react";
import { Link, useLocation } from "react-router-dom";
import BackButton from "./BackButton";
import "../css/adminNavigation.css";

const adminNavigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="admin_navigation_wrapper">
      <div className="admin_navigation_container">
        <Link to="/" className={currentPath === "/" ? "active" : ""}>
          <button>Summary</button>
        </Link>
      </div>
      <BackButton />
    </div>
  );
};

export default adminNavigation;
