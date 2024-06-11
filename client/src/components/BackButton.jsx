import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = () => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <button className="btn btn-primary" onClick={handleBackClick}>
      Back
    </button>
  );
};

export default BackButton;