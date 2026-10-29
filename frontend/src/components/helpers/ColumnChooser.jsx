import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';

const ColumnChooser = ({ columns, onUpdateColumns, onClose }) => {
  const [visibleColumns, setVisibleColumns] = useState(
    columns.map((col) => ({ ...col, isVisible: col.isVisible !== false }))
  );

  const handleToggleColumn = (key) => {
    const updatedColumns = visibleColumns.map((col) =>
      col.key === key ? { ...col, isVisible: !col.isVisible } : col
    );
    setVisibleColumns(updatedColumns);
    onUpdateColumns(updatedColumns);
  };

  return (
    <div className="absolute z-20 w-64 bg-white shadow-lg p-4 border rounded-lg top-10 right-0">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Choose Columns</h3>
        <button onClick={onClose} aria-label="Close column chooser">
          <IoClose className="text-gray-600 hover:text-gray-800" />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {visibleColumns.map((column) => (
          <div key={column.key} className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={column.isVisible}
              onChange={() => handleToggleColumn(column.key)}
              className="h-4 w-4 mr-2 cursor-pointer"
            />
            <span className="text-sm text-gray-700">{column.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={() => {
            const updatedColumns = visibleColumns.map((col) => ({
              ...col,
              isVisible: true,
            }));
            setVisibleColumns(updatedColumns);
            onUpdateColumns(updatedColumns);
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Show All
        </button>
        <button
          onClick={() => {
            const updatedColumns = visibleColumns.map((col) => ({
              ...col,
              isVisible: false,
            }));
            setVisibleColumns(updatedColumns);
            onUpdateColumns(updatedColumns);
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Hide All
        </button>
      </div>
    </div>
  );
};

export default ColumnChooser;