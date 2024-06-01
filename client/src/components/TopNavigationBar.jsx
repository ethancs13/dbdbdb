import React from 'react';
import BackButton from './BackButton';
import { Link } from 'react-router-dom';

const Header = () => {
    return (
        <div className="expense_navigation_wrapper" style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
            <div className="expense_navigation_container">
                <Link to="/"><button>Home</button></Link>
                <Link to="/summary"><button>Summary</button></Link>
                <Link to="/general"><button>General</button></Link>
                <Link to="/food-beverage"><button>Food & Beverage</button></Link>
                <Link to="/mileage"><button>Mileage</button></Link>
                <Link to="/itemized-purchases"><button>Itemized Purchases</button></Link>
                <Link to="/upload-files"><button>Upload Files</button></Link>
            </div>
            <Link to="/history"><button>History</button></Link>
            <BackButton />
        </div>
    );
};

export default Header;
