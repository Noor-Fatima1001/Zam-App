import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {
  GridRowModes,
  DataGrid,
  GridToolbarContainer,
  GridActionsCellItem,
  GridRowEditStopReasons,
} from "@mui/x-data-grid";
import { FaPen, FaPlus } from "react-icons/fa6";
import { MdDelete, MdSave } from "react-icons/md";
import { Paper } from "@mui/material";

const MuiGenericTable = ({
  columns,
  initialData = [],
  enableAdd = true,
  enableEdit = true,
  enableDelete = true,
  onAddRow,
  onSaveRow,
  onDeleteRow,
  setSelectedRows,
  isSelect = true,
  selectedRows,
  dense = true,
  validateRow,
  hasMore = false,
  onLoadMore,
  loading = false,
  enableScroll = true,
}) => {
  const [rows, setRows] = useState([]);
  const [rowModesModel, setRowModesModel] = useState({});

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id) => () => {
    setRowModesModel((prevState) => ({
      ...prevState,
      [id]: { mode: GridRowModes.Edit },
    }));
  };

  const handleSaveClick = (id) => () => {
    const row = rows.find((r) => r?.id === id);
    if (validateRow && !validateRow(row)) return;
    onSaveRow && onSaveRow(row);
    setRowModesModel((prevState) => ({
      ...prevState,
      [id]: { mode: GridRowModes.View },
    }));
  };

  const handleDeleteClick = (id) => () => {
    setRows((prevRows) => prevRows.filter((row) => row?.id !== id));
    onDeleteRow && onDeleteRow(id);
  };

  const processRowUpdate = (newRow) => {
    setRows(rows.map((row) => (row?.id === newRow?.id ? newRow : row)));
    return newRow;
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const handleAddRow = () => {
    const newRow = onAddRow ? onAddRow() : { id: uuidv4(), isNew: true };
    setRows([newRow, ...rows]);
    setRowModesModel({
      ...rowModesModel,
      [newRow?.id]: { mode: GridRowModes.Edit },
    });
  };

  const actionColumn = {
    field: "actions",
    headerName: "Actions",
    width: 120,
    type: "actions",
    getActions: ({ id }) => {
      const isInEditMode = rowModesModel?.[id]?.mode === GridRowModes.Edit;

      if (isInEditMode) {
        return [
          <GridActionsCellItem
            icon={<MdSave />}
            label="Save"
            onClick={handleSaveClick(id)}
          />,
          <GridActionsCellItem
            icon={<MdDelete />}
            label="Cancel"
            onClick={() =>
              setRowModesModel({
                ...rowModesModel,
                [id]: { mode: GridRowModes.View },
              })
            }
          />,
        ];
      }

      const actions = [];
      if (enableEdit) {
        actions.push(
          <GridActionsCellItem
            icon={<FaPen />}
            label="Edit"
            onClick={handleEditClick(id)}
          />
        );
      }
      if (enableDelete) {
        actions.push(
          <GridActionsCellItem
            icon={<MdDelete />}
            label="Delete"
            onClick={handleDeleteClick(id)}
          />
        );
      }
      return actions;
    },
  };

  const handleRowSelection = (selectionModel) => {
    if (selectionModel.length > 0) {
      const selectedId = selectionModel[0];
      const selectedRowData = rows.find((row) => row.id === selectedId);
      setSelectedRows([selectedRowData]); // Store the entire row object
    } else {
      setSelectedRows(null); // Clear selection if no row is selected
    }
  };
  const handleScroll = (params) => {
    if (!enableScroll || !hasMore || loading) return;
    onLoadMore?.();
  };
  const gridRef = useRef(null);

  useEffect(() => {
    if (!enableScroll) return;
    const handleGridScroll = () => {
      if (gridRef.current) {
        const virtualScroller = gridRef.current.querySelector(
          ".MuiDataGrid-virtualScroller"
        );
        if (virtualScroller) {
          const { scrollTop, scrollHeight, clientHeight } = virtualScroller;
          if (scrollTop + clientHeight >= scrollHeight - 10) {
            handleScroll();
          }
        }
      }
    };

    if (gridRef.current) {
      const virtualScroller = gridRef.current.querySelector(
        ".MuiDataGrid-virtualScroller"
      );
      if (virtualScroller) {
        virtualScroller.addEventListener("scroll", handleGridScroll);
      }
    }
    return () => {
      if (gridRef.current) {
        const virtualScroller = gridRef.current.querySelector(
          ".MuiDataGrid-virtualScroller"
        );
        if (virtualScroller) {
          virtualScroller.removeEventListener("scroll", handleGridScroll);
        }
      }
    };
  }, [rows, enableScroll]);

  useEffect(() => {
    setRows(
      initialData.map((row, index) => ({
        ...row,
        id: row?.id || row?.record_id || `temp-${index}-${Date.now()}`,
      }))
    );
  }, [initialData]);

  return (
    <>
      {/* <Box sx={{ position:"relative", height:"100%" }}> */}
      <div ref={gridRef} style={{ height: "100%", width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={[
            ...columns,
            ...(enableEdit || enableDelete ? [actionColumn] : []),
          ]}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={handleRowModesModelChange}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          checkboxSelection={isSelect}
          onRowSelectionModelChange={handleRowSelection}
          selectionModel={selectedRows ? [selectedRows] : []}
          disableMultipleRowSelection
          density={dense ? "compact" : "standard"}
          pageSizeOptions={[]}
          hideFooterPagination={true}
          hideFooter={true}
          slots={{
            toolbar: enableAdd
              ? () => (
                  <GridToolbarContainer>
                    <Button startIcon={<FaPlus />} onClick={handleAddRow}>
                      Add Record
                    </Button>
                  </GridToolbarContainer>
                )
              : null,
          }}
          sx={{
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#696CFF",
              color: "white",
              textTransform: "capitalize",
              // position: "sticky",
              // top: 0,
              // zIndex: 2,
            },

            "& .MuiDataGrid-columnHeaders .MuiDataGrid-filler": {
              backgroundColor: "#696CFF",
            },
            "& .MuiDataGrid-row:nth-of-type(even)": {
              backgroundColor: "white",
            },
            "& .MuiDataGrid-row:nth-of-type(odd)": {
              backgroundColor: "#fffew",
            },
          }}
        />
      </div>
      {/* </Box> */}
    </>
  );
};

export default MuiGenericTable;
