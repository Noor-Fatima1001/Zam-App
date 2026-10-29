import React, { memo, useEffect, useRef, useState } from "react";
import DataTable from "react-data-table-component";

const GenericDataTable = ({
  fieldsMapping,
  data,
  selectionMode = "single",
  onSelectionChange,
  onPermissionChange,
  isSelected = true,
  isDense,
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelectedRows, setClearSelectedRows] = useState(false);

  const [columnWidths, setColumnWidths] = useState(
    fieldsMapping.reduce((acc, field) => {
      acc[field.field] = 120; // Default initial width
      return acc;
    }, {})
  );

  const tableRef = useRef(null); // Reference to the entire table
  const headerRefs = useRef({}); // Store refs for each header column

  useEffect(() => {
    // Ensure headers and body widths are synchronized on load
    syncColumnWidths();
  }, []);
  const syncColumnWidths = () => {
    if (tableRef.current) {
      const table = tableRef.current;
      const headerCells = table.querySelectorAll(".header-cell");
      const bodyCells = table.querySelectorAll(".body-cell");

      headerCells.forEach((headerCell, index) => {
        const bodyCell = bodyCells[index];
        if (headerCell && bodyCell) {
          const width = Math.max(headerCell.offsetWidth, bodyCell.offsetWidth);
          headerCell.style.width = `${width}px`;
          bodyCell.style.width = `${width}px`;
        }
      });
    }
  };

  const startResizing = (field, e) => {
    const startX = e.clientX;
    const startWidth = headerRefs.current[field]?.offsetWidth || 150;
  
    const handleMouseMove = (event) => {
      const delta = event.clientX - startX;
      const newWidth = Math.max(startWidth + delta, 50); // Minimum width: 50px
  
      // Update only the resized column's width
      setColumnWidths((prev) => ({
        ...prev,
        [field]: newWidth,
      }));
  
      // Update the header and body cells for the resized column
      if (headerRefs.current[field]) {
        headerRefs.current[field].style.width = `${newWidth}px`;
      }
  
      // Update the corresponding body cells
      const bodyCells = tableRef.current.querySelectorAll(`.body-cell-${field}`);
      bodyCells.forEach((cell) => {
        cell.style.width = `${newWidth}px`;
      });
    };
  
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  const columns = fieldsMapping.map(({ field, displayName, customCell }) => ({
    name: (
      <div
        ref={(el) => (headerRefs.current[field] = el)} // Attach ref for this header
        className="header-cell"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: `${columnWidths[field]}px`,
        }}
      >
        {displayName}
        <div
          style={{ cursor: "col-resize", padding: "0 5px" }}
          onMouseDown={(e) => startResizing(field, e)}
        >
          ||
        </div>
      </div>
    ), // selector: (row) => row?.[field],
    selector: customCell ? undefined : (row) => row?.[field],
    // cell: customCell ? (row) => customCell(row, onPermissionChange) : undefined,
    cell: (row) => (
      <div
        className="body-cell"
        style={{
          width: `${columnWidths[field]}px`,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {customCell ? customCell(row, onPermissionChange) : row?.[field]}
      </div>
    ),

    // sortable: true,
    style: {
      width: `${columnWidths[field]}px`,
    },
  }));

  const handleRowSelected = (state) => {
    const rows = state.selectedRows;
    console.log("🚀 ~ handleRowSelected ~ rows:", rows);

    if (selectionMode === "single") {
      if (rows.length > 1) {
        setClearSelectedRows(!clearSelectedRows);
        onSelectionChange([]);
        setSelectedRows([]);
        return;
      }
    }

    setSelectedRows(rows);
    onSelectionChange(rows);
  };

  const selectableRowDisabled = (row) => {
    if (selectionMode === "single") {
      return selectedRows.length > 0 && selectedRows[0]?.id !== row.id;
    }
    return false;
  };

  const customStyles = {
    rows: {
      style: {
        minHeight: isDense ? "30px" : "60px",
        padding: isDense ? "3px" : "8px",
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
  const conditionalRowStyles = [
    {
      when: (row) =>
        selectedRows.length === 1 &&
        selectedRows[0]?.record_id === row.record_id,

      style: {
        backgroundColor: "#c9c9c9 !important", // Highlight the selected row
      },
    },
  ];

  return (
    <div ref={tableRef}>
      <DataTable
        columns={columns}
        data={data}
        selectableRows={isSelected}
        clearSelectedRows={clearSelectedRows}
        onSelectedRowsChange={handleRowSelected}
        responsive
        // fixedHeader
        // fixedHeaderScrollHeight="400px"
        selectableRowDisabled={selectableRowDisabled}
        noDataComponent={<div className="p-4">No data found</div>}
        customStyles={customStyles}
        conditionalRowStyles={conditionalRowStyles}
      />
    </div>
  );
};

export default memo(GenericDataTable);
