import React, { useEffect, useState, useMemo } from "react";
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
import useCheckPermission from "../../config/useCheckPermission";
import { filterAndSortData, formatDecimalValue } from "../../utils/helper.function";
import Loader from "../../components/Loader";
import AntSelectFieldTable from "../../AntSelectFieldTable";

const DeptAddRecipe = () => {
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
  const recipeData = getFromSessionStorage("recipeData");
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_DEPT_RECIPE_LIST);
  const { mutate: fetchEntries, isPending: isFetchingEntries } = useGlobelApi(API_ENDPOINTS.GET_RECIPE_ENTRIES);
  const { mutate: deleteEntryMutate } = useGlobelApi(API_ENDPOINTS.DELETE_RECIPE_CHILD_ITEM);
  const { mutate: getUnitList } = useGlobelApi(API_ENDPOINTS.GET_PRODUCT_UNITS);
  const [headerId, setHeaderId] = useState(recipeData?.record_id);
  const UserId = getFromLocalStorage("UserId");
  const [rowsData, setRowsData] = useState([]);
  const [apiData, setApiData] = useState([]); // Added apiData state
  const { mutate: createRecipe } = useGlobelApi(API_ENDPOINTS.CREATE_RECIPE);
  const [productStatus, setProductStatus] = useState();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState({
    recipeUnit: null,
    productType: null,
  });
  const [preservedConfig, setPreservedConfig] = useState();
  const [presfilters, setPresFilters] = useState();

  const checkRecipeUnit = useCheckPermission("recipe-base-unit-permission", UserId);
  const checkProductType = useCheckPermission("recipe-product-type-permission", UserId);

  const headers = [
    { key: "action", label: "Action", width: 100 },
    { key: "product_name", label: "Product", width: 400, sortable: true, filterable: true },
    { key: "product_type", label: "Product Type", width: 400, sortable: true, filterable: true },
    { key: "entry_base_unit", label: "Base Unit", width: 200, sortable: true, filterable: true },
    { key: "unit_selected_label", label: "Unit", width: 200, sortable: true, filterable: true },
    { key: "qty", label: "Quantity", width: 200, sortable: true, filterable: true },
  ];

  const productBaseFilters = recipeCTD
    ? [
      { key: "aptcd.comp_dept_id", operator: "equal", value1: recipeCTD?.com_dept_id, logical: "" },
      { key: "aptcd.status", operator: "equal", value1: "1", logical: "" },
    ]
    : [
      {
        key: "pm.product_type",
        operator: "in",
        value1: productStatus === "recipe" ? "raw,recipe,batch" : "raw,batch",
        logical: "",
      },
      { key: "pm.status", operator: "equal", value1: "1", logical: "" },
      { key: "aptcd.status", operator: "equal", value1: "1", logical: "" },
    ].filter(Boolean);

  // Custom filter function for ResizableTable
  const customFilterFunction = (data, filters, sortConfig, preservedFilter, preservedSortConfig) => {
    return filterAndSortData(
      data,
      apiData,
      setRowsData,
      presfilters,
      preservedConfig,
      setPresFilters,
      setPreservedConfig,
      filters || {},
      sortConfig || {},
      preservedFilter,
      preservedSortConfig
    );
  };

  useEffect(() => {

    if (headerId) {
      handleFetchEntries();
      handleFetchData();
    } else {
      setRowsData([]);
      setApiData([]);
    }
  }, [headerId]);


  useEffect(() => {

    const recipeData = getFromSessionStorage("recipeData");
    setHeaderId(recipeData?.product_id);
  }, [navigate]);

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
      } catch (error) {
        console.error("Permission check failed:", error);
        setPermissions({ recipeUnit: false, productType: false });
      }
    };
    verifyPermissions();
  }, []);

  const handleFetchData = () => {
    const filters = [{ key: "product_id", operator: "equal", value1: headerId, logical: "" }];
    mutate(
      { filters: filters || null, limit: 0, offset: 0, orderby: "" },
      {
        onSuccess: (response) => {
          const data = response?.data?.[0];
          if (data) {
            setValue("product_name", data?.product_name);
            setValue("product_category_id", {
              value: data?.product_category_id,
              label: data?.product_category,
            });
            setValue("base_unit_id", {
              value: data?.base_unit_id,
              label: data?.base_unit_name,
            });
            setProductStatus(data?.product_type);
            setValue("product_type", data?.product_type);
            setIsSaved(true);
          }
        },
        onError: (error) => {
          console.error("Error fetching data:", error);
          toast.error("Failed to fetch recipe data");
        },
      }
    );
  };

  const handleFetchEntries = () => {
    fetchEntries(
      {
        headerData: { parent_product_id: headerId },
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
            record_id: item.record_id || "",
            product_id: item.child_id || "",
            product_name: item?.product_name || "",
            product_type: item.product_type || "",
            entry_base_unit: item.base_unit || "",
            unit_selected: item.unit_selected_id || "",
            unit_selected_label: item.unit_selected || "",
            qty: formatDecimalValue(item.qty) || "0",
          })) || [];

          // Batch update form values
          const updatedValues = {};
          data?.forEach((item, rowIndex) => {
            updatedValues[`product_name${rowIndex}`] = {
              label: item.product_name,
              value: item.child_id,
            };
            updatedValues[`qty${rowIndex}`] = formatDecimalValue(item.qty) || "0";
            updatedValues[`unit_selected${rowIndex}`] = {
              label: item.unit_selected,
              value: item.unit_selected_id,
            };
          });

          setApiData(formattedData);
          setRowsData(formattedData);
        },
        onError: (err) => {
          console.error("Failed to fetch entries:", err);
          toast.error("Failed to load recipe entries");
        },
      }
    );
  };

  const updateRowData = (rowIndex, fieldName, value, record) => {

    setRowsData((prevData) => {
      const newData = [...prevData];
      let targetRow = newData.find((item) => item.index === rowIndex);

      if (!targetRow) {
        targetRow = {
          index: rowIndex,
          record_id: "",
          product_id: "",
          product_type: "",
          entry_base_unit: "",
          unit_selected: "",
          unit_selected_label: "",
          qty: "0",
        };
        newData.push(targetRow);
      }

      setApiData((prevApiData) => {
        const newApiData = [...prevApiData];
        let apiRow = newApiData.find((item) => item.index === rowIndex);
        if (!apiRow) {
          newApiData.push({ ...targetRow });
          apiRow = newApiData.find((item) => item.index === rowIndex);
        }

        if (fieldName === "product_name") {
          if (newApiData && newApiData[rowIndex]) {
            newApiData[rowIndex].product_name = record?.product_name;
          }
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
                targetRow.product_id = product_id;
                targetRow.product_type = record?.product_type || "";
                targetRow.entry_base_unit = unitData?.[0]?.unit_description || "";
                targetRow.qty = "1";
                apiRow.product_id = product_id;
                apiRow.product_type = record?.product_type || "";
                apiRow.entry_base_unit = unitData?.[0]?.unit_description || "";
                apiRow.qty = "1";
              },
              onError: (err) => {
                console.error("Failed to fetch units:", err);
                toast.error("Failed to fetch unit data");
                targetRow.product_id = product_id;
                apiRow.product_id = product_id;
              },
            }
          );
        } else if (fieldName === "unit_selected") {

          targetRow.unit_selected = value.value;
          targetRow.unit_selected_label = value.label;
          apiRow.unit_selected = value.value;
        } else {
          targetRow[fieldName] = value;
          apiRow[fieldName] = value;
        }

        return newApiData;
      });

      return newData;
    });
  };

  const handleAddClick = () => {
    if (!productStatus) {
      toast.error("Please select a product type first");
      return;
    }
    if (!getValues("product_type")) {
      toast.error("Please select a product type before adding a row");
      return;
    }
    const rowIndex = apiData.length > 0 ? Math.max(...apiData.map((row) => row.index)) + 1 : 0;
    const newRow = {
      index: rowIndex,
      record_id: "",
      product_id: "",
      product_type: "",
      entry_base_unit: "",
      unit_selected: "",
      unit_selected_label: "",
      qty: "0",
    };
    setRowsData((prevData) => [...prevData, newRow]);
    setApiData((prevApiData) => [...prevApiData, newRow]);
  };

  const validateAllFields = async () => {
    await trigger();
    let isValid = true;
    apiData.forEach((row, index) => {

      if (!row?.product_id) {
        isValid = false;
      }
      if (!row?.unit_selected) {
        isValid = false;
      }
      if (!row?.qty|| row?.qty <= 0) {
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
    const product_category_id = getValues("product_category_id")?.value;
    const base_unit_id = getValues("base_unit_id")?.value;
    const product_type = productStatus;
    const company_to_dept_id = recipeCTD?.com_dept_id;

    if (!product_name || !product_category_id || !base_unit_id || !product_type) {
      toast.error("Please fill all required fields");
      return;
    }

    const finalArray = {
      header: {
        product_name,
        product_category_id,
        base_unit_id,
        product_type,
        ...(company_to_dept_id ? { company_to_dept_id } : {}),
        status: 1,
        created_by: UserId,
        ...(headerId ? { header_id: headerId } : {}),
      },
      entries: apiData.map((row) => ({
        record_id: row.record_id || "",
        product_id: row.product_id || "",
        qty: parseFloat(row.qty) || 0,
        unit_selected: row.unit_selected || "",
      })),
    };

    createRecipe(
      { dataInsert: finalArray },
      {
        onSuccess: (response) => {
          const data = response?.data?.[0];
          if (data?.msgType === "success") {
            setHeaderId(data?.headerId);
            handleFetchEntries();
            handleFetchData();
            setIsSaved(true);
            toast.success(data?.message);
          } else {
            toast.error(data?.message || "Failed to save recipe");
          }
        },
        onError: (err) => {
          console.error("Save error:", err);
          toast.error(err.response?.data?.message || "Failed to save recipe");
        },
      }
    );
  };

  const deleteEntry = (value, row) => {
    const rowIndex = row.index;
    const removeRowLocally = () => {
      setRowsData((prevData) => {
        const newRowsData = prevData.filter((item) => item.index !== rowIndex);
        return newRowsData.map((item, index) => ({
          ...item,
          index,
        }));
      });
      setApiData((prevApiData) => {
        const newApiData = prevApiData.filter((item) => item.index !== rowIndex);
        return newApiData.map((item, index) => ({
          ...item,
          index,
        }));
      });
    };

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
        if (row.record_id && row.record_id !== "") {
          deleteEntryMutate(
            {
              dataInsert: {
                record_id: row.record_id,
                created_by: UserId,
              },
            },
            {
              onSuccess: (res) => {
                if (res.success) {
                  removeRowLocally();
                  toast.success(res?.data?.[0]?.message || "Entry deleted successfully.")
                  // Swal.fire({
                  //   icon: "success",
                  //   title: "Success",
                  //   text: res?.data?.[0]?.message || "Entry deleted successfully.",
                  // });
                } else {
                  toast.error(res?.data?.[0]?.message || "Failed to delete entry.")
                  // Swal.fire({
                  //   icon: "error",
                  //   title: "Error",
                  //   text: res?.data?.[0]?.message || "Failed to delete entry.",
                  // });
                }
              },
              onError: (error) => {
                console.error("Delete error:", error);
                toast.error(error.response?.data?.message ||  "Something went wrong")
                // Swal.fire({
                //   icon: "error",
                //   title: "Error",
                //   text: error.response?.data?.message || "Something went wrong.",
                // });
              },
            }
          );
        } else {
          removeRowLocally();
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

  const renderCell = (value, row, columnKey) => {
    const rowIndex = row.index;
    const fieldName = `${columnKey}${rowIndex}`;
    const fieldValue = watch(fieldName);

    if (columnKey === "action") {
      return (
        <div className="d-flex justify-content-around">
          <button
            type="button"
            onClick={() => deleteEntry(value, row)}
            className="bg-customBlue w-7 h-7 rounded-md flex justify-center items-center text-white"
            aria-label={`Delete row ${rowIndex + 1}`}
          >
            <MdDelete />
          </button>
        </div>
      );
    }

    if (columnKey === "entry_base_unit" || columnKey === "product_type") {
      return <div>{value}</div>;
    }

    if (columnKey === "product_name") {
      return (
        <div>
          <AntSelectFieldTable
            control={control}
            name={`product_name${rowIndex}`}
            endpoint={recipeCTD ? API_ENDPOINTS.GET_PRODUCT_FOR_RECIPE_CREATION : API_ENDPOINTS.GET_PRODUCT_LIST}
            queryKey="pm.product_name"
            valueKey="record_id"
            labelKey="product_name"
            responseWhich="data"
            placeholder="Select Product"
            onSelectChange={(selected, selectedRecord) => updateRowData(rowIndex, "product_name", selected, selectedRecord)}
            ContcatenateLabel="product_type"
            baseFilters={productBaseFilters}
            rules={{ required: "Product is required" }}
            error={formSubmitted && errors?.[fieldName]?.message}
            defaultValue={{ value: row?.product_id, label: row?.product_name }}
          />
        </div>
      );
    }

    if (columnKey === "unit_selected_label") {
      return (
        <div>
          <AntSelectFieldTable
            control={control}
            name={`unit_selected${rowIndex}`}
            endpoint={API_ENDPOINTS.GET_PRODUCT_UNITS}
            queryKey="ump.description"
            valueKey="record_id"
            labelKey="unit_description"
            responseWhich="data"
            placeholder="Select Unit"
            headerData={{ product_id: rowsData[rowIndex]?.product_id }}
            baseFilters={[
              { key: "ump.description", operator: "contains", value1: "kg", logical: "OR" },
              { key: "ulp.size", operator: "contains", value1: "5", logical: "" },
            ]}
            sendFiltersWithSearchTerm={false}
            onSelectChange={(selected) => updateRowData(rowIndex, "unit_selected", selected)}
            disabled={!rowsData[rowIndex]?.product_id}
            rules={{ required: "Unit is required" }}
            error={formSubmitted && errors?.[fieldName]?.message}
            key={`unit-select-${rowIndex}`}
            defaultValue={{ value: row?.unit_selected, label: row?.unit_selected_label }}
          />
        </div>
      );
    }


    if (columnKey === "qty") {
      return (
        <div>
          <InputFieldTable
            control={control}
            name={fieldName}
            error={errors?.[fieldName]?.message}
            value={row[columnKey] || ""}
            onChange={(e) => updateRowData(rowIndex, columnKey, e.target.value)}
            type={"number" }
            useComma={true}
            defaultValue={row?.qty }
          />
        </div>
      );
    }

    return (
      <div>
        <InputFieldTable
          control={control}
          name={fieldName}
          register={register(fieldName)}
          // error={formSubmitted && errors?.[fieldName]?.message}
          value={fieldValue}
          onChange={(e) => updateRowData(rowIndex, columnKey, e.target.value)}
          maxDecimalLength={3}
        />
      </div>
    );
  };

  const columns = useMemo(
    () =>
      headers.map((header) => ({
        ...header,
        render: (value, row) => renderCell(value, row, header.key),
      })),
    [errors, watch, rowsData, formSubmitted]
  );

  if (isPending || isFetchingEntries) {
    return <Loader />;
  }

  return (
    <div>
      <div className="bg-white shadow-sm p-3 rounded-radiusRegular mt-2 my-3">
        <h1 className="text-size text-color font-headingweight text-center mb-2">
          {headerId ? "Update Batch & Recipe" : "Add Batch & Recipe"}
        </h1>
        <div className="text-end text-color">
          {recipeCTD ? `Company: ${recipeCTD?.company_name}` : null}
        </div>
        <div className="text-end text-color">
          {recipeCTD ? `Dept: ${recipeCTD?.dept_name}` : null}
        </div>
        <div className="">
          <div className="grid grid-cols-3 gap-x-2">
            <div>
              <InputField
                label="Product Name"
                control={control}
                register={register("product_name", { required: "Product name is required" })}
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
                  { key: "pc.parent_id", operator: "greater_than", value1: "0", logical: "" },
                ]}
                rules={{ required: "Category is required" }}
                error={errors.product_category_id?.message}
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
                disabled={!permissions?.recipeUnit && headerId}
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
                disabled={!permissions?.productType && headerId}
                rules={{ required: "Please select a product type" }}
                error={errors.product_type?.message}
                onSelectChange={(value) => {
                  setProductStatus(value || "recipe");
                }}
              />
            </div>
          </div>

          <div className="flex my-2 gap-3">
            <CustomButton type="button" btntext="Save" handleClick={HandleSave} />
            <CustomButton
              type="button"
              btntext="Add Row"
              handleClick={handleAddClick}
              disabled={!getValues("product_type")}
            />
          </div>
        </div>
      </div>

      <div>
        <ResizableTable
          data={rowsData}
          columns={columns}
          height="400px"
          scrollableId="recipe-entries"
          isSelect={false}
          enableScroll={false}
          isDense={true}
          customFilterFunction={customFilterFunction}
        />
      </div>
    </div>
  );
};

export default withPermissionCheck(DeptAddRecipe, "dept-add-recipe");