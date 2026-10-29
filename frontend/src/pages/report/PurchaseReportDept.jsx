import { useEffect, useRef, useState } from "react";
import { BsFiletypeJson } from "react-icons/bs";
import {  FaInbox, FaPrint, FaRegFileExcel } from "react-icons/fa6";
import { MdFilterAlt, MdFilterAltOff, MdRefresh } from "react-icons/md";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import {
  getFromLocalStorage,
  getFromSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import useDebounce from "../../hooks/useDebounce";
import { formatNumberDisplay } from "../../utils/helper.function";
import Loader from "../../components/Loader";
import moment from "moment";
import ResizableTable from "../../components/table/ResizableTable";
import jsPDF from "jspdf";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const PurchaseReportDept = () => {
  const deptPurchaseReport = getFromSessionStorage("purchase-report");
  console.log(deptPurchaseReport);
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.ITEM_PURCHASE_ACTIVITY
  );
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.ITEM_PURCHASE_ACTIVITY
  );

  const UserId = getFromLocalStorage("UserId");
  const [apiData, setApiData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortDirection, setSortDirection] = useState("DESC");
  const [sortField, setSortField] = useState("posting_date");
  const [isFilterWidth, setIsFilterWidth] = useState(false);
  const [childData, setChildData] = useState(null);
  // const [startMonthYear, setStartMonthYear] = useState(null);
  // const [endMonthYear, setEndMonthYear] = useState(null);
  // const [companyId, setCompanyId] = useState();
  const [company, setCompany] = useState({ company_id: deptPurchaseReport?.company_id, company_name: deptPurchaseReport?.company_name });
  const [dept_name, setDept_name] = useState({ dept_id: deptPurchaseReport?.com_dept_id, dept_name: deptPurchaseReport?.dept_name });
  const [comToDept, setComToDept] = useState(deptPurchaseReport?.com_dept_id);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalLast, setTotal] = useState();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const printRef = useRef();
  const limit = 0;
  const fieldsMapping = [
    {
      key: "posting_date",
      label: "Posting Date",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) =>
        value ? (
          <span>{moment(value).format("DD-MM-YYYY") || "N/A"}</span>
        ) : (
          value
        ),
    },
    ...(!deptPurchaseReport ? [
      {
        key: "company_name",
        label: "Company Name",
        width: 200,
        sortable: true,
        filterable: true,
      },
      {
        key: "dept_name",
        label: "Dept Name",
        width: 200,
        sortable: true,
        filterable: true,
      }
    ] : []),
    {
      key: "product_name",
      label: "Product Name",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "supplier_name",
      label: "Supplier Name",
      width: 330,
      sortable: true,
      filterable: true,
    },
    {
      key: "base_unit",
      label: "Base Unit",
      sortable: true,
      filterable: true,
      width: 150,
    },
    {
      key: "base_unit_qty",
      label: "Bu_Qty",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value)
    },
    {
      key: "base_unit_price",
      label: "Bu_Price",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value)
    },
    {
      key: "base_unit_total_price",
      label: "Bu_Amount",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value)
    },
    {
      key: "unit_selected",
      label: "Unit Selected",
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: "qty",
      label: "Us_Qty",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value)
    },
    {
      key: "price",
      label: "Us_Price",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value)
    },
    {
      key: "total_price",
      label: "Us_Amount",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value)
    },
  ];

  const handleFetchdata = (
    filter,
    reset = false,
    orderBy = "posting_date DESC"
  ) => {
    let customFilters = [];
    const isCompany = filter?.some((obj) => obj.key === "company_name");
    const isDept = filter?.some((obj) => obj.key === "dept_name");
    if (deptPurchaseReport && !isCompany) {
      customFilters.push({
        key: "c.id",
        operator: "equal",
        value1: company?.company_id,
        logical: "",
      });
    }
    if (deptPurchaseReport && !isDept) {
      customFilters.push({
        key: "adtc.id",
        operator: "equal",
        value1: dept_name?.dept_id,
        logical: "",
      });
    }
    const isPostingDate = filter?.find((item) => item.key === "posting_date");
    const baseFilters = [];

    const filters = filter
      ? [...baseFilters, ...filter, ...customFilters]
      : [...baseFilters, ...customFilters];

    if (!isPostingDate) {
      return toast.error("Posting date is required");
    }

    if (!company && !isCompany) {
      return toast.error("Company is Required");
    }
    if (!dept_name && !isDept) {
      return toast.error("Department is Required");
    }

    mutate(
      {
        filters: filters || null,
        limit: 0, // Set a reasonable limit
        offset: 0,
        orderby: orderBy,
      },
      {
        onSuccess: (response) => {
          const data = response?.data?.slice(0, -1);        // all except last
          const lastRecord = response?.data[response?.data.length-1]; // last item
          setApiData(data);
          setTotal(lastRecord);
          if (reset) {
            setApiData(data);
            setOffset(limit);
          } else {
            setApiData((prevUsers) => [...prevUsers, ...data]);
            setOffset((prevOffset) => prevOffset + limit);
          }
          const total = data?.[0]?.totalRecords || 0;
          setHasMore(
            data.length > 0 && (reset ? limit : offset + limit) < total
          );
        },
        onError: (error) => {
          console.error("Error fetching users:", error);
        },
      }
    );
  };

  const handleFetchExcelData = (filter) => {
    const today = moment().format("YYYY-MM-DD");
    const oneMonthAgo = moment().subtract(1, "month").format("YYYY-MM-DD");
    let customFilters = [];

    const isCompany = filter?.some((obj) => obj.key === "c.id");
    const isDept = filter?.some((obj) => obj.key === "adtc.id");

    if (deptPurchaseReport && !isCompany) {
      customFilters.push({
        key: "c.id",
        operator: "equal",
        value1: company?.company_id,
        logical: "",
      });
    }

    if (deptPurchaseReport && !isDept) {
      customFilters.push({
        key: "adtc.id",
        operator: "equal",
        value1: dept_name?.dept_id,
        logical: "",
      });
    }

    const isPostingDate = filter?.find((item) => item.key === "posting_date");
    const baseFilters = [];
    const filters = filter
      ? [...baseFilters, ...filter, ...customFilters]
      : [...baseFilters, ...customFilters];

    if (!isPostingDate) {
      filters.push({
        key: "posting_date",
        operator: "between",
        value1: oneMonthAgo,
        value2: today,
        logical: "",
      });
    }

    return new Promise((resolve, reject) => {
      fetchDataForExcel(
        { filters: filters || null, limit: 0, offset: 0 },
        {
          onSuccess: (data) => {
            resolve(data?.data || []);
          },
          onError: (error) => {
            console.error("Error fetching data:", error);
            reject(error);
          },
        }
      );
    });
  };

  const exportToExcel = async () => {
    const data = await handleFetchExcelData(appliedFilters);
    const formattedData = data.map(item => ({
      ...item,
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY"),
      qty: parseFloat(item.qty).toFixed(3),
      price: parseFloat(item.price).toFixed(3),
      total_price: parseFloat(item.total_price).toFixed(3),
      base_unit_qty: parseFloat(item.base_unit_qty).toFixed(3),
      base_unit_total_price: parseFloat(item.base_unit_total_price).toFixed(3),
      base_unit_price: parseFloat(item.base_unit_price).toFixed(3),

    }));

    const limitedData = formattedData.slice(0, 1000);
    const worksheet = XLSX.utils.json_to_sheet(limitedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "purchase-report.xlsx");
  };

  const exportToCSV = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "purchase-report.csv";
    link.click();
  };

  const exportToJSON = (data) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "purchase-report.json";
    link.click();
  };

  const exportToPDF = async () => {
    const data = await handleFetchExcelData(appliedFilters);
    const header = data?.[0];
    const limitedData = data.slice(0, data.length - 1); // All rows except the last one
    const lastRow = data[data.length - 1]; // Last row holds totals

    const doc = new jsPDF();
    let start, end;
    const today = moment().format("YYYY-MM-DD");
    const oneMonthAgo = moment().subtract(1, "month").format("YYYY-MM-DD");

    const isPostingDate = appliedFilters?.find(item => item.key === "posting_date");
    if (isPostingDate) {
      start = isPostingDate.value1;
      end = isPostingDate.value2;
    } else {
      start = oneMonthAgo;
      end = today;
    }
    const companyText = header?.company_name
    const deptText = header?.dept_name;

    doc.setFontSize(11);
    const pageWidth = doc.internal.pageSize.getWidth();
    const title = "Purchase Report";
    const titleWidth = doc.getTextWidth(title);
    const x = (pageWidth - titleWidth) / 2;
    doc.text(title, x, 20);

    doc.setFontSize(7);
    doc.text(companyText, 14, 30);
    doc.text(deptText, 14, 35);
    doc.text(`Period: ${start} ${end ? `- ${end}` : ""}`, 14, 40);

    // Prepare table body
    const tableData = limitedData.map((row) =>
      fieldsMapping.map((col) =>
        col.render
          ? moment(row[col.key]).format("DD-MM-YYYY") || ""
          : row[col.key] || ""
      )
    );

    // Identify the indexes of base_unit_qty and base_unit_total_price
    const qtyIndex = fieldsMapping.findIndex(f => f.key === "base_unit_qty");
    const totalPriceIndex = fieldsMapping.findIndex(f => f.key === "base_unit_total_price");

    // Create total row
    const totalRow = fieldsMapping.map((_, index) => {
      if (index === qtyIndex - 1) return "Total:";
      if (index === qtyIndex) return lastRow.base_unit_qty?.toString() || "0";
      if (index === totalPriceIndex) return lastRow.base_unit_total_price?.toString() || "0";
      return "";
    });

    // Add total row
    tableData.push(totalRow);

    // Generate PDF table
    doc.autoTable({
      head: [fieldsMapping.map((col) => col.label)],
      body: tableData,
      startY: 50,
      theme: "grid",
      headStyles: { fillColor: [0, 102, 204] },
      styles: { fontSize: 6, cellPadding: 1 },
      columnStyles: fieldsMapping.reduce(
        (acc, col, index) => ({
          ...acc,
          [index]: { cellWidth: col.width / 11 },
        }),
        {}
      ),
      didDrawCell: (data) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    doc.save("purchase-report.pdf");
  };


  const handleExport = async (format) => {
    const data = await handleFetchExcelData(appliedFilters);
    const limitedData = data.slice(0, 1000);
    switch (format) {
      case "excel":
        exportToExcel(limitedData);
        break;
      case "pdf":
        exportToPDF(limitedData);
        break;
      case "csv":
        exportToCSV(limitedData);
        break;
      case "json":
        exportToJSON(limitedData);
        break;
      default:
        console.log("Invalid format");
    }
  };

  const fields = [
    {
      name: "company_name",
      label: "Company name",
      type: "textServer",
      aliases: "c.",
      endpoint: `${API_ENDPOINTS.USER_TO_COMPANY}`,
      responseWhich: "result",
      ValueKey: "company_id",
      filterQueryKey: "id",
      serverDefaultValue: company?.company_name,
      baseFilters: [
        {
          key: "auc.user_id",
          operator: "equal",
          value1: UserId,
          logical: "",
        },
        {
          key: "auc.status",
          operator: "equal",
          value1: "1",
          logical: "",
        },
      ],
    },
    {
      name: "dept_name",
      label: "Department name",
      type: "textServer",
      aliases: "adtc.",
      endpoint: `${API_ENDPOINTS.USER_TO_DEPARTMENT}`,
      responseWhich: "result",
      ValueKey: "com_dept_id",
      filterQueryKey: "id",
      serverDefaultValue: dept_name?.dept_name,
      concatenateLable: "company_name",
      baseFilters: [
        { key: "adu.user_id", operator: "equal", value1: UserId, logical: "" },
      ],

    },
    {
      name: "posting_date",
      label: "Posting Date",
      type: "date",
      aliases: "",
    },
    {
      name: "product_name",
      label: "product name",
      aliases: "pm.",
      type: "textServer",
      labelKey: "product_name",
      filterQueryKey: "id",
      ValueKey: "product_id",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_TO_DEPT_LIST}`,
      // baseFilters:[
      //   { key: "aptd.comp_dept_id", operator: "equal", value1: comToDept, logical: "" }
      // ],
      responseWhich: "data",
      dependsOn: {
        field: "dept_name", // The field this depends on
        filterKey: "aptd.comp_dept_id", // The key to use in baseFilters
        defaultValue: comToDept
      },
    },
    {
      name: "supplier_name",
      label: "Supplier",
      type: "textServer",
      filterQueryKey: "id",
      ValueKey: "record_id",
      endpoint: `${API_ENDPOINTS.GET_SUPPLIER}`,
      responseWhich: "data",
      aliases: "sl.",
    },
  ];

  const handleApplyFilters = async (data) => {
    console.log("Applied Filters:", data); // Debug filters
    setOffset(0);
    setAppliedFilters(data);
    handleFetchdata(data, true);
    handleFetchExcelData(data);
  };

  const handlePrint = () => {
    let start, end;
    const today = moment().format("DD-MM-YYYY");
    const oneMonthAgo = moment().subtract(1, "month").format("DD-MM-YYYY");
    const isPostingDate = appliedFilters?.find(
      (item) => item.key === "posting_date"
    );
    if (isPostingDate) {
      start = isPostingDate.value1;
      end = isPostingDate.value2;
    } else {
      start = oneMonthAgo;
      end = today;
    }

    const companyName = company?.company_name || "";
    const content = printRef.current.innerHTML;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Estimate the number of columns in the table for colspan
    const theadContent = printRef.current.querySelector('thead')?.innerHTML || '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `<table><thead>${theadContent}</thead></table>`;
    const columnCount = tempDiv.querySelector('tr')?.children.length || 1;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Data</title>
          <style>
            .print-header {
              width: 100%;
              text-align: center;
              font-weight: bold;
              padding: 3px 0;
              font-size: 10px;
              line-height: 1.2;
            }
            table {

              width: 100%;
              margin: 0;
              table-layout: auto;
            }
            th:first-child,
            td:first-child {
              border-left: 1px solid #000; /* You can change the color and thickness as needed */
            }
            th, td {
              padding: 6px;
              text-align: left;
              font-size: 10px;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            table.dense th, table.dense td {
              padding: 3px !important;
              font-size: 10px !important;
            }
            thead {
              display: table-header-group;
            }
            tbody {
              display: table-row-group;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
              }
              .header-row th {
                border: none;
                padding: 3px 0;
                font-size: 10px;
                font-weight: bold;
                }
                th, td {
                   border-top: 1px solid black;
                   border-right: 1px solid black;
                 }
            @media print {
              body {
                margin: 5mm 10mm 10mm 10mm;
              }
              .print-scrollable {
                overflow: visible !important;
                margin: 0;
              }
              table {
                width: 100% !important;
                font-size: 9px !important;
                margin: 0;
                break-inside: auto;
                page-break-before: auto;
                page-break-after: auto;
              }
              th, td {
                padding: 2px !important;
                white-space: normal !important;
              }
              thead {
                display: table-header-group;
              }
              .header-row th {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-scrollable">
            <table class="table-auto  text-gray-700 text-left text-sm min-w-full ${isDense ? 'dense' : ''}" >
              <thead>
                <tr class="header-row">
                  <th colspan="${columnCount}" class="print-header">${companyName}</th>
                </tr>
                <tr class="header-row">
                  <th colspan="${columnCount}" class="print-header">Purchase Report</th>
                </tr>
                <tr class="header-row">
                  <th colspan="${columnCount}" class="print-header">Period: ${start} ${end ? " - " + end : ""}</th>
                </tr>
                ${theadContent}
              </thead>
              <tbody>
                ${printRef.current.querySelector('tbody')?.innerHTML || content}
              </tbody>
            </table>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = window.close;
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };
  // useEffect(() => {
  //   if (deptPurchaseReport) {
  //     handleFetchdata(null, true);
  //   }
  // }, [navigate]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Optional: Implement search if needed
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (apiData.length > 1) {
      setIsFilterWidth(true);
    }
  }, [apiData]);
  return (
    <>
      <div className="overflow-hidden">
        <h1 className="text-size text-color font-headingweight mb-2">Purchase Report</h1>
        <div className="flex gap-2 items-center">
          <button
            className="flex bg-customBlue  shadow-md font-regularweight rounded-radiusRegular text-btnsize text-white duration-300 gap-1 items-center mb-2 px-2 py-1 transition-all"
            onClick={() => setIsFilterWidth(!isFilterWidth)}
          >
            {isFilterWidth ? (
              <>
                <MdFilterAltOff size={16} /> Filters
              </>
            ) : (
              <>
                <MdFilterAlt size={16} /> Filters
              </>
            )}
          </button>
          {/* <div>
            {startMonthYear &&
              fiscalYearMonthData?.data?.find(
                (item) => item.record_id === startMonthYear
              )?.month_name +
                "-" +
                fiscalYearMonthData?.data?.find(
                  (item) => item.record_id === startMonthYear
                )?.month_year}{" "}
            {endMonthYear &&
              fiscalYearMonthData?.data?.find(
                (item) => item.record_id === endMonthYear
              )?.month_name +
                "-" +
                fiscalYearMonthData?.data?.find(
                  (item) => item.record_id === endMonthYear
                )?.month_year}
          </div>
              fiscalYearMonthData?.data?.find((item) => item.record_id === endMonthYear)?.month_name +
              "-" +
              fiscalYearMonthData?.data?.find((item) => item.record_id === endMonthYear)?.month_year}
          </div> */}

        </div>
        <div className="gap-5  lg:flex relative">
          <div
            className={`transform transition-all duration-300 ease-in-out 
              ${isFilterWidth
                ? "w-0 opacity-0 -translate-x-full"
                : "opacity-100 translate-x-0 w-96 shrink-0"
              } 
              sticky top-4`}
          >
            <div className="h-full mb-5 pb-5 md:pr-4  ">
              <div className="pt-2" ></div>
              <DynamicFilter
                parentStateSet={setIsFilterWidth}
                fieldGrid="grid-cols-1"
                fields={fields}
                onApply={handleApplyFilters}
                watchName="company_name"
                setChildData={setChildData}
                className="bg-white border border-gray-100 h-full p-4  rounded-radiusRegular shadow-lg"
              />
            </div>
          </div>

          <div
            className={`flex-1 transition-all duration-300 xs:mt-2 sm:mt-2 md:mt-2 lg:mt-0 ${isFilterWidth ? "" : ""
              }`}
            style={{ width: "100%", overflowX: "auto", zIndex: 2 }}
          >
            {apiData && apiData.length > 0 ? (
              <div>
                <div className="flex justify-between gap-3 my-2">
                  <div className="flex gap-2 flex-wrap">
                    <CustomButton
                      btntext={"Export to Excel"}
                      icon={<FaRegFileExcel className="me-1" />}
                      handleClick={() => handleExport("excel")}
                    />
                    {/* <CustomButton
                      btntext={"Export to CSV"}
                      icon={<FaFileCsv className="me-1" />}
                      handleClick={() => handleExport("csv")}
                    />
                    <CustomButton
                      btntext={"Export to JSON"}
                      icon={<BsFiletypeJson className="me-1" />}
                      handleClick={() => handleExport("json")}
                    /> */}
                    <CustomButton
                      btntext={"Export to PDF"}
                      icon={<BsFiletypeJson className="me-1" />}
                      handleClick={() => handleExport("pdf")}
                    />
                    <CustomButton
                      btntext={"Print"}
                      icon={<FaPrint className="me-1" />}
                      handleClick={handlePrint}
                    />
                    <div className="d-flex align-items-center">
                      <label className="me-2 text-color font-regularweight">Dense Rows</label>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={isDense}
                          onChange={(e) => setIsDense(e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <CustomButton
                      btntext={<MdRefresh size={18} />}
                      addclass={`w-6 rounded-radiusFull max-w-6 min-w-6 h-6 ${isPending && "animate-spin"
                        }`}
                      padding="p-0"
                      rounded="rounded-full"
                      handleClick={() => {
                        setOffset(0);
                        handleFetchdata(null, true);
                      }}
                    />
                  </div>
                </div>
                {isPending && apiData.length <= 0 ? (
                  <Loader />
                ) : (
                  <div>
                    <ResizableTable
                      data={apiData || []}
                      columns={fieldsMapping}
                      isSelect={false}
                      height="300px"
                      isDense={isDense}
                      onSelectRow={null}
                      scrollableId={"PurchaseReport"}
                      enableScroll={true}
                      hasMore={hasMore}
                      loading={isPending}
                      onSort={(key, direction) => {
                        setSortField(key);
                        setSortDirection(direction.toUpperCase());
                        const orderbyString = `${key} ${direction.toUpperCase()}`;
                        setOffset(0);
                        handleFetchdata(appliedFilters, true, orderbyString);
                      }}
                      onLoadMore={() =>
                        handleFetchdata(
                          appliedFilters,
                          false,
                          `${sortField} ${sortDirection}`
                        )
                      }
                    />  
                    <div>
                       <div className=" flex justify-end pr-4">
            <div className="bg-gray-100 p-3 text-color font-regularweight rounded-md shadow-sm d-flex justify-content-end flex-column ">
                      {
                       "Total:"+totalLast?.base_unit_total_price
                      }
                    </div>
                    </div>
                    </div>

                    <div className="hidden relative">
                      <div
                        ref={printRef}
                        className="border border-gray-300 rounded-lg shadow-lg overflow-hidden"
                      >
                        <div className="print-scrollable">
                          <table className="table-auto text-gray-700 text-left text-sm min-w-full">
                            <thead className="bg-customBlue text-white sticky top-0 z-10">
                              <tr>
                                {fieldsMapping.map((col) => (
                                  <th
                                    key={col.key}
                                    className="px-4 py-2 truncate"
                                  >
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {apiData.map((row, index) => (
                                <tr
                                  key={index}
                                  className={`border ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                    } hover:bg-gray-100`}
                                >
                                  {fieldsMapping.map((col) => (
                                    <td
                                      key={col.key}
                                      className="px-4 py-2 truncate"
                                      title={row[col.key]}
                                    >
                                      {col.render
                                        ? col.render(row[col.key])
                                        : row[col.key] || ""}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col bg-white justify-center p-4 rounded-md items-center">
                <FaInbox size={40} className="text-gray-400" />
                <p className="text-color">
                  No data available. Please apply a filter to see the results.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>
        {`.custom-select.ant-select {
  box-shadow: none !important;
}

.custom-select.ant-select-focused {
  box-shadow: none !important;
  border-color: transparent !important;
}

.custom-select .ant-select-selector {
  box-shadow: none !important;
  border-color: transparent !important;
}

.custom-select .ant-select-selector:focus {
  outline: none !important;
  border-color: transparent !important;
}
.custom-select .ant-select-selection-placeholder {
  color: #9CA3AF !important;
}`}
      </style>
    </>
  );
};

export default withPermissionCheck(PurchaseReportDept, "purchase-report-dept");
