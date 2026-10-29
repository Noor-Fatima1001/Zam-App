import React, { memo } from "react";
import { Controller } from "react-hook-form";
import { Select } from "antd";

const AntSSelectField = ({
  label,
  labelCLass,
  control,
  name,
  rules,
  error,
  onSelectChange=()=>{},
  isClearable = true,
  defaultValue,
  multiple = false,
  options = [],
  disable=false,
}) => {
  return (
    <>
      <div className="w-full write-select">
        {label && (
          <label className={`text-color font-regularweight mb-1 ${labelCLass}`}>{label}</label>
        )}
        <Controller
          name={name}
          control={control}
          rules={rules}
          defaultValue={defaultValue?.value}
          render={({ field }) => (
            <Select
              {...field}
              mode={multiple ? "multiple" : undefined}
              value={options.find((option) => option?.value === field?.value) || null}
              allowClear={isClearable}
              showSearch
              onChange={(value, option) => {
                // Update the form value
                field.onChange(value);
                onSelectChange(value)
              }}
              style={{ width: "100%" }}
              placeholder="Select"
              defaultActiveFirstOption={true} 
              filterOption={false} 
              options={options}
              className="custom-select h-7"
              disabled={disable}
            />
          )}
        />
        {error && <div className="form-text text-danger mt-1">{error.message}</div>}
      </div>
    </>
  );
};

export default memo(AntSSelectField);
