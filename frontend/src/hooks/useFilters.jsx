import React, { useState } from "react";

const FilterField = ({ type, name, label, onChange }) => {
  const [filter, setFilter] = useState({
    key: name,
    operator: type === "text" ? "contains" : "equal",
    value1: "",
    value2: "",
    logical: "and",
  });

  const handleFieldChange = (field, value) => {
    const updatedFilter = { ...filter, [field]: value };

    // Reset secondary value if operator is not "between"
    if (field === "operator" && value !== "between") {
      updatedFilter.value2 = "";
    }

    setFilter(updatedFilter);
    onChange(updatedFilter);
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <label>{label}:</label>

      <select
        value={filter.operator}
        onChange={(e) => handleFieldChange("operator", e.target.value)}
      >
        {type === "text" && (
          <>
            <option value="contains">Contains</option>
            <option value="equals">Equals</option>
            <option value="starts_with">Starts With</option>
            <option value="ends_with">Ends With</option>
          </>
        )}
        {(type === "integer" || type === "date") && (
          <>
            <option value="equal">Equal</option>
            <option value="greater_than">Greater Than</option>
            <option value="less_than">Less Than</option>
            <option value="between">Between</option>
          </>
        )}
      </select>

      <input
        type={type === "text" ? "text" : type === "integer" ? "number" : "date"}
        placeholder="Value 1"
        value={filter.value1}
        onChange={(e) => handleFieldChange("value1", e.target.value)}
      />

      {filter.operator === "between" && (
        <input
          type={type === "date" ? "date" : "number"}
          placeholder="Value 2"
          value={filter.value2}
          onChange={(e) => handleFieldChange("value2", e.target.value)}
        />
      )}

      <select
        value={filter.logical}
        onChange={(e) => handleFieldChange("logical", e.target.value)}
      >
        <option value="and">AND</option>
        <option value="or">OR</option>
      </select>
    </div>
  );
};

export default FilterField;
