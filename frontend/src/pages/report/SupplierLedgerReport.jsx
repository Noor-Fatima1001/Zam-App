import { DatePicker, Select } from "antd";
import jsPDF from "jspdf";
import "jspdf-autotable";
import React, { useEffect, useRef, useState } from "react";
import { BsFiletypeJson } from "react-icons/bs";
import {
  FaFileCsv,
  FaInbox,
  FaPrint,
  FaRegFileExcel,
  FaRegFilePdf,
} from "react-icons/fa6";
import { MdFilterAlt, MdFilterAltOff } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import useDebounce from "../../hooks/useDebounce";
import { formatNumberDisplay, formatUnderScoreValue } from "../../utils/helper.function";
import Loader from "../../components/Loader";
import moment from "moment";
import ResizableTable from "../../components/table/ResizableTable";
import dayjs from "dayjs";

const SupplierLedgerReport = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_SUPPLIER_LEDGER);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_SUPPLIER_LEDGER
  );
  const { mutate: FetchSuppliers, isPending: SuppisPending } = useGlobelApi(
    API_ENDPOINTS.GET_SUPPLIER
  );
  const { mutate: getCompanyName } = useGlobelApi(API_ENDPOINTS.USER_TO_COMPANY);

  const UserId = getFromLocalStorage("UserId");
  const [apiData, setApiData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterWidth, setIsFilterWidth] = useState(false);
  const [supplierIds, setSupplierIds] = useState([]);
  const [companyIds, setCompanyIds] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [childData, setChildData] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [SupplierOptions, setSupplierOptions] = useState([]);
  const navigate = useNavigate();
  const printRef = useRef();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fieldsMapping = [
    {
      key: "supplier_name",
      label: "Supplier",
      width: 180,
      sortable: true,
      filterable: true,
    },
    {
      key: "company_name",
      label: "Company",
      width: 180,
      sortable: true,
      filterable: true,
    },
    {
      key: "posting_date",
      label: "Posting Date",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) =>
        value ? moment(value).format("DD-MM-YYYY") : "",
    },
    {
      key: "doc_type",
      label: "Doc Type",
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: "ref_no",
      label: "Ref No.",
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: "description",
      label: "Description",
      width: 150,
      sortable: true,
      filterable: true,
    },
    ,
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
      key: "running_balance",
      label: "Running Balance",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "status",
      label: "Status",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatUnderScoreValue(value),
    },
    {
      key: "source",
      label: "Source",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatUnderScoreValue(value),
    },

  ];

  const handleFetchdata = (filter, startDate, endDate, supplierIds, companyIds) => {
    if (filter?.[0]?.value1) {
      setCompanyIds(filter[0].value1.split(",").map(Number));
    }
    const supplierIdsArray = Array.isArray(supplierIds) ? supplierIds.map(Number) : supplierIds.split(',').map(Number);
    const companyIdsArray = Array.isArray(companyIds) ? companyIds.map(Number) : companyIds.split(',').map(Number);

    mutate(
      {
        headerData: {
          start_date: startDate ? dayjs(startDate).format("YYYY-MM-DD") : "",
          end_date: endDate ? dayjs(endDate).format("YYYY-MM-DD") : "",
          company_ids: companyIdsArray,
          supplier_ids: supplierIdsArray,
        },
        filters: [],
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (result) => {
          const data = result?.data || [];
          setApiData(data);
        },
        onError: (error) => {
          console.error("Error fetching users:", error);
        },
      }
    );
  };

  const trialBalanceData = getFromLocalStorage("trilaBalanceData");
  useEffect(() => {
    if (trialBalanceData) {
      localStorage.removeItem("trilaBalanceData");
      setCompanyIds([trialBalanceData.companyId]);
      setCompanyOptions([
        {
          value: trialBalanceData.companyId,
          label: trialBalanceData.company_name,
        },
      ]);
      setStartDate(trialBalanceData.start_date);
      setEndDate(trialBalanceData.end_date);
      setSupplierIds([trialBalanceData.gl_filters]);
      handleFetchdata(null, trialBalanceData.start_date, trialBalanceData.end_date, trialBalanceData.gl_filters, trialBalanceData.companyId);
    }
  }, [navigate]);

  const handleFetchExcelData = (filter) => {
    return new Promise((resolve, reject) => {
      fetchDataForExcel(
        {
          headerData: {
            start_date: startDate ? dayjs(startDate).format("YYYY-MM-DD") : "",
            end_date: endDate ? dayjs(endDate).format("YYYY-MM-DD") : "",
            company_ids: Array.isArray(companyIds) ? companyIds.map(Number) : [],
            supplier_ids: Array.isArray(supplierIds) ? supplierIds.map(Number) : [],
          },
          filters: [],
          limit: 0,
          offset: 0,
          orderby: "",
        },
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

  const handleFetchdataJh = (filer) => {
    const baseFilters = [
      { key: "sl.status", operator: "equal", value1: "1", logical: "" },
    ];
    FetchSuppliers(
      {
        filters: baseFilters,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (data) => {
          const newData = data?.data || [];
          setSupplierOptions(newData);
        },
        onError: (error) => {
          console.error("Error fetching suppliers:", error);
        },
      }
    );
  };

  const handleFetchCompany = (filer) => {
    const baseFilters = [
      { key: "company_name", operator: "contains", value1: filer, logical: "" },
      {
        key: "auc.user_id",
        operator: "equal",
        value1: UserId,
        logical: "AND",
      },
      {
        key: "auc.status",
        operator: "equal",
        value1: "1",
        logical: "AND",
      },
    ];
    getCompanyName(
      {
        filters: baseFilters,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (data) => {
          const newData = data?.result || [];
          setCompanyOptions(
            newData.map((item) => ({
              value: item.company_id,
              label: item.company_name,
            }))
          );
        },
        onError: (error) => {
          console.error("Error fetching companies:", error);
        },
      }
    );
  };

  const handleExport = async (format) => {
    switch (format) {
      case "excel":
        exportToExcel(apiData);
        break;
      case "csv":
        exportToCSV(apiData);
        break;
      case "json":
        exportToJSON(apiData);
        break;
      case "pdf":
        exportToPDF(apiData);
        break;
      default:
        console.log("Invalid format");
    }
  };

  const exportToExcel = (data) => {
    const formattedData = data.map((item) => {
      const row = {};
      fieldsMapping.forEach((field) => {
        let value = item[field.key];
        if (field.render) {
          value = field.render(value);
          value = typeof value === 'string' ? value : value?.props?.children || '';
        } else if (field.value) {
          value = field.value(value) || '';
        }
        row[field.label] = value;
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SupplierLedger");
    XLSX.writeFile(workbook, "supplier-ledger.xlsx");
  };

  const exportToCSV = (data) => {
    const formattedData = data.map((item) => {
      const row = {};
      fieldsMapping.forEach((field) => {
        let value = item[field.key];
        if (field.render) {
          value = field.render(value);
          value = typeof value === 'string' ? value : value?.props?.children || '';
        } else if (field.value) {
          value = field.value(value) || '';
        }
        row[field.label] = value;
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "supplier-ledger.csv";
    link.click();
  };

  const exportToJSON = (data) => {
    const formattedData = data.map((item) => {
      const row = {};
      fieldsMapping.forEach((field) => {
        let value = item[field.key];
        if (field.render) {
          value = field.render(value);
          value = typeof value === 'string' ? value : value?.props?.children || '';
        } else if (field.value) {
          value = field.value(value) || '';
        }
        row[field.label] = value;
      });
      return row;
    });
    const jsonString = JSON.stringify(formattedData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "supplier-ledger.json";
    link.click();
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF('landscape'); // Use landscape for wider tables
    const tableHeaders = fieldsMapping.map((field) => field.label);
    const totalWidth = fieldsMapping.reduce((sum, field) => sum + field.width, 0);
    const pageWidth = doc.internal.pageSize.width - 20; // Account for margins
    const widthRatio = pageWidth / totalWidth;

    const tableData = data.map((item) =>
      fieldsMapping.map((field) => {
        let value = item[field.key] ?? '';
        if (field.render) {
          value = field.render(value);
          value = typeof value === 'string' ? value : value?.props?.children || '';
        } else if (field.value) {
          value = field.value(value) || '';
        }
        return value;
      })
    );

    // Fetch selected company names
    const selectedCompanyNames = companyOptions
      .filter((opt) => companyIds.includes(opt.value))
      .map((opt) => opt.label)
      .join(", ") || "No Company Selected";

    // Fetch selected supplier names
    const selectedSupplierNames = SupplierOptions
      .filter((opt) => supplierIds.includes(opt.record_id))
      .map((opt) => opt.supplier_name)
      .join(", ") || "No Supplier Selected";

    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      columnStyles: fieldsMapping.reduce((acc, field, index) => ({
        ...acc,
        [index]: { cellWidth: field.width * widthRatio }
      }), {}),
      margin: { top: 40 }, // Increased margin to accommodate additional headers
      didDrawPage: (data) => {
        doc.setFontSize(12);
        doc.text('Supplier Ledger', 14, 10);
        doc.setFontSize(8);
        doc.text(`Company: ${selectedCompanyNames}`, 14, 16);
        doc.text(`Suppliers: ${selectedSupplierNames}`, 14, 22);
        doc.text(
          `From: ${startDate ? dayjs(startDate).format("DD-MM-YYYY") : ""} To: ${endDate ? dayjs(endDate).format("DD-MM-YYYY") : ""}`,
          14,
          28
        );
      },
    });

    doc.save("supplier-ledger.pdf");
  };


const handlePrint = () => {
  // Fetch selected company names
  const selectedCompanyNames = companyOptions
    .filter(idx => companyIds.includes(idx.value))
    .map((opt) => opt.label)
    .join(", ") || "No Company Selected";

  // Fetch selected supplier names
  const selectedSupplierNames = SupplierOptions
    .filter(idx => supplierIds.includes(idx.record_id))
    .map((opt) => opt.supplier_name)
    .join(", ") || "No Supplier Selected";

  const totalWidth = fieldsMapping.reduce((sum, field) => sum + field.width, 0);
  const widthRatio = 100 / totalWidth; // Percentage-based widths

  // Extract the last record for running_balance
  const lastRow = apiData[apiData.length - 1]; // Last row for total balance

  // Format running_balance as currency (e.g., -2,137,691.00)
  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '';
    return parseFloat(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };

  // Determine rows per page (adjust based on your table height and page size)
  const rowsPerPage = 20; // Adjust this value as needed
  const allRows = apiData.slice(0, -1); // All rows excluding the last one
  const tableRows = [];

  // Generate table rows with header repetition
  for (let i = 0; i < allRows.length; i += rowsPerPage) {
    // Add data rows for this page section
    const pageRows = allRows.slice(i, Math.min(i + rowsPerPage, allRows.length)).map((row, index) => {
      const isOpeningBalance = row.doc_type === "Opening Balance";
      const isClosingBalance = row.doc_type === "Closing Balance";
      const isTotalRow = row.running_balance && !row.transaction_id;
      return `
        <tr class="${(isOpeningBalance || isClosingBalance) ? 'font-bold bg-gray-100' : isTotalRow ? 'bg-white text-customBlue font-bold' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100">
          ${fieldsMapping.map((field) => {
            let value = row[field.key] ?? '';
            if (field.key === 'running_balance') {
              value = formatCurrency(value);
            } else if (field.render) {
              value = field.render(value);
              value = typeof value === 'string' ? value : value?.props?.children || '';
            } else if (field.value) {
              value = field.value(value) || '';
            }
            return `<td class="px-4 py-2 truncate" style="max-width: ${field.width}px; ;">${value}</td>`;
          }).join('')}
        </tr>
      `;
    }).join('');
    tableRows.push(pageRows);
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Print Supplier Ledger</title>
        <style>
          .print-header {
            width: 100%;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 0;
            border-bottom: 1px solid black;
            background-color: #f9f9f9;
          }
          .content-wrapper {
            margin-top: 0; /* Removed fixed header offset */
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
          }
          table, th, td {
            border: 1px solid black;
          }
          th, td {
            padding: 8px;
            text-align: left;
          }
          .summary-box {
            width: 96.5%;
            background-color: #e0f7fa;
            padding: 10px 20px;
            margin-top: 20px;
            font-weight: bold;
            font-size: 12px;
            border: 2px solid #00796b;
            text-align: right;
          }
          .header-row {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          @media print {
            @page {
              size: landscape;
              margin: 0.5in;
            }
            .print-header {
              position: static; /* Removed fixed positioning */
            }
            .content-wrapper {
              position: static;
              top: 0; /* Removed fixed offset */
            }
            table {
              font-size: 8px !important;
              width: 100% !important;
              table-layout: fixed !important;
            }
            th, td {
              padding: 2px !important;
            }
            thead {
              display: table-header-group;
            }
            tbody {
              display: table-row-group;
            }
            ${fieldsMapping.map((field, index) => `
              th:nth-child(${index + 1}), td:nth-child(${index + 1}) {
                width: ${(field.width * widthRatio).toFixed(2)}%;
              }
            `).join('')}
            .font-bold {
              font-weight: bold;
            }
            .summary-box {
              font-size: 10px !important;
              padding: 8px 15px !important;
              break-inside: avoid;
            }
            .header-row {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="content-wrapper">
          <div class="print-scrollable">
            <table>
              <thead class="bg-customBlue text-white">
                <tr class="header-row">
                  <th colspan="${fieldsMapping.length}" class="print-header">
                    Company: ${selectedCompanyNames}<br>Suppliers: ${selectedSupplierNames}<br>Supplier Ledger<br>From: ${startDate ? dayjs(startDate).format("DD-MM-YYYY") : ""} To: ${endDate ? dayjs(endDate).format("DD-MM-YYYY") : ""}
                  </th>
                </tr>
                <tr>
                  ${fieldsMapping.map((field) => `<th class="px-4 py-2 truncate" style="">${field.label}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${tableRows.join('')}
              </tbody>
            </table>
          </div>
          <div class="summary-box">
            ${lastRow?.balance_type || ''}: ${formatCurrency(lastRow?.running_balance)}
          </div>
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



  const handleApplyFilters = async (data) => {
    if (data.length > 0 || companyIds.length > 0) {
      if (startDate && endDate) {
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        if (start.isAfter(end)) {
          toast.error("Start date should be before or equal to end date.")
          // Swal.fire({
          //   icon: "error",
          //   title: "Invalid Date Range",
          //   text: "Start date should be before or equal to end date.",
          // });
          return;
        }
        setAppliedFilters(data);
        handleFetchdata(data, startDate, endDate, supplierIds, companyIds);
        handleFetchExcelData(data);
      } else {
        toast.warning("Something went wrong")
        // Swal.fire({
        //   icon: "warning",
        //   title: "Missing Data",
        //   text: "Please select both start and end dates.",
        // });
      }
    } else {
      toast.error("Please select at least one company")
      // Swal.fire({
      //   icon: "error",
      //   title: "Oops...",
      //   text: "Please select at least one company",
      // });
    }
  };

  useEffect(() => {
    if (debouncedSearchTerm) {
      handleFetchdataJh(debouncedSearchTerm);
      handleFetchCompany(debouncedSearchTerm);
    } else {
      setSupplierOptions([]);
      setCompanyOptions([]);
    }
  }, [debouncedSearchTerm]);

  const HeaderFilterSection = () => {
    return (
      <div className="mt-1">
        <div>
          <p>Company Name</p>
          <div className="flex bg-white border border-gray-500 rounded-md mb-2.5 mt-1">
            <Select
              mode="multiple"
              allowClear
              showSearch
              style={{ width: "100%" }}
              className="custom-select"
              placeholder="Select Companies"
              value={companyIds}
              optionFilterProp="label"
              options={companyOptions}
              onSearch={(value) => setSearchTerm(value)}
              onChange={(value) => setCompanyIds(value)}
            />
          </div>
        </div>
        <div>
          <p>Supplier</p>
          <div className="flex bg-white border border-gray-500 rounded-md mb-2.5 mt-1">
            <Select
              mode="multiple"
              allowClear
              showSearch
              style={{ width: "100%" }}
              className="custom-select"
              placeholder="Select Suppliers"
              value={supplierIds}
              optionFilterProp="label"
              options={SupplierOptions?.map((item) => ({
                value: item?.record_id,
                label: item?.supplier_name,
              })) || []}
              onSearch={(value) => setSearchTerm(value)}
              onChange={(value) => setSupplierIds(value)}
            />
          </div>
          <div>
            <p>Date Range</p>
            <div className="flex bg-white border border-gray-500 rounded-md mb-2.5 mt-1 gap-2">
              <DatePicker
                style={{ width: "100%" }}
                className="custom-select"
                placeholder="Start Date"
                value={startDate ? dayjs(startDate) : null}
                onChange={(date) => setStartDate(date ? date.format("YYYY-MM-DD") : null)}
                format="DD-MM-YYYY"
              />
              <DatePicker
                style={{ width: "100%" }}
                className="custom-select"
                placeholder="End Date"
                value={endDate ? dayjs(endDate) : null}
                onChange={(date) => setEndDate(date ? date.format("YYYY-MM-DD") : null)}
                format="DD-MM-YYYY"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (apiData.length > 0) {
      setIsFilterWidth(true);
    }
  }, [apiData]);

  return (
    <>
      <div className="overflow-hidden">
        <h1 className="text-size text-color font-headingweight mb-2">
          Supplier Ledger
        </h1>
        <div className="flex gap-2 items-center">
          <button
            className="flex bg-customBlue text-btnsize rounded-radiusRegular shadow-md text-white font-regularweight duration-300 gap-1 items-center mb-2 px-2 py-1 transition-all"
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
          <div className="text-color">
            {startDate && dayjs(startDate).format("DD-MM-YYYY")} - {endDate && dayjs(endDate).format("DD-MM-YYYY")}
          </div>
        </div>
        <div className="gap- lg:flex relative">
          <div
            className={`transform transition-all duration-300 ease-in-out 
                ${isFilterWidth
                ? "w-0 opacity-0 -translate-x-full"
                : "opacity-100 translate-x-0 w-96 shrink-0"
              } 
                sticky top-4`}
          >
            <div className="h-full mb-2 md:pr-4">
              <DynamicFilter
                parentStateSet={setIsFilterWidth}
                addpartentSectionAppend={HeaderFilterSection()}
                fieldGrid="grid-cols-1"
                fields={[]}
                onApply={handleApplyFilters}
                watchName="company_name"
                setChildData={setChildData}
                className="bg-white border border-gray-100 h-full p-4 rounded-radiusRegular shadow-lg"
              />
            </div>
          </div>

          <div
            className={`flex-1 transition-all duration-300 xs:mt-2 sm:mt-2 md:mt-2 lg:mt-0 ${isFilterWidth ? "" : ""}`}
            style={{ width: "100%", overflowX: "auto", zIndex: 2 }}
          >
            {apiData && apiData.length > 0 ? (
              <div>
                <div className="flex justify-content-end gap-2 my-2">
                  <CustomButton
                    icon={"Excel"}
                    btntext={<FaRegFileExcel className="me-1" />}
                    handleClick={() => handleExport("excel")}
                  />
                  <CustomButton
                    icon={"CSV"}
                    btntext={<FaFileCsv className="me-1" />}
                    handleClick={() => handleExport("csv")}
                  />
                  <CustomButton
                    icon={"JSON"}
                    btntext={<BsFiletypeJson className="me-1" />}
                    handleClick={() => handleExport("json")}
                  />
                  <CustomButton
                    icon={"PDF"}
                    btntext={<FaRegFilePdf className="me-1" />}
                    handleClick={() => handleExport("pdf")}
                  />
                  <CustomButton
                    icon={"Print"}
                    btntext={<FaPrint className="me-1" />}
                    handleClick={handlePrint}
                  />
                </div>
                {isPending ? (
                  <Loader />
                ) : (
                  <div className="">
                    <ResizableTable
                      data={apiData || []}
                      columns={fieldsMapping}
                      isSelect={false}
                      height="300px"
                      isDense={true}
                      onSelectRow={null}
                      scrollableId={"SupplierLedgerReport"}
                      enableScroll={true}
                      loading={isPending}
                    />
                    <div className="hidden">
                      <div
                        ref={printRef}
                        className="border border-gray-300 rounded-radiusRegular shadow-lg overflow-hidden"
                      >
                        <div className="print-scrollable">
                          <table className="table-auto text-gray-700 text-left text-sm min-w-full">
                            <thead className="bg-customBlue text-white sticky top-0 z-10">
                              <tr>
                                {fieldsMapping.map((field) => (
                                  <th key={field.key} className="px-4 py-2 truncate">
                                    {field.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {apiData.map((row, index) => {
                                const isTotalRow = row.running_balance && !row.transaction_id;
                                return (
                                  <tr
                                    key={index}
                                    className={`border ${isTotalRow
                                      ? "bg-white text-customBlue border font-bold"
                                      : index % 2 === 0
                                        ? "bg-white"
                                        : "bg-gray-50"
                                      } hover:bg-gray-100`}
                                  >
                                    {fieldsMapping.map((field) => {
                                      let value = row[field.key] ?? '';
                                      if (field.render) {
                                        value = field.render(value);
                                        value = typeof value === 'string' ? value : value?.props?.children || '';
                                      } else if (field.value) {
                                        value = field.value(value) || '';
                                      }
                                      return (
                                        <td
                                          key={field.key}
                                          className="px-4 py-2 truncate"
                                          style={{ maxWidth: `${field.width}px` }}
                                        >
                                          {value}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col bg-white justify-center p-4 rounded-radiusRegular items-center">
                <FaInbox size={40} className="text-color" />
                <p>
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
          }
          .custom-select .ant-picker {
            border: none !important;
            box-shadow: none !important;
            width: 100%;
          }
          .custom-select .ant-picker-focused {
            border: none !important;
            box-shadow: none !important;
          }`}
      </style>
    </>
  );
};

export default withPermissionCheck(SupplierLedgerReport, "supplier-ledger-report");