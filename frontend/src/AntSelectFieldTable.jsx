import { Select } from "antd";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import useDebounce from "./hooks/useDebounce";
import { useGlobelApi } from "./apis/useProduct/useCommon";

const AntSelectFieldTable = memo(
  ({
    label,
    labelClass,
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
    disabled,
    onSelectChange,
  }) => {
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState([]);
    const [recordsMap, setRecordsMap] = useState({});
    const [isUserSearching, setIsUserSearching] = useState(false);
    const debouncedInputValue = useDebounce(inputValue, 500);
    const { mutate, isPending } = useGlobelApi(endpoint);

    // Update options and recordsMap when defaultValue changes
    useEffect(() => {
      if (
        defaultValue &&
        defaultValue.value &&
        !options.some((opt) => opt.value === defaultValue.value)
      ) {
        setOptions((prev) => {
          // Ensure defaultValue is included in options, but avoid duplicates
          const filteredPrev = prev.filter(
            (opt) => opt.value !== defaultValue.value
          );
          return [...filteredPrev, defaultValue];
        });
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
      setIsUserSearching(!!value);
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
          <label className={`text-color font-regularweight mb-1 ${labelClass}`}>
            {label}
          </label>
        )}
        <Select
          {...selectProps}
          disabled={disabled}
          value={defaultValue ? defaultValue.value : null} // Use defaultValue directly
          onSearch={handleSearch}
          onChange={(val, option) => {
            const selectedOption = val
              ? { value: val, label: option?.label || "" }
              : null;
            const selectedRecord = val ? recordsMap[val] || null : null;
            if (onSelectChange) onSelectChange(selectedOption, selectedRecord);
            setInputValue(""); // Reset inputValue after selection
            setIsUserSearching(false); // Reset search flag
          }}
        />
      </div>
    );
  }
);

export default AntSelectFieldTable;