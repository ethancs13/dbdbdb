import React from "react";
import { Link, useLocation } from "react-router-dom";
import BackButton from "./BackButton";
import "../css/adminNavigation.css";

const AdminNavigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="admin_navigation_wrapper">
      <div className="admin_navigation_container">
        <Link to="/" className={currentPath === "/" ? "active" : ""}>
          <button>Summary</button>
        </Link>
        <Link to="/users" className={currentPath === "/users" ? "active" : ""}>
          <button>Users</button>
        </Link>
        <Link to="/mileage-rate" className={currentPath === "/mileage-rate" ? "active" : ""}>
          <button>IRS Mileage Rate</button>
        </Link>
        <Link to="/submissions" className={currentPath === "/submissions" ? "active" : ""}>
          <button>Submissions</button>
        </Link>
      </div>
      <BackButton />
    </div>
  );
};

export default AdminNavigation;
