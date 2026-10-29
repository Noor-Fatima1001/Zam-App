import { Select } from "antd";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { useGlobelApi } from "./apis/useProduct/useCommon";
import useDebounce from "./hooks/useDebounce";

const AntdSelectField = memo(
  ({
    label,
    labelCLass,
    control,
    name,
    rules,
    error,
    isClearable = true,
    endpoint,
    valueKey = "value",
    labelKey = "label",
    queryKey,
    responseWhich = "data",
    addionallydata,
    baseFilters,
    headerData,
    defaultValue,
    ContcatenateLabel,
    multipleEntry,
    placeholder,
    disable,
  }) => {
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState(defaultValue ? [defaultValue] : []); // Default value ko direct options me dal diya
    const debouncedInputValue = useDebounce(inputValue, 500);
    const { mutate, isPending } = useGlobelApi(endpoint);
    // console.log(headerData)
    // Create a memoized deep copy of baseFilters to ensure it's reactive
    const memoizedBaseFilters = useMemo(() => {
      if (!baseFilters) return null;
      return baseFilters.map((filter) => ({ ...filter }));
    }, [baseFilters]);
    // Memoize the fetch function
    const fetchOptions = useCallback(
      async (searchTerm) => {
        // console.log("API CALL HO RAHI HAI with searchTerm:", searchTerm); // 🔍 Debugging line
        if (!searchTerm || searchTerm === defaultValue?.label) {
          console.log("API SKIP KARDI KYUN KE DEFAULT VALUE HAI"); // 🔍 Debugging
          return; // ✅ Default value pe API call avoid ki
        }
        const queryfilters = [
          {
            key: queryKey,
            operator: "contains",
            value1: searchTerm,
            logical: "",
          },
        ];

        const filters = memoizedBaseFilters
          ? [...memoizedBaseFilters, ...queryfilters]
          : queryfilters;

        const body = {
          ...(addionallydata && { userId: addionallydata }),
          ...(headerData && {
            headerData: {
              product_id: headerData,
              search_term: searchTerm
            }
          }),
          ...(!headerData && {filters}  ),
          limit: 0,
          offset: 0,
        };

        try {
          mutate(body, {
            onSuccess: (res) => {
              const fetchedOptions = res[responseWhich].map((item) => ({
                value: item[valueKey]?.toString(),
                label: ContcatenateLabel
                  ? `${item[labelKey]} - ${item[ContcatenateLabel]}`
                  : item[labelKey],
              }));

              setOptions((prev) => {
                // Prevent duplicate options
                const uniqueOptions = fetchedOptions.filter(
                  (newOpt) => !prev.some((opt) => opt.value === newOpt.value)
                );
                return [...prev, ...uniqueOptions];
              });
            },
            onError: (err) => console.log(err),
          });
        } catch (error) {
          console.log(error);
        }
      },
      [memoizedBaseFilters]
    );
    // memoizedBaseFilters,
    // queryKey,
    // addionallydata,
    // headerData,
    // mutate,
    // responseWhich,
    // valueKey,
    // labelKey,
    // ContcatenateLabel,
    // Handle search input
    const handleSearch = useCallback((value) => {
      setInputValue(value);
    }, []);
    // useEffect(() => {
    //   setOptions([]);
    // }, [memoizedBaseFilters]);
    useEffect(() => {
      if (defaultValue && inputValue === defaultValue?.label) {
        setOptions([defaultValue]);
        setInputValue(""); // ✅ Yeh ensure karega ke input change na ho
      }
    }, [defaultValue]);

    // Single useEffect for all fetch scenarios
    useEffect(() => {
      // console.log("Debounced Input Value:", debouncedInputValue);
      // console.log("Default Value:", defaultValue?.label);

      if (debouncedInputValue && debouncedInputValue !== defaultValue?.label) {
        // console.log("Now Fetching Options...");
        fetchOptions(debouncedInputValue);
      } else {
        // console.log("Skipping API Call 🚀");
      }
    }, [debouncedInputValue]);

    // Memoize select props to prevent unnecessary re-renders
    const selectProps = useMemo(
      () => ({
        showSearch: true,
        style: { width: "100%" },
        placeholder: placeholder || "Select",
        filterOption: (input, option) => {
          return (
            option?.label?.toLowerCase().includes(input.toLowerCase()) || false
          );
        },
        notFoundContent: isPending
          ? "Loading..."
          : "No options available. Please write and search",
        options,
        className: "custom-select h-7",
      }),
      [isPending, options, placeholder]
    );

    return (
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
              {...selectProps}
              disabled={disable}
              value={
                options.find((option) => option?.value === field?.value) ||
                defaultValue ||
                null
              }
              onSearch={handleSearch}
              onChange={(value) => field.onChange(value)}
            />
          )}
        />
        {error && (
          <div className="form-text text-sm text-danger mt-1">
            {error.message}
          </div>
        )}
      </div>
    );
  }
);

export default AntdSelectField;

// import { Select } from "antd";
// import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
// import { Controller } from "react-hook-form";
// import { useGlobelApi } from "./apis/useProduct/useCommon";
// import useDebounce from "./hooks/useDebounce";

