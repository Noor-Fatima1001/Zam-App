import * as React from "react";
import { getTheme } from "@table-library/react-table-library/baseline";
import { CompactTable } from "@table-library/react-table-library/compact";
import { useTheme } from "@table-library/react-table-library/theme";
import { useRowSelect } from "@table-library/react-table-library/select";
import { Checkbox } from "@mui/material"; // Import Material-UI Checkbox

const NewGenericTable = ({
  fieldsMapping,
  data,
  selectionMode = "single",
  onSelectionChange,
  onPermissionChange,
  isSelected = true,
  isDense,
  isResize = false,
}) => {
  const theme = useTheme({
    Table: `
   
   background-color: white; /* Apply to all rows */
  `,
    HeaderRow: `
   th{
    padding :${isDense ? "8px" : "12px"};
    background:#696CFF;
    color:white !important;
    font-size:10px !important;
   
  
    }
   th div:last-child {
   width:${isResize && "2px"};
   height:${isResize && "80%"};
   margin:${isResize && "3px"};
  background: ${isResize && "#c5c5c5"};
}
  th {
  &:last-child {
    div:last-child  {
     display:${isResize && "none"};
    }
  }
}


  `,
    BaseRow: `
    
        font-weight: normal !important;

    
    td{
    color:black;
        font-size:12px !important;

    padding :${isDense ? (isSelected ? "0px 8px" : "8px") : "12px"} ;
    }
    &:nth-of-type(odd) td{
      background-color: #f5f5f5; /* Light gray for odd rows */
    }
    &:nth-of-type(even) td{
      background-color: #fafafa; /* Slightly lighter gray for even rows */
    }
   
  `,
    // You can add more styling here if needed
  });
  const [selectedRowId, setSelectedRowId] = React.useState(null); // To track selected row
  console.log("🚀 ~ selectedRowId:", selectedRowId);
  const tableData = React.useMemo(() => ({ nodes: data || [] }), [data]);

  // Handle row selection
  const select = useRowSelect(
    tableData,
    {
      onChange: (action, state) => {
        if (action === "select") {
          const selectedRow = state.selected[0]; // Only one row can be selected
          setSelectedRowId(selectedRow ? selectedRow.record_id : null); // Update selected row
          if (onSelectionChange) onSelectionChange(selectedRow); // Callback for selection change
        }
      },
    },
    {
      rowSelect: selectionMode === "single" ? "SingleSelect" : "MultiSelect", // Single or multiple selection
      buttonSelect: selectionMode === "single" ? "SingleSelect" : "MultiSelect",
    }
  );

  // Render checkbox for each row
  const renderCheckbox = (item) => (
    <Checkbox
      size="20"
      checked={selectedRowId === item.record_id}
      onChange={() => {
        setSelectedRowId(item.record_id);
        onSelectionChange([item]);
      }}
    />
  );
  const COLUMNS = fieldsMapping.map(
    ({ field, displayName, customCell }, index) => ({
      label: displayName,
      renderCell: (item) => {
        if (index === 0 && isSelected) {
          // Render checkbox only in the first column
          return (
            <>
              {renderCheckbox(item)} {/* Render the checkbox */}
              {customCell
                ? customCell(item, onPermissionChange)
                : item[field]}{" "}
              {/* Render the field value or custom cell */}
            </>
          );
        } else {
          // Render other columns without the checkbox
          return customCell
            ? customCell(item, onPermissionChange)
            : item[field];
        }
      },
      resize: isResize,
    })
  );

  return (
    <CompactTable
      columns={COLUMNS}
      data={tableData}
      theme={theme}
      select={select}
    />
  );
};

export default NewGenericTable;
