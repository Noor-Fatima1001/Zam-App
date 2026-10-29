import { Select } from "antd";
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
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import { getFromLocalStorage, saveToLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import useDebounce from "../../hooks/useDebounce";
import { getMonthNumber } from "../../utils/helper.function";
import { useForm } from "react-hook-form";
const TrailBalance = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_TRAIL_BALANCE);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_TRAIL_BALANCE
  );
  const { mutate: J_Vochor, isPending: jhisPending } = useGlobelApi(
    API_ENDPOINTS.GET_COA
  );
  const {
    mutate: fiscalYearMonth,
    isPending: fiscalYearMonthLoading,
    data: fiscalYearMonthData,
  } = useGlobelApi(API_ENDPOINTS.GET_FISCAL_YEAR_MONTH);
  const { mutate: getCompanyName } = useGlobelApi(API_ENDPOINTS.GET_COMPANY);
  const { watch } = useForm();
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const [apiData, setApiData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [jhOption, setJhOption] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterWidth, setIsFilterWidth] = useState(false);
  const [jernalIds, setJernalIds] = useState([]);
  const [childData, setChildData] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [startMonthYear, setStartMonthYear] = useState(null);
  const [jlOption, setJLOption] = useState([]);
  const [endMonthYear, setEndMonthYear] = useState(null);
  const navigate = useNavigate();
  const printRef = useRef();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [companyId, setCompanyId] = useState();
  const handleFetchdata = (filter, startperiod, endperiod, jernalIds) => {
    const filterJhIds = jernalIds?.map((item) => item).join(",");
    setCompanyId(filter?.[0].value1)
    const baseFilters = [
      {
        key: "coa.id",
        operator: "in",
        value1: filterJhIds,
        logical: "",
      },
    ];
    const filters = filterJhIds ? [...baseFilters, ...filter] : filter;
    mutate(
      {
        headerData: {
          period_id_start: startperiod || "",
          period_id_end: endperiod || "",
        },
        filters: filters || null,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (data) => {
          const newUsers = data?.data || [];
          setApiData(newUsers);
        },
        onError: (error) => {
          console.error("Error fetching users:", error);
        },
      }
    );
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
            console.error("Error fetching data:", error);
            reject(error);
          },
        }
      );
    });
  };
  const handleFetchdataJh = (filer) => {
    const baseFilters = [
      { key: "gl_name", operator: "contains", value1: filer, logical: "" },
    ];
    J_Vochor(
      {
        filters: baseFilters,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (data) => {
          const newData = data?.data || [];
          setJhOption(newData);
        },
        onError: (error) => {
          console.error("Error fetching ", error);
        },
      }
    );
  };

  const fetchJLOptions = (filer) => {
    J_Vochor(
      {
        filters: null,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (data) => {
          const newData = data?.data || [];
          setJLOption(newData);
        },
        onError: (error) => {
          console.error("Error fetching ", error);
        },
      }
    );
  };

  useEffect(() => {
    fetchJLOptions();
  }, [])

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
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "trail-balance.xlsx");
  };

  const exportToCSV = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "trail-balance.csv";
    link.click();
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();

    // Function to capitalize first letter of each word and remove underscores
    const formatHeader = (header) => {
      return header
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    // Function to format numbers with two decimals and commas
    const formatNumber = (number) => {
      if (number === null || number === undefined || isNaN(number)) return "0.00";
      return Number(number).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    // Function to add headers and footers to each page
    const addHeaderAndFooter = (companyName, start, end) => {
      // Add header
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(companyName, (doc.internal.pageSize.getWidth() - doc.getTextWidth(companyName)) / 2, 10);
      doc.text("Trial Balance", (doc.internal.pageSize.getWidth() - doc.getTextWidth("Trial Balance")) / 2, 14);
      doc.text(`From: ${start}    To: ${end}`, (doc.internal.pageSize.getWidth() - doc.getTextWidth(`From: ${start}    To: ${end}`)) / 2, 18);
      doc.text(`Printed on: July 02, 2025`, (doc.internal.pageSize.getWidth() - doc.getTextWidth("Printed on: July 02, 2025")) / 2, 22);

      // Add footer (page number)
      const pageCount = doc.internal.getNumberOfPages();
      const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`Page ${pageNumber} of ${pageCount}`, (doc.internal.pageSize.getWidth() - doc.getTextWidth(`Page ${pageNumber} of ${pageCount}`)) / 2, doc.internal.pageSize.getHeight() - 10);
    };

    // Fetch company name
    getCompanyName(
      {
        filters: {
          key: "c.id",
          operator: "equal",
          value1: companyId,
          logical: "",
        },
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (response) => {
          const companyName = response?.data?.[0]?.company_name || "Company Name";

          // Get period details
          const monthData = fiscalYearMonthData?.data?.map((item) => {
            return {
              value: item?.record_id,
              label: `${getMonthNumber(item.month_name)}-${item.month_year}`,
            };
          }) || [];

          const start = monthData.find(item => item.value == startMonthYear)?.label || "N/A";
          const end = monthData.find(item => item.value == endMonthYear)?.label || "N/A";

          // Prepare table headers with proper capitalization and no underscores
          const tableHeaders = Object.keys(data[0]).map(formatHeader);

          // Prepare table data with formatted numbers for specific columns
          const tableData = data.map((item) => {
            return Object.keys(item).map((key) => {
              if (['opening_balance', 'debit', 'credit', 'closing_balance'].includes(key)) {
                return formatNumber(item[key]);
              }
              return item[key];
            });
          });

          // Add table to PDF with smaller text and repeat headers
          doc.autoTable({
            head: [tableHeaders],
            body: tableData,
            startY: 28, // Adjusted to account for additional "Printed on" line
            theme: "grid",
            headStyles: {
              fillColor: [0, 51, 102],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 8,
            },
            styles: {
              cellPadding: 1.5,
              fontSize: 7,
              lineColor: [0, 0, 0],
              lineWidth: 0.1,
            },
            didDrawPage: (data) => {
              // Add header and footer on each page
              addHeaderAndFooter(companyName, start, end);
            },
          });

          // Save the PDF
          doc.save("trail-balance.pdf");
        },
        onError: (error) => {
          console.error("Error fetching company name:", error);

          // Fallback in case company name fetch fails
          const monthData = fiscalYearMonthData?.data?.map((item) => {
            return {
              value: item?.record_id,
              label: `${getMonthNumber(item.month_name)}-${item.month_year}`,
            };
          }) || [];

          const start = monthData.find(item => item.value == startMonthYear)?.label || "N/A";
          const end = monthData.find(item => item.value == endMonthYear)?.label || "N/A";

          // Prepare table headers with proper capitalization and no underscores
          const tableHeaders = Object.keys(data[0]).map(formatHeader);

          // Prepare table data with formatted numbers for specific columns
          const tableData = data.map((item) => {
            return Object.keys(item).map((key) => {
              if (['opening_balance', 'debit', 'credit', 'closing_balance'].includes(key)) {
                return formatNumber(item[key]);
              }
              return item[key];
            });
          });

          // Add table to PDF with smaller text and repeat headers
          doc.autoTable({
            head: [tableHeaders],
            body: tableData,
            startY: 28, // Adjusted to account for additional "Printed on" line
            theme: "grid",
            headStyles: {
              fillColor: [0, 51, 102],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 8,
            },
            styles: {
              cellPadding: 1.5,
              fontSize: 7,
              lineColor: [0, 0, 0],
              lineWidth: 0.1,
            },
            didDrawPage: (data) => {
              // Add header and footer on each page
              addHeaderAndFooter("Company Name", start, end);
            },
          });

          // Save the PDF
          doc.save("trail-balance.pdf");
        },
      }
    );
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
  ];

  const handleApplyFilters = async (data) => {
    if (data.length > 0) {
      const startPeriodCheck = fiscalYearMonthData?.data?.find(
        (item) => item.record_id === startMonthYear
      );
      const endPeriodCheck = fiscalYearMonthData?.data?.find(
        (item) => item.record_id === endMonthYear
      );
      if (startPeriodCheck && endPeriodCheck) {
        const startMonth = getMonthNumber(startPeriodCheck.month_name);
        const endMonth = getMonthNumber(endPeriodCheck.month_name);
        const startYear = startPeriodCheck.month_year; // Get the year for the start period
        const endYear = endPeriodCheck.month_year; // Get the year for the end period

        if (startYear > endYear || startMonth > endMonth) {
          toast.error("Start period should be less than the end period.")
          // Swal.fire({
          //   icon: "error",
          //   title: "Invalid Period",
          //   text: "Start period should be less than the end period.",
          // });
          return;
        }
        handleFetchdata(data, startMonthYear, endMonthYear, jernalIds);
        setAppliedFilters(data);

        handleFetchExcelData(data);
      } else {
        toast.warning("Unable to find the start or end period. Please check your selection.")
        // Swal.fire({
        //   icon: "warning",
        //   title: "Missing Data",
        //   text: "Unable to find the start or end period. Please check your selection.",
        // });
      }
    } else {
      toast.error("Please select company")
      // Swal.fire({
      //   icon: "error",
      //   title: "Oops...",
      //   text: "Please select company",
      // });
    }
  };
  const handlefetchYear = async () => {
    fiscalYearMonth({
      filters: [
        { key: "c.id", operator: "equal", value1: childData, logical: "" },
      ],
      limit: 0,
      offset: 0,
      orderby: "fcm.month_year,fcm.start_date_month ASC",
    });
  };
  const handleStartMonthYearChange = (value) => {
    setStartMonthYear(value);
  };

  const handleEndMonthYearChange = (value) => {
    setEndMonthYear(value);
  };
  const handlePrint = () => {

    const monthData = fiscalYearMonthData?.data?.map((item) => {
      return {
        value: item?.record_id,
        // label: `${item.month_name}-${item.month_year}`,
        label: `${getMonthNumber(item.month_name)}-${item.month_year}`,
      };
    }) || [];

    const start = monthData.find(item => item.value == startMonthYear).label;
    const end = monthData.find(item => item.value == endMonthYear).label;

    getCompanyName(
      {
        filters: {
          key: "c.id",
          operator: "equal",
          value1: companyId,
          logical: "",
        },
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (response) => {
          const companyName = response?.data?.[0]?.company_name || "";
          const content = printRef.current.innerHTML;

          const printWindow = window.open("", "_blank");
          if (!printWindow) return;

          printWindow.document.write(`
            <html>
              <head>
                <title>Print Data</title>
                <style>
                  .print-header {
                    width: 100%;
                    text-align: center;
                    font-weight: bold;
                    padding: 10px 0;
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
                  .company-name{
                    display:flex;
                    justify-content:end;
                  }
                </style>
              </head>
              <body>

              <div class="print-header" >${companyName}</div>
              <div class="print-header">Trial Balance</div>
               <div class="print-header" >From:${start} &nbsp;&nbsp; To:${end} </div>

                <div>${content}</div>
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
        },
      }
    );
  };

  useEffect(() => {
    if (debouncedSearchTerm) {
      handleFetchdataJh(debouncedSearchTerm);
    } else {
      setJhOption([]); // Clear options when search is empty
    }
  }, [debouncedSearchTerm]);
  useEffect(() => {
    handlefetchYear();
  }, [childData]);
  const sanitizeAndFormat = (num) => {
    if (num === "" || num === null || isNaN(num)) {
      return "";
    }
    return parseFloat(num).toFixed(3); // Ensures 4 decimal places
  };
  const formattedNumber = (number) => {
    return Math.floor(number); // Removes decimal part
  };

  const formatNumber = (number) => {
    if (!number) return "";
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ".00";
  };
  const HeaderFilterSection = () => {
    const getOptions = () =>
      fiscalYearMonthData?.data?.map((item) => {
        return {
          value: item?.record_id,
          // label: `${item.month_name}-${item.month_year}`,
          label: `${getMonthNumber(item.month_name)}-${item.month_year}`,
        };
      }) || [];
    return (
      <div className="mt-1">
        <p>Period</p>
        <div className="flex bg-white border border-gray-500 rounded-md mb-2.5 mt-1">
          <Select
            showSearch
            style={{ width: "100%" }}
            className="custom-select"
            placeholder="Start "
            optionFilterProp="label"
            disabled={fiscalYearMonthLoading || !childData}
            // filterSort={(optionA, optionB) =>
            //   (optionA?.label ?? "")
            //     .toLowerCase()
            //     .localeCompare((optionB?.label ?? "").toLowerCase())
            // }
            options={getOptions()}
            onChange={handleStartMonthYearChange}
          />
          <Select
            showSearch
            style={{ width: "100%" }}
            className="custom-select"
            placeholder="End "
            optionFilterProp="label"
            disabled={fiscalYearMonthLoading || !childData}
            options={getOptions()}
            onChange={handleEndMonthYearChange}
          />
        </div>
        <div>
          <p>General Ledger</p>
          <div className="flex bg-white border border-gray-500 rounded-md mb-2.5 mt-1">
            <Select
              mode="multiple"
              allowClear
              showSearch
              style={{ width: "100%" }}
              className="custom-select"
              placeholder="Select"
              optionFilterProp="label"
              // disabled={jhisPending}
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? "")
                  .toLowerCase()
                  .localeCompare((optionB?.label ?? "").toLowerCase())
              }
              options={
                jhOption?.map((item) => {
                  return {
                    value: item?.record_id,
                    label: item?.gl_name,
                  };
                }) || []
              }
              onSearch={(value) => setSearchTerm(value)}
              onChange={(value) => setJernalIds(value)}
            />
          </div>
        </div>
      </div>
    );
  };
  useEffect(() => {
    if (apiData.length > 1) {
      setIsFilterWidth(true);
    }
  }, [apiData]);
  console.log(appliedFilters, "appliedFilters");
  const endperiodData = fiscalYearMonthData?.data?.find(
    (item) => item?.record_id == endMonthYear
  );
  const startperiodData = fiscalYearMonthData?.data?.find(
    (item) => item?.record_id == startMonthYear
  );

  const saveGlToLocalStorage = (e) => {
    const startPeriodCheck = fiscalYearMonthData?.data?.find(
      (item) => item.record_id === startMonthYear
    );
    const endPeriodCheck = fiscalYearMonthData?.data?.find(
      (item) => item.record_id === endMonthYear
    );
    const startName = `${getMonthNumber(startPeriodCheck.month_name)}-${startPeriodCheck.month_year}`
    const endName = `${getMonthNumber(endPeriodCheck.month_name)}-${endPeriodCheck.month_year}`
    const item = jlOption.find(item => item.gl_name == e.gl_name);
    const filterJhIds = item ? {
      value: item.record_id,
      label: item.gl_name
    } : undefined;
    const trilaBalanceData = {
      period_id_start: startMonthYear || "",
      period_id_end: endMonthYear || "",
      period_id_start_name: startName || "",
      period_id_end_name: endName || "",
      period_id_start_name: startName || "",
      companyId: companyId,
      gl_filters: filterJhIds,
      company_name: null,
      filters: filterJhIds?.value
    }

    getCompanyName({
      filters: {
        key: "c.id",
        operator: "equal",
        value1: companyId,
        logical: ""
      },
      limit: 0, //should start from 1
      offset: 0,
      orderby: ""
    }, {
      onSuccess: (response) => {
        trilaBalanceData.company_name = response?.data?.[0]?.company_name;
        saveToLocalStorage("trilaBalanceData", trilaBalanceData)
        navigate(`${rootFolder}/journal-ledger`);
      },
    })


  }


  const navigateToLedger = () => {

  }


  return (
    <>
      <div className="overflow-hidden">
        <h2 className="text-black text-lg font-semibold mb-2">
          {" "}
          Trial Balance
        </h2>
        <div className="flex gap-2 items-center">
          <button
            className="flex bg-customBlue text-btnsize rounded-radiusRegular text-white duration-300 gap-1 font-regularweight font-regularweight items-center mb-2 px-2 py-1 transition-all"
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
          <div>
            {startperiodData &&
              getMonthNumber(startperiodData?.month_name) +
              "-" +
              startperiodData?.month_year}{" "}
            {endperiodData &&
              getMonthNumber(endperiodData?.month_name) +
              "-" +
              endperiodData?.month_year}{" "}
          </div>
        </div>
        <div className="gap- lg:flex relative">
          <div
            className={`transform transition-all duration-300 ease-in-out 
        ${isFilterWidth
                ? "w-0 opacity-0 -translate-x-full"
                : " opacity-100 translate-x-0"
              } 
      sticky top-4 `}
          >
            <div className="h-full mb-2 md:pr-4">
              <DynamicFilter
                parentStateSet={setIsFilterWidth}
                addpartentSectionAppend={HeaderFilterSection()}
                fieldGrid="grid-cols-1"
                fields={fields}
                onApply={handleApplyFilters}
                watchName="company_name"
                setChildData={setChildData}
                className="bg-white border border-gray-100 h-full p-4 rounded-radiusRegular shadow-lg"
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div
            className={`flex-1 transition-all duration-300 xs:mt-2 sm:mt-2 md:mt-2 lg:mt-0  ${isFilterWidth ? "" : ""
              }`}
          >
            {apiData && apiData.length > 1 ? (
              <div>
                <div className="flex justify-content-end gap-2 mb-2" >
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
                <div
                  ref={printRef}
                  className="border border-gray-300 rounded-radiusRegular shadow-lg overflow-auto whitespace-nowrap"
                >
                  <table className="table-auto text-gray-700 text-left text-sm min-w-full">
                    <thead className="bg-customBlue text-white sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2">GL Code</th>
                        <th className="px-4 py-2">GL Name</th>
                        <th className="px-4 py-2">Opening Balance</th>
                        <th className="px-4 py-2">Debit</th>
                        <th className="px-4 py-2">Credit</th>
                        <th className="px-4 py-2">Closing Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiData.map((row, index) => {
                        const isTotalRow = row.gl_code === "Total"; // Identify the "Total" row

                        return (
                          <tr
                            key={index}
                            className={`${isTotalRow
                              ? "bg-white text-customBlue border  font-bold"
                              : index % 2 === 0
                                ? "bg-white"
                                : "bg-gray-50"
                              } hover:bg-gray-100`}
                          >
                            <td className="px-4 py-2">{row.gl_code}</td>
                            {/* <td className="px-4 py-2">
                              {<Link to="#">{row.gl_name}</Link> || "N/A"}
                            </td> */}
                            <td className="px-4 py-2">
                              {row.gl_name ? (
                                <div
                                  to="#"
                                  className="tr-blance-gl-name"
                                  style={{ cursor: "pointer", }}
                                  onClick={(e) => {
                                    saveGlToLocalStorage(row)
                                    e.preventDefault();
                                  }}
                                >
                                  {row.gl_name}
                                </div>
                              ) : "N/A"}
                            </td>
                            <td className="px-4 py-2">
                              {row.opening_balance == 0
                                ? "0.00"
                                : formatNumber(
                                  formattedNumber(row.opening_balance)
                                ) || "0.00"}
                            </td>
                            <td className="px-4 py-2">
                              {formatNumber(formattedNumber(row.debit)) ||
                                "0.00"}
                            </td>
                            <td className="px-4 py-2">
                              {formatNumber(formattedNumber(row.credit)) ||
                                "0.00"}
                            </td>
                            <td className="px-4 py-2">
                              {formatNumber(
                                formattedNumber(row.closing_balance)
                              ) || "0.00"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col bg-white justify-center p-4 rounded-radiusRegular items-center">
                <FaInbox size={40} className="text-color" />
                <p>
                  {" "}
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
  color: #9CA3AF !important; /* Replace #888 with your desired color */
}

`}
      </style>
    </>
  );
};

export default withPermissionCheck(TrailBalance, "trial-balance");