// const AntdSelectField = memo(
//   ({
//     label,
//     labelCLass,
//     control,
//     name,
//     rules,
//     error,
//     isClearable = true,
//     endpoint,
//     valueKey = "value",
//     labelKey = "label",
//     queryKey,
//     responseWhich = "data",
//     addionallydata,
//     baseFilters,
//     headerData,
//     defaultValue,
//     ContcatenateLabel,
//     multipleEntry,
//     placeholder,
//     disable,
//   }) => {
//     const [inputValue, setInputValue] = useState("");
//     const [options, setOptions] = useState([]);
//     const debouncedInputValue = useDebounce(inputValue, 500);
//     const { mutate, isPending } = useGlobelApi(endpoint);

//     // Create a memoized deep copy of baseFilters to ensure it's reactive
//     const memoizedBaseFilters = useMemo(() => {
//       if (!baseFilters) return null;
//       return baseFilters.map((filter) => ({ ...filter }));
//     }, [baseFilters]);
//     // Memoize the fetch function
//     const fetchOptions = useCallback(
//       async (searchTerm) => {
//         if (!searchTerm) return; // Prevent fetch with empty search

//         const queryfilters = [
//           {
//             key: queryKey,
//             operator: "contains",
//             value1: searchTerm,
//             logical: "",
//           },
//         ];

//         const filters = memoizedBaseFilters
//           ? [...memoizedBaseFilters, ...queryfilters]
//           : queryfilters;

//         const body = {
//           ...(addionallydata && { userId: addionallydata }),
//           headerData: headerData || null,
//           filters,
//           limit: 0,
//           offset: 0,
//         };

//         try {
//           mutate(body, {
//             onSuccess: (res) => {
//               const fetchedOptions = res[responseWhich].map((item) => ({
//                 value: item[valueKey]?.toString(),
//                 label: ContcatenateLabel
//                   ? `${item[labelKey]} - ${item[ContcatenateLabel]}`
//                   : item[labelKey],
//               }));

//               setOptions((prev) => {
//                 // Prevent duplicate options
//                 const uniqueOptions = fetchedOptions.filter(
//                   (newOpt) => !prev.some((opt) => opt.value === newOpt.value)
//                 );
//                 return [...prev, ...uniqueOptions];
//               });
//             },
//             onError: (err) => console.log(err),
//           });
//         } catch (error) {
//           console.log(error);
//         }
//       },
//       [memoizedBaseFilters]
//     );
//     // memoizedBaseFilters,
//     // queryKey,
//     // addionallydata,
//     // headerData,
//     // mutate,
//     // responseWhich,
//     // valueKey,
//     // labelKey,
//     // ContcatenateLabel,
//     // Handle search input
//     const handleSearch = useCallback((value) => {
//       setInputValue(value);
//     }, []);
//     useEffect(() => {
//       setOptions([]);
//     }, [memoizedBaseFilters]);

//     // Single useEffect for all fetch scenarios
//     useEffect(() => {
//       // Initial load with default value
//       if (defaultValue && !options.length) {
//         setOptions([defaultValue]);
//         fetchOptions(defaultValue.label);
//         return;
//       }

//       // Debounced search
//       if (debouncedInputValue && debouncedInputValue !== defaultValue?.label) {
//         fetchOptions(debouncedInputValue);
//       }
//     }, [
//       debouncedInputValue,
//       multipleEntry ? null : defaultValue,
//       fetchOptions,
//       options.length,
//     ]);

//     // Memoize select props to prevent unnecessary re-renders
//     const selectProps = useMemo(
//       () => ({
//         showSearch: true,
//         style: { width: "100%" },
//         placeholder: placeholder || "Select",
//         filterOption: (input, option) => {
//           const isInputNumber = !isNaN(input);
//           if (isInputNumber) return true;
//           return (
//             option?.label?.toLowerCase().includes(input.toLowerCase()) || false
//           );
//         },
//         notFoundContent: isPending
//           ? "Loading..."
//           : "No options available. Please write and search",
//         options,
//         className: "custom-select h-7",
//       }),
//       [isPending, options, placeholder]
//     );

//     return (
//       <div className="w-full write-select">
//         {label && (
//           <label className={`text-sm mb-1 ${labelCLass}`}>{label}</label>
//         )}
//         <Controller
//           name={name}
//           control={control}
//           rules={rules}
//           defaultValue={defaultValue?.value}
//           render={({ field }) => (
//             <Select
//               {...field}
//               {...selectProps}
//               disabled={disable}
//               value={
//                 options.find((option) => option?.value === field?.value) || null
//               }
//               onSearch={handleSearch}
//               onChange={(value) => field.onChange(value)}
//             />
//           )}
//         />
//         {error && (
//           <div className="form-text text-sm text-danger mt-1">
//             {error.message}
//           </div>
//         )}
//         <style>
//           {`.custom-select.ant-select {
//   border: 1px solid #d9dee3 !important;
//   border-radius:5px;
// }

// .custom-select.ant-select-focused {
//   box-shadow: none !important;
//     border-radius:5px;

// //   border-color: transparent !important;
// }

// .custom-select .ant-select-selector {
//   box-shadow: none !important;
//   border-color: transparent !important;
// }

// .custom-select .ant-select-selector:focus {
//   outline: none !important;
//   border-color: transparent !important;
// }
// .custom-select .ant-select-selection-placeholder {
//   color: #9CA3AF !important; /* Replace #888 with your desired color */
// }

// `}
//         </style>
//       </div>
//     );
//   }
// );

// export default AntdSelectField;
