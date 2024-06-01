import React, { useContext } from "react";
import { FormContext } from "../context/FormContext";
import AddDeleteTableRows from "../components/food-table";

const FoodBev = () => {
  const { foodRowsData, addFoodRow, deleteFoodRow, updateFoodRow } =
    useContext(FormContext);

  const updateFoodRows = (index, name, value) => {
    updateFoodRow(index, name, value);
  };

  return (
    <div>
      <AddDeleteTableRows
        data={foodRowsData}
        addFoodRow={addFoodRow}
        deleteFoodRow={deleteFoodRow}
        updateFoodRow={updateFoodRows}
      />
    </div>
  );
};

export default FoodBev;
