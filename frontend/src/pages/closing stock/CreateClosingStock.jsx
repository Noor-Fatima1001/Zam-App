import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import * as yup from "yup";
import * as XLSX from "xlsx";
import AntdSelectField from "../../AntdSelectField";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import InputField from "../../components/form-elements/InputField";
import { getFromLocalStorage, getFromSessionStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import Loader from "../../components/Loader";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import ResizableTable from "../../components/table/ResizableTable";
import AntdSelectFieldTable from "../../AntdSelectFieldTable";
import InputFieldTable from "../../components/form-elements/InputFieldTable";
import { MdDelete } from "react-icons/md";
import { toast } from "react-toastify";
import { filterAndSortData } from "../../utils/helper.function";
import AntSelectFieldTable from "../../AntSelectFieldTable";
import { FiAnchor } from "react-icons/fi";

// Yup schema for form validation
const schema = yup.object().shape({
  company_id: yup.string().required("Company is required"),
  stock_count_date: yup.string().required("Stock count date is required"),
  items: yup.array().of(
    yup.object().shape({
      us_qty: yup
        .string()
        .required("Quantity is required")
        .test("is-non-negative", "Quantity must be non-negative", (value) => parseFloat(value) >= 0),
    })
  ),
});

const CreateClosingStock = () => {
  const data = getFromSessionStorage("closing-stock-module-data");
  const createOrderData = getFromSessionStorage("DeptClosingStockData");
  const userHeaderData = data?.data;
  const [isCopy, setIsCopy] = useState(data?.iscopy);
  const [rowsData, setRowsData] = useState([]);
  const [apiData, setApiData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [headerId, setHeaderId] = useState(userHeaderData?.closing_stock_list_id);
  const [orderStatus, setOrderStatus] = useState(userHeaderData?.status || "save");
  const [companyDefaultValue, setCompanyDefaultValue] = useState(null);
  const UserId = getFromLocalStorage("UserId");
  const [isCopyHeader, setIsCopyHeader] = useState(isCopy);
  const [presfilters, setPresFilters] = useState();
  const [preservedConfig, setPreservedConfig] = useState();
  const { mutate: saveClosingStock, isPending: isCreating } = useGlobelApi(API_ENDPOINTS.SAVE_CLOSING_STOCK);
  const { mutate: fetchEntries, isPending: isFetchingEntries } = useGlobelApi(API_ENDPOINTS.CLOSING_STOCK_ENTRIES);
  const { mutate: fetchHeader } = useGlobelApi(API_ENDPOINTS.CLOSING_STOCK_HEADER);
  const { mutate: deleteEntryMutate } = useGlobelApi(API_ENDPOINTS.DELETE_CLOSING_STOCK_ENTRY);
  const { mutate: getUnitList } = useGlobelApi(API_ENDPOINTS.GET_PRODUCT_UNITS);

  const {
    register,
    control,
    formState: { errors },
    setValue,
    watch,
    handleSubmit,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      company_id: "",
      stock_count_date: "",
      items: [],
    },
  });

  // Utility for error handling
  const handleApiError = useCallback((error, defaultMessage) => {
    const message = error.response?.data?.message || defaultMessage;
    toast.error(message);
    console.error(defaultMessage, error);
  }, []);

  // Fetch header data
  const handleFetchHeaderData = useCallback(() => {
    if (!headerId || isCopy) return;
    setIsLoading(true);
    fetchHeader(
      {
        headerData: {
          user_id: createOrderData?.user_id,
          comp_to_dept_id: createOrderData?.com_dept_id,
        },
        filters: [{ key: "csl.id", operator: "equal", value1: headerId, logical: "" }],
        limit: 0,
        offset: 0,
      },
      {
        onSuccess: (res) => {
          const header = res?.data?.[0];
          if (header) {
            const companyValue = { label: header?.company_name, value: header.company_id };
            setValue("company_id", header.company_id, { shouldValidate: true });
            setValue("stock_count_date", header.stock_count_date, { shouldValidate: true });
            setCompanyDefaultValue(companyValue);
            setOrderStatus(header.status || "save");
          }
          setIsLoading(false);
        },
        onError: (error) => {
          handleApiError(error, "Failed to fetch header data");
          setIsLoading(false);
        },
      }
    );
  }, [headerId, isCopy, fetchHeader, createOrderData, handleApiError, setValue]);

  // Fetch entries data
  const handleFetchEntries = useCallback(() => {
    if (!headerId) return;
    setIsLoading(true);
    fetchEntries(
      {
        filters: [{ key: "cse.closing_stock_id", operator: "equal", value1: headerId, logical: "" }],
        limit: 0,
        offset: 0,
      },
      {
        onSuccess: (res) => {
          const entries = res?.data?.map((item, index) => ({
            index,
            record_id: !isCopyHeader ? item.record_id || "" : "",
            closing_stock_id: item.closing_stock_id || "",
            product_id: item.product_id || "",
            product_id_label: item.product_name || "",
            unit_selected: item.unit_selected || "",
            unit_selected_label: item.unit_selected_name || "",
            us_qty: parseFloat(item.us_qty || 0).toFixed(3),
            dept_code: item.dept_code || "",
            dept_code_label: item.dept_code || "",
            comp_to_dept_id: item.comp_to_dept_id || "",
            comp_to_location_id: item.comp_to_location_id || "",
            location_name_label: item.location_name || "",
            base_unit_id: item.base_unit_id || "",
            unit_base_name: item.unit_base_name || "",
            product_category: item.product_category || "",
            product_category_id: item.product_category_id || "",
          })) || [];
          setApiData(entries);
          setRowsData(entries);
          setIsLoading(false);
        },
        onError: (error) => {
          handleApiError(error, "Failed to fetch entries");
          setIsLoading(false);
        },
      }
    );
  }, [headerId, fetchEntries, handleApiError, isCopyHeader, setValue]);

  const exportToExcelEntries = async () => {
    const data = apiData;
    const formattedData = data.map(({...item }) => ({
      ...item,
    }));

    const limitedData = formattedData.slice(0, 1000);
    const worksheet = XLSX.utils.json_to_sheet(limitedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "closing-stock-entries.xlsx");
  };

  // Fetch initial data
  useEffect(() => {
    if (headerId) {
      setIsLoading(true);
      handleFetchHeaderData();
      handleFetchEntries();
    } else {
      const initialRow = {
        index: 0,
        record_id: "",
        closing_stock_id: "",
        product_id: "",
        product_id_label: "",
        unit_selected: "",
        unit_selected_label: "",
        us_qty: "0.000",
        dept_code: "",
        dept_code_label: "",
        comp_to_dept_id: "",
        comp_to_location_id: "",
        location_name_label: "",
        base_unit_id: "",
        unit_base_name: "",
        product_category: "",
        product_category_id: "",
      };
      setRowsData([initialRow]);
      setApiData([initialRow]);
    }
  }, [headerId, handleFetchHeaderData, handleFetchEntries, setValue]);

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

  // Calculate totals for display
  const calculateTotals = useCallback(() => {
    return rowsData.reduce(
      (acc, row) => {
        acc.us_qty += parseFloat(row?.us_qty || 0);
        return acc;
      },
      { us_qty: 0 }
    );
  }, [rowsData]);

  const totals = calculateTotals();

  // Update row data
  const updateRowData = useCallback((rowIndex, fieldName, value, record = {}) => {
    setRowsData((prevData) => {
      const newData = [...prevData];
      let targetRow = newData.find((item) => item.index === rowIndex);

      if (!targetRow) {
        targetRow = {
          index: rowIndex,
          record_id: "",
          closing_stock_id: "",
          product_id: "",
          product_id_label: "",
          unit_selected: "",
          unit_selected_label: "",
          us_qty: "0.00",
          dept_code: "",
          dept_code_label: "",
          comp_to_dept_id: "",
          comp_to_location_id: "",
          location_name_label: "",
          base_unit_id: "",
          unit_base_name: "",
          product_category: "",
          product_category_id: "",
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

        const fieldUpdates = {
          dept_code_label: () => ({
            comp_to_dept_id: record?.com_dept_id || "",
            dept_code: value.value,
            dept_code_label: value.label,
          }),
          location_name_label: () => ({
            comp_to_location_id: value.value,
            location_name_label: value.label,
          }),
          product_id_label: () => ({
            product_id: value.value,
            product_id_label: value.label,
            product_category: record?.product_category || "",
            product_category_id: record?.product_category_id || "",
          }),
          unit_selected_label: () => ({
            unit_selected: value.value,
            unit_selected_label: value.label,
          }),
          us_qty: () => ({
            us_qty: value,
          }),
        };

        const updates = fieldUpdates[fieldName]?.() || { [fieldName]: value };
        Object.assign(targetRow, updates);
        Object.assign(apiRow, updates);

        setValue(`items.${rowIndex}`, { ...targetRow }, { shouldValidate: false });

        if (fieldName === "product_id_label" && value.value) {
          getUnitList(
            {
              headerData: { product_id: value.value, search_term: "" },
              filters: null,
              limit: 0,
              offset: 0,
              orderby: "",
            },
            {
              onSuccess: (response) => {
                const unit_data = response?.data?.[0];
                if (unit_data) {
                  const unitUpdates = {
                    unit_selected: unit_data.record_id,
                    unit_selected_label: unit_data.unit_description,
                  };
                  Object.assign(targetRow, unitUpdates);
                  Object.assign(apiRow, unitUpdates);
                  setValue(`items.${rowIndex}`, { ...targetRow }, { shouldValidate: false });
                }
              },
              onError: (error) => handleApiError(error, "Failed to fetch units"),
            }
          );
        }

        return newApiData;
      });

      return newData;
    });
  }, [setValue, getUnitList, handleApiError]);

  // Add a new row
  const handleAddClick = useCallback(() => {
    const rowIndex = apiData.length > 0 ? Math.max(...apiData.map(row => row.index)) + 1 : 0;
    const newRow = {
      index: rowIndex,
      isEditable: true,
      record_id: "",
      closing_stock_id: "",
      product_id: "",
      product_id_label: "",
      unit_selected: "",
      unit_selected_label: "",
      us_qty: "0.000",
      dept_code: "",
      dept_code_label: "",
      comp_to_dept_id: "",
      comp_to_location_id: "",
      location_name_label: "",
      base_unit_id: "",
      unit_base_name: "",
      product_category: "",
      product_category_id: "",
    };
    setRowsData((prev) => {
      const newRowsData = [...prev, newRow];
      return newRowsData;
    });
    setApiData((prev) => [...prev, newRow]);
  }, [apiData, setValue]);

  // Delete a row
  const deleteEntry = useCallback((value, row) => {
    const rowIndex = row.index;

    const removeRowLocally = () => {
      setRowsData((prevData) => {
        const newRowsData = prevData.filter((item) => item.index !== rowIndex);
        const reindexedData = newRowsData.map((item, index) => ({ ...item, index }));
        return reindexedData;
      });
      setApiData((prevApiData) => {
        const newApiData = prevApiData.filter((item) => item.index !== rowIndex);
        return newApiData.map((item, index) => ({ ...item, index }));
      });
    };

    if (apiData.length <= 1) {
      toast.error("You cannot delete the last record!");
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#1E3A8A",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        if (isCopyHeader || !row.record_id) {
          removeRowLocally();
          toast.success("Entry deleted successfully.");
        } else {
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
                  toast.success(res?.data?.[0]?.message || "Entry deleted successfully.");
                } else {
                  toast.error(res?.data?.[0]?.message || "Failed to delete entry.");
                }
              },
              onError: (error) => handleApiError(error, "Failed to delete entry"),
            }
          );
        }
      }
    });
  }, [apiData, isCopyHeader, UserId, deleteEntryMutate, handleApiError, setValue]);

  // Validate all form fields
