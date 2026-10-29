import moment from "moment";
import React, { useEffect, useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
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
import AntdSelectFieldTable from "../../AntSelectFieldTable";
import InputFieldTable from "../../components/form-elements/InputFieldTable";
import { MdDelete } from "react-icons/md";
import {toast} from "react-toastify";
import { filterAndSortData, formatDecimalValue } from "../../utils/helper.function";

const CreatePurchaseOrder = () => {
  const data = getFromSessionStorage("purchase-order-module-data");
  const createOrderData = getFromSessionStorage("createOrderData");
  const userHeaderData = data?.data;

  const [isCopy, setIsCopy] = useState(data?.iscopy);
  const [rowsData, setRowsData] = useState([]);
  const [apiData, setApiData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [headerId, setHeaderId] = useState(userHeaderData?.record_id);
  const [orderStatus, setOrderStatus] = useState(userHeaderData?.status || "save");
  const navigate = useNavigate();
  const UserId = getFromLocalStorage("UserId");
  const [supplier, setSupplier] = useState({
    label: undefined,
    value: undefined,
  });
  const [presfilters, setPresFilters] = useState();
  const [preservedConfig, setPreservedConfig] = useState();
  const [formErrors, setFormErrors] = useState({});

  const { mutate: createOrder, isPending: isCreating } = useGlobelApi(API_ENDPOINTS.ADD_PURCHASE_ORDER);
  const { mutate: fetchEntries, isPending: isFetchingEntries } = useGlobelApi(API_ENDPOINTS.GET_PURCHASE_ORDER_LIST_ENTRIES);
  const { mutate } = useGlobelApi(API_ENDPOINTS.GET_PURCHASE_ORDER_LIST_ENTRIES);
  const { mutate: fetchHeader } = useGlobelApi(API_ENDPOINTS.GET_PURCHASE_ORDER_LIST);
  const { mutate: deleteEntryMutate } = useGlobelApi(API_ENDPOINTS.DELETE_OREDER_LIST_ENTRY);
  const { mutate: taxOption, data: taxOptionData } = useGlobelApi(API_ENDPOINTS.TAX_LIST);
  const { mutate: getUnitList, } = useGlobelApi(API_ENDPOINTS.GET_PRODUCT_UNITS);
  const { mutate: getSupplier } = useGlobelApi(API_ENDPOINTS.GET_SUPPLIER);
  const { mutate: getConversionQty } = useGlobelApi(API_ENDPOINTS.GET_CONVERSION_QTY_PRICE);

  const {
    register,
    control,
    formState: { errors },
    setValue,
    getValues,
    watch,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      supplier_name: "",
      delivery_date: "",
      items: [],
    },
    mode: "onChange",
  });

  const [selectedIds, setSelectedIds] = useState([1]);
  const [isCopyHeader, setIsCopyHeader] = useState(isCopy);

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
    taxOption({ filters: null, limit: 0, offset: 0 });
  }, []);

  useEffect(() => {
    if (userHeaderData) {
      setHeaderId(userHeaderData?.record_id);
    }
  }, [userHeaderData]);

  const handleFetchHeaderData = () => {
    if (!headerId || isCopy) return;
    setIsLoading(true);
    fetchHeader(
      {
        headerData: {
          user_id: createOrderData?.user_id,
          comp_to_dept_id: createOrderData?.com_dept_id,
        },
        filters: [{ key: "poh.id", operator: "equal", value1: headerId, logical: "" }],
        limit: 0,
        offset: 0,
      },
      {
        onSuccess: (res) => {
          const header = res?.data?.[0];
          if (header) {
            setValue("supplier_name", header.supplier_id);
            setSupplier({ value: header.supplier_id, label: header.supplier_name });
            setValue("delivery_date", header.delivery_date);
            setOrderStatus(header.status);
          }
          setIsLoading(false);
        },
        onError: (error) => {
          console.error("Error fetching header:", error);
          toast.error("Failed to fetch header data");
          setIsLoading(false);
        },
      }
    );
  };

  const handleFetchEntries = () => {
    if (!headerId) return;
    setIsLoading(true);
    fetchEntries(
      {
        headerData: { purchase_order_id: headerId },
        filters: null,
        limit: 0,
        offset: 0,
      },
      {
        onSuccess: (res) => {
           const entries = res?.data?.slice(0, -1)?.map((item, index) => ({
            index,
            record_id: item.record_id || "",
            product_id: item.product_id,
            product_label: item.product_name,
            unit_selected: item.unit_selected,
            unit_selected_label: item.unit_description,
            qty: parseFloat(item.qty).toFixed(3),
            price: parseFloat(item.price).toFixed(3),
            tax_id: item.tax_id,
            tax_name: taxOptionData?.data?.find((tax) => tax.record_id == item.tax_id)?.tax_name,
            tax_amount: parseFloat(item.tax_amount).toFixed(3),
            net_price: (parseFloat(item.qty) * parseFloat(item.price)).toFixed(3),
            total_amount: parseFloat(item?.qty * item?.price +  item?.tax_amount).toFixed(3),
            comments: item.comments,
          })) || [];
          setRowsData(entries);
          setApiData(entries);
          setValue("items", entries);
          setIsLoading(false);
        },
        onError: (error) => {
          console.error("Error fetching entries:", error);
          toast.error("Failed to fetch entries");
          setIsLoading(false);
        },
      }
    );
  };

  useEffect(() => {
    if (headerId && taxOptionData) {
      setIsLoading(true);
      handleFetchHeaderData();
      handleFetchEntries();
    } else {
      setRowsData([]);
      setApiData([]);
      setValue("items", []);
    }
  }, [headerId]);

  const calculateTotals = () => {
    const totals = apiData.reduce(
      (acc, row) => {
        acc.net_price += parseFloat(row.net_price || 0);
        acc.tax_amount += parseFloat(row.tax_amount || 0);
        acc.total_amount += parseFloat(row.total_amount || 0);
        return acc;
      },
      { net_price: 0, tax_amount: 0, total_amount: 0 }
    );
    return {
      net_price: formatDecimalValue(totals.net_price) || "0.000",
      tax_amount: formatDecimalValue(totals.tax_amount) || "0.000",
      total_amount: formatDecimalValue(totals.total_amount) || "0.000",
    };
  };


  const updateRowData = (rowIndex, fieldName, value, record) => {
    const prevUnitId = apiData[rowIndex]?.unit_selected;
    setRowsData((prevData) => {
      const newData = [...prevData];
      let targetRow = newData.find((item) => item.index === rowIndex);

      if (!targetRow) {
        targetRow = {
          index: rowIndex,
          record_id: "",
          product_id: "",
          product_label: "",
          unit_selected: "",
          unit_selected_label: "",
          qty: "1.000",
          price: "0.000",
          tax_id: "",
          tax_name: "",
          net_price: "0.000",
          tax_amount: "0.000",
          total_amount: "0.000",
          comments: "",
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

        if (fieldName === "product_label" || fieldName === "unit_selected_label" || fieldName === "tax_name") {
          if (fieldName === "product_label") {
            targetRow["product_id"] = value.value;
            apiRow["product_id"] = value.value;
            targetRow[fieldName] = value.label;
            apiRow[fieldName] = value.label;
          }
          if (fieldName === "unit_selected_label") {
            targetRow["unit_selected"] = value.value;
            apiRow["unit_selected"] = value.value;
            targetRow[fieldName] = value.label;
            apiRow[fieldName] = value.label;
          }
          if (fieldName === "tax_name") {
            targetRow["tax_id"] = value.value;
            apiRow["tax_id"] = value.value;
            targetRow[fieldName] = value.label;
            apiRow[fieldName] = value.label;
          }
        } else {
          const formattedValue = fieldName === "qty" || fieldName === "price" ? (value) : value;
          targetRow[fieldName] = formattedValue;
          apiRow[fieldName] = formattedValue;
        }

        const qty = parseFloat(targetRow.qty) || 0;
        let price = parseFloat(targetRow.price) || 0;
        const taxId = targetRow.tax_id || "";

        if (fieldName === "product_label" && value.value && price === 0 && record) {
          price = parseFloat(record.average_price || 0);
          targetRow.price = formatDecimalValue(record.average_price);
          apiRow.price = targetRow.price;
        }

        const netPrice = qty * price;
        const taxOption = taxOptionData?.data?.find((tax) => tax.record_id == taxId);
        const taxValue = taxOption ? parseFloat(taxOption.tax_value) || 0 : 0;
        const taxAmount = netPrice * taxValue;
        const totalAmount = netPrice + taxAmount;

        targetRow.net_price = formatDecimalValue(netPrice);
        targetRow.tax_amount = formatDecimalValue(taxAmount);
        targetRow.total_amount = formatDecimalValue(totalAmount);
        apiRow.net_price = targetRow.net_price;
        apiRow.tax_amount = targetRow.tax_amount;
        apiRow.total_amount = targetRow.total_amount;

        if (fieldName === "product_label" && value.value && !createOrderData?.withoutOrder) {
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
                  targetRow.unit_selected = unit_data.record_id;
                  targetRow.unit_selected_label = unit_data.unit_description;
                  apiRow.unit_selected = unit_data.record_id;
                  apiRow.unit_selected_label = unit_data.unit_description;
                }
              },
              onError: (error) => {
                console.error("Error fetching units:", error);
              },
            }
          );
        } else if (fieldName === "unit_selected_label" && value.value && !createOrderData?.withoutOrder) {
          if (prevUnitId !== value.value) {
            getConversionQty(
              {
                dataInsert: {
                  unit_from: prevUnitId || value.value,
                  unit_to: value.value,
                  unit_from_price: price,
                  unit_from_qty: qty,
                },
              },
              {
                onSuccess: (response) => {
                  const data = response?.data?.[0];
                  if (data) {
                    const convertedPrice = formatDecimalValue(data?.converted_price);
                    const convertedQty = formatDecimalValue(data?.converted_qty);
                    targetRow.price = convertedPrice;
                    targetRow.qty = convertedQty;
                    apiRow.price = convertedPrice;
                    apiRow.qty = convertedQty;

                    const newNetPrice = parseFloat(convertedQty) * parseFloat(convertedPrice);
                    const newTaxAmount = newNetPrice * taxValue;
                    targetRow.net_price = formatDecimalValue(newNetPrice);
                    targetRow.tax_amount = formatDecimalValue(newTaxAmount);
                    targetRow.total_amount = formatDecimalValue(newNetPrice + newTaxAmount);
                    apiRow.net_price = targetRow.net_price;
                    apiRow.tax_amount = targetRow.tax_amount;
                    apiRow.total_amount = targetRow.total_amount;
                  }
                },
                onError: (error) => {
                  console.error("Error fetching conversion:", error);
                },
              }
            );
          }
        }
        setValue("items", newApiData);
        return newApiData;
      });
      return newData;
    });
  };

  const handleAddClick = () => {
    const rowIndex = apiData.length > 0 ? Math.max(...apiData.map((row) => row.index)) + 1 : 0;
    const newRow = {
      index: rowIndex,
      record_id: "",
      product_id: "",
      product_label: "",
      unit_selected: "",
      unit_selected_label: "",
      qty: "1.000",
      price: "0.000",
      tax_id: "",
      tax_name: "",
      net_price: "0.000",
      tax_amount: "0.000",
      total_amount: "0.000",
      comments: "",
    };
    setRowsData((prevData) => [...prevData, newRow]);
    setApiData((prevApiData) => [...prevApiData, newRow]);
    setValue("items", [...apiData, newRow]);
  };

  const deleteEntry = (value, row) => {
    const rowIndex = row.index;

    const removeRowLocally = () => {
      setRowsData((prevData) => {
        const newRowsData = prevData.filter((item) => item.index !== rowIndex);
        return newRowsData.map((item, index) => ({ ...item, index }));
      });
      setApiData((prevApiData) => {
        const newApiData = prevApiData.filter((item) => item.index !== rowIndex);
        return newApiData.map((item, index) => ({ ...item, index }));
      });
      setValue("items", apiData.filter((item) => item.index !== rowIndex));
    };

    if (apiData.length <= 1) {
      toast.error("You aren't allowed to delete the last record!");
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
              onError: (error) => {
                toast.error(error.response?.data?.message || "Something went wrong.");
              },
            }
          );
        }
      }
    });
  };

  const validateFormData = (data, apiData) => {
    const errors = {};
    if (!data.supplier_name) {
      errors.supplier_name = "Supplier is required";
    }
    if (!data.delivery_date) {
      errors.delivery_date = "Delivery date is required";
    }
    if (!apiData || apiData.length === 0) {
      errors.items = "At least one item is required";
    } else {
      const itemErrors = apiData.map((row, index) => {
        const rowErrors = {};
        if (!createOrderData?.withoutOrder && !row.product_id) {
          rowErrors.product_id = "Product is required";
        }
        if (!createOrderData?.withoutOrder && !row.unit_selected) {
          rowErrors.unit_selected = "Unit selection is required";
        }
        if (!row.tax_id) {
          rowErrors.tax_id = "Tax is required";
        }
        if (!row.qty || parseFloat(row.qty) <= 0) {
          rowErrors.qty = "Quantity must be a positive number";
        }
        if (!row.price || parseFloat(row.price) <= 0) {
          rowErrors.price = "Price must be a positive number";
        }
        return rowErrors;
      });
      if (itemErrors.some((err) => Object.keys(err).length > 0)) {
        errors.items = itemErrors;
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (data) => {
    const isValid = validateFormData(data, apiData);
    if (!isValid) {
      toast.error("Please fix all validation errors before saving");
      return;
    }

    setIsLoading(true);
    const payload = {
      dataInsert: {
        header: {
          company_id: createOrderData.company_id,
          supplier_id: data.supplier_name,
          order_date: moment(Date.now()).format("YYYY-MM-DD"),
          delivery_date: moment(data.delivery_date).format("YYYY-MM-DD"),
          source_type: "manual",
          source_id: "0",
          status: orderStatus,
          created_by: UserId,
          ...(headerId && !isCopyHeader ? { header_id: headerId } : {}),
        },
        entries: apiData.map((row) => ({
          record_id: row.record_id || "",
          comp_to_dept_id: createOrderData?.com_dept_id,
          product_id: row.product_id || 0,
          tax_id: row.tax_id || "",
          price: parseFloat(row.price).toFixed(3),
          qty: parseFloat(row.qty).toFixed(3),
          unit_selected: row.unit_selected,
          comments: row.comments,
        })),
      },
    };

    createOrder(payload, {
      onSuccess: (response) => {
        if (response?.emailStatus === "Order not sent") {
          toast.error(`Email Status: ${response?.emailStatus}`);
        }
        if (response?.emailStatus === "Email sent successfully") {
          toast.success(`Email Status: ${response?.emailStatus}`);
        }
        if (response.data?.[0]?.msgType !== "error") {
          setRowsData([]);
          setApiData([]);
          setValue("items", []);
          setHeaderId(response?.data?.[0]?.headerId);
          setIsCopy(false);
          setIsCopyHeader(false);
          handleFetchHeaderData();
          handleFetchEntries();
          toast.success(response.data?.[0]?.message);
        } else {
          toast.error(response.data?.[0]?.message);
        }
        setIsLoading(false);
      },
      onError: (error) => {
        toast.error(`${error.data?.[0]?.message || "Failed to save purchase order"}`);
        setIsLoading(false);
      },
    });
  };

  const confirmPrint = (withPrices) => {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "Make sure to save order before printing; only saved orders will be printed",
      cancelButtonText: "Cancel",
      cancelButtonColor: "#d33",
      showCancelButton: true,
      confirmButtonText: "Continue",
      confirmButtonColor: "#1E3A8A",
    }).then((result) => {
      if (result.isConfirmed) {
        printPurchaseOrder(withPrices);
      }
    });
  };

  const printPurchaseOrder = async (withPrices) => {
    const supplierId = watch("supplier_name");
    const companyId = createOrderData.company_id;
    if (!supplierId || !companyId) {
      console.error("Supplier or Company ID is missing.");
      return;
    }

    let itemsData = [];
    await new Promise((resolve, reject) => {
      mutate(
        {
          headerData: {
            purchase_order_id: headerId,
          },
          filters: null,
          limit: 0,
          offset: 0,
        },
        {
          onSuccess: (res) => {
            const fetchedEntries = res?.data.slice(0, -1) || [];
            const formattedData = fetchedEntries.map((item) => ({
              record_id: item?.record_id || "",
              product_id: item.product_id,
              product_label: item.product_name,
              unit_selected: item.unit_selected,
              unit_selected_label: item.unit_description,
              qty: formatDecimalValue(item?.qty),
              price: formatDecimalValue(item?.price),
              comments: item.comments,
              tax_id: item.tax_id,
              tax_name: taxOptionData?.data?.find((value) => value?.record_id == item.tax_id)?.tax_name,
              tax_amount: formatDecimalValue(item.tax_amount),
              total_amount: formatDecimalValue(item?.total_price),
              isServer: true,
              isServerLoaded: true,
            }));
            itemsData = formattedData;
            resolve();
          },
          onError: (error) => {
            console.error("Error fetching", error);
            reject(error);
          },
        }
      );
    });
    if (!itemsData.length) {
      console.error("No items available to print");
      return;
    }

    console.info("Generating purchase order...");

    try {
      let supplierData = {};
      try {
        const supplierPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Supplier data fetch timed out"));
          }, 5000);

          getSupplier(
            {
              filters: [{ key: "sl.id", operator: "equal", value1: supplierId, logical: "" }],
              limit: 0,
              offset: 0,
              orderby: "",
            },
            {
              onSuccess: (response) => {
                clearTimeout(timeout);
                if (response?.data?.length > 0) {
                  resolve(response.data[0]);
                } else {
                  resolve({});
                }
              },
              onError: (error) => {
                clearTimeout(timeout);
                console.error("Error fetching supplier:", error);
                resolve({});
              },
            }
          );
        });

        supplierData = await supplierPromise;
      } catch (error) {
        console.error("Supplier fetch failed:", error);
        supplierData = {};
      }
      const itemRows = [];

      for (const item of itemsData) {
        const totalPrice = (parseFloat(item.price) * parseFloat(item.qty)).toFixed(3);
        const rowHtml = `
          <tr> 
            <td>${item.product_label || "N/A"}</td>
            <td>${item.unit_selected_label}</td>
            <td>${Number(item.qty).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            ${withPrices ? `<td>${Number(item.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>` : ""}
            ${withPrices ? `<td>${Number(totalPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>` : ""}
            <td>${item.comments || "N/A"}</td>
          </tr>`;
        itemRows.push(rowHtml);
      }
      const netTotal = itemsData.reduce((sum, item) => sum + parseFloat(item.price) * parseFloat(item.qty), 0).toFixed(3);
      const vatTotal = itemsData.reduce((sum, item) => sum + parseFloat(item.tax_amount || 0), 0).toFixed(3);
      const entriesTotal = (parseFloat(netTotal) + parseFloat(vatTotal)).toFixed(3);
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Purchase Order</title>
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
    .box-supplier {
      width: 48%;
      border-radius: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th,
    td {
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
    .order-info {
      margin-bottom: 15px;
    }
    .currency {
      font-family: monospace;
    }
  </style>
</head>
<body>
  <h2>Purchase Order</h2>
  <div class="order-info">
    <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>POS Order:</strong> ${headerId || "N/A"}</p>
  </div>
  <div class="container">
    <div class="box-supplier">
      <h3>Supplier Details</h3>
      <p><strong>Supplier Code:</strong> ${supplierData?.supplier_code || "N/A"}</p>
      <p><strong>Supplier Name:</strong> ${supplierData?.supplier_name || "N/A"}</p>
      <p><strong>Supplier Phone:</strong> ${supplierData?.supplier_phone || "N/A"}</p>
      <p><strong>Supplier Website:</strong> ${supplierData?.supplier_website || "N/A"}</p>
    </div>
    <div class="box-company">
      <h3>Company Details</h3>
      <p><strong>Company Code:</strong> ${createOrderData?.company_code || "N/A"}</p>
      <p><strong>Company Name:</strong> ${createOrderData?.company_name || "N/A"}</p>
    </div>
  </div>
  <h3>Item Details</h3>
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Unit</th>
        <th>Qty</th>
        ${withPrices ? `<th>Price</th>` : ""}
        ${withPrices ? `<th>Net Amount</th>` : ""}
        <th>Comments</th>
      </tr>
    </thead>
    <tbody>${itemRows.join("")}</tbody>
  </table>
  <p class="note">This is an electronically generated order, so no signature is required.</p>
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
      iframe.onload = function () {
        setTimeout(() => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            console.log("Purchase order ready to print");
            document.body.removeChild(iframe); // Clean up iframe
          } catch (e) {
            console.error("Auto-print failed:", e);
            console.info("Please use the Print button in the document");
            document.body.removeChild(iframe); // Clean up iframe
          }
        }, 1000);
      };
    } catch (error) {
      console.error("Error generating purchase order:", error);
      toast.error("Failed to generate purchase order: " + (error.message || "Unknown error"));
    }
  };

  const handleActionClick = (action) => {
    if (action === "Without amount and prices") {
      confirmPrint(false);
    } else if (action === "With amount and prices") {
      confirmPrint(true);
    }
  };

  const headers = [
    { key: "action", label: "Action", width: 100, sortable: true, filterable: true },
    { key: "product_label", label: "Product", width: 270, sortable: true, filterable: true },
    { key: "unit_selected_label", label: "Unit", width: 200, sortable: true, filterable: true },
    { key: "qty", label: "Quantity", width: 150, sortable: true, filterable: true },
    { key: "price", label: "Unit Price", width: 150, sortable: true, filterable: true },
    { key: "net_price", label: "Net Price", width: 150, sortable: true, filterable: true },
    { key: "tax_name", label: "Tax", width: 250, sortable: true, filterable: true },
    { key: "tax_amount", label: "Tax Amount", width: 150, sortable: true, filterable: true },
    { key: "total_amount", label: "Total Amount", width: 150, sortable: true, filterable: true },
    { key: "comments", label: "Comments", width: 150, sortable: true, filterable: true },
  ];

  const renderCell = (value, row, columnKey) => {
    const rowIndex = row.index;
    const fieldName = `items.${rowIndex}.${columnKey}`;

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

    if (columnKey === "product_label" && !createOrderData?.withoutOrder) {
      return (
        <div>
          <AntdSelectFieldTable
            endpoint={API_ENDPOINTS.GET_USER_PRODUCT_LIST}
            queryKey="pm.product_name"
            valueKey="product_id"
            labelKey="product_name"
            responseWhich="data"
            placeholder="Select Product"
            onSelectChange={(selected, selectedRecord) => updateRowData(rowIndex, "product_label", selected, selectedRecord)}
            headerData={{
              user_id: createOrderData?.user_id,
              comp_to_dept_id: createOrderData?.com_dept_id,
            }}
            baseFilters={[
              { key: "pm.status", operator: "equal", value1: "1", logical: "" },
              { key: "aptcd.status", operator: "equal", value1: "1", logical: "" },
              { key: "pm.product_type", operator: "in", value1: "raw", logical: "" },
            ]}
            defaultValue={row.product_id ? { value: row.product_id, label: row.product_label } : null}
          />
          {formErrors?.items?.[rowIndex]?.product_id && (
            <div className="text-red-500 text-xs">{formErrors.items[rowIndex].product_id}</div>
          )}
        </div>
      );
    }

    if (columnKey === "unit_selected_label" && !createOrderData?.withoutOrder) {
      return (
        <div>
          <AntdSelectFieldTable
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
          {formErrors?.items?.[rowIndex]?.unit_selected && (
            <div className="text-red-500 text-xs">{formErrors.items[rowIndex].unit_selected}</div>
          )}
        </div>
      );
    }

    if (columnKey === "tax_name") {
      return (
        <div>
          <AntdSelectFieldTable
            control={control}
            name={fieldName}
            endpoint={API_ENDPOINTS.TAX_LIST}
            queryKey="tt.tax_name"
            valueKey="record_id"
            labelKey="tax_name"
            responseWhich="data"
            placeholder="Select Tax"
            onSelectChange={(selected) => updateRowData(rowIndex, "tax_name", selected)}
            defaultValue={row.tax_id ? { value: row.tax_id, label: row.tax_name } : null}
          />
          {formErrors?.items?.[rowIndex]?.tax_id && (
            <div className="text-red-500 text-xs">{formErrors.items[rowIndex].tax_id}</div>
          )}
        </div>
      );
    }

    if (columnKey === "net_price" || columnKey === "tax_amount" || columnKey === "total_amount") {
      return (
        <div>
          <InputFieldTable
            control={control}
            name={fieldName}
            type="number"
            useComma={true}
            value={row[columnKey]}
            disabled={true}
            error={formErrors?.items?.[rowIndex]?.[columnKey]}
          />
        </div>
      );
    }

    return (
      <div>
        <InputFieldTable
          control={control}
          name={fieldName}
          maxDecimalLength={3}
          error={formErrors?.items?.[rowIndex]?.[columnKey]}
          value={row[columnKey]}
          onChange={(e) => updateRowData(rowIndex, columnKey, e.target.value)}
          type={columnKey === "qty" || columnKey === "price" ? "number" : "text"}
          useComma={columnKey === "qty" || columnKey === "price"? true : false}
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
    [formErrors, watch, rowsData]
  );

  const breadcrumbItems = [
    { title: "Purchase Order", link: "purchase-order-list" },
    { title: "Purchase Order" },
  ];

  const totals = calculateTotals();

  return (
    <div>
      {isCreating || isFetchingEntries ? (
        <Loader />
      ) : (
        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
          <CustomBreadcrumb items={breadcrumbItems} />
          <div className="flex gap-1 items-center">
            <p className="text-color font-regularweight">Company:</p>
            <span className="text-color">{createOrderData?.company_name}</span>
          </div>
          <div className="flex gap-1 items-center">
            <p className="text-color font-regularweight">Department:</p>
            <span className="text-color">{createOrderData?.dept_name}</span>
          </div>
          <div className="bg-background shadow-sm p-3 rounded-radiusRegular mt-2">
            <h2 className="text-size text-color font-headingweight text-center mb-2">Purchase Order</h2>
            {userHeaderData && (
              <div className="flex gap-1 items-center justify-content-end">
                <p className="text-color font-regularweight">Order Status:</p>
                <span className="capitalize text-color">{orderStatus}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-2">
              <div>
                <AntdSelectField
                  label="Supplier"
                  control={control}
                  name="supplier_name"
                  endpoint={API_ENDPOINTS.GET_SUPPLIER}
                  queryKey="supplier_name"
                  valueKey="record_id"
                  labelKey="supplier_name"
                  responseWhich="data"
                  defaultValue={supplier.label ? supplier : null}
                  error={formErrors.supplier_name}
                  baseFilters={[{ key: "sl.status", operator: "equal", value1: "1", logical: "" }]}
                />
                {formErrors.supplier_name && (
                  <div className="text-red-500 text-xs">{formErrors.supplier_name}</div>
                )}
              </div>
              <div>
                <InputField
                  label="Delivery date"
                  control={control}
                  type="date"
                  register="delivery_date"
                  error={formErrors.delivery_date}
                />
                {formErrors.delivery_date && (
                  <div className="text-red-500 text-xs">{formErrors.delivery_date}</div>
                )}
              </div>
            </div>
            <div className="flex gap-1 items-center my-2">
              <CustomButton type="button" btntext="Add Row" handleClick={handleAddClick} className="bg-primary hover:bg-secondary text-white" />
              <CustomButton type="submit" btntext="Save" handleClick={() => setOrderStatus("save")} className="bg-primary hover:bg-secondary text-white" />
              <GenericActionBar
                text="Print"
                field_disable={!headerId}
                selectedIds={selectedIds}
                onActionClick={handleActionClick}
                action={["With amount and prices", "Without amount and prices"]}
              />
              <CustomButton type="submit" btntext="Send" handleClick={() => setOrderStatus("sent")} className="bg-primary hover:bg-secondary text-white" />
            </div>
            {userHeaderData && (
              <div className="flex gap-1 items-center justify-content-end">
                <p className="text-color font-regularweight">Data Copied from user:</p>
                <span className="text-color">{data?.data?.first_name} {data?.data?.last_name}</span>
              </div>
            )}
          </div>
          <div className="my-3">
            <h2 className="mb-1 text-size text-color font-headingweight">Entries</h2>
            {formErrors.items && !Array.isArray(formErrors.items) && (
              <div className="text-red-500 text-xs mb-2">{formErrors.items}</div>
            )}
            <div className="shrink-0 whitespace-nowrap overflow-x-auto w-full bg-card">
              <ResizableTable
                data={rowsData}
                columns={columns}
                height="400px"
                scrollableId="purchase-order-entries"
                isDense={true}
                isSelect={false}
                enableScroll={false}
                customFilterFunction={customFilterFunction}
              />
            </div>
          </div>
          <div className="flex justify-end pr-4">
            <div className="bg-background p-3 rounded-md shadow-sm d-flex justify-content-end flex-column">
              <div className="flex gap-1 items-center">
                <dt className="text-color font-regularweight">Net Total:</dt>
                <dd className="text-color">{totals.net_price}</dd>
              </div>
              <div className="flex gap-1 items-center">
                <dt className="text-color font-regularweight">Tax Total:</dt>
                <dd className="text-color">{totals.tax_amount}</dd>
              </div>
              <div className="flex gap-1 items-center">
                <dt className="text-color font-regularweight">Gross Total:</dt>
                <dd className="text-color">{totals.total_amount}</dd>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default withPermissionCheck(CreatePurchaseOrder, "create-purchase-order");