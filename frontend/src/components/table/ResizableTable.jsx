import React, { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';
import InfiniteScroll from 'react-infinite-scroll-component';
import Loader from '../Loader';
import { useInView } from 'react-intersection-observer';

export const formatNumberDisplay = (value) => {
  const numberValue = Number(value);
  const formattedNumber = numberValue.toFixed(3);
  const [integerPart, decimalPart] = formattedNumber.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimalPart
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger;
};

// Separate component for each table row to encapsulate useInView hook
const TableRow = ({ row, rowIndex, columns, columnWidths, isSelect, isDense, selectedRows, handleRowSelect }) => {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  return (
    <div
      ref={ref}
      className={`flex border-b text-sm items-center ${isDense ? 'h-8' : 'h-11'} ${
        rowIndex % 2 === 0 ? 'bg-gray-100' : 'bg-white'
      } ${selectedRows.includes(rowIndex) ? '!bg-blue-100' : ''} hover:bg-blue-50 transition-colors duration-150`}
    >
      {inView ? (
        columns.map((column, colIndex) => (
          <div
            key={column.key}
            className="p-2 border-r overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ width: `${columnWidths[column.key]}px` }}
          >
            <div className="flex items-center">
              {colIndex === 0 && isSelect && (
                <div className="mr-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(rowIndex)}
                    onChange={() => handleRowSelect(rowIndex, row)}
                    className="h-4 w-4 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className="flex-1">
                {column.render
                  ? column.render(row[column.key], row, rowIndex)
                  : row[column.key]}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div
          style={{ height: isDense ? '32px' : '44px' }}
          className="bg-gray-100"
        ></div>
      )}
    </div>
  );
};

const ResizableTable = ({
  data = [],
  columns = [],
  resetColumns = false,
  scrollableId,
  height = 'auto',
  className = '',
  onSort,
  onFilter,
  defaultSort,
  defaultFilters = {},
  isSelect = true,
  onSelectRow,
  hasMore,
  enableScroll = true,
  onLoadMore,
  loading,
  selectedData = [],
  disableInternalSort = false,
  isDense = false,
  customFilterFunction,
  rowsDataForFiltering,
  allowMultipleSelect = false,
}) => {
  const [columnWidths, setColumnWidths] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.width?col.width:130 }), {})
  );

  useEffect(() => {
    if (resetColumns) {
      setColumnWidths(
        columns.reduce((acc, col) => ({ ...acc, [col.key]: col.width }), {})
      );
    }
  }, [columns]);

  const [isResizing, setIsResizing] = useState(false);
  const [currentResizer, setCurrentResizer] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedRows, setSelectedRows] = useState(
    selectedData.map((item) => item.index).filter((index) => index !== undefined)
  );
  const [sortConfig, setSortConfig] = useState(
    defaultSort || { key: null, direction: 'asc' }
  );
  const filterRefs = useRef({});
  const [lastPreservedFilter, setLastPreservedFilter] = useState('');
  const [lastPreservedData, setLastPreservedData] = useState('');
  const [processedData, setProcessedData] = useState([]);
  const [preservedSortConfig, setPreservedSortConfig] = useState([]);

  useEffect(() => {
    setSelectedRows(
      selectedData
        .map((item) => item.index)
        .filter((index) => index !== undefined && index < data.length)
    );
  }, []); // Added dependencies

  useEffect(() => {
    const handleClickOutside = (event) => {
      let isOutside = true;
      Object.values(filterRefs.current).forEach((ref) => {
        if (ref && ref.contains(event.target)) {
          isOutside = false;
        }
      });
      if (isOutside) {
        setActiveFilter(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getComparableValue = (value, column) => {
    if (value == null) return null;
    if (column?.sortValue) {
      return column.sortValue(value);
    }
    const num = Number(value);
    return isNaN(num) ? value.toString().toLowerCase() : num;
  };

  const sortData = (dataToSort) => {
    if (!sortConfig.key || disableInternalSort) return dataToSort;

    const column = columns.find((col) => col.key === sortConfig.key);

    return [...dataToSort].sort((a, b) => {
      const aRaw = a[sortConfig.key];
      const bRaw = b[sortConfig.key];
      const aValue = getComparableValue(aRaw, column);
      const bValue = getComparableValue(bRaw, column);

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        if(typeof aValue === 'string' && typeof bValue === 'string'){
          comparison = aValue.localeCompare(bValue);
        }
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };

  useEffect(() => {
    const preservedFilter = JSON.stringify(filters);
    const preservedData = JSON.stringify(data);
    const newsortConfig = JSON.stringify(sortConfig);
    const filtersChanged = preservedFilter !== lastPreservedFilter;
    const sortChanged = newsortConfig !== preservedSortConfig;
    const dataChanged = preservedData !== lastPreservedData;
    if (!filtersChanged && !dataChanged && !sortChanged ) return;
    setLastPreservedData(preservedData);
    setLastPreservedFilter(preservedFilter);
    setPreservedSortConfig(newsortConfig);
    const newProcessedData = customFilterFunction
      ? customFilterFunction(data, filters,sortConfig,preservedFilter,newsortConfig) || []
      : sortData(
          data?.filter((item) => {
            return Object.keys(filters).every((key) => {
              if (!filters[key]) return true;
              return item[key]
                ?.toString()
                ?.toLowerCase()
                .includes(filters[key].toLowerCase());
            });
          })
        );

    setProcessedData(newProcessedData);
  }, [data, filters, customFilterFunction, sortData,sortConfig]);

  const handleSort = (column) => {
    if (!column.sortable) return;

    const newDirection =
      sortConfig.key === column.key && sortConfig.direction === 'asc'
        ? 'desc'
        : 'asc';
    const newSortConfig = { key: column.key, direction: newDirection };
    setSortConfig(newSortConfig);
    onSort?.(column.key, newDirection);
    setSelectedRows([]);
    onSelectRow?.([]);
  };

  const handleFilterChange = (column, value) => {
    const newFilters = { ...filters, [column]: value };
    setFilters(newFilters);
    onFilter?.(newFilters);
    setSelectedRows([]);
    onSelectRow?.([]);
  };

  const clearFilter = (columnKey) => {
    const newFilters = { ...filters, [columnKey]: '' };
    setFilters(newFilters);
    onFilter?.(newFilters);
    setSelectedRows([]);
    onSelectRow?.([]);
  };

  const clearAllFilters = () => {
    const newFilters = columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {});
    setFilters(newFilters);
    onFilter?.(newFilters);
    setActiveFilter(null);
    setSelectedRows([]);
    onSelectRow?.([]);
  };

  const handleRowSelect = (rowIndex, rowData) => {
    let updatedRows;
    let updatedSelection;

    if (allowMultipleSelect) {
      const isSelected = selectedRows.includes(rowIndex);
      if (isSelected) {
        updatedRows = selectedRows.filter((index) => index !== rowIndex);
        updatedSelection = selectedData.filter((item) => item.index !== rowIndex);
      } else {
        updatedRows = [...selectedRows, rowIndex];
        updatedSelection = [...selectedData, { ...rowData, index: rowIndex, id: rowData.id }];
      }
    } else {
      if (selectedRows.includes(rowIndex)) {
        updatedRows = [];
        updatedSelection = [];
      } else {
        updatedRows = [rowIndex];
        updatedSelection = [{ ...rowData, index: rowIndex, id: rowData.id }];
      }
    }

    setSelectedRows(updatedRows);
    onSelectRow?.(updatedSelection);
  };

  useEffect(() => {
    const validSelectedData = selectedData.filter((item) =>
      data.some((row) => row.id === item.id)
    );
    const validSelectedRows = validSelectedData
      .map((item) => data.findIndex((row) => row.id === item.id))
      .filter((index) => index !== -1);

    if (
      validSelectedRows.length !== selectedRows.length ||
      validSelectedData.length !== selectedData.length
    ) {
      setSelectedRows(validSelectedRows);
      onSelectRow?.(validSelectedData);
    }
  }, [data]);

  const startResize = (e, column) => {
    e.stopPropagation();
    setIsResizing(true);
    setCurrentResizer(column);
    setStartX(e.clientX);
    setStartWidth(columnWidths[column]);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !currentResizer) return;
      const diff = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColumnWidths((prev) => ({
        ...prev,
        [currentResizer]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setCurrentResizer(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, currentResizer, startX, startWidth]);

  const activeFilters = columns
    .filter((col) => col.filterable && filters[col.key])
    .map((col) => ({
      key: col.key,
      label: col.label,
      value: filters[col.key],
    }));

  const handleSelectAll = () => {
    if (!allowMultipleSelect) return;

    if (selectedRows.length === processedData.length) {
      setSelectedRows([]);
      onSelectRow?.([]);
    } else {
      const allIndices = processedData.map((_, index) => index);
      const allSelection = processedData.map((row, index) => ({ ...row, index }));
      setSelectedRows(allIndices);
      onSelectRow?.(allSelection);
    }
  };

  const renderHeader = (column) => (
    <div
      className={`relative flex-1 group rounded-2 transition-colors duration-150 ${
        filters[column.key] ? 'bg-blue-700' : sortConfig.key === column.key ? 'bg-blue-800' : 'bg-customBlue'
      } ${column.sortable ? 'hover:bg-blue-600' : ''}`}
      ref={(el) => (filterRefs.current[column.key] = el)}
    >
      {column.filterable && activeFilter === column.key && (
        <div className="absolute z-10 w-full bg-white shadow-lg p-2 border rounded">
          <input
            type="text"
            className="w-full focus:outline-none text-dark border rounded p-1"
            value={filters[column.key] || ''}
            onChange={(e) => handleFilterChange(column.key, e.target.value)}
            placeholder={`Filter ${column.label}...`}
            autoFocus
          />
        </div>
      )}
      <div
        className={`text-white font-semibold p-1 flex items-center justify-between ${
          column.sortable ? 'cursor-pointer' : ''
        }`}
        onClick={() => column.sortable && handleSort(column)}
      >
       <div className='d-flex justify-content-center align-items-center' style={{userSelect:"none"}} >{column.label} &nbsp;  {column.sortable && sortConfig.key === column.key && (
            <span style={{userSelect:"none"}} className="text-xs font-medium text-yellow-300 animate-pulse">
              {sortConfig.direction==="asc"?"↑":"↓"}
            </span>
          )} </div>
        
        <div className="flex gap-2 items-center">
          {column.filterable && (
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setActiveFilter(activeFilter === column.key ? null : column.key);
              }}
            >
              <FiSearch
                className={`text-white ${filters[column.key] ? 'text-yellow-300' : ''}`}
              />
            </div>
          )}
        
        </div>
      </div>
      <div
        className="absolute top-0 -right-[1px] h-full w-[2px] cursor-col-resize bg-gray-400 hover:bg-blue-500"
        onMouseDown={(e) => startResize(e, column.key)}
      />
    </div>
  );

  return (
    <div className="bg-gray-50">
      {activeFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Active Filters:</span>
          {activeFilters.map((filter) => (
            <div
              key={filter.key}
              className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
            >
              <span>
                {filter.label}: {filter.value}
              </span>
              <button
                className="ml-2 focus:outline-none"
                onClick={() => clearFilter(filter.key)}
                aria-label={`Clear filter for ${filter.label}`}
              >
                <IoClose className="text-blue-600 hover:text-blue-800" />
              </button>
            </div>
          ))}
          <button
            className="ml-2 text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
            onClick={clearAllFilters}
            aria-label="Clear all filters"
          >
            Clear All
          </button>
        </div>
      )}
      <div
        id={`scrollableDiv${scrollableId}`}
        className={`border rounded-radiusRegular overflow-auto ${className}`}
        style={{ height }}
      >
        <div className="min-w-max">
          <div className="flex bg-customBlue border-b sticky top-0 z-10">
            {columns.map((column) => (
              <div
                key={column.key}
                className={`border-r relative flex items-center capitalize ${
                  isDense ? 'h-8' : 'h-11'
                }`}
                style={{ width: `${columnWidths[column.key]}px` }}
              >
                {isSelect && column.key === columns[0].key && (
                  <div className="mr-2 flex items-center pl-2">
                    {allowMultipleSelect && (
                      <input
                        type="checkbox"
                        checked={
                          selectedRows.length === processedData.length &&
                          processedData.length > 0
                        }
                        onChange={handleSelectAll}
                        className="h-4 w-4 cursor-pointer"
                      />
                    )}
                  </div>
                )}
                {renderHeader(column)}
              </div>
            ))}
          </div>
          {enableScroll ? (
            <InfiniteScroll
              dataLength={processedData.length}
              next={() => {
                console.log('Scroll bottom reached!');
                onLoadMore();
              }}
              hasMore={hasMore}
              loader={<Loader />}
              endMessage={<p className="text-center mt-2">No more records</p>}
              scrollableTarget={`scrollableDiv${scrollableId}`}
            >
              <div>
                {processedData.length === 0 ? (
                  <div
                    className={`flex text-sm items-center ${
                      isDense ? 'h-8' : 'h-11'
                    } bg-gray-100`}
                  >
                    <div
                      className="p-2 text-center text-gray-500 w-full"
                      style={{
                        width: `${Object.values(columnWidths).reduce(
                          (a, b) => a + b,
                          0
                        )}px`,
                      }}
                    >
                      No Records
                    </div>
                  </div>
                ) : (
                  processedData.map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      row={row}
                      rowIndex={rowIndex}
                      columns={columns}
                      columnWidths={columnWidths}
                      isSelect={isSelect}
                      isDense={isDense}
                      selectedRows={selectedRows}
                      handleRowSelect={handleRowSelect}
                    />
                  ))
                )}
              </div>
            </InfiniteScroll>
          ) : (
            <div>
              {processedData.length === 0 ? (
                <div
                  className={`flex text-sm items-center ${
                    isDense ? 'h-8' : 'h-11'
                  } bg-gray-100`}
                >
                  <div
                    className="p-2 text-center text-gray-500 w-full"
                    style={{
                      width: `${Object.values(columnWidths).reduce(
                        (a, b) => a + b,
                        0
                      )}px`,
                    }}
                  >
                    No Records
                  </div>
                </div>
              ) : (
                processedData.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    row={row}
                    rowIndex={rowIndex}
                    columns={columns}
                    columnWidths={columnWidths}
                    isSelect={isSelect}
                    isDense={isDense}
                    selectedRows={selectedRows}
                    handleRowSelect={handleRowSelect}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 my-2">
        <p className="font-regularweight text-color">
          <strong>Records: </strong>
          {processedData.length}/{data?.[0]?.totalRecords || data.length}
        </p>
        {allowMultipleSelect && (
          <p>
            <strong>Selected: </strong>
            {selectedRows.length}
          </p>
        )}
      </div>
    </div>
  );
};

export default ResizableTable;