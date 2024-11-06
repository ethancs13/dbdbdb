import React from "react";
import { Link, useLocation } from "react-router-dom";
import BackButton from "./BackButton";
import "../css/userNavigation.css";

const userNavigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="user_navigation_wrapper">
      <div className="user_navigation_container">
        <div className="user_navigation_left">
          <Link
            to="/general"
            className={
              currentPath === "/general" ? "user-navigation-items active" : "user-navigation-items"
            }
          >
            <button>General</button>
          </Link>
          <Link
            to="/food-beverage"
            className={
              currentPath === "/food-beverage"
                ? "user-navigation-items active"
                : "user-navigation-items"
            }
          >
            <button>Food & Beverage</button>
          </Link>
          <Link
            to="/mileage"
            className={
              currentPath === "/mileage" ? "user-navigation-items active" : "user-navigation-items"
            }
          >
            <button>Mileage</button>
          </Link>
          <Link
            to="/itemized-purchases"
            className={
              currentPath === "/itemized-purchases"
                ? "user-navigation-items active"
                : "user-navigation-items"
            }
          >
            <button>Itemized Purchases</button>
          </Link>
          <Link
            to="/upload-files"
            className={
              currentPath === "/upload-files"
                ? "user-navigation-items active"
                : "user-navigation-items"
            }
          >
            <button>Upload Files</button>
          </Link>
          <Link
            to="/"
            className={
              currentPath === "/" ? "user-navigation-items active" : "user-navigation-items"
            }
          >
            <button>Summary</button>
          </Link>
        </div>
        <Link
          to="/history"
          className={
            currentPath === "/history" ? "user-navigation-items active" : "user-navigation-items"
          }
        >
          <button>History</button>
        </Link>
      </div>
      {/* <BackButton /> */}
    </div>
  );
};

export default userNavigation;
