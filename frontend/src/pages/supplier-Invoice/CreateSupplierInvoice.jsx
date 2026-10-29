import React, { useEffect, useState, useMemo } from "react";
import ResizableTable from "../../components/table/ResizableTable";
import AntdSelectField from "../../AntdSelectField";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useForm } from "react-hook-form";
import { getFromLocalStorage, getFromSessionStorage } from "../../config/crypto-file";
import InputField from "../../components/form-elements/InputField";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { useNavigate } from "react-router-dom";
import AntdSelectFieldTable from "../../AntdSelectFieldTable";
import InputFieldTable from "../../components/form-elements/InputFieldTable";
import CustomButton from "../../components/button/CustomButton";
import { MdDelete } from "react-icons/md";
import Loader from "../../components/Loader";
import withPermissionCheck from "../../config/withPermissionCheck";
import moment from "moment";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { filterAndSortData, formatDecimalValue, formatNumberDisplay } from "../../utils/helper.function";
import AntSelectFieldTable from "../../AntSelectFieldTable";

const CreateSupplierInvoice = () => {
  const {
    register,
    control,
    formState: { errors },
    getValues,
    setValue,
    watch,
    trigger,
  } = useForm({ mode: "onChange", reValidateMode: "onChange" });

  const data = getFromSessionStorage("supplier_invoice_edit_module-detailData");
  const userHeaderData = data?.data;
  const [isCopy, setIsCopy] = useState(data?.iscopy);
  const [headerId, setHeaderId] = useState(userHeaderData?.record_id);
  const UserId = getFromLocalStorage("UserId");
  const [rowsData, setRowsData] = useState([]);
  const [apiData, setApiData] = useState([]);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [status, setStatus] = useState("save");
  const [companyData, setCompanyData] = useState();
  const [supplierName, setSupplierName] = useState();
  const [postingDate, setPostingDate] = useState();
  const [invoiceTax, setInvoiceTax] = useState();
  const navigate = useNavigate();

  const { mutate: createVoucher, isPending: isCreating } = useGlobelApi(API_ENDPOINTS.ADD_SUPPLIER_INVOICE);
  const { mutate: fetchHeader, isPending: headerIsPending } = useGlobelApi(API_ENDPOINTS.GET_SUPPLIER_INVOICE_HEADER);
  const { mutate: fetchEntries, isPending: isFetchingEntries } = useGlobelApi(API_ENDPOINTS.GET_SUPPLIER_INVOICE_ENTERIES);
  const { mutate: fetchTaxOptions, data: taxOptionData } = useGlobelApi(API_ENDPOINTS.TAX_LIST);
  const { mutate: deleteEntryMutate } = useGlobelApi(API_ENDPOINTS.DELETE_SUPPLIER_INVOICE_ENTRY);

  const headers = [
    { key: "action", label: "Action", width: 100 },
    { key: "description", label: "Description", width: 200, sortable: true, filterable: true },
    { key: "gl_id_label", label: "General Ledger", width: 200, sortable: true, filterable: true, filterKey: "gl_id_label" },
    { key: "quantity", label: "Quantity", width: 150, sortable: true, filterable: true },
    { key: "unit_price", label: "Unit Price", width: 150, sortable: true, filterable: true },
    { key: "tax_id_label", label: "Tax", width: 200, sortable: true, filterable: true, filterKey: "tax_id_label" },
    { key: "net_price", label: "Net Price", width: 150, sortable: true, filterable: true },
    { key: "tax_amount", label: "Tax Amount", width: 200, sortable: true, filterable: true },
    { key: "total_amount", label: "Total Amount", width: 200, sortable: true, filterable: true },
  ];

  const [preservedConfig, setPreservedConfig] = useState();
  const [presfilters, setPresFilters] = useState();
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

  // Fetch tax options
  useEffect(() => {
    fetchTaxOptions({ filters: null, limit: 0, offset: 0 });
  }, [fetchTaxOptions]);

  // Fetch header and entries data
  const handleFetchData = () => {
    if (!headerId) return;
    const filters = [{ key: "sih.id", operator: "equal", value1: headerId, logical: "" }];
    fetchHeader(
      { filters, limit: 0, offset: 0 },
      {
        onSuccess: (res) => {
          const header = res?.data?.[0];
          if (header) {
            setValue('company_name', { value: header.company_id, label: header.company_name });
            setValue('supplier_name', { value: header.supplier_id, label: header.supplier_name });
            setSupplierName({ value: header.supplier_id, label: header.supplier_name })
            setCompanyData({ value: header.company_id, label: header.company_name })
            setValue('posting_date', header.posting_date);
            setValue('external_ref', header.external_ref);
            setValue('header_description', header.header_description);
            setValue('invoice_total', header.invoice_total.toString());
            setValue('invoice_tax', header.invoice_tax);
            setInvoiceTax(header.invoice_tax)
          }
        },
        onError: (error) => {
          console.error("Error fetching header:", error);
          toast.error("Failed to fetch header data");
        },
      }
    );

    fetchEntries(
      { filters: [{ key: "sie.supplier_header_id", operator: "equal", value1: headerId, logical: "" }], limit: 0, offset: 0 },
      {
        onSuccess: (res) => {
          const entries = res?.data?.map((item, index) => ({
            index,
            record_id: item.record_id || "",
            description: item.description || "",
            gl_id: item.gl_id?.toString() || "",
            gl_id_label: item.gl_name || "",
            tax_id: item.tax_id?.toString() || "",
            tax_id_label: item.tax_name || "",
            tax_value: formatDecimalValue(item.tax_value) || 0 ,
            quantity: formatDecimalValue(item.quantity) || 0 ,
            unit_price: formatDecimalValue(item.unit_price) || 1,
            net_price: formatDecimalValue(item.net_price) || 0,
            tax_amount:formatDecimalValue(item.tax_amount) || 0,
            total_amount: formatDecimalValue(item.total_price) || 0,
          })) || [];
          setApiData(entries);
          setRowsData(entries);
        },
        onError: (error) => {
          console.error("Error fetching entries:", error);
          toast.error("Failed to fetch entries");
        },
      }
    );
  };

  useEffect(() => {
    if (headerId) {
      handleFetchData();
    } else {
      // const initialRow = {
      //   index: 0,
      //   record_id: "",
      //   description: "",
      //   gl_id: "",
      //   gl_id_label: "",
      //   tax_id: "",
      //   tax_id_label: "",
      //   tax_value: "0.00",
      //   quantity: "1.00",
      //   unit_price: "1.00",
      //   net_price: "0.00",
      //   tax_amount: "0.00",
      //   total_amount: "0.00",
      // };
      setRowsData([]);
      setApiData([]);
    }
  }, [headerId]);

  useEffect(() => {
    const data = getFromSessionStorage("supplier_invoice_edit_module-detailData");
    const userHeaderData = data?.data;
    const id = userHeaderData?.record_id;
    if (headerId !== id) {
      setIsCopy(data?.iscopy);
      setHeaderId(id);
    }
  }, [navigate]);

  const calculateTotals = () => {
    const totals = rowsData.reduce(
      (acc, row) => {
        acc.net_price += formatDecimalValue(row.net_price || 0);
        acc.tax_amount += formatDecimalValue(row.tax_amount || 0);
        acc.total_amount += formatDecimalValue(row.total_amount || 0);
        return acc;
      },
      { net_price: 0, tax_amount: 0, total_amount: 0 }
    );

    const shortAccessValue = formatDecimalValue(getValues("short_access")) || 0;
    const grossTotal = totals.total_amount + shortAccessValue;

    return {
      net_price: formatDecimalValue(totals.net_price),
      tax_amount: formatDecimalValue(totals.tax_amount),
      total_amount: formatDecimalValue(totals.total_amount),
      gross_total: formatDecimalValue(grossTotal),
    };
  };

  const updateRowData = (rowIndex, fieldName, value) => {
    setRowsData((prevData) => {
      const newData = [...prevData];
      let targetRow = newData.find((item) => item.index === rowIndex);

      if (!targetRow) {
        targetRow = {
          index: rowIndex,
          record_id: "",
          description: "",
          gl_id: "",
          gl_id_label: "",
          tax_id: "",
          tax_id_label: "",
          tax_value: "0.00",
          quantity: "1.00",
          unit_price: "1.00",
          net_price: "0.00",
          tax_amount: "0.00",
          total_amount: "0.00",
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
        if (fieldName === "gl_id_label") {
          targetRow.gl_id = value?.value || "";
          targetRow.gl_id_label = value?.label || "";
          apiRow.gl_id = value?.value || "";
          apiRow.gl_id_label = value?.label || "";
        } else if (fieldName === "tax_id_label") {
          targetRow.tax_id = value?.value || "";
          targetRow.tax_id_label = value?.label || "";
          apiRow.tax_id = value?.value || "";
          apiRow.tax_id_label = value?.label || "";
        } else {
          targetRow[fieldName] = value || "";
          apiRow[fieldName] = value || "";
        }

        const quantity = formatDecimalValue(targetRow.quantity) || 1;
        const unitPrice = formatDecimalValue(targetRow.unit_price) || 1;
        const taxId = targetRow.tax_id || 0;
        const taxOption = taxOptionData?.data?.find((tax) => tax.record_id == taxId);
        const taxValue = taxOption ? formatDecimalValue(taxOption.tax_value) || 0 : 0;
        const netPrice = quantity * unitPrice;
        const taxAmount = netPrice * taxValue;
        const totalAmount = netPrice * (1 + taxValue);

        Object.assign(targetRow, {

          net_price: formatDecimalValue(netPrice),
          tax_value: formatDecimalValue(taxValue),
          tax_amount: formatDecimalValue(taxAmount),
          total_amount: formatDecimalValue(totalAmount),
        });
        Object.assign(apiRow, {
          net_price: formatDecimalValue(netPrice),
          tax_value: formatDecimalValue(taxValue),
          tax_amount: formatDecimalValue(taxAmount),
          total_amount: formatDecimalValue(totalAmount),

        });

        return newApiData;
      });

      return newData;
    });
  };

  const handleAddClick = () => {
    const rowIndex = apiData.length > 0 ? Math.max(...apiData.map(row => row.index)) + 1 : 0;
    const newRow = {
      index: rowIndex,
      record_id: "",
      description: "",
      gl_id: "",
      gl_id_label: "",
      tax_id: "",
      tax_id_label: "",
      tax_value: "0.00",
      quantity: "1.00",
      unit_price: "1.00",
      net_price: "0.00",
      tax_amount: "0.00",
      total_amount: "0.00",
    };
    setRowsData((prevData) => [...prevData, newRow]);
    setApiData((prevApiData) => [...prevApiData, newRow]);
  };

  const validateRowFields = (rowIndex) => ({
    validate: (value) => {
      const quantity = formatDecimalValue(getValues(`quantity${rowIndex}`)) || 0;
      const unitPrice = formatDecimalValue(getValues(`unit_price${rowIndex}`)) || 0;

      if (quantity === 0 && unitPrice === 0) {
        return "Either Quantity or Unit Price must be greater than zero";
      }
      if (quantity < 0 || unitPrice < 0) {
        return "Values cannot be negative";
      }
      return true;
    },
  });

  const validateAllFields = async () => {
    // const isValid = await trigger();
    let rowValid = true;

    apiData.forEach((row) => {
      const description = row.description;
      const glId = row.gl_id;
      const taxId = row.tax_id;
      const quantity = formatDecimalValue(row.quantity) || 0;
      const unitPrice = formatDecimalValue(row.unit_price) || 0;

      if (!description || !glId || !taxId) {
        rowValid = false;
      }
    });

    setFormSubmitted(true);
    return rowValid;
  };

  const handleSave = async (status) => {
    const isFormValid = await validateAllFields();
    if (!isFormValid) {
      toast.error("Please fix all validation errors before saving");
      return;
    }

    const company_name = getValues("company_name");
    const supplier_name = getValues("supplier_name");
    const posting_date = getValues("posting_date");
    const external_ref = getValues("external_ref");
    const header_description = getValues("header_description");
    const invoice_total = getValues("invoice_total");
    const short_access = getValues("short_access");
    if (!company_name || !supplier_name || !posting_date || !external_ref || !header_description || !invoice_total) {
      toast.error("Please fill all required fields");
      return;
    }

    const totals = calculateTotals();
    // if (status === "posted" && formatDecimalValue(invoice_total) !== formatDecimalValue(totals.gross_total)) {
    //   // toast.error("Invoice Total must equal Gross Total for posting");
    //   return;
    // }

    const finalArray = {
      dataInsert: {
        header: {
          company_id: company_name?.value||company_name,
          supplier_id: supplier_name?.value||supplier_name,
          posting_date: moment(posting_date).format("YYYY-MM-DD"),
          external_ref,
          header_description,
          source: "manual_invoice",
          source_id: "0",
          status,
          invoice_total: formatDecimalValue(invoice_total) || 0,
          invoice_tax: formatDecimalValue(totals.tax_amount) || 0,
          ...(short_access !== "0.00" ? { short_access: formatDecimalValue(short_access) } : {}),
          created_by: UserId,
          ...(headerId && !isCopy ? { header_id: headerId } : {}),
        },
        entries: apiData.map((row) => ({
          ...(isCopy ? {} : { record_id: row.record_id }),
          description: row.description,
          gl_id: row.gl_id || "",
          tax_id: row.tax_id || 0,
          quantity: formatDecimalValue(row.quantity) || 0,
          unit_price: formatDecimalValue(row.unit_price) || 0,
          tax_value: formatDecimalValue(row.tax_value) || 0,
          tax_amount: formatDecimalValue(row.tax_amount) || 0,
          total_price: formatDecimalValue(row.total_amount) || 0,
        })),
      },
    };

    createVoucher(finalArray, {
      onSuccess: (response) => {
        const data = response?.data?.[0];
        if (data?.msgType === "success") {
          setHeaderId(data?.headerId);
          setIsCopy(false);
          handleFetchData();
          toast.success(data?.message);
        } else {
          toast.error(data?.message || "Failed to save invoice");
        }
      },
      onError: (err) => {
        console.error("Save error:", err);
        toast.error(err.response?.data?.message || "Failed to save invoice");
      },
    });
  };

  const deleteEntry = (rowIndex) => {
    const row = rowsData.find((item) => item.index === rowIndex);
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

    if (row?.record_id && row.record_id !== "") {
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
          if (headerId && isCopy) {
            removeRowLocally();
            toast.success("Entry deleted successfully.")
            // Swal.fire({
            //   icon: "success",
            //   title: "Deleted",
            //   text: "Entry deleted successfully.",
            // });
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
                    toast.success(res?.data?.[0]?.message || "Entry deleted successfully.")
                    // Swal.fire({
                    //   icon: "success",
                    //   title: "Success",
                    //   text: res?.data?.[0]?.message || "Entry deleted successfully.",
                    // });
                  } else {
                    toast.error(res?.data?.[0]?.message || "Failed to delete entry")
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
          }
        }
      });
    } else {
      removeRowLocally();
    }
  };

  const renderCell = (value, row, columnKey) => {
    const rowIndex = row.index;
    const fieldName =
      columnKey === "gl_id_label"
        ? `gl_id${rowIndex}`
        : columnKey === "tax_id_label"
          ? `tax_id${rowIndex}`
          : `${columnKey}${rowIndex}`;

    if (columnKey === "action") {
      return (
        <div className="d-flex justify-content-around">
          <button
            type="button"
            onClick={() => deleteEntry(rowIndex)}
            className="bg-customBlue w-7 h-7 rounded-md flex justify-center items-center text-white"
            aria-label={`Delete row ${rowIndex + 1}`}
          >
            <MdDelete />
          </button>
        </div>
      );
    }

    if (columnKey === "gl_id_label") {
      return (
        <div>
          <AntSelectFieldTable
            control={control}
            name={fieldName}
            endpoint={API_ENDPOINTS.GET_COA}
            queryKey="coa.gl_name"
            valueKey="record_id"
            labelKey="gl_name"
            ContcatenateLabel={"gl_code"}
            responseWhich="data"
            placeholder="Select GL"
            rules={{ required: "General Ledger is required" }}
            defaultValue={row.gl_id ? { value: row.gl_id, label: row.gl_id_label } : null}
            onSelectChange={(selected) => updateRowData(rowIndex, "gl_id_label", selected)}
            baseFilters={[]}
            error={errors?.[fieldName]?.message}
          // getValues={getValues}
          />
        </div>
      );
    }

    if (columnKey === "tax_id_label") {
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
            rules={{ required: "Tax is required" }}
            defaultValue={row.tax_id ? { value: row.tax_id, label: row.tax_id_label } : null}
            onSelectChange={(selected) => updateRowData(rowIndex, "tax_id_label", selected)}
            baseFilters={[]}
            error={errors?.[fieldName]?.message}
          // getValues={getValues}
          />
        </div>
      );
    }

    if (columnKey === "net_price" || columnKey === "tax_amount" || columnKey === "total_amount") {
      return (
        <div>
          <InputFieldTable
            control={control}
            name={fieldName}
            value={row[columnKey]}
            disabled={true}
            useComma={true}
            type="number"
            maxDecimalLength={3}
          />
        </div>
      );
    }
 if (columnKey === "quantity" ) {
  return (
      <div>
        <InputFieldTable
          control={control}
          name={fieldName}
          error={errors?.[fieldName]?.message}
          value={row[columnKey] || ""}
          allowNegative={true}
          onChange={(e) => updateRowData(rowIndex, columnKey, e.target.value)}
          type={columnKey === "quantity" || columnKey === "unit_price" ? "number" : "text"}
          useComma={columnKey === "quantity" || columnKey === "unit_price"}
        />
      </div>
    );
 }
    return (
      <div>
        <InputFieldTable
          control={control}
          name={fieldName}
          error={errors?.[fieldName]?.message}
          value={row[columnKey] || ""}
          onChange={(e) => updateRowData(rowIndex, columnKey, e.target.value)}
          type={columnKey === "quantity" || columnKey === "unit_price" ? "number" : "text"}
          useComma={columnKey === "quantity" || columnKey === "unit_price"}
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
    [errors, watch, rowsData, taxOptionData]
  );

  const totals = calculateTotals();

  if (isCreating || isFetchingEntries || headerIsPending) {
    return <Loader />;
  }

  return (
    <div>
      <div className="bg-white shadow-sm p-3 rounded-radiusRegular my-3">
        <h1 className="text-size text-color font-headingweight text-center mb-2">
          {headerId ? "Update Supplier Invoice" : "Add Supplier Invoice"}
        </h1>
        <div>
          <div className="grid grid-cols-3 gap-x-2">
            <div>
              <AntdSelectFieldTable
                label="Company"
                control={control}
                name="company_name"
                endpoint={API_ENDPOINTS.USER_TO_COMPANY}
                queryKey="company_name"
                valueKey="company_id"
                labelKey="company_name"
                responseWhich="result"
                register={register('company_name', { required: 'Company is required' })}
                error={errors.company_name?.message}
                baseFilters={[
                  { key: 'auc.user_id', operator: 'equal', value1: UserId, logical: '' },
                  { key: 'auc.status', operator: 'equal', value1: '1', logical: '' },
                ]}
              />
            </div>
            <div>
              <AntdSelectFieldTable
                label="Supplier"
                control={control}
                name="supplier_name"
                endpoint={API_ENDPOINTS.GET_SUPPLIER}
                queryKey="supplier_name"
                valueKey="record_id"
                labelKey="supplier_name"
                responseWhich="data"
                register={register('supplier_name', { required: 'Supplier is required' })}
                error={errors.supplier_name?.message}
                baseFilters={[{ key: 'sl.status', operator: 'equal', value1: '1', logical: '' }]}
              />
            </div>
            <div>
              <InputFieldTable
                label="Posting Date"
                control={control}
                name="posting_date"
                type="date"
                register={register("posting_date", { required: "Posting date is required" })}
                error={errors.posting_date?.message}
                defaultValue={postingDate}
              />
            </div>
            <div>
              <InputField
                label="External Ref"
                control={control}
                register={register("external_ref", { required: "External ref is required" })}
                error={errors.external_ref?.message}
              />
            </div>
            <div>
              <InputField
                label="Header Description"
                control={control}
                register={register("header_description", { required: "Header description is required" })}
                error={errors.header_description?.message}
              />
            </div>
            <div>
              <InputField
                label="Invoice Total"
                control={control}
                name="invoice_total"
                type="number"
                step="0.0001"
                maxDecimalLength={3}
                allowNegative={true}
                register={register("invoice_total", {
                  required: "Invoice total is required",
                  // min: { value: 0, message: "Must be non-negative" },
                })}
                error={errors.invoice_total?.message}
              />
            </div>
            <div>
              <InputFieldTable
                label="Invoice Tax"
                // control={control}
                name="invoice_tax"
                type="number"
                value={totals.tax_amount}
                disabled={true}
                maxDecimalLength={3}
                useComma={true}
                error={errors.invoice_tax?.message}
              // defaultValue={taxAmount}
              />
            </div>
            <div>
              <InputField
                label="Short Access"
                control={control}
                name="short_access"
                type="number"
                step="0.0001"
                maxDecimalLength={3}
                defaultValue="0.000"
                register={register("short_access", {
                  min: { value: 0, message: "Must be non-negative" },
                })}
                error={errors.short_access?.message}
                mainClass="w-36"
              />
            </div>
          </div>
          <div className="flex my-2 gap-3">
            <CustomButton
              type="button"
              btntext="Save"
              handleClick={() => {
                setStatus("save");
                handleSave("save");
              }}
            />
            <CustomButton
              type="button"
              btntext="Post"
              handleClick={() => {
                setStatus("posted");
                handleSave("posted");
              }}
            />
            <CustomButton
              type="button"
              btntext="Add Row"
              handleClick={handleAddClick}
            />
          </div>
        </div>
      </div>
      <div>
        <ResizableTable
          data={rowsData}
          columns={columns}
          isDense={true}
          height="400px"
          scrollableId="invoice-entries"
          isSelect={false}
          enableScroll={false}
          customFilterFunction={customFilterFunction}
        />
      </div>
      <div className="mt-4 flex justify-end pr-4">
        <div className="bg-gray-100 p-4 rounded-md shadow-sm flex gap-8">
          <div className="font-semibold">
            Net Total: <span className="text-green-600">{formatNumberDisplay(totals.net_price)}</span>
          </div>
          <div className="font-semibold">
            Tax Total: <span className="text-green-600">{formatNumberDisplay(totals.tax_amount)}</span>
          </div>
          <div className="font-semibold">
            Gross Total: <span className="text-green-600">{formatNumberDisplay(totals.gross_total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withPermissionCheck(CreateSupplierInvoice, "edit-supplier-Invoice");