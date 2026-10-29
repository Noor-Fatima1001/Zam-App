import { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import moment from "moment";
import ResizableTable from "../../components/table/ResizableTable";
import Loader from "../../components/Loader";
import { toast } from "react-toastify";
import { formatNumberDisplay, formatPrintNumberDisplay, formatUnderScoreValue } from "../../utils/helper.function";
import dayjs from "dayjs";
import { Modal } from "antd";
import Swal from "sweetalert2";

const paymentTypeOptions = [
  { value: "outgoing_cheque_payment", label: "Outgoing Cheque Payment" },
  { value: "incoming_cheque_payment", label: "Incoming Cheque Payment" },
  { value: "outgoing_bank_transfer", label: "Outgoing Bank Transfer" },
  { value: "incoming_bank_transfer", label: "Incoming Bank Transfer" },
];

const paymentStatus = [
  { value: "cancelled", label: "Cancelled" },
  { value: "ready_for_transfer", label: "Ready For Transfer" },
];
const paymentMoodOptions = [
  { value: "ref_invoice", label: "Invoice Ref" },
  { value: "direct_gl", label: "GL Ref" },
  { value: "advance_payment", label: "Advance Payment" },
];

const PaymentList = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.PAYMENT_HEAD_LIST);
  const { mutate: FetchEntries, isPending: EnteriesPending } = useGlobelApi(API_ENDPOINTS.PAYMENT_ENTRIES);
  const { mutate: FetchEntriesForGL, isPending: EnteriesPendingGL } = useGlobelApi(API_ENDPOINTS.PAYMENT_ENTRIES_GL);
  const { mutate: reversal } = useGlobelApi(API_ENDPOINTS.PAYMENT_REVERSAL);
  const { mutate: fetchDataForExcel } = useGlobelApi(API_ENDPOINTS.PAYMENT_HEAD_LIST);
  const { mutate: fetchInvoice, isPending: isInoicePending } = useGlobelApi(API_ENDPOINTS.GET_SUPPLIER_INVOICE_ENTERIES);
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const UserId = getFromLocalStorage("UserId");
  const [moduleData, setModuleData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("ph.id");
  const [jrEnteries, setJrEnteries] = useState([]);
  const [invoiceEntries, setInvoiceEntries] = useState([]);
  const [isEntriesLoading, setIsEntriesLoading] = useState(false);
  const limit = 10;
  const navigate = useNavigate();
  const [entriesType, setEntriesType] = useState();

  const handleFetchdata =
    (filters, reset = false, orderBy = "ph.id DESC") => {
      mutate(
        {
          filters: filters || null,
          limit,
          offset: reset ? 0 : offset,
          orderby: orderBy,
        },
        {
          onSuccess: (data) => {
            const newUsers = data?.data || [];
            if (reset) {
              setSelectedIds([]);
              setModuleData(newUsers);
              setOffset(limit);
            } else {
              setModuleData((prevUsers) => [...prevUsers, ...newUsers]);
              setOffset((prevOffset) => prevOffset + limit);
            }
            const total = newUsers?.[0]?.totalRecords || 0;
            setHasMore(newUsers.length > 0 && (reset ? limit : offset + limit) < total);
          },
          onError: (error) => {
            console.error("Error fetching users:", error);
            toast.error("Failed to fetch payment data.");
          },
        }
      );
    }

  const handleFetchEntries = (paymentMode) => {
    setIsEntriesLoading(true);
    const baseFilter = [
      { key: "payment_header_id", operator: "equal", value1: selectedIds?.[0]?.record_id, logical: "" },
    ];
    if (paymentMode !== "direct_gl" && paymentMode !== "advance_payment") {
      FetchEntries(
        {
          filters: [...baseFilter],
          limit: 0,
          offset: 0,
          orderby: "",
        },
        {
          onSuccess: (response) => {
            const data = response?.data?.map((data) => ({
              external_ref: data?.external_ref,
              sup_invoice_id: data?.sup_invoice_id,
              paid_amount: parseFloat(data?.paid_amount).toFixed(3),
              invoice_total: parseFloat(data?.invoice_total).toFixed(3),
              invoice_date: data?.invoice_date,
            }));
            setJrEnteries(data);
            setIsEntriesLoading(false);
          },
          onError: (err) => {
            console.error("Error fetching entries:", err);
            toast.error("Failed to fetch payment entries.");
            setIsEntriesLoading(false);
          },
        }
      );
    } else {
      FetchEntriesForGL(
        {
          filters: [{ key: "ph.id", operator: "equal", value1: selectedIds?.[0]?.record_id, logical: "" }],
          limit: 0,
          offset: 0,
          orderby: "",
        },
        {
          onSuccess: (response) => {
            const data = response?.data?.map((data) => ({
              gl_name: data?.gl_name,
              debit: parseFloat(data?.debit).toFixed(3),
              credit: parseFloat(data?.credit).toFixed(3),
              description: data?.description,
            }));
            setJrEnteries(data);
            setIsEntriesLoading(false);
          },
          onError: (err) => {
            console.error("Error fetching GL entries:", err);
            toast.error("Failed to fetch GL entries.");
            setIsEntriesLoading(false);
          },
        }
      );
    }
  };

  const handleFetchSupplierInvoice = (data) => {
    fetchInvoice(
      {
        filters: [
          {
            key: "sie.supplier_header_id",
            operator: "equal",
            value1: data?.sup_invoice_id,
            logical: "",
          },
        ],
        limit: 0,
        offset: 0,
      },
      {
        onSuccess: (res) => {
          setInvoiceEntries(res?.data);
        },
        onError: (error) => {
          console.error("Error fetching supplier invoice:", error);
          toast.error("Failed to fetch supplier invoice details.");
        },
      }
    );
  };

  const handleReversal = () => {
    const record_id = selectedIds?.[0]?.record_id;
    if (!record_id) {
      toast.error("Please select a payment to reverse.");
      return;
    }
    reversal(
      {
        dataInsert: {
          record_id,
          created_by: UserId,
        },
      },
      {
        onSuccess: (response) => {
          const data = response?.data?.[0];
          if (data?.msgType === "error") {
            toast.error(data?.message);
          } else {
            toast.success(data?.message);
            handleFetchdata(appliedFilters, true);
          }
        },
        onError: (err) => {
          toast.error(`Error: ${err.message || err}`);
        },
      }
    );
  };

  const handleReversalConfirm = async () => {
    const record_id = selectedIds?.[0]?.record_id;
    if (!record_id) {
      toast.error("Please select a payment to reverse.");
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Before proceeding with the reversal, please confirm that you want to reverse the selected payment. This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, reverse it!'
    });

    if (result.isConfirmed) {
      handleReversal();
    }
  };

  const handleFetchExcelData = (filter) => {
    return new Promise((resolve, reject) => {
      fetchDataForExcel(
        { filters: filter || null, limit: 0, offset: 0 },
        {
          onSuccess: (data) => {
            resolve(data?.data || []);
          },
          onError: (error) => {
            console.error("Error fetching data for Excel:", error);
            reject(error);
          },
        }
      );
    });
  };

  const exportToExcel = async () => {
    try {
      const data = await handleFetchExcelData(appliedFilters);
      const formattedData = data.map((item) => ({
        ...item,
        posting_date: dayjs(item.posting_date).format("DD-MM-YYYY"),
        payment_total: parseFloat(item.payment_total).toFixed(3),

      }));
      const limitedData = formattedData.slice(0, 1000);

      const worksheet = XLSX.utils.json_to_sheet(limitedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      XLSX.writeFile(workbook, "payment.xlsx");
    } catch (error) {
      toast.error("Failed to export data to Excel.");
    }
  };

  const fields = [
    {
      name: "ph.id",
      label: "Document Number",
      type: "numerical",
      aliases: "",
    },
    {
      name: "supplier_name",
      label: "Supplier",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_SUPPLIER}`,
      responseWhich: "data",
      aliases: "sl.",
    },
    {
      name: "company_name",
      label: "Company name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_COMPANY}`,
      responseWhich: "data",
      aliases: "c.",
    },
    {
      name: "bl.bank_name",
      label: "Bank Name",
      type: "textServer",
      labelKey: "bank_name",
      ValueKey: "bank_name",
      endpoint: `${API_ENDPOINTS.GET_BANK_LIST}`,
      responseWhich: "data",
    },
    {
      name: "posting_date",
      label: "Posting Date",
      type: "date",
      aliases: "",
    },
    {
      name: "iban_number",
      label: "IBAN Number",
      type: "text",
      aliases: "",
    },
    {
      name: "branch_name",
      label: "Branch Name",
      type: "text",
      aliases: "",
    },
    {
      name: "account_number",
      label: "Account Number",
      type: "text",
      aliases: "",
    },
    {
      name: "swift_code",
      label: "Swift Code",
      type: "text",
      aliases: "",
    },
    {
      name: "payment_type",
      label: "Payment Type",
      type: "select",
      aliases: "",
      options: paymentTypeOptions,
    },
    {
      name: "payment_status",
      label: "Payment Status",
      type: "select",
      aliases: "",
      options: paymentStatus,
    },
    {
      name: "payment_mode",
      label: "Payment Mode",
      type: "select",
      aliases: "",
      options: paymentMoodOptions,
    },
    {
      name: "payment_total",
      label: "Payment Total",
      type: "text",
      aliases: "",
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      aliases: "",
    },
    {
      name: "payment_ref",
      label: "Cheque#",
      type: "text",
      aliases: "",
    },
  ];

  const handleApplyFilters = (data) => {
    console.log("Filter Values:", data);
    setOffset(0);
    setAppliedFilters(data);
    handleFetchdata(data, true);
  };

  const handleResetFilters = () => {
    console.log("Filters Reset");
    setOffset(0);
    setAppliedFilters(null);
    handleFetchdata(null, true);
  };

  const fieldsMapping = [
    {
      key: "payment_mode",
      label: "Payment Mode",
      sortable: true,
      filterable: true,
      width: 200,
      render: (value) => <span className="capitalize">{formatUnderScoreValue(value)}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      width: 200,
      render: (value) => <span className="capitalize">{value}</span>,
    },
    {
      key: "payment_status",
      label: "Payment Status",
      sortable: true,
      filterable: true,
      width: 200,
      render: (value) => <span>{formatUnderScoreValue(value)}</span>,
    },
    {
      key: "record_id",
      label: "Document ID",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "posting_date",
      label: "Posting Date",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => <span>{value ? moment(value).format("DD-MM-YYYY") : ""}</span>,
    },
    {
      key: "supplier_name",
      label: "Supplier Name",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "payment_total",
      label: "Payment Total",
      sortable: true,
      filterable: true,
      width: 200,
      render: (value) => <span>{formatNumberDisplay(value)}</span>,
    },
    {
      key: "company_name",
      label: "Company Name",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "bank_name",
      label: "Bank Name",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "description",
      label: "Description",
      sortable: true,
      filterable: true,
      width: 200,
    },
  ];

  const EnteriesfieldsMapping = entriesType === "direct_gl" || entriesType === "advance_payment" ? [
    {
      key: "gl_name",
      label: "GL Name",
      width: 250,
      sortable: true,
      filterable: true,
    },
    {
      key: "debit",
      label: "Debit",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "credit",
      label: "Credit",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "description",
      label: "Description",
      width: 250,
      sortable: true,
      filterable: true,
    },
  ] : [
    {
      key: "invoice_date",
      label: "Invoice Date",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => <span>{value ? moment(value).format("DD-MM-YYYY") : ""}</span>,
    },
    {
      key: "external_ref",
      label: "External Ref",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "invoice_total",
      label: "Invoice Total",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => <span>{formatNumberDisplay(value)}</span>,
    },
    {
      key: "paid_amount",
      label: "Paid Amount",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => <span>{formatNumberDisplay(value)}</span>,
    },
  ];

  const supplierEnteriesfieldsMapping = [
    {
      key: "description",
      label: "Description",
      width: 250,
      sortable: true,
      filterable: true,
    },
    {
      key: "gl_id",
      label: "GL Id",
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: "gl_code",
      label: "GL Code",
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: "gl_name",
      label: "GL Name",
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: "quantity",
      label: "QTY",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "unit_price",
      label: "Price",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "net_price",
      label: "Net Price",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "tax_name",
      label: "Tax",
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: "total_price",
      label: "Total Price",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "gl_name",
      label: "General Ledger",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "created_at",
      label: "Created At",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value, row) => <span>{moment(row?.created_at).format("DD-MM-YYYY")}</span>,
    },
  ];

  const handlePrint = () => {
    if (!selectedIds?.length || !jrEnteries?.length) {
      toast.error("Please select a payment with entries to print.");
      return;
    }

    const createdBy = {
      first_name: selectedIds?.[0]?.first_name,
      last_name: selectedIds?.[0]?.last_name,
    };

    const selectedPayment = moduleData.find(
      (item) => item.record_id === selectedIds[0]?.record_id
    );
    if (!selectedPayment) {
      toast.error("Selected payment not found.");
      return;
    }

    const {
      company_name,
      supplier_name,
      bank_name,
      posting_date,
      payment_type,
      payment_ref,
      record_id,
      payment_mode,
    } = selectedPayment;

    const totalAmount = jrEnteries
      .reduce(
        (sum, entry) =>
          sum +
          (parseFloat(entry.paid_amount || entry.debit || entry.credit) || 0),
        0
      )
      .toFixed(3);

    const formattedPaymentDate = posting_date
      ? moment(posting_date).format("DD-MM-YYYY")
      : "N/A";

    const FIRST_PAGE_ENTRIES = 15;
    const SUBSEQUENT_PAGE_ENTRIES = 20;
    const LAST_PAGE_MAX_ENTRIES = 10;

    // ✅ Sort entries by invoice_date (ascending), parsing string dates
    const sortedEntries = [...jrEnteries].sort((a, b) => {
      const dateA = new Date(a.invoice_date);
      const dateB = new Date(b.invoice_date);
      return dateA - dateB;
    });

    let remainingEntries = sortedEntries.length;
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
              margin: 0;
              padding: 20px;
              line-height: 1.5;
            }
            .supplier-w { width:255px; }
            .page {
              position: relative;
              page-break-after: always;
              padding-bottom: 100px;
            }
            .page:last-child { page-break-after: auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 5px 0; font-size: 24px; }
            .header-right { text-align: right; font-size: 14px; margin-bottom: 10px; }
            .page-number { text-align: right; font-size: 14px; margin-bottom: 10px; }
            .sub-header-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .greeting { margin: 20px 0; font-size: 14px; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 14px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total {
              text-align: right;
              font-weight: bold;
              margin-top: 10px;
              font-size: 14px;
            }
            .footer-content { margin-top: 30px; font-size: 14px; }
            .signature { margin-top: 5px; }
            .footer-lines {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              display: flex;
              justify-content: space-between;
              padding: 20px 0;
              border-top: 1px solid #eee;
              font-size: 14px;
              background-color: white;
            }
            .footer-lines div { flex: 1; text-align: center; }
            @media print {
              @page { size: auto; margin: 7mm 5mm 7mm 5mm; }
              body { margin: 0; padding: 0; }
              .page { padding: 5mm; box-sizing: border-box; height: 100%; width: 100%; }
              .page-number { position: running(pageNumber); }
              th {
                background-color: #d8d8d8 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .footer-lines {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                border-top: 1px solid #000;
                background-color: white;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${pages
          .map((entriesCount, pageIndex) => {
            let startIdx =
              pageIndex === 0
                ? 0
                : pages.slice(0, pageIndex).reduce((sum, count) => sum + count, 0);
            const endIdx = startIdx + entriesCount;
            const pageEntries = sortedEntries.slice(startIdx, endIdx);
            const currentPage = pageIndex + 1;

            return `
                <div class="page">
                  <div class="header">
                    ${pageIndex === 0 ? `<h1>Remittance Advice</h1>` : ""
              }
                    <div class="header-right">
                      <div class="page-number"><b> Page:</b> ${currentPage}/${totalPages}</div>
                      <div><b> Date:</b> ${new Date()
                .toLocaleString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
                .replace(",", "")}</div>
                    </div>
                  </div>
                  ${pageIndex === 0
                ? `
                    <div><b> Document ID:</b> ${record_id || ""}</div>
                    <div class="sub-header-line">
                      <div><b>Company:</b> ${company_name || "N/A"}</div>
                      <div class="supplier-w"><b> Supplier:</b> ${supplier_name || "N/A"
                }</div>
                    </div>
                    <div><b> Payment Type:</b> ${formatUnderScoreValue(payment_type) || ""
                }</div>
                    <div><b> Payment Mode:</b> ${formatUnderScoreValue(payment_mode) || ""
                }</div>
                    <div><b>Bank name:</b> ${bank_name || "N/A"}</div>`
                : ""
              }
                  ${pageIndex === 0
                ? `
                    <div class="greeting">
                      <div><b>Dear Sir or Madam,</b></div>
                      <div>
                        On ${formattedPaymentDate}, the amount of ${totalAmount} was settled 
                        ${payment_type === "outgoing_cheque_payment"
                  ? `by check (number ${payment_ref || "N/A"})`
                  : ""
                }
                        for the items listed below.
                      </div>
                    </div>`
                : ""
              }
                  <table>
                    <thead>
                      <tr>
                        ${entriesType === "direct_gl" ||
                entriesType === "advance_payment"
                ? `
                          <th>GL Name</th>
                          <th>Debit</th>
                          <th>Credit</th>
                          <th>Description</th>`
                : `
                          <th>Invoice Date</th>
                          <th>External Ref</th>
                          <th>Invoice Total</th>
                          <th>Paid Amount</th>`
              }
                      </tr>
                    </thead>
                    <tbody>
                      ${pageEntries
                .map((entry) =>
                  entriesType === "direct_gl" ||
                    entriesType === "advance_payment"
                    ? `
                          <tr>
                            <td>${entry.gl_name || ""}</td>
                            <td>${formatPrintNumberDisplay(entry.debit) || "0.00"
                    }</td>
                            <td>${formatPrintNumberDisplay(entry.credit) 
                    || "0.00"
                    }</td>
                            <td>${entry.description || ""}</td>
                          </tr>`
                    : `
                          <tr>
                            <td>${entry.invoice_date
                      ? moment(new Date(entry.invoice_date)).format(
                        "DD-MM-YYYY"
                      )
                      : ""
                    }</td>
                            <td>${entry.external_ref || ""}</td>
                            <td>${formatPrintNumberDisplay(
                      parseFloat(entry.invoice_total).toFixed(2)
                    ) || "0.00"
                    }</td>
                            <td>${formatPrintNumberDisplay(
                      parseFloat(entry.paid_amount).toFixed(2)
                    ) || "0.00"
                    }</td>
                          </tr>`
                )
                .join("")}
                    </tbody>
                  </table>
                  ${pageIndex === totalPages - 1
                ? `
                    <div class="total"><b>TOTAL:</b> ${totalAmount}</div>
                    <div class="footer-content">
                      <div>Yours sincerely,</div>
                      <div class="signature">
                        <div>${createdBy?.first_name + " " + createdBy?.last_name ||
                "N/A"
                }</div>
                        <div>${company_name || "Indochine Restaurant LTD"}</div>
                      </div>
                    </div>`
                : ""
              }
                  <div class="footer-lines">
                    <div><b> Accounts:</b> ________________</div>
                    <div><b>Received By:</b> ________________</div>
                    <div><b>Operations:</b> ________________</div>
                  </div>
                </div>`;
          })
          .join("")}
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 500);
            });
          </script>
        </body>
      </html>
    `);
      printWindow.document.close();
    } catch (error) {
      console.error("Error generating print window:", error);
      toast.error("An error occurred while generating the print window.");
    }
  };


  useEffect(() => {
    handleFetchdata(null, true);
  }, []);

  useEffect(() => {
    if (selectedIds && selectedIds?.[0]?.record_id) {
      const paymentMode = selectedIds?.[0]?.payment_mode;
      setEntriesType(paymentMode);
      handleFetchEntries(paymentMode);
    }
  }, [selectedIds]);

  const triggerModal = (data) => {
    if (!data?.[0]?.sup_invoice_id) {
      toast.error("No valid supplier invoice selected.");
      return;
    }
    setIsModalOpen(!isModalOpen);
    handleFetchSupplierInvoice(data[0]);
  };

  return (
    <>
      <div>
        <h1 className="mb-2 text-size text-color font-headingweight">
          Payment List
        </h1>

        <div>
          <DynamicFilter fields={fields} onApply={handleApplyFilters} onReset={handleResetFilters} />
        </div>
        <div className="flex justify-between gap-3 my-2">
          <div className="flex flex-wrap gap-2">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              addclass="gap-1"
              handleClick={exportToExcel}
            />
            <CustomButton
              btntext={"Add New"}
              handleClick={() => navigate(`${rootFolder}/add-payment`)}
            />
            <CustomButton
              btntext={"Reversal"}
              handleClick={() => {
                handleReversalConfirm();
              }}
            />
            <CustomButton
              btntext={"Print"}
              handleClick={() => {
                handlePrint();
              }}
            />
            <div className=" d-flex align-items-center">
              <label className="me-2 text-color font-regularweight">Dense Rows</label>

              <label className="switch">
                <input
                  type="checkbox"
                  id="denseSwitch"
                  checked={isDense}
                  onChange={(e) => setIsDense(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="inline-flex items-center">
              <span className="me-2 text-color font-regularweight">server-side sorting</span>
              <label className="switch">
                <input
                  type="checkbox"
                  id="denseSwitch"
                  checked={useServerSorting}
                  onChange={(e) => setUseServerSorting(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <CustomButton
              btntext={<MdRefresh size={18} />}
              addclass={`w-6 rounded-radiusFull max-w-6 min-w-6 h-6 ${isPending && "animate-spin"
                } `}

              padding="p-0"
              rounded="rounded-full"
              handleClick={() => {
                setOffset(0);
                handleFetchdata(null, true);
              }}
            />
          </div>
        </div>

        <div className="">
          <ResizableTable
            data={moduleData || []}
            columns={fieldsMapping}
            isDense={isDense}
            height="300px"
            className=""
            onSort={(key, direction) => {
              if (useServerSorting) {
                let dbField;
                switch (key) {
                  case "supplier_name":
                    dbField = "supplier_name";
                    break;
                  case "company_name":
                    dbField = "company_name";
                    break;
                  case "posting_date":
                    dbField = "posting_date";
                    break;
                  case "swift_code":
                    dbField = "swift_code";
                    break;
                  case "iban_number":
                    dbField = "iban_number";
                    break;
                  case "payment_type":
                    dbField = "payment_type";
                    break;
                  case "payment_status":
                    dbField = "payment_status";
                    break;
                  case "status":
                    dbField = "status";
                    break;
                  case "payment_total":
                    dbField = "payment_total";
                    break;
                  case "bank_name":
                    dbField = "bank_name";
                    break;
                  case "branch_name":
                    dbField = "branch_name";
                    break;
                  default:
                    dbField = "ph.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"PaymentList"}
            isSelect={true}
            onFilter={(filters) => console.log("Filters:", filters)}
            onSelectRow={(selectedData) => setSelectedIds(selectedData)}
            hasMore={hasMore}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "ph.id DESC"
              )
            }
            loading={isPending}
          />

          <div className="">
            {selectedIds && selectedIds?.length > 0 && (
              isEntriesLoading || EnteriesPending || EnteriesPendingGL ? (
                <Loader />
              ) : (
                jrEnteries && jrEnteries?.length > 0 && (
                  <div className="card mt-4 shadow-lg border-0 rounded-lg">
                    <div className="p-2 text-white">
                      <h4 className="p-0 m-0 text-size text-color font-headingweight">Entries</h4>
                    </div>
                    <div className="">
                      <ResizableTable
                        data={jrEnteries || []}
                        columns={EnteriesfieldsMapping}
                        isDense={isDense}
                        height="300px"
                        onSelectRow={(selectedData) => triggerModal(selectedData)}
                        hasMore={false}
                        loading={EnteriesPending || EnteriesPendingGL}
                        isSelect={true}
                      />
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
        <Modal
          title="Supplier Invoice Details"
          width={"60%"}
          open={isModalOpen}
          footer={null}
          onCancel={() => setIsModalOpen(false)}
          centered
        >
          <ResizableTable
            data={invoiceEntries || []}
            columns={supplierEnteriesfieldsMapping}
            isDense={isDense}
            height="300px"
            onSelectRow={(selectedData) => triggerModal(selectedData)}
            hasMore={false}
            loading={isInoicePending}
            isSelect={false}
          />
        </Modal>
      </div>
    </>
  );
};

export default withPermissionCheck(PaymentList, "payment-list");