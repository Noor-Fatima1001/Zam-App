import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import CustomButton from "../button/CustomButton";
import SelectField from "../form-elements/SelectField";
import InputField from "../form-elements/InputField";
import { v4 as uuidv4 } from "uuid";

const GenericDataTableRowAdd = ({
  fieldsMapping,
  data,
  onSave,
  isSaving,
  onPermissionChange,
  rightSideAction,
  endAction,
  onEdit,
}) => {
  const { control, handleSubmit, register, reset, setValue } = useForm();
  const [modifiedData, setModifiedData] = useState([]);

  useEffect(() => {
    // Add temporary IDs to API data
    const updatedData = data.map((row) => ({
      ...row,
      id: uuidv4(), // Assign unique ID if not present
    }));
    setModifiedData(updatedData);
  }, [data]);
  const [newRows, setNewRows] = useState([]);
  console.log("🚀 ~ newRows:", newRows);
  const [isDense, setIsDense] = useState(true);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editingRowData, setEditingRowData] = useState({});

  //  new editable row
  const handleAddRow = async () => {
    const hasIncompleteRow = newRows.some((row) =>
      Object.values(row).some((value) => value === "")
    );

    if (hasIncompleteRow) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please complete and save the current row before adding another.",
      });
      return;
    }
    reset();
    setEditingRowIndex(null);
    setEditingRowData({});

    const newRow = fieldsMapping.reduce(
      (acc, { field }) => ({ ...acc, [field]: "", id: uuidv4() }),
      {}
    );
    setNewRows([...newRows, newRow]);
  };

  const handleEditStatus = (row) => {
    console.log("🚀 ~ handleEditStatus ~ row:", row);
    // Clear any new rows being added
    setEditingRowIndex(null);
    setEditingRowData({});
    reset();
    setNewRows([]);
    // Set editing state
    setEditingRowIndex(row.id);
    setEditingRowData({ ...row });
  };

  const handleSaveEdit = (item) => {
    console.log("🚀 ~ handleSaveEdit ~ item:", item);
    const updatedData = [...modifiedData];
    const rowIndex = updatedData.findIndex((row) => row.id === editingRowIndex);

    if (rowIndex !== 1) {
      updatedData[rowIndex] = { ...editingRowData };
      setEditingRowIndex(null);
      setEditingRowData({});
    }
    // Optionally update the parent state
    if (onEdit && rowIndex !== -1) {
      console.log(updatedData[rowIndex], "updatedData[rowIndex]");
      // onSave(updatedData[rowIndex], "edit");
      onSave(item, updatedData[rowIndex], "edit");
    }
  };

  const onSubmit = (formData) => {
    console.log("🚀 ~ onSubmit ~ formData:", formData);
    const transformedData = Object.values(formData.newRows || {});
    console.log("🚀 ~ onSubmit ~ transformedData:", transformedData);

    if (editingRowIndex !== null && onEdit) {
      handleSaveEdit(transformedData?.[0]);
      return;
    }

    if (transformedData.length == 0 || transformedData.length < 1) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please add at least one new row before saving.",
      });
    } else {
      const hasInvalidRow = transformedData.some((row) =>
        Object.values(row).some(
          (value) => value === "" || value === null || value === undefined
        )
      );

      if (hasInvalidRow) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please complete all fields in the row before saving.",
        });
        return;
      }
      if (onSave && transformedData.length > 0) {
        onSave(transformedData?.[0]);
        setNewRows([]);
        reset();
      }
    }
  };
  const columns = fieldsMapping.map(
    ({
      field,
      displayName,
      type,
      endpoint,
      responseWhich,
      labelKey,
      valueKey,
      queryKey,
      disabled,
      baseFilters,
      valueConcatenateWithLabel,
      customCell,
      editable,
    }) => {
      const fieldType = type;
      const fieldEndpoint = endpoint;
      const fieldResponseWhich = responseWhich;
      const fieldvalueKey = valueKey;
      const fieldlabelKey = labelKey;
      const fieldqueryKey = queryKey;
      const fielddisabled = disabled;
      const Edit_able = editable;
      const fieldbaseFilters = baseFilters;
      const ContcatenateLabel = valueConcatenateWithLabel;
      return {
        name: displayName,
        selector: customCell ? undefined : (row) => row[field],
        cell: (row) => {
          if (customCell) {
            return row.isNew ? (
              fielddisabled ? (
                <span className="text-secondary">Auto Generated</span>
              ) : (
                customCell(row, onPermissionChange)
              )
            ) : (
              customCell(row, onPermissionChange)
            );
          }
          if (row.isNew) {
            return fielddisabled ? (
              <span className="text-secondary">Auto Generated</span>
            ) : fieldType === "textServer" ? (
              <SelectField
                control={control}
                name={`newRows[${row.id}].${field}`}
                // rules={{ required: "This field is required" }}
                endpoint={fieldEndpoint}
                queryKey={fieldqueryKey}
                valueKey={fieldvalueKey}
                labelKey={fieldlabelKey}
                ContcatenateLabel={ContcatenateLabel}
                // label={field}
                // setValue={setValue}
                responseWhich={fieldResponseWhich}
                baseFilters={fieldbaseFilters}
              />
            ) : (
             
              <InputField
                register={register(`newRows[${row.id}].${field}`)}
                defaultValue={row[field]}
                placeholder={`Enter ${displayName}`}
              />
            );
          }
          if (editingRowIndex === row.id && onEdit) {
            if (Edit_able !== false) {
              return fieldType === "textServer" ? (
                <SelectField
                  control={control}
                  name={`newRows[${row.id}].${field}`}
                  endpoint={fieldEndpoint}
                  queryKey={fieldqueryKey}
                  valueKey={fieldvalueKey}
                  labelKey={fieldlabelKey}
                  ContcatenateLabel={ContcatenateLabel}
                  // label={field}
                  // setValue={setValue}
                  responseWhich={fieldResponseWhich}
                  baseFilters={fieldbaseFilters}
                  defaultValue={{
                    value: editingRowData?.[fieldvalueKey], // Default value key
                    label: editingRowData?.[fieldlabelKey], // Default label to display
                  }}
                />
              ) : (
                <InputField
                  register={register(`newRows[${row.id}].${field}`)}
                  defaultValue={editingRowData?.[field]}
                  placeholder={`Enter ${displayName}`}
                />
              );
            }
          }
          if (displayName === "status") {
            return (
              <span className="text-secondary">
                {row[field] === 1 ? "Active" : "InActive"}
              </span>
            );
          }
          return (
            <span onClick={() => onEdit && handleEditStatus(row)}>
              {row[field] || "N/A"}
            </span>
          );
        },
        sortable: true,
      };
    }
  );

  const customStyles = {
    rows: {
      style: {
        minHeight: isDense ? "30px" : "60px",
        padding: isDense ? "4px" : "8px",
        background: "white",
      },
    },
    headCells: {
      style: {
        padding: isDense ? "4px" : "8px",
        minHeight: isDense ? "30px" : "60px",
        color: "white",
        background: "#696CFF",
        fontWeight: "bold",
        textTransform: "uppercase",
      },
    },
    cells: {
      style: {
        paddingLeft: "8px",
        paddingRight: "8px",
      },
    },
    headRow: {
      style: {
        minHeight: isDense ? "30px !important" : "60px !important",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="row-add-table">
      <div className="mb-2 mt-2 ">
        <div className="flex justify-between items-center">
          <div className="d-flex align-items-center gap-2">
            {rightSideAction && rightSideAction}
            <CustomButton
              disabled={isSaving || editingRowIndex !== null} // Disable if editing is active
              handleClick={handleAddRow}
              btntext={" Add Row"}
            />
            <CustomButton
              type="submit"
              disabled={isSaving || newRows.length === 0} // Disable if no new rows
              btntext={"Save Changes"}
              isLoading={isSaving}
            />
            <div className=" d-flex align-items-center">
              <label className="me-2">Dense Rows</label>
              <label className="switch">
                <input
                  type="checkbox"
                  id="denseSwitch"
                  checked={isDense}
                  onChange={(e) => setIsDense(e.target.checked)}
                />
                <span className="slider"></span>
              </label>{" "}
            </div>
          </div>
          {endAction && endAction}
        </div>
      </div>
      <DataTable
        columns={columns}
        // data={[...data, ...newRows.map((row) => ({ ...row, isNew: true }))]}
        data={[
          ...newRows.map((row) => ({ ...row, isNew: true })),
          ...modifiedData,
        ]}
        responsive
        fixedHeader
        noDataComponent={<div className="p-4">No data found</div>}
        customStyles={customStyles}
      />
    </form>
  );
};

export default GenericDataTableRowAdd;
