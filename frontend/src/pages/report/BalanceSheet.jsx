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
import { toast } from "react-toastify";

import { useForm } from "react-hook-form";
import ResizableTable from "../../components/table/ResizableTable";
import dayjs from "dayjs";
import HierarchicalTable from "../../components/table/HierarchicalTable";
const BalanceSheet = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_BALANCE_SHEET);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_BALANCE_SHEET
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
  const [tableData, setTableData] = useState([]);
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
  const [groupedData, setGroupedData] = useState([]);
  const navigate = useNavigate();
  const printRef = useRef();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [companyId, setCompanyId] = useState();
  const [company, setCompany] = useState();
  const { mutate: getCompanyName } = useGlobelApi(API_ENDPOINTS.GET_COMPANY);
  const fieldsMapping = [
    {
      key: "name", label: " ", width: 200, sortable: false,
      render: (value) => {
        return <span className="fw-bold " style={{ color: "red" }}  >
          {/* {value} */}
        </span>
      },
      filterable: false,
    },
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
    },
    {
      key: "opening_balance",
      label: "Opening Balance",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {

      key: "closing_balance",
      label: "Closing Balance",

      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {

      key: "period_debit",
      label: "Debit",

      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {

      key: "period_credit",
      label: "Credit",

      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
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
        onSuccess: (response) => {
          const data = response?.data || [];
          const grouped_data = data.reduce((acc, item) => {
            const headName = item.head_name || 'Unknown';
            if (!acc[headName]) {
              acc[headName] = { subHeads: {}, total: null };
            }
            if (item.gl_name === `TOTAL ${headName}` || (headName === 'TOTAL' && item.head_name === 'TOTAL')) {
              acc[headName].total = item;
            } else if (item.sub_name) {
              const subName = item.sub_name;
              if (!acc[headName].subHeads[subName]) {
                acc[headName].subHeads[subName] = { items: [], subtotal: null };
              }
              if (item.gl_name === 'SUBTOTAL') {
                acc[headName].subHeads[subName].subtotal = item;
              } else {
                acc[headName].subHeads[subName].items.push(item);
              }
            }
            return acc;
          }, {});
          setGroupedData(grouped_data)
          setApiData(data);
          const newData = transformToHierarchical(data);
          setTableData(newData);
        },
        onError: (error) => {
          console.error("Error fetching users:", error);
        },
      }
    );
  };

  const transformToHierarchical = (flatData) => {
    const levelColors = ["#FF6B6B", "#4ECDC4", "#FFD93D"];
    const tree = [];
    const headMap = new Map(); // head_name -> head node
    const subMap = new Map();  // `${head_name}_${sub_name}` -> sub node

    flatData.forEach((item, idx) => {
      // Step 1: Group by head_name (not main_head_id)
      const headKey = item.head_name?.trim();
      if (!headKey) return; // Skip records with no head_name

      let headNode = headMap.get(headKey);

      if (!headNode) {
        headNode = {
          id: `head_${headKey.replace(/\s+/g, "_").toLowerCase()}`,
          name: item.head_name,
          parent_id: null,
          level: 1,
          arrowColor: levelColors[0],
          children: []
        };
        headMap.set(headKey, headNode);
        tree.push(headNode);
      }

      // Step 2: Handle sub_name (if any)
      let parentNode = headNode;
      const subKey = item.sub_name?.trim() ? `${headKey}_${item.sub_name.trim()}` : null;

      if (subKey) {
        let subNode = subMap.get(subKey);
        if (!subNode) {
          subNode = {
            id: `sub_${subKey.replace(/\s+/g, "_").toLowerCase()}`,
            name: item.sub_name,
            parent_id: headNode.id,
            level: 2,
            arrowColor: levelColors[1],
            children: []
          };
          subMap.set(subKey, subNode);
          headNode.children.push(subNode);
        }
        parentNode = subNode;
      }

      // Step 3: GL node
      const glNode = {
        id: `gl_${idx}`,
        parent_id: parentNode.id,
        level: parentNode.level + 1,
        arrowColor: levelColors[parentNode.level] || levelColors.at(-1),
        children: [],
        ...item,
        opening_balance: item.opening_balance != null ? formatNumberDisplay(item.opening_balance) : "",
        closing_balance: item.closing_balance != null ? formatNumberDisplay(item.closing_balance) : "",
        period_credit: item.period_credit != null ? formatNumberDisplay(item.period_credit) : "",
        period_debit: item.period_debit != null ? formatNumberDisplay(item.period_debit) : "",


      };

      parentNode.children.push(glNode);
    });

    return tree;
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
        opening_balance: parseFloat(item.opening_balance).toFixed(3),
        period_debit: parseFloat(item.period_debit).toFixed(3),
        period_credit: parseFloat(item.period_credit).toFixed(3),
        closing_balance: parseFloat(item.closing_balance).toFixed(3),
    }));
   const limitedData = formattedData.slice(0, 1000);
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "balance_sheet.xlsx");
  };

  const exportToCSV = (data) => {
    // Format posting_date field
    const formattedData = data.map(item => ({
      ...item,
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY")
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "balance_sheet.csv";
    link.click();
  };

  const exportToJSON = (data) => {
    // Format posting_date field
    const formattedData = data.map(item => ({
      ...item,
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY")
    }));

    const jsonString = JSON.stringify(formattedData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "balance_sheet.json";
    link.click();
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let yOffset = 20;

    // Add company name
    getCompanyName(
      {
        filters: { key: 'c.id', operator: 'equal', value1: companyId, logical: '' },
        limit: 0,
        offset: 0,
        orderby: '',
      },
      {
        onSuccess: (response) => {
          const companyName = response?.data?.[0]?.company_name || 'Unknown Company';
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(companyName, pageWidth / 2, yOffset, { align: 'center' });
          yOffset += 8;

          // Add title
          doc.text('Balance Sheet', pageWidth / 2, yOffset, { align: 'center' });
          yOffset += 8;

          // Add period
          const monthData = fiscalYearMonthData?.data?.map((item) => ({
            value: item?.record_id,
            label: `${getMonthNumber(item.month_name)}-${item.month_year}`,
          })) || [];
          let start = startMonthYear?.label || monthData.find(item => item.value == startMonthYear)?.label || '';
          let end = endMonthYear?.label || monthData.find(item => item.value == endMonthYear)?.label || '';
          doc.setFontSize(8);
          doc.text(`From: ${start} To: ${end}`, pageWidth / 2, yOffset, { align: 'center' });
          yOffset += 10;

          // Prepare table data in a single table format with new columns
          const tableData = [];
          tableData.push([' ', ' ', 'GL Name', 'Opening Balance', 'Total Debit', 'Total Credit', 'Balance']);

          // Assets Section
          tableData.push(['Assets', '', '', '', '', '', '']);
          const assets = groupedData['Assets'] || { subHeads: {}, total: null };
          Object.entries(assets.subHeads).forEach(([subName, subData]) => {
            tableData.push(['', subName, '', '', '', '', '']);
            subData.items.forEach(item => {
              tableData.push(['', '', item.gl_name, formatNumberDisplay(item.opening_balance), formatNumberDisplay(item.period_debit), formatNumberDisplay(item.period_credit), formatNumberDisplay(item.closing_balance)]);
            });
            if (subData.subtotal) {
              tableData.push(['', 'SUBTOTAL', '', formatNumberDisplay(subData.subtotal.opening_balance), formatNumberDisplay(subData.subtotal.period_debit), formatNumberDisplay(subData.subtotal.period_credit), formatNumberDisplay(subData.subtotal.closing_balance)]);
            }
          });
          if (assets.total) {
            tableData.push(['', 'TOTAL Assets', '', formatNumberDisplay(assets.total.opening_balance), formatNumberDisplay(assets.total.period_debit), formatNumberDisplay(assets.total.period_credit), formatNumberDisplay(assets.total.closing_balance)]);
          }

          // Liability Section
          tableData.push(['Liability', '', '', '', '', '', '']);
          const liability = groupedData['Liability'] || { subHeads: {}, total: null };
          Object.entries(liability.subHeads).forEach(([subName, subData]) => {
            tableData.push(['', subName, '', '', '', '', '']);
            subData.items.forEach(item => {
              tableData.push(['', '', item.gl_name, formatNumberDisplay(item.opening_balance), formatNumberDisplay(item.period_debit), formatNumberDisplay(item.period_credit), formatNumberDisplay(item.closing_balance)]);
            });
            if (subData.subtotal) {
              tableData.push(['', 'SUBTOTAL', '', formatNumberDisplay(subData.subtotal.opening_balance), formatNumberDisplay(subData.subtotal.period_debit), formatNumberDisplay(subData.subtotal.period_credit), formatNumberDisplay(subData.subtotal.closing_balance)]);
            }
          });
          if (liability.total) {
            tableData.push(['', 'TOTAL Liabilities', '', formatNumberDisplay(liability.total.opening_balance), formatNumberDisplay(liability.total.period_debit), formatNumberDisplay(liability.total.period_credit), formatNumberDisplay(liability.total.closing_balance)]);
          }

          // Equity Section
          tableData.push(['Equity', '', '', '', '', '', '']);
          const equity = groupedData['Equity'] || { subHeads: {}, total: null };
          Object.entries(equity.subHeads).forEach(([subName, subData]) => {
            tableData.push(['', subName, '', '', '', '', '']);
            subData.items.forEach(item => {
              tableData.push(['', '', item.gl_name, formatNumberDisplay(item.opening_balance), formatNumberDisplay(item.period_debit), formatNumberDisplay(item.period_credit), formatNumberDisplay(item.closing_balance)]);
            });
            if (subData.subtotal) {
              tableData.push(['', 'SUBTOTAL', '', formatNumberDisplay(subData.subtotal.opening_balance), formatNumberDisplay(subData.subtotal.period_debit), formatNumberDisplay(subData.subtotal.period_credit), formatNumberDisplay(subData.subtotal.closing_balance)]);
            }
          });
          if (equity.total) {
            tableData.push(['', 'TOTAL Equity', '', formatNumberDisplay(equity.total.opening_balance), formatNumberDisplay(equity.total.period_debit), formatNumberDisplay(equity.total.period_credit), formatNumberDisplay(equity.total.closing_balance)]);
          }

          // Add table to PDF with adjusted alignment
          doc.autoTable({
            head: [tableData[0]],
            body: tableData.slice(1),
            startY: yOffset,
            margin: { left: margin },
            styles: { fontSize: 7, cellPadding: 1.5 },
            headStyles: { fillColor: [103, 159, 243], textColor: [255, 255, 255], fontSize: 7, halign: 'center' },
            bodyStyles: { textColor: [0, 0, 0] },
            columnStyles: {
              0: { cellWidth: 30, halign: 'left' }, // Category
              1: { cellWidth: 30, halign: 'left' }, // Subcategory
              2: { cellWidth: 40, halign: 'left' }, // GL Name
              3: { cellWidth: 30, halign: 'right' }, // Opening Balance
              4: { cellWidth: 30, halign: 'right' }, // Total Debit
              5: { cellWidth: 30, halign: 'right' }, // Total Credit
              6: { cellWidth: 30, halign: 'right' }, // Balance
            },
            didDrawPage: (data) => {
              yOffset = data.cursor.y;
            }
          });

          doc.save('balance_sheet.pdf');
        },
      }
    );
  };



  const fields = [
    {
      name: "company_name",
      label: "Company name",
      type: "textServer",
      aliases: "",

      endpoint: `${API_ENDPOINTS.USER_TO_COMPANY}`,
      responseWhich: "result",
      ValueKey: "company_id",
      filterQueryKey: "company_id",
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
    const monthData = fiscalYearMonthData?.data?.map((item) => ({
      value: item?.record_id,
      label: `${getMonthNumber(item.month_name)}-${item.month_year}`,
    })) || [];
    let start = startMonthYear?.label || monthData.find(item => item.value == startMonthYear)?.label || '';
    let end = endMonthYear?.label || monthData.find(item => item.value == endMonthYear)?.label || '';

    getCompanyName(
      {
        filters: { key: 'c.id', operator: 'equal', value1: companyId, logical: '' },
        limit: 0,
        offset: 0,
        orderby: '',
      },
      {
        onSuccess: (response) => {
          const companyName = response?.data?.[0]?.company_name || 'Unknown Company';

          // Generate HTML content with a single table and adjusted alignment
          let content = `
          <div style="text-align: center; font-weight: bold; font-size: 12px; padding: 8px 0;">
            ${companyName}
          </div>
          <div style="text-align: center; font-weight: bold; font-size: 12px; padding: 8px 0;">
            Balance Sheet
          </div>
          <div style="text-align: center; font-size: 10px; padding: 8px 0;">
            From: ${start} To: ${end}
          </div>
          <table style="border-collapse: collapse; width: 100%; font-size: 8px;">
            <thead>
              <tr style="background-color: rgb(103, 159, 243); color: #fff;">
                <th style="border: 1px solid #000; padding: 3px; text-align: left; width: 10%;"> </th>
                <th style="border: 1px solid #000; padding: 3px; text-align: left; width: 10%;"> </th>
                <th style="border: 1px solid #000; padding: 3px; text-align: left; width: 20%;">GL Name</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: right; width: 15%;">Opening Balance</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: right; width: 15%;">Total Debit</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: right; width: 15%;">Total Credit</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: right; width: 15%;">Balance</th>
              </tr>
            </thead>
            <tbody>
        `;

          // Assets Section
          content += '<tr style="font-weight: bold;"><td style="border: 1px solid #000; padding: 3px;">Assets</td><td colspan="6"></td></tr>';
          const assets = groupedData['Assets'] || { subHeads: {}, total: null };
          Object.entries(assets.subHeads).forEach(([subName, subData]) => {
            content += `<tr style="font-weight: bold;"><td></td><td style="border: 1px solid #000; padding: 3px; text-align: left;">${subName}</td><td colspan="5"></td></tr>`;
            subData.items.forEach(item => {
              content += `
              <tr style="border: 1px solid #000;">
                <td></td><td></td>
                <td style="border: 1px solid #000; padding: 3px; text-align: left;">${item.gl_name || 'N/A'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.opening_balance) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.period_debit) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.period_credit) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.closing_balance) || '0.00'}</td>
              </tr>
            `;
            });
            if (subData.subtotal) {
              content += `
              <tr style="border: 1px solid #000; font-weight: bold; background-color: #F3F4F6;">
                <td></td><td></td>
                <td style="border: 1px solid #000; padding: 3px; text-align: left;">SUBTOTAL</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(subData.subtotal.opening_balance) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(subData.subtotal.period_debit) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(subData.subtotal.period_credit) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(subData.subtotal.closing_balance) || '0.00'}</td>
              </tr>
            `;
            }
          });
          if (assets.total) {
            content += `
            <tr style="border: 1px solid #000; font-weight: bold; background-color: #DBEAFE;">
              <td></td><td></td>
              <td style="border: 1px solid #000; padding: 3px; text-align: left;">TOTAL Assets</td>
              <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(assets.total.opening_balance) || '0.00'}</td>
              <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(assets.total.period_debit) || '0.00'}</td>
              <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(assets.total.period_credit) || '0.00'}</td>
              <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(assets.total.closing_balance) || '0.00'}</td>
            </tr>
          `;
          }

          // Liability Section
          content += '<tr style="font-weight: bold;"><td style="border: 1px solid #000; padding: 3px;">Liability</td><td colspan="6"></td></tr>';
          const liability = groupedData['Liability'] || { subHeads: {}, total: null };
          Object.entries(liability.subHeads).forEach(([subName, subData]) => {
            content += `<tr style="font-weight: bold;"><td></td><td style="border: 1px solid #000; padding: 3px; text-align: left;">${subName}</td><td colspan="5"></td></tr>`;
            subData.items.forEach(item => {
              content += `
              <tr style="border: 1px solid #000;">
                <td></td><td></td>
                <td style="border: 1px solid #000; padding: 3px; text-align: left;">${item.gl_name || 'N/A'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.opening_balance) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.period_debit) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.period_credit) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.closing_balance) || '0.00'}</td>
              </tr>
            `;
            });
            if (subData.subtotal) {
              content += `
              <tr style="border: 1px solid #000; font-weight: bold; background-color: #F3F4F6;">
                <td></td><td></td>
                <td style="border: 1px solid #000; padding: 3px; text-align: left;">SUBTOTAL</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(subData.subtotal.opening_balance) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(subData.subtotal.period_debit) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(subData.subtotal.period_credit) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(subData.subtotal.closing_balance) || '0.00'}</td>
              </tr>
            `;
            }
          });
          if (liability.total) {
            content += `
            <tr style="border: 1px solid #000; font-weight: bold; background-color: #DBEAFE;">
              <td></td><td></td>
              <td style="border: 1px solid #000; padding: 3px; text-align: left;">TOTAL Liabilities</td>
              <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(liability.total.opening_balance) || '0.00'}</td>
              <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(liability.total.period_debit) || '0.00'}</td>
              <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(liability.total.period_credit) || '0.00'}</td>
              <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(liability.total.closing_balance) || '0.00'}</td>
            </tr>
          `;
          }

          // Equity Section
          content += '<tr style="font-weight: bold;"><td style="border: 1px solid #000; padding: 3px;">Equity</td><td colspan="6"></td></tr>';
          const equity = groupedData['Equity'] || { subHeads: {}, total: null };
          Object.entries(equity.subHeads).forEach(([subName, subData]) => {
            content += `<tr style="font-weight: bold;"><td></td><td style="border: 1px solid #000; padding: 3px; text-align: left;">${subName}</td><td colspan="5"></td></tr>`;
            subData.items.forEach(item => {
              content += `
              <tr style="border: 1px solid #000;">
                <td></td><td></td>
                <td style="border: 1px solid #000; padding: 3px; text-align: left;">${item.gl_name || 'N/A'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.opening_balance) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.period_debit) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.period_credit) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.closing_balance) || '0.00'}</td>
              </tr>
            `;
            });
            if (subData.subtotal) {
              content += `
              <tr style="border: 1px solid #000; font-weight: bold; background-color: #F3F4F6;">
                <td></td><td></td>
                <td style="border: 1px solid #000; padding: 3px; text-align: left;">SUBTOTAL</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(subData.subtotal.opening_balance) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(subData.subtotal.period_debit) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(subData.subtotal.period_credit) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(subData.subtotal.closing_balance) || '0.00'}</td>
              </tr>
            `;
            }
          });
          if (equity.total) {
            content += `
            <tr style="border: 1px solid #000; font-weight: bold; background-color: #DBEAFE;">
              <td></td><td></td>
              <td style="border: 1px solid #000; padding: 3px; text-align: left;">TOTAL Equity</td>
              <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(equity.total.opening_balance) || '0.00'}</td>
              <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(equity.total.period_debit) || '0.00'}</td>
              <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(equity.total.period_credit) || '0.00'}</td>
              <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(equity.total.closing_balance) || '0.00'}</td>
            </tr>
          `;
          }

          content += '</tbody></table>';

          const printWindow = window.open('', '_blank');
          printWindow.document.write(`
          <html>
            <head>
              <title>Balance Sheet</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 15px; }
                table { border-collapse: collapse; width: 100%; font-size: 8px; }
                th, td { border: 1px solid #000; padding: 3px; }
                th { background-color: rgb(103, 159, 243); color: #fff; text-align: center; }
                .total-row { background-color: #DBEAFE; font-weight: bold; }
                .subtotal-row { background-color: #F3F4F6; font-weight: bold; }
                @media print {
                  table { font-size: 7px; }
                  th, td { padding: 2px; color: black }
                }
              </style>
            </head>
            <body>
              ${content}
              <script>
                window.onload = () => {
                  window.print();
                  window.onafterprint = () => window.close();
                };
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
        {/* <div>
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
                  .toLowerCase()ss
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
        </div> */}
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
          Balance Sheet
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
                    <HierarchicalTable
                      data={tableData || []}
                      columns={fieldsMapping}
                      isSelect={false}
                      height="300px"
                      isDense={true}
                      onSelectRow={null}
                      scrollableId={"BalanceSheet"}
                      enableScroll={true}
                      loading={isPending}
                    />
                    <div className="hidden relative">
                      <div ref={printRef} className="border border-gray-300 rounded-radiusRegular shadow-lg overflow-hidden">
                        {Object.entries(groupedData).map(([headName, headData], headIndex) => (
                          <div key={headIndex}>
                            {headName !== 'TOTAL' && (
                              <h1 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E3A8A', margin: '8px 0' }}>
                                {headName}
                              </h1>
                            )}
                            {Object.entries(headData.subHeads).map(([subName, subData], subIndex) => (
                              <div key={subIndex}>
                                <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#4B5563', marginLeft: '8px', marginTop: '4px' }}>
                                  {subName}
                                </h2>
                                <table style={{ borderCollapse: 'collapse', width: '100%', margin: '4px 0 8px 12px', fontSize: '8px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: 'rgb(103, 159, 243)', color: '#fff' }}>
                                      <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>GL Code</th>
                                      <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>GL Name</th>
                                      <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>Opening Balance</th>
                                      <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>Closing Balance</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {subData.items.map((item, itemIndex) => (
                                      <tr key={itemIndex} style={{ border: '1px solid #000', textAlign: 'center' }}>
                                        <td style={{ border: '1px solid #000', padding: '3px' }}>{item.gl_code || ''}</td>
                                        <td style={{ border: '1px solid #000', padding: '3px' }}>{item.gl_name || 'N/A'}</td>
                                        <td style={{ border: '1px solid #000', padding: '3px' }}>
                                          {formatNumberDisplay(item.opening_balance) || '0.00'}
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '3px' }}>
                                          {formatNumberDisplay(item.closing_balance) || '0.00'}
                                        </td>
                                      </tr>
                                    ))}
                                    {subData.subtotal && (
                                      <tr className="subtotal-row" style={{ textAlign: 'center' }}>
                                        <td style={{ border: '1px solid #000', padding: '3px' }}></td>
                                        <td style={{ border: '1px solid #000', padding: '3px' }}>SUBTOTAL</td>
                                        <td style={{ border: '1px solid #000', padding: '3px' }}>
                                          {formatNumberDisplay(subData.subtotal.opening_balance) || '0.00'}
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '3px' }}>
                                          {formatNumberDisplay(subData.subtotal.closing_balance) || '0.00'}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            ))}
                            {headData.total && (
                              <table style={{ borderCollapse: 'collapse', width: '100%', margin: '4px 0 8px 8px', fontSize: '8px' }}>
                                <tbody>
                                  <tr className="total-row" style={{ textAlign: 'center' }}>
                                    <td style={{ border: '1px solid #000', padding: '3px' }}></td>
                                    <td style={{ border: '1px solid #000', padding: '3px' }}>{`TOTAL ${headName}`}</td>
                                    <td style={{ border: '1px solid #000', padding: '3px' }}>
                                      {formatNumberDisplay(headData.total.opening_balance) || '0.00'}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '3px' }}>
                                      {formatNumberDisplay(headData.total.closing_balance) || '0.00'}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            )}
                          </div>
                        ))}
                        {groupedData['TOTAL']?.total && (
                          <table style={{ borderCollapse: 'collapse', width: '100%', margin: '8px 0', fontSize: '8px' }}>
                            <tbody>
                              <tr className="grand-total-row" style={{ textAlign: 'center' }}>
                                <td style={{ border: '1px solid #000', padding: '3px' }}></td>
                                <td style={{ border: '1px solid #000', padding: '3px' }}>GRAND TOTAL</td>
                                <td style={{ border: '1px solid #000', padding: '3px' }}>
                                  {formatNumberDisplay(groupedData['TOTAL'].total.opening_balance) || '0.00'}
                                </td>
                                <td style={{ border: '1px solid #000', padding: '3px' }}>
                                  {formatNumberDisplay(groupedData['TOTAL'].total.closing_balance) || '0.00'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}
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

export default withPermissionCheck(BalanceSheet, "balance-sheet");
