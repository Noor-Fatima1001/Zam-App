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
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import useDebounce from "../../hooks/useDebounce";
import { formatNumberDisplay, getMonthNumber } from "../../utils/helper.function";
import Loader from "../../components/Loader";
import moment from "moment";

import { useForm } from "react-hook-form";
import ResizableTable from "../../components/table/ResizableTable";
import dayjs from "dayjs";
const JournalLedger = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_JOURNAL_LEDGER);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_JOURNAL_LEDGER
  );
  const { mutate: J_Vochor, isPending: jhisPending } = useGlobelApi(
    API_ENDPOINTS.GET_COA
  );
  const {
    mutate: fiscalYearMonth,
    isPending: fiscalYearMonthLoading,
    data: fiscalYearMonthData,
  } = useGlobelApi(API_ENDPOINTS.GET_FISCAL_YEAR_MONTH);
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const [apiData, setApiData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [jhOption, setJhOption] = useState([]);
  const [jlOption, setJLOption] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterWidth, setIsFilterWidth] = useState(false);
  const [jernalIds, setJernalIds] = useState([]);
  const [childData, setChildData] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [startMonthYear, setStartMonthYear] = useState(null);
  const [endMonthYear, setEndMonthYear] = useState(null);
  const navigate = useNavigate();
  const printRef = useRef();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [companyId, setCompanyId] = useState();
  const [company, setCompany] = useState();
  const { mutate: getCompanyName } = useGlobelApi(API_ENDPOINTS.GET_COMPANY);
  const fieldsMapping = [
    {
      key: "gl_code", label: "Gl Code", width: 120, sortable: true,
      filterable: true,
    },
    {
      key: "gl_name",
      label: "GL Name",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "posting_date",
      label: "Posting Date",
      width: 200,
      render: (value) => (
        <span>

          {value ? moment(value).format("DD-MM-YYYY") : ""}

        </span>
      ),
      sortable: true,
      filterable: true,
    },
    {
      key: "description",
      label: "Description",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "source",
      label: "Source",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "source_id",
      label: "Source Id",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {

      key: "debit",
      label: "Debit",

      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),



      // editable: true,
    },
    {
      key: "credit",
      label: "Credit",

      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value)
      // editable: true,
    },


    {
      key: "balance", label: "Balance", width: 120, sortable: true,

      filterable: true,
      render: (value) => formatNumberDisplay(value)
    },
  ];


  const handleFetchdata = (filter, startperiod, endperiod, journalIds, company_id) => {

    const filterJhIds = Array.isArray(journalIds) ? journalIds.join(",") : journalIds;
    const baseFilters = [
      {
        key: "coa.id",
        operator: "in",
        value1: filterJhIds,
        logical: "",
      },
    ];
    if (filter?.[0]?.value1 != "" && filter?.[0]?.value1 != undefined) {
      setCompanyId(filter?.[0]?.value1);
    }
    const filters = filterJhIds ? baseFilters : null;
    mutate(
      {
        headerData: {
          period_id_start: startperiod || "",
          period_id_end: endperiod || "",
          company_id: companyId || filter?.[0]?.value1 || company_id
        },
        filters: filters || null,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (data) => {
          const newUsers = data?.data || [];
          // newUsers.shift(); // Removes the record at index 0
          setApiData(newUsers);
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
      localStorage.removeItem("trilaBalanceData")
      setCompanyId(trialBalanceData.companyId)
      setCompany(trialBalanceData.company_name);
      setEndMonthYear({
        value: trialBalanceData.period_id_end,
        label: trialBalanceData.period_id_end_name,
      })
      setStartMonthYear({
        value: trialBalanceData.period_id_start,
        label: trialBalanceData.period_id_start_name,
      })
      setJernalIds([trialBalanceData.gl_filters]);
      handleFetchdata(null, trialBalanceData.period_id_start, trialBalanceData.period_id_end, trialBalanceData.filters, trialBalanceData.companyId);
    }
  }, [navigate])


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
    // Format posting_date field
    const formattedData = data.map(item => ({
      ...item,
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY"),
      debit: parseFloat(item.debit).toFixed(3),
      credit: parseFloat(item.credit).toFixed(3),
      balance: parseFloat(item.balance).toFixed(3),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "journal-ledger.xlsx");
  };

  const exportToCSV = (data) => {
    // Format posting_date field
    const formattedData = data.map(item => ({
      ...item,
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY"),
      debit: parseFloat(item.debit).toFixed(3),
      credit: parseFloat(item.credit).toFixed(3),
      balance: parseFloat(item.balance).toFixed(3),
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "journal-ledger.csv";
    link.click();
  };

  const exportToJSON = (data) => {
    // Format posting_date field
    const formattedData = data.map(item => ({
      ...item,
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY"),
      debit: parseFloat(item.debit).toFixed(3),
      credit: parseFloat(item.credit).toFixed(3),
      balance: parseFloat(item.balance).toFixed(3),
    }));

    const jsonString = JSON.stringify(formattedData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "journal-ledger.json";
    link.click();
  };
 const exportToPDF = (data) => {
    // Format posting_date field
    const formattedData = data.map(item => ({
      ...item,
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY"),
      debit: parseFloat(item.debit).toFixed(3),
      credit: parseFloat(item.credit).toFixed(3),
      balance: parseFloat(item.balance).toFixed(3),
    }));

    const selectedKeys = ['posting_date', 'source', 'source_id', 'gl_code', 'gl_name', 'description', 'debit', 'credit', 'balance'];
    const tableHeaders = selectedKeys;

    const tableData = formattedData.map((item) =>
      selectedKeys.map((key) => item[key])
    );

    const doc = new jsPDF();
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      styles: {
        fontSize: 6,
        cellWidth: 'wrap',
        overflow: 'linebreak',
      },
    });

    doc.save("journal-ledger.pdf");
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
      serverDefaultValue: company,
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
    if (data.length > 0 || companyId) {
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

        setAppliedFilters(data);
        handleFetchdata(data, startMonthYear, endMonthYear, jernalIds);
        handleFetchExcelData(data);
      } else {
        if (startMonthYear && endMonthYear) {

          setAppliedFilters(data);
          const journalIds = jernalIds?.map(item => item.value ? item.value : item).join(',');
          handleFetchdata(data, startMonthYear.value ? startMonthYear.value : startMonthYear, endMonthYear.value ? endMonthYear.value : endMonthYear, journalIds);
          handleFetchExcelData(data);
        } else {
          toast.warning("Unable to find the start or end period. Please check your selection.")
          // Swal.fire({
          //   icon: "warning",
          //   title: "Missing Data",
          //   text: "Unable to find the start or end period. Please check your selection.",
          // });
        }
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
    let start = "";
    let end = "";
    if (startMonthYear.value) {
      start = startMonthYear.label;
    } else {
      start = monthData.find(item => item.value == startMonthYear).label;
    }
    if (endMonthYear.value) {
      end = endMonthYear.label;
    } else {
      end = monthData.find(item => item.value == endMonthYear).label;
    }

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
                  @media print {
                  .print-scrollable {
                    overflow: visible !important;
                  }
                  
                  table {
                    font-size: 10px !important; /* Smaller font for printing */
                    width: 100% !important;
                    table-layout: fixed !important;
                  }
                  
                  th, td {
                    padding: 2px !important;
                    white-space: nowrap !important; /* Prevent wrapping for most cells */
                  }
                  
                  /* Allow only description to wrap */
                  th:nth-child(4), td:nth-child(4) {
                    white-space: normal !important;
                    word-wrap: break-word !important;
                  }
                }  

                </style>
              </head>
              <body>
              <div class="print-header" >${companyName}</div>
              <div class="print-header">Journal Ledger</div>
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
            value={startMonthYear}
            // filterSort={(optionA, optionB) =>
            //   (optionA?.label ?? "")
            //     .toLowerCase()
            //     .localeCompare((optionB?.label ?? "").toLowerCase())
            // }
            options={getOptions()}
            onChange={handleStartMonthYearChange}
            defaultValue={startMonthYear}
          />
          <Select
            showSearch
            style={{ width: "100%" }}
            className="custom-select"
            placeholder="End "
            value={endMonthYear}
            optionFilterProp="label"
            disabled={fiscalYearMonthLoading || !childData}
            options={getOptions()}
            onChange={handleEndMonthYearChange}
            defaultValue={endMonthYear}
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
              value={jernalIds}
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
  return (
    <>
      <div className="overflow-hidden">
        <h1 className="text-size text-color font-headingweight mb-2">
          {" "}
          Journal Ledger
        </h1>
        <div className="flex gap-2 items-center">
          <button
            className="flex bg-customBlue text-btnsize rounded-radiusRegular shadow-md text-white font-regularweight font-regularweight duration-300 gap-1 items-center mb-2 px-2 py-1 transition-all"
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
                : " opacity-100 translate-x-0 w-96 shrink-0"
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
            style={{ width: "100%", overflowX: "auto", zIndex: 2 }}
          >
            {apiData && apiData.length > 1 ? (
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
                {isPending && apiData.length <= 0 ? (
                  <Loader />
                ) : (
                  <div className="" >
                    <ResizableTable
                      data={apiData || []}
                      columns={fieldsMapping}
                      isSelect={false}
                      height="300px"
                      isDense={true}
                      onSelectRow={null}
                      scrollableId={"JournalLedger"}
                      enableScroll={true}
                      loading={isPending}
                    />
                    <div className="hidden relative" >
                      <div
                        ref={printRef}
                        className="border border-gray-300 rounded-radiusRegular shadow-lg overflow-hidden"
                      >
                        <div className="print-scrollable">
                          <table className="table-auto text-gray-700 text-left text-sm min-w-full  " >
                            <thead className="bg-customBlue text-white sticky top-0 z-10">
                              <tr>
                                <th className="px-4 py-2 truncate" >GL Code</th>
                                <th className="px-4 py-2 truncate"  >GL Name</th>
                                <th className="px-4 py-2  truncate"  >Posting date</th>
                                <th className="px-4 py-2 truncate"  >Description</th>
                                <th className="px-4 py-2  truncate">Debit</th>
                                <th className="px-4 py-2  truncate">Credit</th>
                                <th className="px-4 py-2 truncate">Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {apiData.map((row, index) => {
                                const isTotalRow = row.gl_code === "Total";
                                const postingDate = row.posting_date
                                  ? moment(row.posting_date).isValid()
                                    ? moment(row.posting_date).format("DD-MM-YYYY")
                                    : null
                                  : null;

                                return (
                                  <tr
                                    key={index}
                                    className={`border  ${isTotalRow
                                      ? "bg-white text-customBlue border font-bold"
                                      : index % 2 === 0
                                        ? "bg-white"
                                        : "bg-gray-50"
                                      } hover:bg-gray-100`}
                                  >
                                    <td className="px-4 py-2 max-w-[120px] truncate">
                                      {row.gl_code}
                                    </td>
                                    <td className="px-4 py-2 truncate" >
                                      {row.gl_name || "N/A"}
                                    </td>
                                    <td className="px-4 py-2  truncate ">
                                      {postingDate || ""}
                                    </td>
                                    <td
                                      className="px-4 py-2  truncate"
                                      title={row.description}
                                    >
                                      {`${row.description}`}
                                    </td>
                                    <td className="px-4 py-2  truncate">
                                      {formatNumber(formattedNumber(row.debit)) || "0.00"}
                                    </td>
                                    <td className="px-4 py-2  truncate">
                                      {formatNumber(formattedNumber(row.credit)) || "0.00"}
                                    </td>
                                    <td className="px-4 py-2 truncate">
                                      {row.opening_balance === 0
                                        ? "0.00"
                                        : formatNumber(formattedNumber(row.balance)) || "0.00"}
                                    </td>
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

export default withPermissionCheck(JournalLedger, "journal-ledger");
