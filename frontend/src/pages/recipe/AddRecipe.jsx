import React, { useEffect, useState } from "react";
import ResizableTable from "../../components/table/ResizableTable";
import AntdSelectFieldTable from "../../AntdSelectFieldTable";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useForm } from "react-hook-form";
import {
  getFromLocalStorage,
  getFromSessionStorage,
} from "../../config/crypto-file";
import InputField from "../../components/form-elements/InputField";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { useNavigate } from "react-router-dom";
import InputFieldTable from "../../components/form-elements/InputFieldTable";
import CustomButton from "../../components/button/CustomButton";
import withPermissionCheck from "../../config/withPermissionCheck";
import AntSSelectField from "../../AntSSelectField";
import AntdSelectField from "../../AntdSelectField";
import { MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const AddRecipe = () => {
  const {
    register,
    control,
    formState: { errors, isValid },
    setValue,
    getValues,
    watch,
    trigger,
  } = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      product_type: { value: "recipe", label: "Recipe" }, // Default to "Recipe"
    },
  });
  const recipeCTD = getFromSessionStorage("recipeCTD");
  console.log(recipeCTD)
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_PRODUCT_LIST);
  const { mutate: FetchEntries, isPending: EnteriesPending } = useGlobelApi(API_ENDPOINTS.GET_RECIPE_ENTRIES)
  const { mutate: deleteEnteryMutate } = useGlobelApi(
    API_ENDPOINTS.DELETE_RECIPE_CHILD_ITEM
  );
  const recipeData = getFromSessionStorage("recipeData")
  const { mutate: getUnitList } = useGlobelApi(API_ENDPOINTS.GET_PRODUCT_UNITS);
  const [headerId, setHeaderId] = useState(recipeData?.record_id);
  const UserId = getFromLocalStorage("UserId");
  const [rowsData, setRowsData] = useState([]);
  const { mutate: createRecipe } = useGlobelApi(API_ENDPOINTS.CREATE_RECIPE);
  const [productStatus, setProductStatus] = useState(); // Single state for product type
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState({
    recipeUnit: null,
    productType: null,
  });
  useEffect(() => {

    permissions
  }, [permissions])
  const checkRecipeUnit = useCheckPermission("recipe-base-unit-permission", UserId);
  const checkProductType = useCheckPermission("recipe-product-type-permission", UserId);
  useEffect(() => {
    if (headerId) {
      handleFetchEntries()
      handleFetchdata()
    }
  }, [headerId])
  useEffect(() => {
    const recipeData = getFromSessionStorage("recipeData")
    setHeaderId(recipeData?.record_id)
  }, [navigate])


  const handleFetchdata = () => {
    const filters = [
      { key: "pm.product_type", operator: "in", value1: "batch,recipe" },
      { key: "pm.id", operator: "contains", value1: headerId, logical: "" }
      // {key:"pm."}
    ];
    mutate(
      {
        filters: filters || null,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (response) => {
          const data = response?.data?.[0];
          setValue("product_name", data?.product_name);
          setValue("product_category_id", {
            value: data?.product_category_id,
            label: data?.product_category
          })
          setValue("base_unit_id", {
            value: data?.base_unit_id,
            label: data?.base_unit
          })
          setProductStatus(data?.product_type);
          setValue("product_type", data?.product_type, { shouldValidate: true });
          // setValue("plu_code", data?.plu_code)
          setIsSaved(true);
          // setValue("product_code", data?.product_code)
        },
        onError: (error) => {
          console.error("Error fetching users:", error);
        },
      }
    );
  };
  const handleFetchEntries = () => {
    FetchEntries(
      {
        headerData: {
          parent_product_id: headerId,
        },
        filters: null,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (response) => {
          const data = response?.data;
          const formattedData = data?.map((item, index) => ({
            index,
            record_id: item.record_id,
            product_id: item.child_id,
            entry_base_unit: item.base_unit,
            unit_selected: item.unit_selected_id,
            qty: item.qty,
          }));

          // Batch update form values
          const updatedValues = {};
          data?.forEach((item, rowIndex) => {
            updatedValues[`product_id${rowIndex}`] = {
              label: item.product_name,
              value: item.record_id,
            };
            updatedValues[`qty${rowIndex}`] = item.qty || "0";
            updatedValues[`unit_selected${rowIndex}`] = {
              label: item.unit_selected,
              value: item.unit_selected_id,
            };
          });
          Object.entries(updatedValues).forEach(([key, value]) =>
            setValue(key, value, { shouldValidate: true })
          );

          setRowsData(formattedData);
        },
        onError: (err) => {
          console.error("Failed to fetch entries:", err);
          toast.error("Failed to load recipe entries");
        },
      }
    );
  };



  const headers = [
    { key: "action", label: "Action", width: 100 },
    {
      key: "product_id",
      label: "Product",
      width: 400,
      // sortable: true,
      filterable: true,
    },
    {
      key: "product_type",
      label: "Product Type",
      width: 400,
      // sortable: true,
      filterable: true,
    },
    {
      key: "entry_base_unit",
      label: "Base Unit",
      width: 200,
      // sortable: true,
      filterable: true,
    },
    {
      key: "unit_selected",
      label: "Unit",
      width: 200,
      // sortable: true,
      filterable: true,
    },
    {
      key: "qty",
      label: "Quantity",
      width: 200,
      // sortable: true,
      filterable: true,
    },
  ];
  const productBaseFilters = recipeCTD ? [
    {
      key: "aptcd.comp_dept_id",
      operator: "equal",
      value1: recipeCTD?.com_dept_id,
      logical: ""
    }
  ] : [
    {
      key: "pm.product_type",
      operator: "in",
      value1: productStatus === "recipe" ? "raw,recipe,batch" : "raw,batch",
      logical: "",
    },
    { key: "pm.status", operator: "equal", value1: "1", logical: "" },
  ].filter(Boolean); // Remove null values

  const updateRowData = (rowIndex, fieldName, value, record) => {
    if (fieldName === "product_id") {
      const product_id = value.value;
      getUnitList(
        {
          headerData: { product_id, search_term: "" },
          filters: null,
          limit: 0,
          offset: 0,
          orderby: "",
        },
        {
          onSuccess: (response) => {
            const unitData = response?.data;
            setRowsData((prevData) => {
              const newData = [...prevData];
              if (!newData[rowIndex]) newData[rowIndex] = { index: rowIndex };
              if (unitData?.length > 0) {
                newData[rowIndex]["entry_base_unit"] = unitData?.[0].unit_description;
              } else {
                newData[rowIndex]["entry_base_unit"] = null;
              }
              setValue(`qty${rowIndex}`, "1");
              newData[rowIndex]["product_id"] = product_id;
              newData[rowIndex]["product_type"] = record?.product_type;
              newData[rowIndex]["qty"] = "1";
              return newData;
            });
          },
          onError: (err) => {
            console.error("Failed to fetch units:", err);
            setRowsData((prevData) => {
              const newData = [...prevData];
              if (!newData[rowIndex]) newData[rowIndex] = { index: rowIndex };
              newData[rowIndex]["product_id"] = value.value;
              newData[rowIndex]["unit_selected"] = null;
              setValue(`unit_selected${rowIndex}`, null, {
                shouldValidate: true,
              });
              setValue(`product_id${rowIndex}`, value, {
                shouldValidate: true,
              });
              return newData;
            });
          },
        }
      );
    } else {
      setRowsData((prevData) => {
        const newData = [...prevData];
        if (!newData[rowIndex]) newData[rowIndex] = { index: rowIndex };
        if (fieldName === "unit_selected") {
          newData[rowIndex][fieldName] = value.value;
        } else {
          newData[rowIndex][fieldName] = value;
        }
        setValue(`${fieldName}${rowIndex}`, value, { shouldValidate: true });
        return newData;
      });
    }
  };

  const handleAddClick = () => {
    if (!productStatus) {
      return toast.error("Please Select product type first");
    }
    if (!getValues("product_type")) {
      toast.error("Please select a product type before adding a row");
      return;
    }
    const rowIndex = rowsData.length;
    const newRow = {
      index: rowIndex,
      record_id: "",
      product_id: "",
      qty: "0",
      unit_selected: "",
    };
    setRowsData((prevData) => [...prevData, newRow]);
    setValue(`product_id${rowIndex}`, null, { shouldValidate: true });
    setValue(`qty${rowIndex}`, "0", { shouldValidate: true });
    setValue(`unit_selected${rowIndex}`, null, { shouldValidate: true });
  };

  const validateAllFields = async () => {
    await trigger();
    let isValid = true;
    rowsData.forEach((row, index) => {
      const qty = parseFloat(watch(`qty${index}`)) || 0;
      const product = watch(`product_id${index}`);
      const unit = watch(`unit_selected${index}`);

      if (!product) {
        setValue(`product_id${index}`, null, { shouldValidate: true });
        isValid = false;
      }
      if (!unit) {
        setValue(`unit_selected${index}`, null, { shouldValidate: true });
        isValid = false;
      }
      if (qty <= 0) {
        setValue(`qty${index}`, "0", { shouldValidate: true });
        isValid = false;
      }
    });

    setFormSubmitted(true);
    return isValid;
  };

  const HandleSave = async () => {
    const isFormValid = await validateAllFields();
    if (!isFormValid) {
      toast.error("Please fix all validation errors before saving");
      return;
    }

    const product_name = getValues("product_name");
    // const product_code = getValues("product_code");
    const product_category_id = getValues("product_category_id").value;
    const base_unit_id = getValues("base_unit_id").value;
    // const plu_code = getValues("plu_code");
    const product_type = productStatus;

    if (
      // !product_code ||
      !product_name ||
      !product_category_id ||
      !base_unit_id ||
      !product_type
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    const company_to_dept_id = recipeCTD?.com_dept_id;

    const finalArray = {
      header: {
        // product_code,
        product_name,
        product_category_id: product_category_id.value || product_category_id,
        base_unit_id,
        product_type,
        ...(company_to_dept_id ? { company_to_dept_id } : {}),
        status: 1,
        created_by: UserId,
        ...(headerId ? { header_id: headerId } : {}),
      },
      entries: rowsData.map((row) => ({
        record_id: row.record_id,
        product_id: row.product_id,
        qty: parseFloat(row.qty) || 0,
        unit_selected: row.unit_selected,
      })),
    };

    createRecipe(
      { dataInsert: finalArray },
      {
        onSuccess: (response) => {
          const data = response?.data?.[0];
          if (data?.msgType === "success") {
            setHeaderId(data?.headerId);
            handleFetchEntries()
            handleFetchdata()
            setIsSaved(true);
          }
          toast[data.msgType](data?.message);
        },
        onError: (err) => {
          console.log(err);
          toast.error("Failed to save product");
        },
      }
    );
  };


  const getProductId = (rowIndex) => {
    return rowsData[rowIndex]?.product_id;
  };

  const renderCell = (value, row, columnKey) => {
    const rowIndex = row.index;
    const fieldName = `${columnKey}${rowIndex}`;
    const fieldValue = watch(fieldName);

    if (columnKey === "action") {
      return (
        <div className="d-flex justify-content-around">
          <button
            type="button"
            onClick={() => deleteEntry(value, row, columnKey)}
            className="bg-customBlue w-7 h-7 rounded-md flex justify-center items-center text-white"
          >
            <MdDelete />
          </button>
        </div>
      );
    }

    if (columnKey === "entry_base_unit") {
      return <div>{value}</div>
    }
    if (columnKey === "product_type") {
      return <div>{value}</div>
    }

    if (columnKey === "product_id") {
      return (
        <div>
          <AntdSelectFieldTable
            control={control}
            name={`product_id${rowIndex}`}
            endpoint={recipeCTD ? API_ENDPOINTS.GET_PRODUCT_FOR_RECIPE_CREATION : API_ENDPOINTS.GET_PRODUCT_LIST}
            queryKey="pm.product_name"
            valueKey="record_id"
            labelKey="product_name"
            responseWhich="data"
            placeholder="Select Product"
            onSelectChange={(selected, selectedRecord) =>
              updateRowData(rowIndex, "product_id", selected, selectedRecord)
            }
            ContcatenateLabel="product_type"
            baseFilters={productBaseFilters} // Use dynamic filters
          />
          {formSubmitted && errors?.[fieldName] && (
            <div className="text-red-500 text-xs mt-1">
              {errors[fieldName]?.message || "Product is required"}
            </div>
          )}
        </div>
      );
    }

    if (columnKey === "unit_selected") {
      return (
        <div>
          <AntdSelectFieldTable
            control={control}
            name={`unit_selected${rowIndex}`}
            endpoint={API_ENDPOINTS.GET_PRODUCT_UNITS}
            queryKey="ump.description"
            valueKey="record_id"
            labelKey="unit_description"
            responseWhich="data"
            placeholder="Select Unit"
            headerData={{
              product_id: rowsData[rowIndex]?.product_id,
            }}
            sendFiltersWithSearchTerm={false}
            baseFilters={[
              { key: "ump.description", operator: "contains", value1: "kg", logical: "OR" },
              { key: "ulp.size", operator: "contains", value1: "5", logical: "" }
            ]}
            onSelectChange={(selected) =>
              updateRowData(rowIndex, "unit_selected", selected)
            }
            disabled={!rowsData[rowIndex]?.product_id}
            key={`unit-select-${rowIndex}`}
          />
          {formSubmitted && errors?.[fieldName] && (
            <div className="text-red-500 text-xs mt-1">
              {errors[fieldName]?.message || "Unit is required"}
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <InputFieldTable
          control={control}
          name={fieldName}
          register={register(fieldName, {
            required: columnKey === "qty" ? "Quantity is required" : false,
            min:
              columnKey === "qty"
                ? { value: 0, message: "Must be non-negative" }
                : undefined,
          })}
          error={errors?.[fieldName]?.message}
          value={fieldValue}
          onChange={(e) => updateRowData(rowIndex, columnKey, e.target.value)}
          type={columnKey === "qty" ? "number" : "text"}
        />
      </div>
    );
  };


  const deleteEntry = (value, row) => {
    const rowIndex = row.index;

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#696cff",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const removeRow = () => {
          // Remove the row and update indices
          const newRowsData = rowsData.filter((item) => item.index !== rowIndex);
          const updatedRows = newRowsData.map((item, index) => {
            const oldIndex = item.index;
            const newIndex = index;
            if (oldIndex !== newIndex) {
              // Update form values for the shifted rows
              setValue(`product_id${newIndex}`, watch(`product_id${oldIndex}`));
              setValue(`qty${newIndex}`, watch(`qty${oldIndex}`));
              setValue(`unit_selected${newIndex}`, watch(`unit_selected${oldIndex}`));
              // Clear old values
              setValue(`product_id${oldIndex}`, undefined);
              setValue(`qty${oldIndex}`, undefined);
              setValue(`unit_selected${oldIndex}`, undefined);
            }
            return { ...item, index: newIndex };
          });
          setRowsData(updatedRows);
        };

        if (row.record_id && row.record_id !== "") {
          deleteEnteryMutate(
            {
              dataInsert: {
                record_id: row.record_id,
                created_by: UserId,
              },
            },
            {
              onSuccess: (res) => {
                if (res.success) {
                  removeRow();
                  toast.success(res?.data?.[0]?.message || "Entry deleted successfully.")
                  // Swal.fire({
                  //   icon: "success",
                  //   title: "Success",
                  //   text: res?.data?.[0]?.message || "Entry deleted successfully.",
                  // });
                } else {
                  toast.error(res?.data?.[0]?.message || "Something went wrong")
                  // Swal.fire({
                  //   icon: "error",
                  //   title: "Error",
                  //   text: res?.data?.[0]?.message || "Failed to delete entry.",
                  // });
                }
              },
              onError: (error) => {
                console.error("Delete error:", error);
                toast.error(error.response?.data?.message || "Something went wrong")
                // Swal.fire({
                //   icon: "error",
                //   title: "Error",
                //   text: error.response?.data?.message || "Something went wrong.",
                // });
              },
            }
          );
        } else {
          removeRow();
          toast.success("Entry deleted successfully.")
          // Swal.fire({
          //   icon: "success",
          //   title: "Deleted",
          //   text: "Entry deleted successfully.",
          // });
        }
      }
    });
  };

  useEffect(() => {
    const verifyPermissions = async () => {
      try {

        const [addResult, editResult] = await Promise.all([
          checkRecipeUnit.check(),
          checkProductType.check(),
        ]);
        setPermissions({
          recipeUnit: addResult,
          productType: editResult,
        });
        console.log("Permissions:", { addRecipe: addResult, editRecipe: editResult });
      } catch (error) {

        console.error("Permission check failed:", error);
        setPermissions({ addRecipe: false, editRecipe: false });
      }
    };
    verifyPermissions();
  }, []);


  return (
    <div>
      <div className="bg-white shadow-sm p-3  rounded-radiusRegular mt-2 my-3">
        <h1 className="text-size text-color font-headingweight text-center mb-2">
          Batch & Recipe
        </h1>
        <div className="text-end text-color" >
          {

            recipeCTD ? "Company:" + " " + recipeCTD?.company_name : null

          }
        </div>
        <div className="text-end text-color" >
          {

            recipeCTD ? "Dept:" + " " + recipeCTD?.dept_name : null

          }
        </div>
        <div className="">
          <div className="grid grid-cols-3 gap-x-2">
            <div>
              <InputField
                label="Product Name"
                control={control}
                register={register("product_name", {
                  required: "Product name is required",
                })}
                error={errors.product_name?.message}
              />
            </div>
            <div>
              <AntdSelectFieldTable
                label="Product Category"
                control={control}
                name="product_category_id"
                endpoint={API_ENDPOINTS.GET_CATEGORY_LIST}
                queryKey="pc.description"
                valueKey="record_id"
                labelKey="category_product"
                responseWhich="data"
                baseFilters={[
                  {
                    key: "pc.parent_id",
                    operator: "greater_than",
                    value1: "0",
                    logical: "",
                  },
                ]}
                rules={{
                  required: "category is required",
                }}
                error={errors.product_category_id}
              />
            </div>
            <div>
              <AntdSelectFieldTable
                label="Unit"
                control={control}
                name="base_unit_id"
                endpoint={API_ENDPOINTS.GET_UNIT_LIST}
                queryKey="ump.description"
                valueKey="record_id"
                labelKey="unit"
                sendFiltersWithSearchTerm={false}
                responseWhich="data"
                disabled={(!permissions?.recipeUnit && headerId )?true : false}
                rules={{ required: "Unit is required" }}
                error={errors.base_unit_id?.message}
              />
            </div>
            <div>
              <AntSSelectField
                label="Product Type"
                control={control}
                isClearable={false}
                name="product_type"
                options={[
                  { value: "recipe", label: "Recipe" },
                  { value: "batch", label: "Batch" },
                ]}
                rules={{ required: "Please select a product type" }}
                disable={!permissions?.productType && headerId }
                error={errors.product_type?.message}
                onSelectChange={(value) => {
                  setProductStatus(value || "recipe");
                }}
              />
            </div>
          </div>

          <div className="flex my-2 gap-3">
            <CustomButton
              type="button"
              btntext="Save"
              handleClick={HandleSave}
            />
            <CustomButton
              type="button"
              btntext="Add Row"
              handleClick={handleAddClick}
              disabled={!getValues("product_type")} // Disable if product_type is not selected
            />
          </div>
        </div>
      </div>

      <div>
        <ResizableTable
          data={rowsData}
          columns={headers.map((header) => ({
            ...header,
            render: (value, row) => renderCell(value, row, header.key),
          }))}
          height="400px"
          scrollableId="recipe-entries"
          isSelect={false}
          enableScroll={false}
        />
      </div>
    </div>
  );
};

export default withPermissionCheck(AddRecipe, "add-recipe");
