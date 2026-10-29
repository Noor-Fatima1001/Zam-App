import { useEffect, useState } from "react";
import ResizableTable from "../../components/table/ResizableTable";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useForm } from "react-hook-form";
import { getFromLocalStorage } from "../../config/crypto-file";
import InputField from "../../components/form-elements/InputField";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { toast } from "react-toastify";
import CustomButton from "../../components/button/CustomButton";
import withPermissionCheck from "../../config/withPermissionCheck";
import AntSSelectField from "../../AntSSelectField";
import AntdSelectFieldTable from "../../AntdSelectFieldTable";
import moment from "moment";
import InputFieldTable from "../../components/form-elements/InputFieldTable";
import { MdDelete } from "react-icons/md";
import { formatNumberDisplay, formatPrintNumberDisplay, formatUnderScoreValue } from "../../utils/helper.function";
import { filterAndSortData } from "../../utils/helper.function";
import AntSelectFieldTable from "../../AntSelectFieldTable";

const AddPayment = () => {
  const {
    register,
    control,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      product_type: { value: "recipe", label: "Recipe" },
    },
  });

  const UserId = getFromLocalStorage("UserId");
  const { mutate: mutatePaymentHead } = useGlobelApi(API_ENDPOINTS.PAYMENT_HEAD_LIST);
  const { mutate: fetchUnpaidInvoices } = useGlobelApi(API_ENDPOINTS.GET_UNPAID_INVOICES);
  const { mutate: fetchPaymentEntries } = useGlobelApi(API_ENDPOINTS.PAYMENT_ENTRIES);
  const { mutate: createPayment } = useGlobelApi(API_ENDPOINTS.CREATE_PAYMENT);
  const { mutate: fetchUser } = useGlobelApi(API_ENDPOINTS.USER_TO_COMPANY);
  const { mutate: FetchEntries } = useGlobelApi(API_ENDPOINTS.PAYMENT_ENTRIES_GL);
  const [rowsData, setRowsData] = useState([]);
  const [apiData, setApiData] = useState([]);
  const [postedEntries, setPostedEntries] = useState([]);
  const [presfilters, setPresFilters] = useState();
  const [preservedConfig, setPreservedConfig] = useState();
  const [selectedStatus, setSelectedStatus] = useState(false);
  const [user, setUser] = useState();
  const [headerId, setHeaderId] = useState();
  const [printData, setPrintData] = useState();
  const [selectedOption, setSelectedOption] = useState({ id: 1, name: "Invoice Ref", type: "ref_invoice" });
  const [nextRowId, setNextRowId] = useState(0);
  const [selectAll, setSelectAll] = useState(false);
  const [companyId, setCompanyId] = useState();
  const [paymentTotal, setPaymentTotal] = useState();

  const handleSelectAll = (e) => {
    if (selectedOption.id !== 1 || headerId) return;
    const checked = e.target.checked;
    const updatedData = apiData.map((row) => ({
      ...row,
      isEdit: checked,
      paid_amount: checked ? row.open_amount : "",
    }));
    setApiData(updatedData);
    const sortedData = filterAndSortData(
      updatedData,
      updatedData,
      setRowsData,
      presfilters,
      preservedConfig,
      setPresFilters,
      setPreservedConfig,
      presfilters || {},
      preservedConfig || {}
    );
    setRowsData(sortedData);
    setSelectAll(checked);
  };

  const optionsConfig = {
    1: {
      name: "Invoice Ref",
      headers: [
        {
          key: "select",
          label: (
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="h-5 w-5"
            />
          ),
          width: 100,
          sortable: false,
          filterable: false,
        },
        { key: "external_ref", label: "External Ref", width: 200, sortable: true, filterable: true },
        { key: "invoice_date", label: "Invoice Date", width: 150, sortable: true, filterable: true },
        { key: "invoice_total", label: "Amount", width: 150, sortable: true, filterable: true },
        { key: "open_amount", label: "Open Amount", width: 200, sortable: true, filterable: true },
        { key: "paid_amount", label: "Paid Amount", width: 200, sortable: true, filterable: true },
        { key: "remaining_amount", label: "Remaining Amount", width: 250, sortable: true, filterable: true },
      ],
      fetchEntries: fetchUnpaidInvoices,
      endpoint: fetchUnpaidInvoices,
      validateEntries: (rows) => {
        const rowErrors = [];
        rows.forEach((row, index) => {
          if (row.isEdit) {
            const paidAmount = parseFloat(row.paid_amount) || 0;
            if (paidAmount === null || paidAmount === "") {
              rowErrors.push(`Paid Amount for Entry no. ${index + 1} is required`);
            } else if (paidAmount > parseFloat(row.open_amount)) {
              rowErrors.push(`Paid Amount for Entry no. ${index + 1} cannot exceed Open Amount (${row.open_amount})`);
            }
          }
        });
        return rowErrors;
      },
      formatEntries: (data) =>
        data.map((item, index) => ({
          index,
          ...item,
          invoice_total: parseFloat(item.invoice_total)?.toFixed(3),
          open_amount: parseFloat(item.open_amount)?.toFixed(3),
          isEdit: false,
        })),
      submitEntries: (rows) =>
        rows
          .filter((row) => row.isEdit)
          .map((row) => ({
            sup_invoice_id: row?.invoice_id,
            paid_amount: row?.paid_amount,
          })),
      calculateTotal: (rows) =>
        rows
          .filter((row) => row.isEdit)
          .reduce((sum, item) => sum + parseFloat(item.paid_amount || 0), 0).toFixed(3),
    },
    2: {
      name: "GL Ref",
      headers: [
        { key: "action", label: "Action", width: 100 },
        { key: "description", label: "Description", width: 300, sortable: true, filterable: true },
        { key: "gl_name", label: "GL Account", width: 300, sortable: true, filterable: true },
        { key: "debit", label: "Debit", width: 200, sortable: true, filterable: true },
        { key: "credit", label: "Credit", width: 200, sortable: true, filterable: true },
      ],
      validateEntries: (rows) => {
        const rowErrors = [];
        rows.forEach((row, index) => {
          const debit = parseFloat(row.debit) || 0;
          const credit = parseFloat(row.credit) || 0;
          if (!row.gl_id) {
            rowErrors.push(`GL Account for Entry no. ${index + 1} is required`);
          }
          if (debit === 0 && credit === 0) {
            rowErrors.push(`Either Debit or Credit for Entry no. ${index + 1} must be greater than zero`);
          }
          if (debit > 0 && credit > 0) {
            rowErrors.push(`Only one of Debit or Credit for Entry no. ${index + 1} can be non-zero`);
          }
          if (debit < 0 || credit < 0) {
            rowErrors.push(`Values for Entry no. ${index + 1} cannot be negative`);
          }
        });
        return rowErrors;
      },
      formatEntries: (data) =>
        data.map((item, idx) => ({
          rowId: idx,
          gl_id: item.gl_id.toString(),
          gl_name: item.gl_name || "",
          description: item.description || "",
          debit: parseFloat(item.debit).toFixed(3) || "0",
          credit: parseFloat(item.credit).toFixed(3) || "0",
          isEdit: true,
        })),
      submitEntries: (rows) =>
        rows.map((row) => ({
          gl_id: row.gl_id,
          description: row.description,
          debit: parseFloat(row.debit) || 0,
          credit: parseFloat(row.credit) || 0,
        })),
      calculateTotal: (rows) =>
        rows.reduce((sum, item) => sum + parseFloat(item.debit || 0) - parseFloat(item.credit || 0), 0).toFixed(3),
      defaultRows: () => [
        { rowId: 0, description: "", gl_id: "", gl_name: "", debit: "0", credit: "0", isEdit: true },
      ],
    },
    3: {
      name: "Advance Payment",
      headers: [],
      validateEntries: () => [],
      calculateTotal: () => "0",
      formatEntries: () => [],
      submitEntries: () => [],
      defaultRows: () => [],
    },
  };

  useEffect(() => {
    fetchUser(
      {
        filters: [
          { key: "auc.user_id", operator: "equal", value1: UserId, logical: "" },
        ],
        limit: 0,
        offset: 0,
      },
      {
        onSuccess: (response) => {
          setUser(response?.result?.[0]);
        },
      }
    );
  }, []);

  const handleFetchPaymentData = (id) => {
    if (!headerId && !id) return;
    const baseFilter = [{ key: "ph.id", operator: "equal", value1: headerId || id, logical: "" }];
    mutatePaymentHead(
      { filters: baseFilter, limit: 0, offset: 0, orderby: "" },
      {
        onSuccess: (response) => {
          if (response?.success) {
            setPrintData(response?.data?.[0] || []);
            setValue("payment_total", response?.data?.[0].payment_total);
          }
        },
      }
    );
  };

  const handleFetchEntries = () => {
    const config = optionsConfig[selectedOption.id];
    const company_id = getValues("company_name")?.value;
    const supplier_id = getValues("supplier_name")?.value;

    if (selectedOption.id === 1) {
      const headerData = { company_id, supplier_id };
      config.fetchEntries(
        { headerData, filters: [], limit: 0, offset: 0 },
        {
          onSuccess: (response) => {
            let currentId = nextRowId;
            const data = response?.data || [];
            const formatted = data.map((item) => ({
              rowId: currentId++,
              ...item,
              invoice_total: parseFloat(item.invoice_total)?.toFixed(3),
              open_amount: parseFloat(item.open_amount)?.toFixed(3),
              isEdit: false,
            }));
            setNextRowId(currentId);
            setApiData(formatted);
            const sortedData = filterAndSortData(
              formatted,
              formatted,
              setRowsData,
              presfilters,
              preservedConfig,
              setPresFilters,
              setPreservedConfig,
              presfilters || {},
              preservedConfig || {}
            );
            setRowsData(sortedData);
          },
        }
      );
    }
  };

  const handleFetchPrintEntries = () => {
    const baseFilter = [{ key: "payment_header_id", operator: "equal", value1: headerId, logical: "" }];
    fetchPaymentEntries(
      { filters: baseFilter, limit: 0, offset: 0, orderby: "" },
      {
        onSuccess: (response) => {
          return response;
        },
      }
    );
  };

  useEffect(() => {
    if (headerId) {
      if (selectedOption.id === 1) {
        handleFetchPrintEntries();
      } else {
        handleFetchEntries();
      }
    }
  }, [headerId]);

  useEffect(() => {
    const isCompany = watch("company_name");
    const isSupplier = watch("supplier_name");
    if (isCompany && isSupplier) {
      setSelectedStatus(true);
      if (selectedOption.id === 1) {
        handleFetchEntries();
      } else {
        let currentId = nextRowId;
        const defaults = optionsConfig[selectedOption.id]?.defaultRows?.() || [];
        const formattedDefaults = defaults.map((item) => ({
          ...item,
          rowId: currentId++,
        }));
        setRowsData(formattedDefaults);
        setApiData(formattedDefaults);
        setNextRowId(currentId);
      }
    } else {
      setSelectedStatus(false);
    }
  }, [watch("company_name"), watch("supplier_name"), selectedOption]);

  useEffect(() => {
    if (selectedOption.id === 1) {
      const allSelected = apiData.length > 0 && apiData.every((row) => row.isEdit);
      setSelectAll(allSelected);
    }
  }, [apiData, selectedOption.id]);

  const updateRowData = (rowId, fieldName, value) => {
    setApiData((prevApi) => {
      const updatedApi = prevApi.map((item) => {
        if (item.rowId === rowId) {
          const updatedItem = { ...item, [fieldName]: value };
          if (selectedOption.id === 2) {
            if (fieldName === "gl_name") {
              updatedItem.gl_id = value.value;
              updatedItem.gl_name = value.label;
            } else if (fieldName === "debit" && value && parseFloat(value) > 0) {
              updatedItem.credit = "0";
            } else if (fieldName === "credit" && value && parseFloat(value) > 0) {
              updatedItem.debit = "0";
            }
          }
          return updatedItem;
        }
        return item;
      });
      const sortedData = filterAndSortData(
        updatedApi,
        updatedApi,
        setRowsData,
        presfilters,
        preservedConfig,
        setPresFilters,
        setPreservedConfig,
        presfilters || {},
        preservedConfig || {}
      );
      setRowsData(sortedData);
      return updatedApi;
    });
  };

  const handleAddRow = () => {
    if (selectedOption.id !== 2) return;
    const newRowId = nextRowId;
    const newRow = {
      rowId: newRowId,
      description: "",
      gl_id: "",
      gl_name: "",
      debit: "0",
      credit: "0",
      isEdit: true,
    };
    setApiData((prev) => {
      const updatedData = [...prev, newRow];
      const sortedData = filterAndSortData(
        updatedData,
        updatedData,
        setRowsData,
        presfilters,
        preservedConfig,
        setPresFilters,
        setPreservedConfig,
        presfilters || {},
        preservedConfig || {}
      );
      setRowsData(sortedData);
      return updatedData;
    });
    setNextRowId(newRowId + 1);
  };

  const deleteRow = (rowId) => {
    setApiData((prev) => {
      const updatedData = prev.filter((item) => item.rowId !== rowId);
      const sortedData = filterAndSortData(
        updatedData,
        updatedData,
        setRowsData,
        presfilters,
        preservedConfig,
        setPresFilters,
        setPreservedConfig,
        presfilters || {},
        preservedConfig || {}
      );
      setRowsData(sortedData);
      return updatedData;
    });
  };

  const handleCheckboxToggle = (rowId) => {
    if (selectedOption.id !== 1 || headerId) return;
    setApiData((prevApi) => {
      const updatedApi = prevApi.map((item) => {
        if (item.rowId === rowId) {
          const isEdit = !item.isEdit;
          const updatedItem = {
            ...item,
            isEdit,
            paid_amount: isEdit ? item.paid_amount || item.open_amount : "",
          };
          return updatedItem;
        }
        return item;
      });
      const sortedData = filterAndSortData(
        updatedApi,
        updatedApi,
        setRowsData,
        presfilters,
        preservedConfig,
        setPresFilters,
        setPreservedConfig,
        presfilters || {},
        preservedConfig || {}
      );
      setRowsData(sortedData);
      return updatedApi;
    });
  };

  const renderCell = (value, row, columnKey) => {
    const rowId = row.rowId;
    if (columnKey === "select" && selectedOption.id === 1 && !headerId) {
      return (
        <input
          type="checkbox"
          checked={row.isEdit || false}
          onChange={() => handleCheckboxToggle(rowId)}
          className="h-5 w-5"
        />
      );
    }

    if (selectedOption.id === 1) {
      if (columnKey === "invoice_date") {
        return <span>{value ? moment(value).format("DD-MM-YYYY") : ""}</span>;
      }
      if (columnKey === "remaining_amount") {
        return (
          <span>
            {row.paid_amount && row.isEdit
              ? (parseFloat(row.open_amount) - parseFloat(row.paid_amount)).toFixed(3)
              : parseFloat(row?.open_amount).toFixed(3)}
          </span>
        );
      }
      if (columnKey === "paid_amount") {
        return row.isEdit ? (
          <InputFieldTable
            control={control}
            name={`paid_amount${rowId}`}
            value={row[columnKey]}
            allowNegative={true}
            type="number"
            error={errors?.[`paid_amount${rowId}`]?.message}
            onChange={(e) => updateRowData(rowId, columnKey, e.target.value)}
          />
        ) : "";
      }
      return <div>{value}</div>;
    } else if (selectedOption.id === 2) {
      const fieldName = columnKey === "gl_name" ? `gl_id${rowId}` : `${columnKey}${rowId}`;
      if (columnKey === "action") {
        return !headerId ? (
          <div className="d-flex justify-content-around">
            <button
              type="button"
              onClick={() => deleteRow(rowId)}
              className="bg-customBlue w-7 h-7 rounded-md flex justify-center items-center text-white"
            >
              <MdDelete />
            </button>
          </div>
        ) : "";
      }
      if (columnKey === "gl_name" && !headerId) {
        return (
          <div>
            <AntSelectFieldTable
              control={control} // Pass the control prop
              name={fieldName}
              endpoint={API_ENDPOINTS.GET_COA}
              queryKey="coa.gl_name"
              valueKey="record_id"
              labelKey="gl_name"
              ConcatenateLabel="gl_code"
              responseWhich="data"
              placeholder="Select GL"
              onSelectChange={(selected) => updateRowData(rowId, "gl_name", selected)}
              defaultValue={row?.gl_id ? { value: row?.gl_id, label: row?.gl_name } : null}
            />
          </div>
        );
      }
      return !headerId ? (
        <div>
          <InputFieldTable
            control={control}
            name={fieldName}
            register={register(fieldName, {
              required: columnKey !== "description" ? `${columnKey} is required` : false,
              min:
                columnKey === "debit" || columnKey === "credit"
                  ? { value: 0, message: "Must be non-negative" }
                  : undefined,
            })}
            error={errors?.[fieldName]?.message}
            value={value}
            useComma={true}
            onChange={(e) => updateRowData(rowId, columnKey, e.target.value)}
            type={columnKey === "debit" || columnKey === "credit" ? "number" : "text"}
          />
        </div>
      ) : (
        <div>{value}</div>
      );
    }
  };

  useEffect(() => {
    const total = optionsConfig[selectedOption.id].calculateTotal(apiData);
    setValue("payment_total", total);
  }, [apiData, selectedOption]);

  const HandleSave = async () => {
    const company_id = getValues("company_name")?.value;
    const supplier_id = getValues("supplier_name")?.value;
    const posting_date = getValues("posting_date");
    const company_bank_id = getValues("company_bank_name")?.value;
    const payment_type = getValues("payment_type");
    const payment_total = paymentTotal;
    const payment_ref = getValues("payment_ref");
    const description = getValues("description");
    const missingFields = [];
    if (!company_id) missingFields.push("Company Name");
    if (!supplier_id) missingFields.push("Supplier Name");
    if (!posting_date) missingFields.push("Posting Date");
    if (!company_bank_id) missingFields.push("Company Bank Name");
    if (!payment_type) missingFields.push("Payment Type");
    if (!payment_total) missingFields.push("Payment Total");
    if (payment_type === "outgoing_cheque_payment" && !payment_ref) missingFields.push("Payment Reference");
    if (!description) missingFields.push("Description");

    if (missingFields.length > 0) {
      toast.error(`Please fill the following required field(s): ${missingFields.join(", ")}`);
      return;
    }

    const config = optionsConfig[selectedOption.id];
    const finalArray = {
      header: {
        company_id,
        supplier_id,
        posting_date: moment(posting_date).format("YYYY-MM-DD"),
        company_bank_id,
        payment_type,
        payment_mode: selectedOption?.type,
        status: "posted",
        payment_total,
        ...(payment_type === "outgoing_cheque_payment" ? { payment_ref } : {}),
        description,
        created_by: UserId,
        ...(selectedOption.id === 2 ? { source: "manual", source_id: 0 } : {}),
      },
      entries: config?.submitEntries(apiData),
    };

    createPayment(
      { dataInsert: finalArray },
      {
        onSuccess: (response) => {
          const data = response?.data?.[0];
          if (data?.msgType === "success") {
            if (selectedOption.id === 1) {
              const formattedPostedEntries = apiData
                .filter((row) => row.isEdit)
                .map((row) => ({
                  rowId: row.rowId,
                  invoice_id: row.invoice_id,
                  external_ref: row.external_ref,
                  invoice_date: row.invoice_date,
                  invoice_total: row.invoice_total,
                  open_amount: row.open_amount,
                  paid_amount: row.paid_amount,
                }));
              setPostedEntries(formattedPostedEntries);
            } else if (selectedOption.id === 2) {
              const formattedPostedEntries = apiData.map((row) => ({
                rowId: row.rowId,
                gl_id: row.gl_id,
                gl_name: row.gl_name,
                description: row.description,
                debit: row.debit,
                credit: row.credit,
              }));
              setPostedEntries(formattedPostedEntries);
            }
            setHeaderId(data?.headerId);
            handleFetchPaymentData(data?.headerId);
            handleFetchEntries();
            toast[data.msgType](data?.message);
          }
          if (selectedOption.id === 3) {
            handleAdvancePaymentEntries(data?.headerId);
          }
        },
        onError: (err) => {
          console.log(err);
          toast.error(`Failed to save ${selectedOption.name.toLowerCase()}`);
        },
      }
    );
  };

  const handleAdvancePaymentEntries = (id) => {
    const baseFilter = [
      { key: "ph.id", operator: "equal", value1: id, logical: "" },
    ];
    try {
      FetchEntries(
        {
          filters: [...baseFilter],
          limit: 0,
          offset: 0,
          orderby: "",
        },
        {
          onSuccess: (response) => {
            let currentId = nextRowId;
            const data = response?.data?.map((item) => ({
              rowId: currentId++,
              gl_name: item?.gl_name,
              description: item?.description,
              credit: parseFloat(item?.credit).toFixed(3),
              debit: parseFloat(item?.debit).toFixed(3),
            }));
            setNextRowId(currentId);
            setPostedEntries(data);
            const sortedData = filterAndSortData(
              data,
              data,
              setRowsData,
              presfilters,
              preservedConfig,
              setPresFilters,
              setPreservedConfig,
              presfilters || {},
              preservedConfig || {}
            );
            setRowsData(sortedData);
            setApiData(data);
          },
          onError: (err) => {
            console.error("Error fetching entries:", err);
            toast.error("Failed to fetch payment entries.");
          },
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    if (!printData || !postedEntries?.length) {
      toast.error("Please select a payment with entries to print.");
      return;
    }

    const { company_name, supplier_name, bank_name, posting_date, payment_method, payment_ref, record_id, payment_mode, payment_type } = printData;
    const totalAmount = printData?.payment_total;

    // Convert posting_date to proper formatted date
    const formattedPaymentDate = posting_date
      ? moment(posting_date, ["YYYY-MM-DD", "DD-MM-YYYY", moment.ISO_8601]).format("DD-MM-YYYY")
      : "N/A";

    const FIRST_PAGE_ENTRIES = 15;
    const SUBSEQUENT_PAGE_ENTRIES = 20;
    const LAST_PAGE_MAX_ENTRIES = 10;

    // ✅ Convert invoice_date into Date objects & sort ASC
    const entries = selectedOption.id === 1
      ? postedEntries
        .map(entry => ({
          ...entry,
          invoice_date: moment(entry.invoice_date, ["YYYY-MM-DD", "DD-MM-YYYY", moment.ISO_8601]).toDate()
        }))
        .sort((a, b) => a.invoice_date - b.invoice_date)
      : postedEntries;

    let remainingEntries = entries.length;
    const pages = [];

    if (remainingEntries > 0) {
      pages.push(Math.min(FIRST_PAGE_ENTRIES, remainingEntries));
      remainingEntries -= pages[0];
    }

    while (remainingEntries > LAST_PAGE_MAX_ENTRIES) {
      pages.push(SUBSEQUENT_PAGE_ENTRIES);
      remainingEntries -= SUBSEQUENT_PAGE_ENTRIES;
    }

    if (remainingEntries > 0) {
      pages.push(Math.min(LAST_PAGE_MAX_ENTRIES, remainingEntries));
    }

    const totalPages = pages.length;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Failed to open print window. Please check browser settings.");
      return;
    }

    try {
      printWindow.document.write(`
      <html>
        <head>
          <title>Remittance Advice</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.5;
            }
            .supplier-w {
              width: 255px;
            }
            .page {
              position: relative;
              page-break-after: always;
              padding-bottom: 120px;
            }
            .page:last-child {
              page-break-after: auto;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              position: relative;
            }
            .header h1 {
              margin: 5px 0;
              font-size: 24px;
            }
            .header h2 {
              margin: 5px 0;
              font-size: 18px;
              color: #ff0000;
              font-family: 'Brush Script MT', cursive;
            }
            .subheader {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              margin-bottom: 20px;
            }
            .greeting {
              margin-top: 20px;
              margin-bottom: 20px;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 14px;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .total {
              text-align: right;
              font-weight: bold;
              margin-top: 10px;
              font-size: 14px;
            }
            .footer {
              font-size: 14px;
              margin-bottom: 120px;
            }
            .signature {
              margin-top: 0px;
            }
            .footer-lines {
              position: fixed;
              left: 0;
              right: 0;
              bottom: 0px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              width: 100%;
              padding: 0 20px;
              box-sizing: border-box;
              z-index: 1000;
              background-color: white;
            }
            .footer-lines div {
              flex: 1;
              text-align: center;
            }
            .sub-header-line {
              display: flex;
              justify-content: space-between;
            }
            @media print {
              @page {
                margin: 10mm 10mm 120px 10mm;
                size: auto;
              }
              body {
                margin: 0;
                padding: 10mm;
              }
              .page {
                padding: 10mm;
                box-sizing: border-box;
              }
              table {
                page-break-inside: auto;
                margin-bottom: 10px;
              }
              th {
                background-color: #d8d8d8 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              .footer {
                position: relative;
                margin-bottom: 120px;
              }
              .footer-lines {
                position: fixed;
                bottom: 0px;
                z-index: 1000;
                background-color: white;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none;
              }
              body::after {
                content: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${pages.map((entriesCount, pageIndex) => {
        let startIdx = pageIndex === 0 ? 0 : pages.slice(0, pageIndex).reduce((sum, count) => sum + count, 0);
        const endIdx = startIdx + entriesCount;
        const pageEntries = entries.slice(startIdx, endIdx);
        const currentPage = pageIndex + 1;

        return `
              <div class="page">
                <div class="header">
                  ${pageIndex === 0 ? `<h1>Remittance Advice</h1>` : ''}
                  <div style="text-align: end;font-size:14px"> 
                    <span style="margin-left: 20px;">Page: ${currentPage}/${totalPages}</span>
                  </div>
                  <div style="text-align: end;font-size:14px">
                    <span><b>Date:</b> ${new Date()
            .toLocaleString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .replace(",", "")}</span>
                  </div>
                </div>
                ${pageIndex === 0 ? `
                <div class="">
                  <div><b>Document ID:</b> ${record_id || ""}</div>
                  <div class="sub-header-line">
                    <div><b>Company:</b> ${company_name || ""}</div>
                    <div class="supplier-w"><b>Supplier:</b> ${supplier_name || ""}</div>
                  </div>
                  <div><b>Payment Type:</b> ${formatUnderScoreValue(payment_type) || ""}</div>
                  <div><b>Payment Mode:</b> ${formatUnderScoreValue(payment_mode) || ""}</div>
                  <div><b>Bank name:</b> ${bank_name || "N/A"}</div>
                </div>
                <div class="greeting">
                  <div><b>Dear Sir or Madam,</b></div>
                  <div>
                    On ${formattedPaymentDate}, the amount of ${totalAmount} was settled 
                    ${payment_method === "outgoing_bank_transfer"
              ? `by ${payment_method || "check"} (number ${payment_ref || "N/A"})`
              : ""
            } 
                    for the items listed below.
                  </div>
                </div>
                ` : ''}
                <table>
                  <thead>
                    <tr>
                      ${selectedOption.id === 1 ? `
                        <th>Invoice Date</th>
                        <th>External Ref</th>
                        <th>Invoice Total</th>
                        <th>Paid Amount</th>
                      ` : `
                        <th>Description</th>
                        <th>GL Account</th>
                        <th>Debit</th>
                        <th>Credit</th>
                      `}
                    </tr>
                  </thead>
                  <tbody>
                    ${pageEntries.map((entry) =>
              selectedOption.id === 1
                ? `
                          <tr>
                            <td>${moment(entry?.invoice_date).format("DD-MM-YYYY") || ""}</td>
                            <td>${entry.external_ref || ""}</td>
                            <td>${formatPrintNumberDisplay(entry.invoice_total) || "0.00"}</td>
                            <td>${formatPrintNumberDisplay(entry.paid_amount) || "0.00"}</td>
                          </tr>
                        `
                : `
                          <tr>
                            <td>${entry.description || ""}</td>
                            <td>${entry.gl_name || ""}</td>
                            <td>${formatPrintNumberDisplay(entry.debit) || "0.00"}</td>
                            <td>${formatPrintNumberDisplay(entry.credit) || "0.00"}</td>
                          </tr>
                        `
            ).join("")}
                  </tbody>
                </table>
                ${pageIndex === totalPages - 1 ? `
                <div class="total">
                  TOTAL: ${totalAmount}
                </div>
                <div class="footer">
                  <div>Yours sincerely,</div>
                  <div class="signature">
                    <div>${user?.first_name + " " + user?.last_name || "N/A"}</div>
                    <div>${company_name || "Indochine Restaurant LTD"}</div>
                  </div>
                </div>
                ` : ''}
                <div class="footer-lines">
                  <div>Accounts: ________________</div>
                  <div>Received By: ________________</div>
                  <div>Operations: ________________</div>
                </div>
              </div>
            `;
      }).join("")}
        </body>
      </html>
    `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error("Error generating print window:", error);
      toast.error("An error occurred while generating the print window.");
    }
  };


  const handleCheckboxChange = (option) => {
    setSelectedOption(option);
    setRowsData([]);
    setApiData([]);
    setPostedEntries([]);
    setNextRowId(0);
    setSelectAll(false);
    setPresFilters(undefined);
    setPreservedConfig(undefined);
    if (option.id === 2) {
      let currentId = 0;
      const defaults = optionsConfig[2].defaultRows().map((item) => ({
        ...item,
        rowId: currentId++,
      }));
      setRowsData(defaults);
      setApiData(defaults);
      setNextRowId(currentId);
    } else {
      handleFetchEntries();
    }
  };

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

  const options = [
    { id: 1, name: "Invoice Ref", type: "ref_invoice" },
    { id: 2, name: "GL Ref", type: "direct_gl" },
    { id: 3, name: "Advance Payment", type: "advance_payment" },
  ];

  return (
    <div>
      <div className="bg-white shadow-sm p-3 rounded-radiusRegular mt-2 my-3">
        <h2 className="text-size text-color font-headingweight text-center mb-2">
          Add Payment
        </h2>
        <div>
          <div className="grid grid-cols-3 gap-x-2">
            <AntdSelectFieldTable
              label="Company"
              control={control}
              name="company_name"
              endpoint={API_ENDPOINTS.USER_TO_COMPANY}
              queryKey="company_name"
              valueKey="company_id"
              labelKey="company_name"
              responseWhich="result"
              rules={{ required: "Company is required." }}
              onSelectChange={(selectedOption) => setCompanyId(selectedOption?.value)}
              error={errors.company_name}
              baseFilters={[
                { key: "auc.user_id", operator: "equal", value1: UserId, logical: "" },
                { key: "auc.status", operator: "equal", value1: "1", logical: "" },
              ]}
            />
            <AntdSelectFieldTable
              label="Supplier"
              control={control}
              name="supplier_name"
              endpoint={API_ENDPOINTS.GET_SUPPLIER}
              queryKey="supplier_name"
              valueKey="record_id"
              labelKey="supplier_name"
              responseWhich="data"
              rules={{ required: "Supplier is required." }}
              error={errors.supplier_name}
              baseFilters={[{ key: "sl.status", operator: "equal", value1: "1", logical: "" }]}
            />
            <InputField
              label="Posting Date"
              control={control}
              type="date"
              register="posting_date"
              rules="Posting Date is required"
              error={errors?.posting_date}
              field_disable={!selectedStatus}
            />
            <AntdSelectFieldTable
              label="Bank Name"
              control={control}
              name="company_bank_name"
              endpoint={API_ENDPOINTS.ASSIGN_BANK_LIST}
              queryKey="bank_name"
              valueKey="record_id"
              labelKey="bank_name"
              responseWhich="data"
              rules={{ required: "Bank Name is required." }}
              error={errors.company_bank_name}
              baseFilters={[
                { key: "abtc.company_id", operator: "equal", value1: companyId, logical: "" }
              ]}
              disable={!selectedStatus}
              ContcatenateLabel="account_number"
            />
            <AntSSelectField
              label="Payment Type"
              control={control}
              isClearable={false}
              name="payment_type"
              options={[
                { value: "outgoing_bank_transfer", label: "Outgoing Bank Transfer" },
                { value: "outgoing_cheque_payment", label: "Outgoing Cheque Payment" },
              ]}
              rules={{ required: "Please select" }}
              error={errors.payment_type?.message}
              disable={!selectedStatus}
            />
            <InputFieldTable
              label="Payment Total"
              name="payment_total"
              type="number"
              useComma={true}
              value={paymentTotal}
              onChange={(e) => { setPaymentTotal(e.target.value) }}
              register={register("payment_total", { required: "Payment Total is required" })}
              error={errors.payment_total?.message}
              field_disable={!selectedStatus}
            />
            <InputField
              label="Payment ref/Cheque#"
              name="payment_ref"
              type="text"
              register={register("payment_ref")}
              error={errors.payment_ref?.message}
              field_disable={!selectedStatus}
            />
            <InputField
              label="Description"
              name="description"
              type="text"
              register={register("description", { required: "Description is required" })}
              error={errors.description?.message}
              field_disable={!selectedStatus}
            />
          </div>

          <div className="flex my-2 gap-3">
            {!headerId && (
              <CustomButton type="button" btntext="Post" handleClick={HandleSave} />
            )}
            {headerId && (
              <CustomButton type="button" btntext="Print" handleClick={handlePrint} />
            )}
            {selectedOption.id === 2 && !headerId && (
              <CustomButton type="button" btntext="Add Row" handleClick={handleAddRow} />
            )}
          </div>
        </div>
        <div>
          <div className="d-flex">
            {options.map((option) => (
              <label key={option.id} className="flex items-center space-x-2 cursor-pointer mx-2">
                <input
                  type="checkbox"
                  disabled={headerId}
                  checked={selectedOption.id === option.id}
                  onChange={() => handleCheckboxChange(option)}
                  className="h-5"
                />
                <span className="text-gray-700">{option.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div>
        {selectedOption.id === 3 ? null : (
          <ResizableTable
            data={rowsData}
            columns={optionsConfig[selectedOption.id].headers.map((header) => ({
              ...header,
              render: (value, row) => renderCell(value, row, header.key),
            }))}
            resetColumns={true}
            height="400px"
            scrollableId={selectedOption.id === 1 ? "recipe-entries" : "journal-entries"}
            isSelect={false}
            enableScroll={false}
            isDense={true}
            customFilterFunction={customFilterFunction}
          />
        )}
        {selectedOption.id === 2 && (
          <div className="mt-4 flex justify-end pr-4">
            <div className="bg-gray-100 p-3 rounded-md shadow-sm flex gap-8">
              <div className="font-medium">
                Total Debit: <span className="text-green-600">{apiData.reduce((sum, row) => sum + parseFloat(row.debit || 0), 0).toFixed(3)}</span>
              </div>
              <div className="font-medium">
                Total Credit: <span className="text-red-600">{apiData.reduce((sum, row) => sum + parseFloat(row.credit || 0), 0).toFixed(3)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default withPermissionCheck(AddPayment, "add-payment");