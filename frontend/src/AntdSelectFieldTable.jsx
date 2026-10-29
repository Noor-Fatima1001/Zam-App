import { Select } from "antd";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { useGlobelApi } from "./apis/useProduct/useCommon";
import useDebounce from "./hooks/useDebounce";

const AntdSelectFieldTable = memo(
  ({
    label,
    labelClass, // Fixed typo from labelCLass
    control,
    name,
    rules,
    error,
    isClearable = false,
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
    sendFiltersWithSearchTerm = true,
    disabled, // Standardized prop name
    onSelectChange,
  }) => {
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState([]);
    const [recordsMap, setRecordsMap] = useState({}); // Map value to full record
    const [isUserSearching, setIsUserSearching] = useState(false); // Track user-initiated search
    const debouncedInputValue = useDebounce(inputValue, 500);
    const { mutate, isPending } = useGlobelApi(endpoint);

    // Initialize options and recordsMap with defaultValue if provided
    useEffect(() => {
      if (
        defaultValue &&
        defaultValue.value &&
        !options.some((opt) => opt.value === defaultValue.value)
      ) {
        setOptions((prev) => [...prev, defaultValue]);
        setRecordsMap((prev) => ({
          ...prev,
          [defaultValue.value]: defaultValue.record || defaultValue,
        }));
      }
    }, [defaultValue]);

    const memoizedBaseFilters = useMemo(() => {
      if (!baseFilters) return null;
      return baseFilters.map((filter) => ({ ...filter }));
    }, [baseFilters]);

    const fetchOptions = useCallback(
      async (searchTerm) => {
        if (
          !searchTerm ||
          (defaultValue && searchTerm === defaultValue.label)
        ) {
          return;
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
              ...headerData,
              search_term: searchTerm,
            },
          }),
          ...(sendFiltersWithSearchTerm && { filters }),
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
              const newRecordsMap = res[responseWhich].reduce((acc, item) => {
                acc[item[valueKey]?.toString()] = item;
                return acc;
              }, {});
              setOptions((prev) => {
                const uniqueOptions = fetchedOptions.filter(
                  (newOpt) =>
                    !prev.some((opt) => opt.value === newOpt.value) &&
                    newOpt.value !== defaultValue?.value
                );
                return [
                  ...prev.filter((opt) => opt.value === defaultValue?.value),
                  ...uniqueOptions,
                ];
              });
              setRecordsMap((prev) => ({
                ...prev,
                ...newRecordsMap,
              }));
            },
            onError: (err) => console.error("Error fetching options:", err),
          });
        } catch (error) {
          console.error("Error in fetchOptions:", error);
        }
      },
      [
        memoizedBaseFilters,
        queryKey,
        addionallydata,
        headerData,
        mutate,
        responseWhich,
        valueKey,
        labelKey,
        ContcatenateLabel,
        defaultValue,
      ]
    );

    const handleSearch = useCallback((value) => {
      setInputValue(value);
      setIsUserSearching(!!value); // Set flag when user types
    }, []);

    useEffect(() => {
      if (
        isUserSearching &&
        debouncedInputValue &&
        debouncedInputValue !== defaultValue?.label
      ) {
        fetchOptions(debouncedInputValue);
      }
    }, [debouncedInputValue, fetchOptions, defaultValue, isUserSearching]);

    const selectProps = useMemo(
      () => ({
        showSearch: true,
        style: { width: "100%" },
        placeholder: placeholder || "Select",
        filterOption: (input, option) =>
          option?.label?.toLowerCase().includes(input.toLowerCase()) || false,
        notFoundContent: isPending
          ? "Loading..."
          : "No options available. Please write and search",
        options,
        className: "custom-select h-7",
        allowClear: isClearable,
      }),
      [isPending, options, placeholder, isClearable]
    );

    return (
      <div className="w-full write-select">
        {label && (
          <label className={`text-color font-regularweight mb-1 ${labelClass}`}>{label}</label>
        )}
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field }) => (
            <Select
              {...selectProps}
              disabled={disabled}
              value={field.value || null} // Use form value
              onSearch={handleSearch}
              onChange={(val, option) => {
                const selectedOption = val
                  ? { value: val, label: option?.label || "" }
                  : null;
                const selectedRecord = val ? recordsMap[val] || null : null;
                field.onChange(selectedOption); // Update form state
                if (onSelectChange) onSelectChange(selectedOption, selectedRecord);
                setInputValue(""); // Reset inputValue after selection
                setIsUserSearching(false); // Reset search flag
              }}
            />
          )}
        />
        {error && (
          <div className="text-sm text-danger mt-1">{error.message}</div>
        )}
      </div>
    );
  }
);

export default AntdSelectFieldTable;