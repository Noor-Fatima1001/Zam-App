import React, { useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import useDebounce from "../../hooks/useDebounce";

const CustomTextField = ({
  label,
  control,
  name,
  rules,
  error,
  endpoint,
  queryKey,
  valueKey = "value",
  labelKey = "label",
  concatenateLable,
  setValue,
  responseWhich,
  additionalParams = {},
  baseFilters = [],
  optionRelative,
  resetSignal,
  defaultValue,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([
    { recirdId: 1, companyname: "ssss" },
  ]);
  const [showOptions, setShowOptions] = useState(false);

  const debouncedInputValue = useDebounce(inputValue, 500);
  const { mutate, isPending: loading } = useGlobelApi(endpoint);
  const dropdownRef = useRef(null); // Create a ref for the dropdown

  const fetchOptions = async (searchTerm) => {
    const queryfilters = [
      {
        key: queryKey,
        operator: "contains",
        value1: searchTerm,
        logical: "",
      },
    ];
    const filters = baseFilters
      ? [...baseFilters, ...queryfilters]
      : queryfilters;
    const body = {
      filters: filters,
      ...(additionalParams && { ...additionalParams }),
      limit: 10,
      offset: 0,
    };
    mutate(body, {
      onSuccess: (res) => {
        console.log("🚀 ~ fetchOptions ~ res:", responseWhich);
        setOptions(res?.[responseWhich] || []);
      },
      onError: (err) => {
        console.error("Error fetching options:", error);
      },
    });
  };

  useEffect(() => {
    if (defaultValue) {
      setInputValue(defaultValue);
    }
  }, [defaultValue]);
  useEffect(() => {
    if (debouncedInputValue) {
      fetchOptions(debouncedInputValue);
      // setShowOptions(true);
    } else {
      setOptions([]);
      setShowOptions(false);
    }
  }, [debouncedInputValue]);
  useEffect(() => {
    if (inputValue === "") {
      setOptions([]);
      setShowOptions(false);
      setValue(name, "");
    }
  }, [inputValue]);
  // Listen for reset changes
  useEffect(() => {
    if (resetSignal) {
      setInputValue("");
      setValue(name, "");
    }
  }, [resetSignal]);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowOptions(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="w-100" style={{ position: "relative" }} ref={dropdownRef}>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <input
            {...field}
            type="search"
            className={` border-0  ps-1 h-full w-full ${
              error ? "is-invalid" : ""
            }`}
            placeholder={`Enter ${label}`}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value); // Update local state
              field.onChange(e); // Notify React Hook Form
              setShowOptions(true);
              setValue(name, inputValue); // Show dropdown when typing
            }}
            onFocus={() => {
              if (options.length > 0) setShowOptions(true); // Show dropdown on focus
            }}
          />
        )}
      />

      {/* Suggestions Dropdown */}
      {showOptions && options.length > 0 && (
        <ul
          style={{
            position: optionRelative ? "relative" : "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "4px",
            marginTop: "4px",
            padding: "0",
            listStyle: "none",
            zIndex: 1000,
            maxHeight: "150px",
            overflowY: "auto",
          }}
        >
          {options.map((option) => (
            <li
              key={option[valueKey]}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #f0f0f0",
              }}
              onClick={() => {
                setShowOptions(false);
                setInputValue(option[labelKey]); // Set selected value
                setValue(name, option[valueKey]); // Update React Hook Form value
              }}
            >
              
              { !concatenateLable? option[labelKey]:option[labelKey] + " > " + option[concatenateLable]}
            </li>
          ))}
        </ul>
      )}

      {/* Loading State */}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "10px",
            color: "gray",
          }}
        >
          Loading...
        </div>
      )}
    </div>
  );
};

export default CustomTextField;
