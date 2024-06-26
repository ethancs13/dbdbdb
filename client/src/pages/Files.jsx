import React, { useContext, useState, useRef } from "react";
import { FormContext } from "../context/FormContext";
import axios from "axios";
import "../css/Files.css";

const Files = () => {
  const { uploadedFiles, addFiles, removeFile } = useContext(FormContext);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  axios.defaults.withCredentials = true;

  const handleFileChange = (e) => {
    addFiles(Array.from(e.target.files));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileRemove = (index) => {
    removeFile(index);
  };

  const handleClick = () => {
    fileInputRef.current.click(); 
  };

  return (
    <div className="auth-form-container">
      <h1>Upload Files</h1>
      <div
        className="file-upload-container"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}  // Assign the reference to the input element
          style={{ display: "none" }}  // Hide the file input
        />
        <div onClick={handleClick} className="drag-drop-area">
          Drag and drop files here, or click to select files
        </div>
      </div>
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h2>Uploaded Files</h2>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index} className="file-item">
                <span className="file-name">{file.name}</span>
                <button
                  className="btn-remove"
                  onClick={() => handleFileRemove(index)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Files;