const validateAllFields = useCallback(async (apiData) => {
    // Trigger Yup schema validation
      
    const isSchemaValid = await trigger();
    const  items  = apiData;
    // Check items array
    if (!items || items.length === 0) {
      toast.error("At least one item is required");
      return false;
    }

    // Validate each item in the items array
    let isItemsValid = true;
    items.forEach((item, index) => {
      if (!item.product_id) {
        toast.error(`Product is required for row ${index + 1}`);
        isItemsValid = false;
      }
      if (!item.unit_selected) {
        toast.error(`Unit is required for row ${index + 1}`);
        isItemsValid = false;
      }
      if (!item.us_qty || parseFloat(item.us_qty) < 0) {
        toast.error(`Valid quantity is required for row ${index + 1}`);
        isItemsValid = false;
      }
    });

    // Return true only if both schema and custom checks pass
    return isSchemaValid && isItemsValid;
  }, [trigger, watch]);

  // Handle form submission
  const onSubmit = useCallback(async (data) => {
    
    const isFormValid = await validateAllFields(apiData);
    if (!isFormValid) {
      toast.error("Please fix all validation errors before saving");
      return;
    }

    setIsLoading(true);
    const payload = {
      dataInsert: {
        header: {
          company_id: data.company_id,
          stock_count_date: moment(data.stock_count_date).format("YYYY-MM-DD"),
          status: orderStatus,
          created_by: UserId,
          ...(headerId && !isCopyHeader ? { header_id: headerId } : {}),
        },
        entries: apiData.map((row) => ({
          record_id: row.record_id || "",
          comp_to_dept_id: row.comp_to_dept_id || createOrderData?.com_dept_id || "",
          comp_to_location_id: row.comp_to_location_id || "",
          product_id: row.product_id || "",
          unit_selected: row.unit_selected || "",
          us_qty: parseFloat(row.us_qty || 0).toFixed(3),
        })),
      },
    };

    saveClosingStock(payload, {
      onSuccess: (response) => {
        if (response?.emailStatus === "Order not sent") {
          toast.error(`Email Status: ${response?.emailStatus}`);
        }
        if (response?.emailStatus === "Email sent successfully") {
          toast.success(`Email Status: ${response?.emailStatus}`);
        }
        if (response.data?.[0]?.msgType !== "error") {
          const newHeaderId = response?.data?.[0]?.headerId;
          setHeaderId(newHeaderId);
          setIsCopy(false);
          setIsCopyHeader(false);
          handleFetchHeaderData();
          handleFetchEntries();
          toast.success(response.data?.[0]?.message || "Closing stock saved successfully");
        } else {
          toast.error(response.data?.[0]?.message || "Failed to save closing stock");
        }
        setIsLoading(false);
      },
      onError: (error) => {
        handleApiError(error, "Failed to save closing stock");
        setIsLoading(false);
      },
    });
  }, [orderStatus, UserId, headerId, isCopyHeader, handleFetchHeaderData, handleFetchEntries, apiData, createOrderData, handleApiError, saveClosingStock]);

  // Confirm before printing
  const confirmPrint = useCallback(() => {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "Make sure to save stock before printing; only saved stock will be printed",
      cancelButtonText: "Cancel",
      cancelButtonColor: "#d33",
      showCancelButton: true,
      confirmButtonText: "Continue",
      confirmButtonColor: "#1E3A8A",
    }).then((result) => {
      if (result.isConfirmed) {
        printClosingStock();
      }
    });
  }, []);

  // Generate and print stock report
  const printClosingStock = useCallback(async () => {
    const companyId = watch("company_id");
    if (!companyId || !headerId) {
      toast.error("Company or Header ID is missing.");
      return;
    }

    let itemsData = [];
    await new Promise((resolve, reject) => {
      fetchEntries(
        {
          filters: [{ key: "cse.closing_stock_id", operator: "equal", value1: headerId, logical: "" }],
          limit: 0,
          offset: 0,
        },
        {
          onSuccess: (res) => {
            const fetchedEntries = res?.data?.slice(0, -1) || [];
            itemsData = fetchedEntries.map((item) => ({
              record_id: item.record_id || "",
              product_id: item.product_id || "",
              product_id_label: item.product_name || "",
              unit_selected: item.unit_selected || "",
              unit_selected_label: item.unit_selected_label || "",
              us_qty: parseFloat(item.us_qty || 0).toFixed(3),
              dept_code: item.dept_code || "",
              dept_code_label: item?.dept_code_label || item.dept_code || "",
              location_name: item.location_name || "",
            }));
            resolve();
          },
          onError: (error) => {
            handleApiError(error, "Failed to fetch entries for printing");
            reject(error);
          },
        }
      );
    });

    if (!itemsData.length) {
      toast.error("No items available to print");
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Closing Stock Report</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media print {
      @page {
        size: A4;
        margin: 1cm;
      }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      line-height: 1.6;
      font-size: 12px;
    }
    p {
      margin-block-start: 0.2rem;
      margin-block-end: 0.2rem;
    }
    h2 {
      text-align: center;
      margin-bottom: 15px;
    }
    h3 {
      margin-top: 10px;
      margin-bottom: 5px;
    }
    .container {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .box-company {
      width: 48%;
      display: flex;
      flex-direction: column;
      align-items: end;
    }
    .box-details {
      width: 48%;
      border-radius: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 6px;
      text-align: left;
      font-size: 11px;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .total-section {
      margin-top: 15px;
      padding: 10px;
      border-top: 2px solid #000;
      text-align: right;
    }
    .note {
      margin-top: 20px;
      font-style: italic;
      text-align: center;
      color: #666;
    }
    .stock-info {
      margin-bottom: 15px;
    }
  </style>
</head>
<body>
  <h2>Closing Stock Report</h2>
  <div class="stock-info">
    <p><strong>Stock Count Date:</strong> ${moment(watch("stock_count_date")).format("DD/MM/YYYY")}</p>
    <p><strong>Stock ID:</strong> ${headerId || "N/A"}</p>
  </div>
  <div class="container">
    <div class="box-details">
      <h3>Details</h3>
      <p><strong>Company Name:</strong> ${createOrderData?.company_name || "N/A"}</p>
      <p><strong>Department:</strong> ${createOrderData?.dept_name || "N/A"}</p>
    </div>
    <div class="box-company">
      <h3>Company Details</h3>
      <p><strong>Company Code:</strong> ${createOrderData?.company_code || "N/A"}</p>
    </div>
  </div>
  <h3>Stock Items</h3>
  <table>
    <thead>
      <tr>
        <th>Department</th>
        <th>Location</th>
        <th>Product</th>
        <th>Unit</th>
        <th>Quantity (US)</th>
      </tr>
    </thead>
    <tbody>
      ${itemsData
        .map(
          (item) => `
        <tr>
          <td>${item.dept_code_label || "N/A"}</td>
          <td>${item.location_name || "N/A"}</td>
          <td>${item.product_id_label || "N/A"}</td>
          <td>${item.unit_selected_label || "N/A"}</td>
          <td>${Number(item.us_qty).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>
  <div class="total-section">
    <p><strong>Total US Quantity:</strong> ${totals.us_qty}</p>
  </div>
  <p class="note">This is an electronically generated report, no signature required.</p>
</body>
</html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          console.log("Closing stock report ready to print");
        } catch (e) {
          console.error("Auto-print failed:", e);
          toast.error("Please use the Print button in the document");
        } finally {
          document.body.removeChild(iframe);
        }
      }, 1000);
    };
  }, [watch, headerId, createOrderData, fetchEntries, handleApiError, totals]);

  // Handle print action
  const handleActionClick = useCallback(() => {
    confirmPrint();
  }, [confirmPrint]);

  // Table headers
  const headers = [
    { key: "action", label: "Action", width: 100, sortable: true, filterable: true },
    { key: "dept_code_label", label: "Dept Name", width: 200, sortable: true, filterable: true },
    { key: "location_name_label", label: "Location Name", width: 200, sortable: true, filterable: true },
    { key: "product_id_label", label: "Product Name", width: 200, sortable: true, filterable: true },
    { key: "product_category", label: "Product Category", width: 250, sortable: true, filterable: true },
    { key: "unit_selected_label", label: "Unit Selected", width: 150, sortable: true, filterable: true },
    { key: "us_qty", label: "US Qty", width: 150, sortable: true, filterable: true },
  ];

  // Render table cells
  const renderCell = useCallback((value, row, columnKey) => {
    const rowIndex = row.index;
    const fieldName = `items.${rowIndex}.${columnKey === "dept_code_label" ? "dept_code" : columnKey === "location_name_label" ? "location_name" : columnKey === "product_id_label" ? "product_id" : columnKey === "unit_selected_label" ? "unit_selected" : columnKey}`;

    if (columnKey === "action") {
      return (
        <div className="d-flex justify-content-around">
          <button
            type="button"
            onClick={() => deleteEntry(value, row)}
            className="bg-primary w-7 h-7 rounded-md flex justify-center items-center text-white hover:bg-secondary"
            aria-label={`Delete row ${rowIndex + 1}`}
          >
            <MdDelete />
          </button>
        </div>
      );
    }
    if (columnKey === "dept_code_label" && row?.isEditable) {
      return (
        <div>
          <AntSelectFieldTable
            control={control}
            name={fieldName}
            endpoint={API_ENDPOINTS.USER_TO_DEPARTMENT}
            queryKey="dept_name"
            valueKey="com_dept_id"
            labelKey="dept_code"
            responseWhich="result"
            ContcatenateLabel="dept_name"
            rules={{ required: "Department is required" }}
            onSelectChange={(selected, selectedRecord) => updateRowData(rowIndex, "dept_code_label", selected, selectedRecord)}
            baseFilters={[
              { key: "adu.user_id", operator: "equal", value1: UserId, logical: "" },
              { key: "adu.status", operator: "equal", value1: "1", logical: "" },
              { key: "c.id", operator: "equal", value1: companyDefaultValue?.value, logical: "" },
            ]}
            defaultValue={row?.dept_code_label ? { value: row?.comp_to_dept_id, label: row?.dept_code_label } : null}
          />
          {errors?.items?.[rowIndex]?.dept_code && (
            <div className="text-red-500 text-xs">{errors.items[rowIndex].dept_code.message}</div>
          )}
        </div>
      );
    }

    if (columnKey === "location_name_label" && row?.isEditable) {
      return (
        <div>
          <AntSelectFieldTable
            control={control}
            name={fieldName}
            endpoint={API_ENDPOINTS.ASSIGN_LOCATION_LIST}
            queryKey="sl.location_name"
            valueKey="record_id"
            labelKey="location_name"
            responseWhich="data"
            placeholder="Select Location"
            baseFilters={[
              { key: "altcd.comp_dept_id", operator: "equal", value1: row?.comp_to_dept_id, logical: "" },
            ]}
            onSelectChange={(selected) => updateRowData(rowIndex, "location_name_label", selected)}
            defaultValue={row.location_name_label ? { value: row.comp_to_location_id, label: row.location_name_label } : null}
          />
          {errors?.items?.[rowIndex]?.location_name && (
            <div className="text-red-500 text-xs">{errors.items[rowIndex].location_name.message}</div>
          )}
        </div>
      );
    }

    if (columnKey === "product_id_label" && row?.isEditable) {
      return (
        <div>
          <AntSelectFieldTable
            control={control}
            name={fieldName}
            endpoint={API_ENDPOINTS.GET_PRODUCT_FOR_RECIPE_CREATION}
            queryKey="pm.product_name"
            valueKey="record_id"
            labelKey="product_name"
            ContcatenateLabel="product_type"
            responseWhich="data"
            placeholder="Select Product"
            onSelectChange={(selected, selectedRecord) => updateRowData(rowIndex, "product_id_label", selected, selectedRecord)}
            headerData={{ user_id: UserId, comp_to_dept_id: row?.comp_to_dept_id }}
            baseFilters={[
              {
                key: "aptcd.comp_dept_id",
                operator: "equal",
                value1: row?.comp_to_dept_id,
                logical: ""
              },
              { key: "aptcd.status", operator: "equal", value1: "1", logical: "" },
              { key: "pm.status", operator: "equal", value1: "1", logical: "" },
              { key: "pm.product_type", operator: "in", value1: "raw,batch", logical: "" },
            ]}
            defaultValue={row.product_id ? { value: row.product_id, label: row.product_id_label } : null}
          />
          {errors?.items?.[rowIndex]?.product_id && (
            <div className="text-red-500 text-xs mt-1">{errors.items[rowIndex].product_id.message}</div>
          )}
        </div>
      );
    }

    if (columnKey === "unit_selected_label") {
      return (
        <div>
          <AntSelectFieldTable
            control={control}
            name={fieldName}
            endpoint={API_ENDPOINTS.GET_PRODUCT_UNITS}
            queryKey="ump.description"
            valueKey="record_id"
            labelKey="unit_description"
            responseWhich="data"
            placeholder="Select Unit"
            onSelectChange={(selected) => updateRowData(rowIndex, "unit_selected_label", selected)}
            disabled={!row.product_id}
            sendFiltersWithSearchTerm={false}
            headerData={{ product_id: row.product_id, search_term: "" }}
            baseFilters={[]}
            defaultValue={row.unit_selected ? { value: row.unit_selected, label: row.unit_selected_label } : null}
          />
          {errors?.items?.[rowIndex]?.unit_selected && (
            <div className="text-red-500 text-xs">{errors.items[rowIndex].unit_selected.message}</div>
          )}
        </div>
      );
    }
    if (columnKey === "us_qty") {
      return (
        <div>
          <InputFieldTable
            control={control}
            name={fieldName}
            register={register(fieldName)}
            maxDecimalLength={3}
            useComma={true}
            error={errors?.items?.[rowIndex]?.us_qty?.message}
            value={row.us_qty}
            onChange={(e) => updateRowData(rowIndex, "us_qty", e.target.value)}
            type="number"
          />
        </div>
      );
    }

    if (columnKey === "product_category") {
      return <span>{row.product_category || "N/A"}</span>;
    }

    return (
      <span>
        {value}
      </span>
    );
  }, [control, errors, register, updateRowData, UserId, companyDefaultValue]);

  const breadcrumbItems = [
    { title: "Closing Stock", link: "closing-stock-list" },
    { title: "Create Closing Stock" },
  ];

  // Memoize table columns
  const columns = useMemo(
    () =>
      headers.map((header) => ({
        ...header,
        render: (value, row, record) => renderCell(value, row, header.key, record),
      })),
    [renderCell]
  );

  return (
    <div>
      {isCreating || isLoading ? (
        <Loader />
      ) : (
        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
          <CustomBreadcrumb items={breadcrumbItems} />
          <div className="bg-background shadow-sm p-3 rounded-radiusRegular mt-2">
            <h2 className="text-size text-color font-headingweight text-center mb-2">Closing Stock</h2>
            {userHeaderData && (
              <div className="flex gap-1 items-center justify-content-end">
                <p className="text-color font-regularweight">Status:</p>
                <span className="capitalize text-color">{orderStatus}</span>
              </div>
            )}
            {userHeaderData && (
              <div className="flex gap-1 items-center justify-content-end">
                <p className="text-color font-regularweight">Data Copied from user:</p>
                <span className="text-color">{data?.data?.first_name} {data?.data?.last_name}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-2">
              <AntdSelectField
                label="Company"
                control={control}
                name="company_id"
                endpoint={API_ENDPOINTS.USER_TO_DEPARTMENT}
                queryKey="company_name"
                valueKey="company_id"
                labelKey="company_name"
                responseWhich="result"
                ConcatenateLabel="dept_name"
                disable={true}
                rules={{ required: "Company is required" }}
                baseFilters={[
                  { key: "adu.user_id", operator: "equal", value1: UserId, logical: "" },
                  { key: "adu.status", operator: "equal", value1: "1", logical: "" },
                ]}
                defaultValue={companyDefaultValue}
                error={errors.company_id?.message}
              />
              <InputField
                label="Stock Count Date"
                control={control}
                type="date"
                field_disable={true}
                register="stock_count_date"
                rules={{ required: "Stock count date is required" }}
                error={errors.stock_count_date?.message}
              />
            </div>
            <div className="flex gap-1 items-center my-2">
              <CustomButton
                type="button"
                btntext="Add Row"
                handleClick={handleAddClick}
                className="bg-primary hover:bg-secondary text-white"
              />
              <CustomButton
                type="submit"
                btntext="Save"
                handleClick={() => setOrderStatus("save")}
                className="bg-primary hover:bg-secondary text-white"
              />
              <GenericActionBar
                text="Print"
                field_disable={!headerId}
                onActionClick={handleActionClick}
                action={["Print Stock Report"]}
              />
            </div>
          </div>
          <div className="my-3">
            <h2 className="mb-1 text-size text-color font-headingweight">Entries</h2>
            {errors.items && !Array.isArray(errors.items) && (
              <div className="text-red-500 text-xs mb-2">{errors.items.message}</div>
            )}
            <div className="shrink-0 whitespace-nowrap overflow-x-auto w-full bg-card">
              {
                isFetchingEntries ?
                  <Loader />
                  :
                  <div>
                    <CustomButton
                      btntext={"Export to Excel"}
                      icon={<FiAnchor />}
                      handleClick={exportToExcelEntries}
                      addclass="gap-1"
                    />
                    <ResizableTable
                      data={rowsData}
                      columns={columns}
                      height="400px"
                      scrollableId="closing-stock-entries"
                      isDense={true}
                      isSelect={false}
                      enableScroll={false}
                      customFilterFunction={customFilterFunction}
                    />
                  </div>
              }
            </div>
          </div>
          <div className="flex justify-end pr-4">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <div className="font-medium">
                Total US Quantity: <span>{Number(totals.us_qty).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</span>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default withPermissionCheck(CreateClosingStock, "create-closing-stock");