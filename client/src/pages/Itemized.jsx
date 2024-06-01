import React, { useContext } from "react";
import { FormContext } from "../context/FormContext";
import AddDeleteTableRows from "../components/item-table";

const Itemized = () => {
  const { itemRowsData, addItemRow, deleteItemRow, updateItemRow } = useContext(FormContext);

  const updateItemRows = (index, name, value) => {
    updateItemRow(index, name, value);
  };

  return (
    <div>
      <AddDeleteTableRows
        data={itemRowsData}
        addItemRow={addItemRow}
        deleteItemRow={deleteItemRow}
        updateItemRow={updateItemRows}
      />
    </div>
  );
};

export default Itemized;
