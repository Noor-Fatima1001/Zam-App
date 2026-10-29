import React, { useState, useEffect, useRef } from 'react';
import { IoIosArrowDown, IoIosArrowForward } from 'react-icons/io';
import { FiSearch } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';
import { FaSort } from 'react-icons/fa';
import InfiniteScroll from 'react-infinite-scroll-component';
import Loader from '../Loader';

// Recursive filter function
const filterHierarchicalData = (nodes, filters) => {
  return nodes
    .filter((node) => {
      const matchesFilters = Object.keys(filters).every((key) => {
        if (!filters[key]) return true;
        return node[key]?.toString()?.toLowerCase()?.includes(filters[key].toLowerCase());
      });

      let filteredChildren = [];
      if (node.children && node.children.length > 0) {
        filteredChildren = filterHierarchicalData(node.children, filters);
      }

      return matchesFilters || filteredChildren.length > 0;
    })
    .map((node) => ({
      ...node,
      children:
        node.children && node.children.length > 0
          ? filterHierarchicalData(node.children, filters)
          : node.children,
    }));
};

// Flatten hierarchical data for rendering
const flattenData = (nodes, expandedRows, level = 0) => {
  const result = [];
  nodes.forEach((node) => {
    result.push({ ...node, level });
    if (expandedRows[node.id] && node.children && node.children.length > 0) {
      result.push(...flattenData(node.children, expandedRows, level + 1));
    }
  });
  return result;
};

