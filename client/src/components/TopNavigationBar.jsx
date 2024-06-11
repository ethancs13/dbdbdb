import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import BackButton from './BackButton';
import '../css/Header.css';

const Header = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="expense_navigation_wrapper" style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
      <div className="expense_navigation_container">
        <Link to="/" className={currentPath === '/' ? 'active' : ''}><button>Home</button></Link>
        <Link to="/summary" className={currentPath === '/summary' ? 'active' : ''}><button>Summary</button></Link>
        <Link to="/general" className={currentPath === '/general' ? 'active' : ''}><button>General</button></Link>
        <Link to="/food-beverage" className={currentPath === '/food-beverage' ? 'active' : ''}><button>Food & Beverage</button></Link>
        <Link to="/mileage" className={currentPath === '/mileage' ? 'active' : ''}><button>Mileage</button></Link>
        <Link to="/itemized-purchases" className={currentPath === '/itemized-purchases' ? 'active' : ''}><button>Itemized Purchases</button></Link>
        <Link to="/upload-files" className={currentPath === '/upload-files' ? 'active' : ''}><button>Upload Files</button></Link>
      </div>
      <Link to="/history" className={currentPath === '/history' ? 'active' : ''}><button className="btn btn-primary">History</button></Link>
      <BackButton />
    </div>
  );
};

export default Header;
