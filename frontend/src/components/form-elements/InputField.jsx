import React from "react";
import { formatNumber, unformatNumber } from "../../utils/helper.function";
import { Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const InputField = ({
  label,
  placeholder,
  type,
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
  step = "0.01",
  maxDecimalLength = 2,
  allowNegative = false,
}) => {
  const handleChange = (e) => {
    const input = e.target;
    let value = input.value;
    const cursorPosition = input.selectionStart; // Capture initial cursor position

    if (type === "number" && value) {
      // Store original value and length for cursor adjustment
      const originalValue = value;
      const originalLength = value.length;

      // Step 1: Clean input, allow digits, decimal point, and negative sign (if allowed)
      const regex = allowNegative ? /[^0-9.-]/g : /[^0-9.]/g;
      value = value.replace(regex, "");

      // Step 2: Handle negative sign (only at start if allowed)
      if (allowNegative) {
        const hasNegative = value.startsWith("-");
        value = value.replace(/-/g, ""); // Remove all negative signs
        if (hasNegative) value = "-" + value; // Reapply at start if present
      } else {
        value = value.replace(/-/g, ""); // Remove all negative signs
      }

      // Step 3: Ensure only one decimal point
      const parts = value.split(".");
      if (parts.length > 2) {
        value = parts[0] + "." + parts[1];
      }

      // Step 4: Restrict decimal places to maxDecimalLength
      if (parts[1] && parts[1].length > maxDecimalLength) {
        value = parts[0] + "." + parts[1].slice(0, maxDecimalLength);
      }

      // Step 5: Update input only if value changed
      if (value !== originalValue) {
        input.value = value;

        // Adjust cursor position
        let newCursorPosition = cursorPosition;
        const lengthDiff = value.length - originalLength;
        newCursorPosition = cursorPosition + lengthDiff;
        newCursorPosition = Math.min(newCursorPosition, value.length);

        // Set cursor position
        input.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }

    if (useComma) {
      // Remove commas for validation
      const rawValue = unformatNumber(input.value);
      // Apply comma formatting
      const formattedValue = formatNumber(rawValue);
      if (formattedValue !== input.value) {
        input.value = formattedValue;
        // Set cursor to end after formatting
        input.setSelectionRange(formattedValue.length, formattedValue.length);
      }
    }

    // Trigger react-hook-form's onChange and custom onChange
    register.onChange(e);
    onChange && onChange(e);
  };

  return (
    <>
      <div className={`${mainClass ? mainClass : "w-full"}`}>
        {label && <label className="mb-1 w-full text-color font-regularweight">{label}</label>}
        {type === "date" ? (
          <div>
            <Controller
              name={`${register}`}
              control={control}
              rules={{ required: rules }}
              defaultValue={null}
              render={({
                field: { onChange, onBlur, value, ref },
                fieldState: { error },
              }) => (
                <>
                  <DatePicker
                    showIcon
                    selected={value || ""}
                    onChange={onChange}
                    dateFormat="dd/MM/yyyy"
                    className={`border rounded-radiusRegular h-7 text-sm focus:outline-none w-full ${dateClass}`}
                    placeholderText="dd/MM/yyyy"
                    ref={(el) => ref(el?.input)}
                    disabled={field_disable}
                  />
                  {error && (
                    <div className="form-text text-xs text-danger mt-1">
                      {error.message}
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
                type={type}
                disabled={field_disable}
                {...register}
                step={type === "number" ? step : undefined}
                maxLength={maxLength || null}
                defaultValue={defaultValue || ""}
                placeholder={placeholder}
                onChange={handleChange}
                className={`border px-2 rounded-radiusRegular w-full h-7 text-sm focus:outline-none ${inputClass}`}
              />
              {icon}
            </div>
            {error && (
              <div className="form-text text-xs text-danger mt-1">{error}</div>
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
// import React from "react";
// import { formatNumber, unformatNumber } from "../../utils/helper.function";
// import { Controller } from "react-hook-form";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

// const InputField = ({
//   label,
//   placeholder,
//   type,
//   register,
//   error,
//   inputClass,
//   inputDiv,
//   icon,
//   onChange,
//   defaultValue,
//   maxLength,
//   rules,
//   dateClass,
//   useComma = false,
//   control,
//   mainClass,
//   field_disable = false,
//   step
// }) => {
//   const handleChange = (e) => {
//     if(onChange){
//       onChange(e);
//     }
//     if (useComma) {
//       // Remove commas from the input value for validation
//       const rawValue = unformatNumber(e.target.value);
//       // Update the input with formatted value (for display purposes)
//       e.target.value = formatNumber(rawValue);
//     }
//     register.onChange(e);
//     onChange && onChange(e); // If a custom onChange handler is passed
//   };

//   return (
//     <>
//       <div className={`${mainClass ? mainClass : "w-full"}`}>
//         {label && <label className="mb-1 w-full !text-sm">{label}</label>}
//         {type == "date" ? (
//           <div>
//             <Controller
//               name={`${register}`}
//               control={control}
//               rules={{ required: rules }}
//               defaultValue={null}
//               render={({
//                 field: { onChange, onBlur, value, ref },
//                 fieldState: { error },
//               }) => (
//                 <>
//                   <DatePicker
//                     showIcon
//                     selected={value || ""}
//                     onChange={onChange}
//                     dateFormat="dd/MM/yyyy"
//                     className={`border rounded-md h-7 text-sm focus:outline-none w-full ${dateClass}`}
//                     placeholderText="dd/MM/yyyy"
//                     ref={(el) => ref(el?.input)} // Yahan ref ko set karna zaroori hai
//                   />
//                   {error && (
//                     <div className="form-text text-xs text-danger mt-1">
//                       {error.message}
//                     </div>
//                   )}
//                 </>
//               )}
//             />
//           </div>
//         ) : (
//           <div>
//             <div className={inputDiv}>
//               <input
//                 type={type}
//                 disabled={field_disable}
//                 {...register}
//                 {...(step && { step })}
//                 maxLength={maxLength?maxLength:null}
//                 defaultValue={defaultValue || ""}
//                 placeholder={placeholder}
//                 // onChange={onChange}
//                 onChange={handleChange}
//                 className={`border px-2 rounded-md w-full	h-7 text-sm focus:outline-none ${inputClass}`}
//               />

//               {icon}
//             </div>
//             {error && (
//               <div className="form-text text-xs  text-danger mt-1">{error}</div>
//             )}
//           </div>
//         )}
//       </div>
//       <style>
//         {`
//         .react-datepicker-wrapper{
//         width:100%;}
//       .react-datepicker__calendar-icon {
//       padding:7px !important;
//       fill:#c5c7c9;
//       }
//       .react-datepicker-popper {
//       z-index:20}
//       `}
//       </style>
//     </>
//   );
// };

// export default InputField;
