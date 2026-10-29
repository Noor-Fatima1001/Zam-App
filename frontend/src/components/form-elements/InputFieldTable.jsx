// New formatting utility functions
const formatNumberWithCommas = (value) => {
  if (!value && value !== 0) return "";
  
  const stringValue = value.toString();
  const [integerPart, decimalPart] = stringValue.split(".");
  
  // Add commas to integer part (Indian numbering system: ##,##,###)
  let formattedInteger = integerPart;
  if (integerPart.length > 3) {
    const formattedRemaining = formattedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    formattedInteger = formattedRemaining ;
  }
  
  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};

const unformatNumberWithCommas = (value) => {
  if (!value) return "";
  return value.toString().replace(/,/g, "");
};

import React, { useEffect } from "react";
import { Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const InputFieldTable = ({
  label,
  placeholder,
  type,
  register,
  value, // Controlled value from parent
  error,
  inputClass,
  inputDiv,
  icon,
  onChange, // Custom onChange from parent
  defaultValue,
  maxLength,
  rules,
  dateClass,
  useComma = false,
  control,
  mainClass,
  field_disable = false,
  step = "0.01",
  name, // Explicit name prop for consistency
  maxDecimalLength = 3,
  allowNegative = false,
}) => {


  const handleChange = (e) => {
    const input = e.target;
    let value = input.value;
    const cursorPosition = input.selectionStart;
    const originalValue = value;
    const originalLength = value.length;

    // Clean numeric input if type is number
    if (type === "number" && value) {
      // Step 1: Remove commas first to get raw value
      if (useComma) {
        value = unformatNumberWithCommas(value);
      }

      // Step 2: Clean input (allow digits, decimal point, and optional negative sign)
      const regex = allowNegative ? /[^0-9.-]/g : /[^0-9.]/g;
      value = value.replace(regex, "");

      // Step 3: Handle negative sign
      if (allowNegative) {
        const hasNegative = value.startsWith("-");
        value = value.replace(/-/g, "");
        if (hasNegative) value = "-" + value;
      } else {
        value = value.replace(/-/g, "");
      }

      // Step 4: Ensure single decimal point
      const parts = value.split(".");
      if (parts.length > 2) {
        value = parts[0] + "." + parts[1];
      }

      // Step 5: Limit decimal places
      if (parts[1] && parts[1].length > maxDecimalLength) {
        value = parts[0] + "." + parts[1].slice(0, maxDecimalLength);
      }

      // Step 6: Format with comma if needed (for display only)
      let displayValue = value;
      if (useComma && value) {
        displayValue = formatNumberWithCommas(value);
      }

      // Step 7: Update input display value if changed
      // if (displayValue !== originalValue) {
        input.value = displayValue;

        // Adjust cursor position
        const lengthDiff = displayValue.length - originalLength;
        let newCursorPosition = cursorPosition + lengthDiff;
        newCursorPosition = Math.max(0, Math.min(newCursorPosition, displayValue.length));
        
        // Set cursor position after a small delay to ensure input is updated
        setTimeout(() => {
          input.setSelectionRange(newCursorPosition,newCursorPosition);
        }, 0);
      // }

      // Create event with raw value (without commas) for form handling
      const rawValue = unformatNumberWithCommas(displayValue);
      const eventWithRawValue = {
        ...e,
        target: {
          ...e.target,
          value: rawValue
        }
      };

      // Send the raw value (without commas) to handlers
      register?.onChange?.(eventWithRawValue);
      onChange?.(eventWithRawValue);
    } else {
      // For non-number types, handle normally
      register?.onChange?.(e);
      onChange?.(e);
    }
  };

  const handleDateChange = (date) => {
    // For date picker, call both form and custom onChange
    if (onChange) {
      onChange({ target: { value: date } });
    }
    return date; // Return value for Controller's onChange
  };

  // Format display value for controlled input
  const getDisplayValue = () => {
    if (value !== undefined) {
      if (useComma && type === "number" && value) {
        return formatNumberWithCommas(value);
      }
      return value;
    }
    if (register && defaultValue !== undefined) {
      if (useComma && type === "number" && defaultValue) {
        return formatNumberWithCommas(defaultValue);
      }
      return defaultValue;
    }
    return "";
  };

  return (
    <>
      <div className={`${mainClass ? mainClass : "w-full"}`}>
        {label && <label className="mb-1 w-full !text-sm">{label}</label>}
        {type === "date" ? (
          <div>
            <Controller
              name={name || (typeof register === "string" ? register : register?.name)} // Use name, register string, or register.name
              control={control}
              rules={rules}
              defaultValue={defaultValue || null}
              render={({
                field: { onChange, onBlur, value: fieldValue, ref },
                fieldState: { error: fieldError },
              }) => (
                <>
                  <DatePicker
                    showIcon
                    selected={
                      value !== undefined
                        ? value
                        : fieldValue !== undefined
                          ? fieldValue
                          : defaultValue || ""
                    }
                    onChange={(date) => {
                      onChange(handleDateChange(date));
                    }}
                    dateFormat="dd/MM/yyyy"
                    className={`border rounded-md h-7 text-sm focus:outline-none w-full ${dateClass}`}
                    placeholderText={placeholder || "dd/MM/yyyy"}
                    ref={(el) => ref(el?.input)}
                    disabled={field_disable}
                  />
                  {(error || fieldError) && (
                    <div className="form-text text-xs text-danger mt-1">
                      {error?.message || fieldError?.message}
                    </div>
                  )}
                </>
              )}
            />
          </div>
        ) : (
          <div>
            <div className={inputDiv}>
              <input
                // type={type}
                disabled={field_disable}
                {...(register && { ...register })} // Spread register if provided
                {...(step && { step })}
                maxLength={maxLength}
                value={getDisplayValue()}
                placeholder={placeholder}
                onChange={handleChange}
                className={`border px-2 rounded-md w-full h-7 text-sm focus:outline-none ${inputClass}`}
              />
              {icon}
            </div>
            {error && (
              <div className="form-text text-xs text-danger mt-1">{error.message || error}</div>
            )}
          </div>
        )}
      </div>
      <style>
        {`
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__calendar-icon {
          padding: 7px !important;
          fill: #c5c7c9;
        }
        .react-datepicker-popper {
          z-index: 20;
        }
        `}
      </style>
    </>
  );
};

export default InputFieldTable;