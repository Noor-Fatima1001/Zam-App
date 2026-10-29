import React from "react";
import { Controller } from "react-hook-form";
import CreatableSelect from "react-select/creatable";

const SelectWriteField = ({
  label,
  options,
  control,
  name,
  rules,
  error,
  isClearable = true,
  border,
}) => {
  return (
    <div className="mb-2">
      {label && <label className="form-label mb-1">{label}</label>}
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <CreatableSelect
            {...field}
            options={options}
            isClearable={isClearable}
            styles={{
              control: (base) => ({
                ...base,
                height: "40px",
                boxShadow: "none",
                caretColor: "#24B1B3",
                border: border ? border : "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "14px",
              }),
              placeholder: (base) => ({
                ...base,
                color: "rgb(148 163 184)",
              }),
            }}
          />
        )}
      />
      {error && (
        <div className="form-text text-danger mt-1">{error.message}</div>
      )}
    </div>
  );
};

export default SelectWriteField;
