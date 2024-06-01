import React, { useContext } from "react";
import { FormContext } from "../context/FormContext";
import MileageTable from "../components/mileage-table";

const Mileage = () => {
  const { mileageRowsData, addMileageRow, deleteMileageRow, updateMileageRow } = useContext(FormContext);

  const updateMileageRows = (index, name, value) => {
    updateMileageRow(index, name, value);
  };

  return (
    <div>
      <MileageTable
        data={mileageRowsData}
        addMileageRow={addMileageRow}
        deleteMileageRow={deleteMileageRow}
        updateMileageRows={updateMileageRows}
      />
    </div>
  );
};

export default Mileage;

