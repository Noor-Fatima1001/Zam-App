import React, { useState, useEffect } from "react";
import { Input } from "antd";
import { getFromLocalStorage } from "../../config/crypto-file";

const DebouncedInput = ({
  fieldName,
  apiEndpoint,
  resultColumn,
  delay = 300,
  value,
  onValueChange,
}) => {
  const [localValue, setLocalValue] = useState(value || ""); // Initialize with the prop value
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [isItemSelected, setIsItemSelected] = useState(false);
  const token = getFromLocalStorage("authToken");

  useEffect(() => {
    setLocalValue(value || ""); // Sync localValue with the external value
  }, [value]);

  useEffect(() => {
    if (!localValue.trim()) {
      setData([]);
      return;
    }

    if (isItemSelected) {
      setIsItemSelected(false);
      return;
    }

    const handler = setTimeout(() => {
      fetchData();
    }, delay);

    return () => clearTimeout(handler);
  }, [localValue]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filters: [
            {
              key: fieldName,
              operator: "contains",
              value1: localValue,
              logical: "",
            },
          ],
          limit: 0,
          offset: 0,
          orderby: "",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Response:", result);

      setData(result.result.map((item) => item[resultColumn]));
    } catch (err) {
      setError("Error fetching data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onValueChange(newValue); // Notify parent about the value change
  };

  const handleSelect = (item) => {
    setLocalValue(item);
    onValueChange(item); // Notify parent about the selected value
    setIsItemSelected(true);
    setData([]);
  };

  return (
    <div style={{ position: "relative" }}>
      <Input
        placeholder={`Enter ${fieldName}`}
        value={localValue}
        onChange={handleChange}
        allowClear
      />
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {data?.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ccc",
            listStyleType: "none",
            padding: "0",
            margin: "4px 0 0",
            maxHeight: "150px",
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {data.map((item, index) => (
            <li
              key={index}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #f0f0f0",
              }}
              onClick={() => handleSelect(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DebouncedInput;
