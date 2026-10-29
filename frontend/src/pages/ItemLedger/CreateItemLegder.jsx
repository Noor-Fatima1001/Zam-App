import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as yup from "yup";
import AntdSelectField from "../../AntdSelectField";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import InputField from "../../components/form-elements/InputField";
import {
  getFromLocalStorage,
  getFromSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import useDebounce from "../../hooks/useDebounce";
import Loader from "../../components/Loader";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import ResizableTable from "../../components/table/ResizableTable";
import AntdSelectFieldTable from "../../AntdSelectFieldTable";
import InputFieldTable from "../../components/form-elements/InputFieldTable";
import { MdDelete } from "react-icons/md";
import {toast} from "react-toastify";
import { filterAndSortData, formatDecimalValue } from "../../utils/helper.function";
import AntSelectFieldTable from "../../AntSelectFieldTable";

const CreateItemLedger = () => {
  const schema = yup.object().shape({
    supplier_name: yup.string().required("Supplier is required"),
    posting_date: yup.string().required("Posting Date is required"),
    external_ref: yup.string().required("External ref is required"),
    delivery_total: yup.string().required("Delivery Total is required"),
    items: yup.array().of(
      yup.object().shape({
        product_id: yup.string().required("Product is required"),
        unit_selected: yup.string().required("Unit selection is required"),
        tax_id: yup.string().required("Tax is required"),
        qty: yup
          .string()
          .required("Quantity is required"),
        price: yup
          .string()
          .required("Price is required")
          .test("is-non-negative", "Price must be non-negative", (value) => parseFloat(value) >= 0),
      })
    ),
  });

  useEffect(()=>{
    if(!createOrderData?.company_id){
      setIsSessionExpired(true)
    }
  },[])
  
  const data = getFromSessionStorage("item-ledger-data");
  const userHeaderData = data?.data;
  const createOrderData = getFromSessionStorage("createOrderData");
  const [isCopy, setIsCopy] = useState(data?.iscopy);
  const [isLoading, setIsLoading] = useState(false);
  const [rowsData, setRowsData] = useState([]);
  const [apiData, setApiData] = useState([]);
  const [headerId, setHeaderId] = useState(userHeaderData?.record_id);
  const [deliveryStatus, setDeliveryStatus] = useState(userHeaderData?.status);
  const [isCopyHeader, setIsCopyHeader] = useState(isCopy);
  const [source, setSource] = useState(getFromSessionStorage("ledger-source"));
  const [sourceId, setSourceId] = useState("0");
  const [headerSupplier, setHeaderSupplier] = useState(null);
  const [presfilters, setPresFilters] = useState();
  const [preservedConfig, setPreservedConfig] = useState();
  const [isFOCMode, setIsFOCMode] = useState(false);
  const navigate = useNavigate();
  const UserId = getFromLocalStorage("UserId");
  const [isSessionExpired,setIsSessionExpired]=useState(false);
  const { mutate: createVoucher, isPending: isCreating } = useGlobelApi(
    API_ENDPOINTS.CREATE_ITEM_LEDGER
  );
  const { mutate: fetchEntries } = useGlobelApi(API_ENDPOINTS.GET_ITEM_LEDGER_ENTRIES);
  const { mutate: purchaseOrderEntries } = useGlobelApi(
    API_ENDPOINTS.GET_OPEN_ITEM_FOR_DELIVERY
  );
  const { mutate: purchaseOrderHeader } = useGlobelApi(
    API_ENDPOINTS.GET_OPEN_ITEM_FOR_DELIVERY
  );
  const { mutate: itemLedgerHeader } = useGlobelApi(
    API_ENDPOINTS.GET_ITEM_LEDGER_HEAD
  );
  const { mutate: deleteEntryMutate } = useGlobelApi(
    API_ENDPOINTS.DELETE_ITEM_LEDGER_ENTRY
  );
  const { mutate: supplierOption, data: supplierOptionData } = useGlobelApi(
    API_ENDPOINTS.GET_SUPPLIER
  );
  const { mutate: taxOption, data: taxOptionData } = useGlobelApi(
    API_ENDPOINTS.TAX_LIST
  );
  const { mutate: getUserProductList } = useGlobelApi(
    API_ENDPOINTS.GET_USER_PRODUCT_LIST
  );
  const { mutate: getUnitList } = useGlobelApi(
    API_ENDPOINTS.GET_PRODUCT_UNITS
  );
  const { mutate: getConversionQty } = useGlobelApi(
    API_ENDPOINTS.GET_CONVERSION_QTY_PRICE
  );
  const { mutate: getSupplier } = useGlobelApi(API_ENDPOINTS.GET_SUPPLIER);

  const {
    register,
    control,
    formState: { errors },
    setValue,
    watch,
    handleSubmit,
    trigger,
  } = useForm({
    // resolver: yupResolver(schema),
    mode: "onChange",
    // reValidateMode: "onChange",
    // defaultValues: {
    //   supplier_name: "",
    //   posting_date: "",
    //   external_ref: "",
    //   delivery_total: "0.000",
    //   delivery_tax: "0.000",
    //   short_access: "0.000",
    //   items: [],
    // },
  });

  const watchedItems = useWatch({ control, name: "items" });
  const debouncedInputValue = useDebounce(watchedItems, 500);
  const shortAccess = useWatch({ control, name: "short_access" });
  const [grossTotal, setGrossTotal] = useState(0);
  const [vatTotal, setVatTotal] = useState(0);
  const [netTotal, setNetTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [isPurchaseOrder, setIsPurchaseOrder] = useState(
    getFromSessionStorage("ledger-source")
  );

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
    supplierOption({
      filters: [{ key: "sl.status", operator: "equal", value1: "1", logical: "" }],
      limit: 0,
      offset: 0,
    });
    taxOption({ filters: null, limit: 0, offset: 0 });
    getUserProductList({
      headerData: {
        user_id: createOrderData?.user_id,
        comp_to_dept_id: createOrderData?.com_dept_id,
      },
      filters: null,
      limit: 0,
      offset: 0,
    });
  }, []);

  useEffect(() => {
    if (userHeaderData) {
      setHeaderId(userHeaderData?.record_id);
    }
  }, [navigate]);

  const handleFetchHeaderData = () => {
    if (!headerId || isCopy) return;
    setIsLoading(true);
    if (isPurchaseOrder === "manual" || isPurchaseOrder === "purchase-order-update") {
      itemLedgerHeader(
        {
          headerData: {
            comp_to_dept_id: createOrderData?.com_dept_id,
          },
          filters: [
            {
              key: "ilh.id",
              operator: "equal",
              value1: headerId,
              logical: "",
            },
          ],
          limit: 0,
          offset: 0,
        },
        {
          onSuccess: (res) => {
            const headerResponse = res?.data?.[0];
            if (headerResponse) {
              setHeaderSupplier({
                value: headerResponse?.supplier_id?.toString(),
                label: headerResponse?.supplier_name,
              });
              setValue("supplier_name", headerResponse?.supplier_id?.toString());
              setValue("external_ref", headerResponse?.external_ref);
              setValue("delivery_tax", headerResponse?.delivery_tax);
              setValue("delivery_total", headerResponse?.delivery_total);
              setValue("posting_date", headerResponse?.posting_date);
              setDeliveryStatus(headerResponse.status);
              setSource(headerResponse?.source);
              setSourceId(headerResponse?.source_id);
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
    } else if (isPurchaseOrder === "purchase_order") {
      purchaseOrderHeader(
        {
          headerData: {
            purchase_order_id: headerId,
          },
          filters: [],
          limit: 0,
          offset: 0,
        },
        {
          onSuccess: (res) => {
            const headerResponse = res?.data?.[0];
            if (headerResponse) {
              setHeaderSupplier({
                value: headerResponse?.po_sup_id?.toString(),
                label: headerResponse?.supplier_name,
              });
              setValue("supplier_name", headerResponse?.po_sup_id?.toString());
              setValue("posting_date", headerResponse?.delivery_date);
              setSource("purchase_order");
              setValue("");
              setSourceId(headerId);
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
    }
  };

  const handleFetchEntries = () => {
    if (!headerId) return;
    setIsLoading(true);
    if (isPurchaseOrder === "manual" || isPurchaseOrder === "purchase-order-update") {
      fetchEntries(
        {
          headerData: {
            item_ledger_head_id: headerId,
          },
          filters: null,
          limit: 0,
          offset: 0,
        },
        {
          onSuccess: (res) => {
            const fetchedEntries = res?.data?.slice(0, -1) || [];
            const formattedData = fetchedEntries.map((item, index) => {
              const net_price = parseFloat(item?.net_price || 0).toFixed(3);
              const tax_amount = parseFloat(item?.tax_amount || 0).toFixed(3);
              const total_amount = (parseFloat(net_price) + parseFloat(tax_amount)).toFixed(3);
              return {
                index,
                record_id: !isCopyHeader ? item?.record_id || "" : "",
                product_id: item.product_id,
                product_label: item.product_name,
                unit_selected: item.unit_selected,
                unit_selected_label: item.unit_description,
                qty: parseFloat(item?.qty || 0).toFixed(3),
                price: parseFloat(item?.price || 0).toFixed(3),
                tax_id: item.tax_id,
                tax_name: taxOptionData?.data?.find(
                  (value) => value?.record_id == item.tax_id
                )?.tax_name,
                tax_amount,
                net_price,
                total_amount,
                comments: item.comments,
              };
            });
            setRowsData(formattedData);
            setApiData(formattedData);
            setValue("items", formattedData);
            setIsLoading(false);
          },
          onError: (error) => {
            console.error("Error fetching entries:", error);
            toast.error("Failed to fetch entries");
            setIsLoading(false);
          },
        }
      );
    } else if (isPurchaseOrder === "purchase_order") {
      purchaseOrderEntries(
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
            const fetchedEntries = res?.data || [];
            const formattedData = fetchedEntries.map((item, index) => {
              const tax_value = parseFloat(
                taxOptionData?.data?.find(
                  (value) => value?.record_id == item.po_tax_id
                )?.tax_value || 0
              );
              const net_price = (parseFloat(item?.remaining_ordered_qty) * parseFloat(item?.base_unit_price)).toFixed(3);
              const tax_amount = (parseFloat(net_price) * tax_value).toFixed(3);
              const total_amount = (parseFloat(net_price) + parseFloat(tax_amount)).toFixed(3);
              return {
                index,
                record_id: "",
                product_id: item.product_id,
                product_label: item.product_name,
                unit_selected: item.base_unit_id,
                unit_selected_label: item.base_unit_name,
                qty: parseFloat(item?.remaining_ordered_qty || 0).toFixed(3),
                price: parseFloat(item?.base_unit_price || 0).toFixed(3),
                tax_id: item.po_tax_id,
                tax_name: taxOptionData?.data?.find(
                  (value) => value?.record_id == item.po_tax_id
                )?.tax_name,
                tax_amount,
                net_price,
                total_amount,
                comments: item.comments,
              };
            });
            setRowsData(formattedData);
            setApiData(formattedData);
            setValue("items", formattedData);
            setIsLoading(false);
          },
          onError: (error) => {
            console.error("Error fetching entries:", error);
            toast.error("Failed to fetch entries");
            setIsLoading(false);
          },
        }
      );
    }
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
  }, [headerId, taxOptionData]);

  useEffect(() => {
    if (headerSupplier && headerId) {
      setValue("supplier_name", headerSupplier.value);
    }
  }, [headerSupplier, setValue, headerId]);

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
          price: isFOCMode ? "0.000" : "0.000",
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

        if (fieldName === "product_id" || fieldName === "unit_selected" || fieldName === "tax_id") {
          if (fieldName === "product_id") {
            targetRow["product_id"] = value.value;
            apiRow["product_id"] = value.value;
            targetRow["product_label"] = value.label;
            apiRow["product_label"] = value.label;
          }
          if (fieldName === "unit_selected") {
            targetRow["unit_selected"] = value.value;
            apiRow["unit_selected"] = value.value;
            targetRow["unit_selected_label"] = value.label;
            apiRow["unit_selected_label"] = value.label;
          }
          if (fieldName === "tax_id") {
            targetRow["tax_id"] = value.value;
            apiRow["tax_id"] = value.value;
            targetRow["tax_name"] = value.label;
            apiRow["tax_name"] = value.label;
          }
          setValue(`items.${rowIndex}.${fieldName}`, value.value, { shouldValidate: true });
        } else {
          const formattedValue = fieldName === "qty" || fieldName === "price" ? value : value;
          targetRow[fieldName] = formattedValue;
          apiRow[fieldName] = formattedValue;
          setValue(`items.${rowIndex}.${fieldName}`, formattedValue, { shouldValidate: true });
        }

        const qty = parseFloat(targetRow.qty) || 0;
        let price = parseFloat(targetRow.price) || 0;
        const taxId = targetRow.tax_id || "";

        if (fieldName === "product_id" && value.value && record && !isFOCMode) {
          price = parseFloat(record.average_price || 0);
          targetRow.price = formatDecimalValue(record.average_price);
          apiRow.price = targetRow.price;
          setValue(`items.${rowIndex}.price`, targetRow.price, { shouldValidate: true });
        } else if (fieldName === "product_id" && isFOCMode) {
          price = 0;
          targetRow.price = "0.000";
          apiRow.price = "0.000";
          setValue(`items.${rowIndex}.price`, "0.000", { shouldValidate: true });
        }

        const netPrice = formatDecimalValue(qty * price);
        const taxOption = taxOptionData?.data?.find((tax) => tax.record_id == taxId);
        const taxValue = taxOption ? parseFloat(taxOption.tax_value) || 0 : 0;
        const taxAmount = netPrice * taxValue;
        const totalAmount = netPrice * ( 1 + taxValue);
        
        targetRow.net_price = formatDecimalValue(netPrice);
        targetRow.tax_amount = formatDecimalValue(taxAmount);
        targetRow.total_amount = formatDecimalValue(totalAmount);
        apiRow.net_price = targetRow.net_price;
        apiRow.tax_amount = targetRow.tax_amount;
        apiRow.total_amount = targetRow.total_amount;
        setValue(`items.${rowIndex}.net_price`, targetRow.net_price, { shouldValidate: true });
        setValue(`items.${rowIndex}.tax_amount`, targetRow.tax_amount, { shouldValidate: true });
        setValue(`items.${rowIndex}.total_amount`, targetRow.total_amount, { shouldValidate: true });

        if (fieldName === "product_id" && value.value && !createOrderData?.withoutOrder) {
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
                  setValue(`items.${rowIndex}.unit_selected`, unit_data.record_id, { shouldValidate: true });
                }
              },
              onError: (error) => {
                console.error("Error fetching units:", error);
              },
            }
          );
        } else if (fieldName === "unit_selected" && value.value && !createOrderData?.withoutOrder) {
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
                    const convertedPrice = isFOCMode ? "0.000" : formatDecimalValue(data?.converted_price);
                    const convertedQty = formatDecimalValue(data?.converted_qty);
                    targetRow.price = convertedPrice;
                    targetRow.qty = convertedQty;
                    apiRow.price = convertedPrice;
                    apiRow.qty = convertedQty;
                    setValue(`items.${rowIndex}.price`, convertedPrice, { shouldValidate: true });
                    setValue(`items.${rowIndex}.qty`, convertedQty, { shouldValidate: true });

                    const newNetPrice = parseFloat(convertedQty) * parseFloat(convertedPrice);
                    const newTaxAmount = newNetPrice * taxValue;
                    targetRow.net_price = formatDecimalValue(newNetPrice);
                    targetRow.tax_amount = formatDecimalValue(newTaxAmount);
                    targetRow.total_amount = formatDecimalValue(newNetPrice + newTaxAmount);
                    apiRow.net_price = targetRow.net_price;
                    apiRow.tax_amount = targetRow.tax_amount;
                    apiRow.total_amount = targetRow.total_amount;

                    setValue(`items.${rowIndex}.net_price`, targetRow.net_price, { shouldValidate: true });
                    setValue(`items.${rowIndex}.tax_amount`, targetRow.tax_amount, { shouldValidate: true });
                    setValue(`items.${rowIndex}.total_amount`, targetRow.total_amount, { shouldValidate: true });
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
      price: isFOCMode ? "0.000" : "0.000",
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
      confirmButtonColor: "#696cff",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        if (isCopyHeader || isPurchaseOrder === "purchase_order" || !row.record_id) {
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

  useEffect(() => {
    const calculateTotals = () => {
      const totals = apiData.reduce(
        (acc, row) => {
          acc.net_total += parseFloat(row.net_price || 0);
          acc.vat_total += parseFloat(row.tax_amount || 0);
          return acc;
        },
        { net_total: 0, vat_total: 0 }
      );
      setNetTotal(formatDecimalValue(totals.net_total));
      setVatTotal(formatDecimalValue(totals.vat_total));
      setValue("delivery_tax", formatDecimalValue(totals.vat_total));
      // setValue("delivery_total", formatDecimalValue(totals.net_total));
      const shortAccessValue = parseFloat(shortAccess) || 0;
      setGrossTotal(formatDecimalValue(totals.net_total + totals.vat_total + shortAccessValue));
    };
    calculateTotals();
  }, [debouncedInputValue, shortAccess, setValue]);

  const validateAllFields = async () => {
    const isValid = await trigger();
    const items = watch("items");
    if (!items || items.length === 0) {
      toast.error("At least one item is required");
      return false;
    }
    return isValid;
  };

  const onSubmit = async (data) => {
    const isValid = await validateAllFields();
    if (!isValid) {
      toast.error("Please fix all validation errors before saving");
      return;
    }

    setIsLoading(true);
    const short_access = parseFloat(data.short_access) || 0;
    const payload = {
      dataInsert: {
        header: {
          company_id: createOrderData.company_id,
          supplier_id: data.supplier_name,
          delivery_tax: parseFloat(data.delivery_tax).toFixed(3),
          delivery_total: parseFloat(data.delivery_total).toFixed(3),
          external_ref: data.external_ref,
          posting_date: moment(data.posting_date).format("YYYY-MM-DD"),
          source: isFOCMode ? "foc" : source,
          source_id: sourceId,
          status: status,
          created_by: UserId,
          ...(short_access !== 0 ? { short_access } : {}),
          ...(headerId && !isCopyHeader && isPurchaseOrder !== "purchase_order"
            ? { header_id: headerId }
            : {}),
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

    createVoucher(payload, {
      onSuccess: (response) => {
        if (response.data?.[0]?.msgType !== "error") {
          const inResponseHeaderId = response?.data?.[0]?.headerId;
          if (inResponseHeaderId) {
            setHeaderId(inResponseHeaderId);
            setIsCopy(false);
            setIsCopyHeader(false);
            setIsPurchaseOrder("purchase-order-update");
            handleFetchHeaderData();
            handleFetchEntries();
          }
          toast.success(response.data?.[0]?.message);
        } else {
          toast.error(response.data?.[0]?.message);
        }
        setIsLoading(false);
      },
      onError: (error) => {
        toast.error(error.data?.[0]?.message || "Failed to save item ledger");
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
      confirmButtonColor: "#696cff",
    }).then((result) => {
      if (result.isConfirmed) {
        printItemLedger(withPrices);
      }
    });
  };

  const printItemLedger = async (withPrices) => {
    const supplierId = watch("supplier_name");
    const companyId = createOrderData.company_id;
    if (!supplierId || !companyId) {
      console.error("Supplier or Company ID is missing.");
      return;
    }

    let itemsData = [];
    await new Promise((resolve, reject) => {
      fetchEntries(
        {
          headerData: {
            item_ledger_head_id: headerId,
          },
          filters: null,
          limit: 0,
          offset: 0,
        },
        {
          onSuccess: (res) => {
            const fetchedEntries = res?.data.slice(0, -1) || [];
            itemsData = fetchedEntries.map((item) => ({
              record_id: !isCopy ? item?.record_id || "" : "",
              product_id: item.product_id,
              product_label: item.product_name,
              unit_selected: item.unit_selected,
              unit_selected_label: item.unit_description,
              qty: parseFloat(item?.qty || 0).toFixed(3),
              price: parseFloat(item?.price || 0).toFixed(3),
              comments: item.comments,
              tax_id: item.tax_id,
              tax_name: taxOptionData?.data?.find(
                (value) => value?.record_id == item.tax_id
              )?.tax_name,
              tax_amount: parseFloat(item.tax_amount || 0).toFixed(3),
              total_amount: parseFloat(item?.total_price || 0).toFixed(3),
              isServer: true,
              isServerLoaded: true,
            }));
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

    try {
      let supplierData = {};
      try {
        const supplierPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Supplier data fetch timed out"));
          }, 5000);
          getSupplier(
            {
              filters: [
                {
                  key: "sl.id",
                  operator: "equal",
                  value1: supplierId,
                  logical: "",
                },
              ],
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

      const itemRows = itemsData.map((item) => {
        const totalPrice = (parseFloat(item.price) * parseFloat(item.qty)).toFixed(3);
        return `
          <tr> 
            <td>${item.product_label || "N/A"}</td>
            <td>${item.unit_selected_label}</td>
            <td>${Number(item.qty).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}</td>
            ${withPrices ? `<td>${Number(item.price).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}</td>` : ""}
            ${withPrices ? `<td>${Number(totalPrice).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}</td>` : ""}
            <td>${item.comments || "N/A"}</td>
          </tr>`;
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Goods Receipts Note</title>
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
    .note {
      margin-top: 20px;
      font-style: italic;
      text-align: center;
      color: #666;
    }
    .order-info {
      margin-bottom: 15px;
    }
  </style>
</head>
<body>
  <h2>Goods Receipts Note</h2>
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
            console.log("Goods Receipts Note ready to print");
            document.body.removeChild(iframe);
          } catch (e) {
            console.error("Auto-print failed:", e);
            console.info("Please use the Print button in the document");
            document.body.removeChild(iframe);
          }
        }, 1000);
      };
    } catch (error) {
      console.error("Error generating goods receipts note:", error);
      toast.error("Failed to generate goods receipts note: " + (error.message || "Unknown error"));
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
    { key: "tax_name", label: "Tax", width: 200, sortable: true, filterable: true },
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

    if (columnKey === "product_label") {
      return (
        <div>
          <AntSelectFieldTable
            control={control}
            name={fieldName}
            endpoint={API_ENDPOINTS.GET_USER_PRODUCT_LIST}
            queryKey="pm.product_name"
            valueKey="product_id"
            labelKey="product_name"
            responseWhich="data"
            placeholder="Select Product"
            onSelectChange={(selected, selectedRecord) => updateRowData(rowIndex, "product_id", selected, selectedRecord)}
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
            onSelectChange={(selected) => updateRowData(rowIndex, "unit_selected", selected)}
            disabled={!row.product_id}
            headerData={{ product_id: row.product_id, search_term: "" }}
            baseFilters={[]}
            sendFiltersWithSearchTerm={false}
            defaultValue={row.unit_selected ? { value: row.unit_selected, label: row.unit_selected_label } : null}
          />
          {errors?.items?.[rowIndex]?.unit_selected && (
            <div className="text-red-500 text-xs mt-1">{errors.items[rowIndex].unit_selected.message}</div>
          )}
        </div>
      );
    }

    if (columnKey === "tax_name") {
      return (
        <div>
          <AntSelectFieldTable
            control={control}
            name={fieldName}
            endpoint={API_ENDPOINTS.TAX_LIST}
            queryKey="tt.tax_name"
            valueKey="record_id"
            labelKey="tax_name"
            responseWhich="data"
            placeholder="Select Tax"
            onSelectChange={(selected) => updateRowData(rowIndex, "tax_id", selected)}
            defaultValue={row.tax_id ? { value: row.tax_id, label: row.tax_name } : null}
          />
          {errors?.items?.[rowIndex]?.tax_id && (
            <div className="text-red-500 text-xs mt-1">{errors.items[rowIndex].tax_id.message}</div>
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
            error={errors?.items?.[rowIndex]?.[columnKey]?.message}
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
          error={errors?.items?.[rowIndex]?.[columnKey]?.message}
          value={row[columnKey]}
          onChange={(e) => updateRowData(rowIndex, columnKey, e.target.value)}
          type={columnKey === "qty" || columnKey === "price" ? "number" : "text"}
           allowNegative={columnKey === "qty" ?true:false}
          useComma={columnKey === "qty" || columnKey === "price"}
        />
      </div>
    );
  };

  const breadcrumbItems = [
    { title: "Item Ledger", link: "item-ledger-list" },
    { title: "Item Ledger" },
  ];

  const [selectedIds, setSelectedIds] = useState([1]);

  return (
    <div>
      {(isLoading || isCreating) ? (
        <Loader />
      ) : isSessionExpired? <div className="fs-5 text-center text-danger " >Please Re-Select your Dept to continue...</div> :  (
        <form autoComplete="on" onSubmit={handleSubmit(onSubmit)}>
          <CustomBreadcrumb items={breadcrumbItems} />
          <div className="flex gap-1 items-center">
            <p className="text-color font-regularweight">Company:</p>
            <span className="text-color capitalize">{createOrderData?.company_name}</span>
          </div>
          <div className="flex gap-1 items-center">
            <p className="text-color font-regularweight">Department:</p>
            <span className="text-color capitalize">{createOrderData?.dept_name}</span>
          </div>
          <div className="bg-white shadow-sm p-3 rounded-radiusRegular mt-2">
            <h1 className="text-size text-color font-headingweight text-center mb-2">Item Ledger</h1>
            {userHeaderData && (
              <div className="flex gap-1 items-center justify-content-end">
                <p className="text-color font-regularweight">Delivery Status:</p>
                <span className="text-color capitalize">{deliveryStatus}</span>
              </div>
            )}
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isFOCMode}
                  onChange={(e) => {
                    setIsFOCMode(e.target.checked);
                    if (e.target.checked) {
                      const updatedRows = apiData.map((row) => ({
                        ...row,
                        price: "0.000",
                        net_price: "0.000",
                        tax_amount: "0.000",
                        total_amount: "0.000",
                      }));
                      setRowsData(updatedRows);
                      setApiData(updatedRows);
                      updatedRows.forEach((row, index) => {
                        setValue(`items.${index}.price`, "0.000", { shouldValidate: true });
                        setValue(`items.${index}.net_price`, "0.000", { shouldValidate: true });
                        setValue(`items.${index}.tax_amount`, "0.000", { shouldValidate: true });
                        setValue(`items.${index}.total_amount`, "0.000", { shouldValidate: true });
                      });
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-color">FOC Mode (Zero Price)</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-x-2">
              <AntdSelectField
                label="Supplier"
                control={control}
                name="supplier_name"
                endpoint={API_ENDPOINTS.GET_SUPPLIER}
                queryKey="supplier_name"
                valueKey="record_id"
                labelKey="supplier_name"
                responseWhich="data"
                disabled={isPurchaseOrder === "purchase_order"}
                error={errors.supplier_name?.message}
                baseFilters={[
                  {
                    key: "sl.status",
                    operator: "equal",
                    value1: "1",
                    logical: "",
                  },
                ]}
                defaultValue={headerSupplier}
              />
              <InputField
                label="Posting Date"
                control={control}
                type="date"
                register={"posting_date"}
                error={errors.posting_date?.message}
              />
            </div>
            <div className="grid grid-cols-2 gap-x-2 py-2">
              <InputField
                label="External Ref"
                maxLength={30}
                register={register("external_ref")}
                error={errors.external_ref?.message}
              />
              <div className="grid grid-cols-2 d-flex gap-2">
                <InputField
                  label="Delivery Total"
                  type="number"
                  step="0.001"
                  allowNegative={true}
                  maxDecimalLength={3}
                  register={register("delivery_total")}
                  error={errors.delivery_total?.message}
                  mainClass="w-36"
                  disabled={true}
                />
                <InputField
                  label="Delivery Tax"
                  register={register("delivery_tax")}
                  error={errors.delivery_tax?.message}
                  mainClass="w-36"
                  disabled={true}
                />
              </div>
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
                handleClick={() => setStatus("save")} 
                className="bg-primary hover:bg-secondary text-white"
                isLoading={isCreating}
              />
              <GenericActionBar
                text="Print"
                field_disable={!headerId}
                selectedIds={selectedIds}
                onActionClick={handleActionClick}
                action={["With amount and prices", "Without amount and prices"]}
              />
              <CustomButton
                type="submit"
                btntext="Posted"
                handleClick={() => setStatus("posted")} 
                className="bg-primary hover:bg-secondary text-white"
                isLoading={isCreating} 
              />
            </div>
            {userHeaderData && (
              <div className="flex gap-1 items-center justify-content-end">
                <p className="text-color font-regularweight">Data Copied from user:</p>
                <span className="text-color capitalize">{data?.data?.first_name} {data?.data?.last_name}</span>
              </div>
            )}
          </div>
          <div className="my-3">
            <h2 className="mb-1 text-size text-color font-headingweight">Entries</h2>
            {errors.items && !Array.isArray(errors.items) && (
              <div className="text-red-500 text-xs mb-2">{errors.items.message}</div>
            )}
            <div className="shrink-0 whitespace-nowrap overflow-x-auto w-full bg-card">
              <ResizableTable
                data={rowsData}
                columns={headers.map((header) => ({
                  ...header,
                  render: (value, row) => renderCell(value, row, header.key),
                }))}
                height="400px"
                scrollableId="item-ledger-entries"
                isDense={true}
                isSelect={false}
                enableScroll={false}
                customFilterFunction={customFilterFunction}
              />
            </div>
          </div>
          <div className="flex justify-end pr-4">
            <div className="bg-white p-3 rounded-md shadow-sm d-flex justify-content-end flex-column">
              <div className="font-medium">
                Vat Total: <span>{Number(vatTotal).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</span>
              </div>
              <div className="font-medium">
                Net Total: <span>{Number(netTotal).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</span>
              </div>
              <div className="font-medium">
                Gross Total: <span>{Number(grossTotal).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</span>
              </div>
              <InputField
                step="0.0001"
                defaultValue="0.000"
                label="Short/Access"
                register={register("short_access")}
                type="number"
                mainClass="w-36"
                maxDecimalLength={3}
                error={errors.short_access?.message}
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default withPermissionCheck(CreateItemLedger, "itemledger");
