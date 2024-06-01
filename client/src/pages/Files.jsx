import React, { useContext, useState } from "react";
import { FileContext } from "../context/FileContext";
import axios from "axios";
import "../css/Files.css";

const Files = () => {
  const { uploadedFiles, addFiles, removeFile } = useContext(FileContext);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Implement file upload logic here
    setLoading(false);
  };

  return (
    <div className="auth-form-container">
      <h1>Upload Files</h1>
      <div
        className="file-upload-container"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* <label htmlFor="file-upload">Upload Files:</label> */}
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={handleFileChange}
        />
        <div className="drag-drop-area">
          Drag and drop files here, or click to select files
        </div>
      </div>
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h2>Uploaded Files:</h2>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index}>
                {file.name}
                <button onClick={() => handleFileRemove(index)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Submit"}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Files;