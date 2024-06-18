import React, { createContext, useState, useEffect } from "react";

const FormContext = createContext();

const FormProvider = ({ children }) => {
  const [rowsData, setRowsData] = useState(() => {
    const savedRows = localStorage.getItem("rowsData");
    return savedRows ? JSON.parse(savedRows) : [];
  });

  const [itemRowsData, setItemRowsData] = useState(() => {
    const savedItems = localStorage.getItem("itemRowsData");
    return savedItems ? JSON.parse(savedItems) : [];
  });

  const [mileageRowsData, setMileageRowsData] = useState(() => {
    const savedMileage = localStorage.getItem("mileageRowsData");
    return savedMileage ? JSON.parse(savedMileage) : [];
  });

  const [foodRowsData, setFoodRowsData] = useState(() => {
    const savedFood = localStorage.getItem("foodRowsData");
    return savedFood ? JSON.parse(savedFood) : [];
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);

  const addFiles = (files) => {
    setUploadedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const [mileageTotal, setMileageTotal] = useState(0);

  useEffect(() => {
    localStorage.setItem("rowsData", JSON.stringify(rowsData));
  }, [rowsData]);

  useEffect(() => {
    localStorage.setItem("itemRowsData", JSON.stringify(itemRowsData));
  }, [itemRowsData]);

  useEffect(() => {
    localStorage.setItem("mileageRowsData", JSON.stringify(mileageRowsData));
  }, [mileageRowsData]);

  useEffect(() => {
    localStorage.setItem("foodRowsData", JSON.stringify(foodRowsData));
  }, [foodRowsData]);

  useEffect(() => {
    const total = mileageRowsData.reduce(
      (acc, row) => acc + parseFloat(row.amount || 0),
      0
    );
    setMileageTotal(total);
  }, [mileageRowsData]);

  // clear form data on submit
  const clearFormContext = () => {
    setRowsData([]);
    setItemRowsData([]);
    setMileageRowsData([]);
    setFoodRowsData([]);
    setMileageTotal(0);
    localStorage.removeItem("rowsData");
    localStorage.removeItem("itemRowsData");
    localStorage.removeItem("mileageRowsData");
    localStorage.removeItem("foodRowsData");
  };

  // Item Rows

  const addItemRow = () => {
    const newDate = new Date().toISOString().split("T")[0];
    const newItemRow = {
      date: newDate,
      item: "",
      subTotal: 0,
      cityTax: 0,
      taxPercent: 0,
      total: 0,
      source: "",
      shippedFrom: "",
      shippedTo: "",
      billable: "No",
      porCC: "No",
    };
    setItemRowsData((prevRows) => [...prevRows, newItemRow]);
  };

  const deleteItemRow = (evnt, index) => {
    setItemRowsData((prevRows) => prevRows.filter((_, idx) => idx !== index));
    localStorage.setItem("itemRowsData", JSON.stringify(itemRowsData));
  };

  const updateItemRow = (index, name, value) => {
    setItemRowsData((prevRows) =>
      prevRows.map((row, idx) =>
        idx === index ? { ...row, [name]: value } : row
      )
    );
  };

  // Mileage Rows

  const addMileageRow = () => {
    const newDate = new Date().toISOString().split("T")[0];
    const newItemRow = {
      date: newDate,
      purpose: "",
      miles: 0,
      billable: "No",
      amount: 0,
    };
    setMileageRowsData((prevRows) => [...prevRows, newItemRow]);
  };

  const deleteMileageRow = (evnt, index) => {
    setMileageRowsData((prevRows) =>
      prevRows.filter((_, idx) => idx !== index)
    );
    localStorage.setItem("mileageRowsData", JSON.stringify(mileageRowsData));
  };

  const updateMileageRow = (index, name, value) => {
    setMileageRowsData((prevRows) =>
      prevRows.map((row, idx) =>
        idx === index ? { ...row, [name]: value } : row
      )
    );
  };

  // Food Rows

  const addFoodRow = () => {
    const newDate = new Date().toISOString().split("T")[0];
    const newFoodRow = {
      date: newDate,
      amount: 0,
      location: "",
      persons: 0,
      type: "",
      purpose: "",
      billable: "No",
      porCC: "No",
    };
    setFoodRowsData((prevRows) => [...prevRows, newFoodRow]);
  };

  const deleteFoodRow = (evnt, index) => {
    setFoodRowsData((prevRows) => prevRows.filter((_, idx) => idx !== index));
    localStorage.setItem("foodRowsData", JSON.stringify(foodRowsData));
  };

  const updateFoodRow = (index, name, value) => {
    setFoodRowsData((prevRows) =>
      prevRows.map((row, idx) =>
        idx === index ? { ...row, [name]: value } : row
      )
    );
  };

  // Row Data

  const addRow = () => {
    const newRow = {
      type: "Cell",
      billable: "No",
      porCC: "No",
      amount: 0,
      comment: "",
      customer: ""
    };
    setRowsData((prevRows) => [...prevRows, newRow]);
  };

  const deleteRow = (index) => {
    setRowsData((prevRows) => prevRows.filter((_, idx) => idx !== index));
  };

  const updateRow = (index, name, value) => {
    setRowsData((prevRows) =>
      prevRows.map((row, idx) =>
        idx === index ? { ...row, [name]: value } : row
      )
    );
  };

  return (
    <FormContext.Provider
      value={{
        rowsData,
        mileageRowsData,
        itemRowsData,
        foodRowsData,
        mileageTotal,
        uploadedFiles,
        clearFormContext,
        addItemRow,
        deleteItemRow,
        updateItemRow,
        addFoodRow,
        updateFoodRow,
        deleteFoodRow,
        addMileageRow,
        updateMileageRow,
        deleteMileageRow,
        addRow,
        deleteRow,
        updateRow,
        addFiles,
        removeFile,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

export { FormContext, FormProvider };