const HierarchicalTable = ({
  data = [],
  columns = [],
  scrollableId = 'table',
  height = 'auto',
  className = '',
  onSort,
  onFilter,
  defaultSort = { key: null, direction: 'asc' },
  defaultFilters = {},
  isSelect = true,
  onSelectRow,
  hasMore = false,
  enableScroll = true,
  onLoadMore = () => {},
  loading = false,
  isDense = false,
  disableInternalSort = false,
}) => {
  console.log("hirarchicalTable!",data)
  const [columnWidths, setColumnWidths] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.width || 150 }), {})
  );
  const [isResizing, setIsResizing] = useState(false);
  const [currentResizer, setCurrentResizer] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [filters, setFilters] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: defaultFilters[col.key] || '' }), {})
  );
  const [activeFilter, setActiveFilter] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [sortConfig, setSortConfig] = useState(defaultSort);
  const [allExpanded, setAllExpanded] = useState(false);
  const filterRefs = useRef({});

  // Click outside handler for filters
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

  // Handle column resizing
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

  // Handle filter change
  const handleFilterChange = (columnKey, value) => {
    const newFilters = { ...filters, [columnKey]: value };
    setFilters(newFilters);
    onFilter?.(newFilters);
    setSelectedRow(null);
  };

  // Clear a specific filter
  const clearFilter = (columnKey) => {
    handleFilterChange(columnKey, '');
  };

  // Clear all filters
  const clearAllFilters = () => {
    const newFilters = columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {});
    setFilters(newFilters);
    onFilter?.(newFilters);
    setActiveFilter(null);
    setSelectedRow(null);
  };

  // Handle sort
  const handleSort = (column) => {
    if (!column.sortable) return;
    const newDirection =
      sortConfig.key === column.key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    const newSortConfig = { key: column.key, direction: newDirection };
    setSortConfig(newSortConfig);
    onSort?.(column.key, newDirection);
    setSelectedRow(null);
  };

  // Handle row selection
  const handleRowSelect = (rowIndex, rowData) => {
    if (selectedRow === rowIndex) {
      setSelectedRow(null);
      onSelectRow?.(null);
    } else {
      setSelectedRow(rowIndex);
      onSelectRow?.([rowData]);
    }
  };

  // Toggle row expansion
  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    setSelectedRow(null);
  };

  // Toggle all rows expansion
  const toggleAllRows = () => {
    const newExpandedState = {};
    if (!allExpanded) {
      // Expand all rows that have children
      const setAllExpanded = (nodes) => {
        nodes.forEach((node) => {
          if (node.children && node.children.length > 0) {
            newExpandedState[node.id] = true;
            setAllExpanded(node.children);
          }
        });
      };
      setAllExpanded(data);
    }
    setExpandedRows(newExpandedState);
    setAllExpanded(!allExpanded);
  };

  // Filter and flatten data
  const filteredData = filterHierarchicalData(data, filters);
  const processedData = disableInternalSort
    ? flattenData(filteredData, expandedRows)
    : flattenData(
        [...filteredData].sort((a, b) => {
          if (!sortConfig.key) return 0;
          const aValue = a[sortConfig.key] || '';
          const bValue = b[sortConfig.key] || '';
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }),
        expandedRows
      );

  // Get active filters
  const activeFilters = columns
    .filter((col) => col.filterable && filters[col.key])
    .map((col) => ({
      key: col.key,
      label: col.label,
      value: filters[col.key],
    }));

  // Render header
  const renderHeader = (column) => (
    <div
      className={`relative flex-1 group ${filters[column.key] ? 'bg-blue-700' : ''}`}
      ref={(el) => (filterRefs.current[column.key] = el)}
    >
      <div
        className={`text-white overflow-x-hidden font-semibold p-2 flex items-center justify-between ${
          column.sortable ? 'cursor-pointer' : ''
        }`}
        onClick={() => column.sortable && handleSort(column)}
      >
        <span>{column.label}</span>
        <div className="flex gap-2 items-center">
          {column.filterable && (
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setActiveFilter(activeFilter === column.key ? null : column.key);
              }}
            >
              <FiSearch className={`text-white ${filters[column.key] ? 'text-yellow-300' : ''}`} />
            </div>
          )}
          {column.sortable && (
            <FaSort
              className={`text-white ${
                sortConfig.key === column.key
                  ? sortConfig.direction === 'asc'
                    ? 'text-yellow-300'
                    : 'text-yellow-300 rotate-180'
                  : ''
              }`}
            />
          )}
        </div>
      </div>
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
        className="absolute top-0 -right-[1px] h-full w-[2px] cursor-col-resize bg-gray-400 hover:bg-blue-500"
        onMouseDown={(e) => startResize(e, column.key)}
      />
    </div>
  );

  return (
    <div className=" ">
      {/* Active Filters Section */}
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
      <div className="d-flex justify-content-end">
        <button
          className="flex justify-center text-xs items-center  min-w-16 rounded-full border-0 bg-customBlue text-white p-1 px-2 text-capitalize"
          onClick={toggleAllRows}
          aria-label={allExpanded ? 'Collapse all rows' : 'Expand all rows'}
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
      <div
        id={`scrollableDiv${scrollableId}`}
        className={`border rounded-lg overflow-auto ${className}`}
        style={{ height }}
      >
        <div className="min-w-max">
          {/* Headers */}
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
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer"
                      disabled
                    />
                  </div>
                )}
                {renderHeader(column)}
              </div>
            ))}
          </div>
          {/* Body */}
          {enableScroll ? (
            <InfiniteScroll
              dataLength={processedData.length}
              next={onLoadMore}
              hasMore={hasMore}
              loader={<Loader />}
              endMessage={<p className="text-center mt-2">No more records</p>}
              scrollableTarget={`scrollableDiv${scrollableId}`}
            >
              <div>
                {processedData.length === 0 ? (
                  <div
                    className={`flex text-sm items-center ${isDense ? 'h-8' : 'h-11'} bg-gray-100`}
                  >
                    <div
                      className="p-2 text-center text-gray-500 w-full"
                      style={{
                        width: `${Object.values(columnWidths).reduce((a, b) => a + b, 0)}px`,
                      }}
                    >
                      No Records
                    </div>
                  </div>
                ) : (
                  processedData.map((row, rowIndex) => (
                    <div
                      key={`${row.id}-${row.level}-${rowIndex}`}
                      className={`flex border-b text-sm items-center ${
                        isDense ? 'h-8' : 'h-11'
                      } ${rowIndex % 2 === 0 ? 'bg-gray-100' : 'bg-white'} ${
                        selectedRow === rowIndex ? '!bg-blue-100' : ''
                      } hover:bg-blue-50`}
                    >
                      {columns.map((column, colIndex) => (
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
                                  checked={selectedRow === rowIndex}
                                  onChange={() => handleRowSelect(rowIndex, row)}
                                  className="h-4 w-4 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}
                            {colIndex === 0 && (
                              <div
                                className="flex items-center"
                                style={{ paddingLeft: `${row.level * 20}px` }}
                              >
                                {row.children && row.children.length > 0 && (
                                  <button
                                    className="mr-2 focus:outline-none"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRow(row.id);
                                    }}
                                    aria-label={
                                      expandedRows[row.id] ? 'Collapse row' : 'Expand row'
                                    }
                                  >
                                    {expandedRows[row.id] ? (
                                      <IoIosArrowDown className="text-blue-600" />
                                    ) : (
                                      <IoIosArrowForward className="text-blue-600" />
                                    )}
                                  </button>
                                )}
                                <span>{row[column.key] || ''}</span>
                              </div>
                            )}
                            {colIndex !== 0 && <span>{row[column.key] || ''}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </InfiniteScroll>
          ) : (
            <div>
              {processedData.length === 0 ? (
                <div
                  className={`flex text-sm items-center ${isDense ? 'h-8' : 'h-11'} bg-gray-100`}
                >
                  <div
                    className="p-2 text-center text-gray-500 w-full"
                    style={{
                      width: `${Object.values(columnWidths).reduce((a, b) => a + b, 0)}px`,
                    }}
                  >
                    No Records
                  </div>
                </div>
              ) : (
                processedData.map((row, rowIndex) => (
                  <div
                    key={`${row.id}-${row.level}-${rowIndex}`}
                    className={`flex border-b text-sm items-center ${
                      isDense ? 'h-8' : 'h-11'
                    } ${rowIndex % 2 === 0 ? 'bg-gray-100' : 'bg-white'} ${
                      selectedRow === rowIndex ? '!bg-blue-100' : ''
                    } hover:bg-blue-50`}
                  >
                    {columns.map((column, colIndex) => (
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
                                checked={selectedRow === rowIndex}
                                onChange={() => handleRowSelect(rowIndex, row)}
                                className="h-4 w-4 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                          {colIndex === 0 && (
                            <div
                              className="flex items-center"
                              style={{ paddingLeft: `${row.level * 20}px` }}
                            >
                              {row.children && row.children.length > 0 && (
                                <button
                                  className="mr-2 focus:outline-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRow(row.id);
                                  }}
                                  aria-label={
                                    expandedRows[row.id] ? 'Collapse row' : 'Expand row'
                                  }
                                >
                                  {expandedRows[row.id] ? (
                                    <IoIosArrowDown className="text-blue-600" />
                                  ) : (
                                    <IoIosArrowForward className="text-blue-600" />
                                  )}
                                </button>
                              )}
                              <span>{row[column.key] || ''}</span>
                            </div>
                          )}
                          {colIndex !== 0 && <span>{row[column.key] || ''}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <p>
          <strong>Records: </strong>
          {processedData.length}/{data.length}
        </p>
      </div>
    </div>
  );
};

export default HierarchicalTable;