import React from "react";
import { Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import { formatNumber, unformatNumber } from "../../utils/helper.function";
import "react-datepicker/dist/react-datepicker.css";

const InputField = ({
  name,
  label,
  placeholder,
  type = "text",
  register,
  error,
  inputClass,
  inputDiv,
  icon,
  onChange,
  defaultValue,
  maxLength,
  rules,
  dateClass,
  useComma = false,
  control,
  mainClass,
  field_disable = false,
  step
}) => {
  const handleChange = (e) => {
    if (useComma) {
      const rawValue = unformatNumber(e.target.value);
      e.target.value = formatNumber(rawValue);
    }

    if (register?.onChange) register.onChange(e);
    if (onChange) onChange(e);
  };

  return (
    <>
      <div className={`${mainClass || "w-full"}`}>
        {label && <label className="mb-1 w-full !text-sm">{label}</label>}

        {type === "date" ? (
          <Controller
            name={name}
            control={control}
            rules={{ required: rules }}
            defaultValue={null}
            render={({
              field: { onChange, onBlur, value, ref },
              fieldState: { error: fieldError },
            }) => (
              <>
                <DatePicker
                  showIcon
                  selected={value || ""}
                  onChange={onChange}
                  dateFormat="dd/MM/yyyy"
                  className={`border rounded-md h-7 text-sm focus:outline-none w-full ${dateClass}`}
                  placeholderText="dd/MM/yyyy"
                  ref={(el) => ref?.(el?.input)}
                />
                {fieldError && (
                  <div className="form-text text-xs text-danger mt-1">
                    {fieldError.message}
                  </div>
                )}
              </>
            )}
          />
        ) : (
          <div>
            <div className={inputDiv}>
              <input
                name={name}
                type={type}
                disabled={field_disable}
                {...(typeof register === "object" ? register : {})}
                {...(step && { step })}
                maxLength={maxLength || null}
                defaultValue={defaultValue || ""}
                placeholder={placeholder}
                onChange={handleChange}
                className={`border px-2 rounded-md w-full h-7 text-sm focus:outline-none ${inputClass}`}
              />
              {icon}
            </div>
            {error && (
              <div className="form-text text-xs text-danger mt-1">
                {error}
              </div>
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

export default InputField;
