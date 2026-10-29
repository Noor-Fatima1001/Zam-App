import React from "react";
import { MdDelete } from "react-icons/md";
import InputField from "../form-elements/InputField";
import SelectField from "../form-elements/SelectField";
const FieldsTable = ({
  name,
  control,
  fields,
  append,
  register,
  remove,
  columns,
  errors,
  headerId,
  status,
  handleDeleteEntry,
}) => {
  return (
    <div className="fields-table relative max-h-72 overflow-auto row-add-table">
      <table className="table w-full">
        <thead className="bg-customBlue sticky top-0 z-2 whitespace-nowrap">
          <tr>
            {columns.map((column, index) => {
              const isfieldWidth = column.width;

              if (column?.type == "hidden") {
                return null;
              }
              return (
                <th
                  key={index}
                  className={`py-2 ps-2.5 text-white text-xs ${
                    isfieldWidth
                      ? `!min-w-${isfieldWidth} !max-w-${isfieldWidth}`
                      : "min-w-40 max-w-40"
                  }`}
                >
                  {column.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr key={field.id} className="border-b">
              {columns.map((column, colIndex) => {
                if (column?.type == "hidden") {
                  return null;
                }
                const isfieldWidth = column.width;
                return (
                  <td
                    key={colIndex}
                    className={`p-1 place-self-start place-content-start ${
                      isfieldWidth
                        ? `!min-w-${isfieldWidth} !max-w-${isfieldWidth}`
                        : "min-w-40 max-w-40"
                    }`}
                  >
                    {column.type === "select" ? (
                      <SelectField
                        control={control}
                        name={`entries[${index}].${column?.name}`}
                        endpoint={column?.endpoint}
                        queryKey={column?.queryKey}
                        valueKey={column?.valueKey}
                        labelKey={column?.labelKey}
                        baseFilters={column?.baseFilters}
                        rules={column.rules}
                        error={errors?.entries?.[index]?.[column?.name]}
                      />
                    ) : (
                      <div
                        className={`w-full  gap-1 ${
                          column?.deleteRow && "flex text-left"
                        }`}
                      >
                        <InputField
                          type={column.type}
                          register={register(
                            `entries.${index}.${column.name}`,
                            column.rules
                          )}
                          // placeholder={"Enter " + `${column?.name}`}
                          error={
                            errors?.entries?.[index]?.[column?.name]?.message
                          }
                          field_disable={column?.field_disable}
                          onChange={(e) => column.rules?.onChange?.(e, index)}
                          // useComma={column?.useComma}
                        />
                        {column?.record_id}
                        {column?.deleteRow && (
                          <span
                            role="button"
                            onClick={() =>
                              field?.isApiData
                                ? handleDeleteEntry(field?.record_id, index)
                                : remove(index)
                            }
                            className="text-white w-7 h-7 flex justify-center items-center rounded-md  bg-customBlue cursor-pointer"
                          >
                            {/* className="text-white w-7 h-7 flex justify-center items-center rounded-sm absolute right-0 top-1/2 transform -translate-y-1/2 bg-customBlue cursor-pointer"
                      > */}
                            <MdDelete />
                          </span>
                        )}
                      </div>
                    )}

                    {/* {column?.deleteRow && index !== 0 && !field.isFromApi && ( */}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FieldsTable;
