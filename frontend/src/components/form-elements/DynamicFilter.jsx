import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FaFilter, FaMinus } from "react-icons/fa6";
import Select from "react-select";
import { NumericSelectList, SelectDateList, SelectList } from "../../config/selectList";
import CustomButton from "../button/CustomButton";
import CustomTextField from "./CustomTextField";
import InputField from "./InputField";
import moment from "moment";
import AntdSelectField from "../../AntdSelectField";

const DynamicFilter = ({
  fields,
  onApply,
  onReset,
  fieldGrid,
  addpartentSectionAppend,
  setChildData,
  watchName,
  parentStateSet,
}) => {
  const { control, handleSubmit, reset, getValues, setValue, watch } = useForm();

  // Watch all field values to track dependencies
  const watchedFields = watch(fields.map((field) => field.name));

  // Handle watchName for parent-child data sync
  if (watchName && setChildData) {
    const watchdata = watch(watchName);
    setChildData(watchdata);
  }

  const [resetSignal, setResetSignal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const onSubmit = () => {
    const result = fields
      ?.map((field) => {
        const operator = getValues(`${field.name}_operator`);
        const value1 = getValues(field.name);
        const aliasesValue = field?.aliases;
        const QueryValue = field?.filterQueryKey;
        let value2 = null;

        // Determine value2 based on field type and operator
        if ((field.type === "date" || field.type === "numerical") && operator === "between") {
          value2 = getValues(`${field.name}_value2`);
        }

        if (value1 && value1 !== "") {
          return {
            key: aliasesValue
              ? `${aliasesValue}${QueryValue ? QueryValue : field.name}`
              : field.name,
            operator: operator || "",
            value1: value1?.label
              ? value1?.value
              : field.type === "date"
                ? moment(value1).format("YYYY-MM-DD")
                : value1,
            ...(value2 && {
              value2: field.type === "date"
                ? moment(value2).format("YYYY-MM-DD")
                : value2,
            }),
            logical: "",
          };
        }
        return null;
      })
      .filter((item) => item !== null);
    onApply(result);
    setResetSignal(false);
  };

  const handleResetFilters = () => {
    // Reset all form fields
    reset(
      fields.reduce((acc, field) => {
        return {
          ...acc,
          [field.name]: "", // Reset value1
          [`${field.name}_operator`]: field.type === "date" || field.type === "numerical" ? SelectDateList[1]?.value : SelectList[1]?.value, // Reset operator to default
          ...(field.type === "date" || field.type === "numerical"
            ? { [`${field.name}_value2`]: "" } // Reset value2 for date/numerical
            : {}),
        };
      }, {})
    );

    // Toggle reset signal for any dependent components
    setResetSignal((prev) => !prev);

    // Call onReset callback to notify parent of filter clearing
    if (onReset) {
      onReset(); // Notify parent that filters are cleared
    }
  };

  useEffect(() => {
    if (parentStateSet) {
      parentStateSet(!expanded);
    }
  }, [expanded, parentStateSet]);

  return (
    <>
      <Accordion
        className="!shadow-md rounded-radiusRegular  border p-2 mb-2  before:hidden"
        expanded={expanded}
        onChange={() => setExpanded((prevExpanded) => !prevExpanded)}
      >
        <AccordionSummary
          TouchRippleProps={{ className: "px-0 m-0 !h-10 !min-h-7 !max-h-7 p-2 " }}
          className="px-0 m-0 !h-7 !min-h-7 !max-h-7"
          expandIcon={
            <span className="w-6 h-6 rounded-full border-[1.5px] border-customBlue flex justify-center items-center ">
              {!expanded ? (
                <FaFilter className="text-customBlue" />
              ) : (
                <FaMinus className="text-customBlue" />
              )}
            </span>
          }
          aria-controls={`plane1-content`}
          id={`plane1-header`}
        >
          <h3 className="!m-0 text-customBlue text-size font-headingweight ">
            Filters
          </h3>
        </AccordionSummary>
        <AccordionDetails className="p-0">
          <form autocomplete="off" onSubmit={handleSubmit(onSubmit)} className="">
            <div
              className={`grid ${fieldGrid ? fieldGrid : "lg:grid-cols-2 grid-cols-1"
                } gap-x-5 gap-y-1 text-sm`}
            >
              {fields?.map((field) => {
                const placeholder = field?.label?.toLowerCase();
                const fieldType = field.type;
                const fieldName = field?.name;
                const fieldValueKey = field?.ValueKey;
                const fieldlabelKey = field?.labelKey;
                const selectfieldQueryKey = field.fieldQueryKey;
                const selectOptions = field.options;
                const ApiEndPoint = field.endpoint;
                const ApiResponseWhich = field.responseWhich;
                const ApiadditionalParams = field?.additionalParams;
                const selectType =
                  fieldType === "date"
                    ? SelectDateList
                    : fieldType === "numerical"
                    ? NumericSelectList
                    : SelectList;
                const serverDefaultValue = field.serverDefaultValue;
                const fieldconcatenateLable = field.concatenateLable;

                // Start with the field's baseFilters
                let ApibaseFilters = field?.baseFilters || [];

                // Check if the field should be disabled
                let isDisabled = false;
                if (field.dependsOn) {
                  const dependentFieldIndex = fields.findIndex(
                    (f) => f.name === field.dependsOn.field
                  );
                  const dependentFieldValue = watchedFields[dependentFieldIndex];
                  const dependentFieldConfig = fields[dependentFieldIndex];

                  // Disable if dependent field is empty and has no serverDefaultValue
                  isDisabled =
                    !dependentFieldValue && !dependentFieldConfig?.serverDefaultValue;

                  // Update baseFilters
                  if (dependentFieldValue) {
                    // Use the dependent field's value if available
                    ApibaseFilters = [
                      ...ApibaseFilters,
                      {
                        key: field.dependsOn.filterKey,
                        operator: "equal",
                        value1:
                          dependentFieldValue?.value || dependentFieldValue,
                        logical: "",
                      },
                    ];
                  } else if (field.dependsOn.defaultValue) {
                    // Use dependsOn.defaultValue if no value is selected
                    ApibaseFilters = [
                      ...ApibaseFilters,
                      {
                        key: field.dependsOn.filterKey,
                        operator: "equal",
                        value1: field.dependsOn.defaultValue,
                        logical: "",
                      },
                    ];
                  }
                }

                return (
                  <div key={field?.name}>
                    <label
                      htmlFor={field?.name}
                      className="flex  mb-1  text-color font-regularweight"
                    >
                      {field?.label}
                    </label>
                    <div className="filter-row flex h-8 filterdata">
                      <Controller
                        name={`${field?.name}_operator`}
                        control={control}
                        defaultValue={selectType?.[1]?.value}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="border-0 p-1 operater text-sm"
                            disabled={isDisabled}
                          >
                            {selectType?.map((op) => (
                              <option key={op?.value} value={op?.value}>
                                {op?.label}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      <Controller
                        name={field?.name}
                        control={control}
                        defaultValue=""
                        render={({ field }) => {
                          const operate = watch(`${field?.name}_operator`);
                          if (fieldType === "date") {
                            return (
                              <div className="d-flex w-100">
                                <InputField
                                  control={control}
                                  dateClass="border-0"
                                  type={"date"}
                                  register={field?.name}
                                  disabled={isDisabled}
                                />
                                {operate === "between" && (
                                  <InputField
                                    control={control}
                                    dateClass="border-0"
                                    type={"date"}
                                    register={`${field?.name}_value2`}
                                    disabled={isDisabled}
                                  />
                                )}
                              </div>
                            );
                          } else if (fieldType === "select") {
                            return (
                              <Select
                                {...field}
                                options={selectOptions?.map((option) => ({
                                  value: option?.value,
                                  label: option?.label,
                                }))}
                                className="w-100 !h-7 !min-h-7 !max-h-7"
                                isSearchable
                                placeholder={`Select ${placeholder}`}
                                isDisabled={isDisabled}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    boxShadow: "none",
                                    minHeight: "28px",
                                    height: "28px",
                                    maxHeight: "28px",
                                    border: "none",
                                    borderRadius: "10px !important",
                                    fontSize: "14px",
                                    "&:focus": {
                                      outline: "none !important",
                                      boxShadow: "none !important",
                                      borderColor: "gray !important",
                                    },
                                    "&:hover": {
                                      borderColor: "none !important",
                                    },
                                  }),
                                  placeholder: (base) => ({
                                    ...base,
                                    color: "rgb(148 163 184)",
                                  }),
                                }}
                              />
                            );
                          } else if (fieldType === "textServer") {
                            return operate === "in" ? (
                              <AntdSelectField
                                control={control}
                                name={fieldName}
                                endpoint={ApiEndPoint}
                                queryKey={
                                  selectfieldQueryKey
                                    ? selectfieldQueryKey
                                    : fieldName
                                }
                                valueKey={
                                  fieldValueKey ? fieldValueKey : fieldName
                                }
                                labelKey={
                                  fieldlabelKey ? fieldlabelKey : fieldName
                                }
                                responseWhich={ApiResponseWhich}
                                baseFilters={ApibaseFilters}
                                multiple
                                disabled={isDisabled}
                              />
                            ) : (
                              <CustomTextField
                                control={control}
                                name={fieldName}
                                endpoint={ApiEndPoint}
                                queryKey={
                                  selectfieldQueryKey
                                    ? selectfieldQueryKey
                                    : fieldName
                                }
                                valueKey={
                                  fieldValueKey ? fieldValueKey : fieldName
                                }
                                labelKey={
                                  fieldlabelKey ? fieldlabelKey : fieldName
                                }
                                concatenateLable={fieldconcatenateLable}
                                label={placeholder}
                                setValue={setValue}
                                responseWhich={ApiResponseWhich}
                                resetSignal={resetSignal}
                                additionalParams={ApiadditionalParams}
                                baseFilters={ApibaseFilters}
                                defaultValue={serverDefaultValue}
                                disabled={isDisabled}
                              />
                            );
                          } else if (fieldType === "numerical") {
                            return (
                              <div className="d-flex w-100">
                                <Controller
                                  name={field?.name}
                                  control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                      <input
                                        {...field}
                                        id={field?.name}
                                        type="number"
                                        placeholder={`Enter ${placeholder}`}
                                        className="w-100 border-0 p-1"
                                        disabled={isDisabled}
                                      />
                                    )}
                                  />
                                  {operate === "between" && (
                                    <Controller
                                      name={`${field?.name}_value2`}
                                      control={control}
                                      defaultValue=""
                                      render={({ field }) => (
                                        <input
                                          {...field}
                                          type="number"
                                          placeholder={`Enter ${placeholder} end`}
                                          className="w-100 border-0 p-1"
                                          disabled={isDisabled}
                                        />
                                      )}
                                    />
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <input
                                  {...field}
                                  id={field?.name}
                                  type="text"
                                  placeholder={`Select ${placeholder}`}
                                  className="w-100 border-0 p-1"
                                  disabled={isDisabled}
                                />
                              );
                            }
                          }}
                        />

                      </div>
                    
                  </div>
                );
              })}
            </div>
            {addpartentSectionAppend && <div>{addpartentSectionAppend}</div>}
            <div className="flex gap-2 mt-2.5">
              <CustomButton addclass=" rounded-lg  text-black " btntext={"Apply Filter"} type="submit" />
              {onReset && (
                <CustomButton
                  btntext={"Reset Filter"}
                  handleClick={handleResetFilters}
                  addclass=" rounded-lg  text-black "
                />
              )}
            </div>
          </form>
        </AccordionDetails>
      </Accordion>
      <style jsx>{`
        .MuiAccordionSummary-content {
          margin: 0 !important;
        }
      `}</style>
    </>
  );
};

export default DynamicFilter;
