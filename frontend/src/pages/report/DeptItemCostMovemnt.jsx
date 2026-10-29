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
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import { getFromLocalStorage, getFromSessionStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import useDebounce from "../../hooks/useDebounce";
import { formatNumberDisplay, formatUnderScoreValue, getMonthNumber } from "../../utils/helper.function";
import Loader from "../../components/Loader";
import dayjs from "dayjs";
import ResizableTable from "../../components/table/ResizableTable";
import moment from "moment";
import { toast } from "react-toastify";

const DeptItemCostMovemnt = (departmentData) => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.ITEM_COST_MOVEMENT);
  const { mutate: fetchDataForExcel } = useGlobelApi(API_ENDPOINTS.ITEM_COST_MOVEMENT);
  const { mutate: J_Vochor, isPending: jhisPending } = useGlobelApi(API_ENDPOINTS.GET_COA);
  const {
    mutate: fiscalYearMonth,
    isPending: fiscalYearMonthLoading,
    data: fiscalYearMonthData,
  } = useGlobelApi(API_ENDPOINTS.GET_FISCAL_YEAR_MONTH);
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const mainData = getFromSessionStorage("productToDeptData_card");
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
  const navigate = useNavigate();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [companyId, setCompanyId] = useState();
  const [company, setCompany] = useState();
  const { mutate: getCompanyName } = useGlobelApi(API_ENDPOINTS.GET_COMPANY);
  useEffect(() => {
    console.log(mainData?.company_id)

  }, [])
  const fieldsMapping = [
    {
      key: "product_code",
      label: "Product Code",
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
      render: (value) => moment(value).format("DD-MM-YYYY"),
    },
    {
      key: "base_unit_qty",
      label: "Bu_Qty",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "base_unit_price",
      label: "Bu_Price",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "base_unit_total_price",
      label: "Bu_Total Price",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "prev_qty",
      label: "Prev Qty",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "running_qty",
      label: "Running_Qty",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "avg_price",
      label: "Avg Price",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "cost_method",
      label: "Cost Method",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatUnderScoreValue(value)
    },
    {
      key: "system_cost",
      label: "System Cost",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "source",
      label: "Source",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatUnderScoreValue(value)
    },
    {
      key: "source",
      label: "Source",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatUnderScoreValue(value)
    },
    {
      key: "updated_at",
      label: "Updated At",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => moment(value).format("DD-MM-YYYY")
    },
  ];

  const handleFetchdata = (filter, period) => {
    if (filter?.[0]?.value1 != "" && filter?.[0]?.value1 != undefined) {
      setCompanyId(filter?.[0]?.value1);
    }
    const data = getFromSessionStorage("productToDeptData");
    mutate(
      {
        headerData: {
          period_id: period || "",
          product_id: data?.product_id,
          comp_to_dept_id: data?.comp_dept_id,
          company_id: mainData?.company_id
        },
        filters: [],
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (response) => {
          const data = response?.data || [];
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
      setCompanyId(trialBalanceData.companyId);
      setCompany(trialBalanceData.company_name);
      setStartMonthYear({
        value: trialBalanceData.period_id_start,
        label: trialBalanceData.period_id_start_name,
      });
      setJernalIds([trialBalanceData.gl_filters]);
      handleFetchdata(null, trialBalanceData.period_id_start, trialBalanceData.companyId);
    }
  }, [navigate]);

  const handleFetchExcelData = (filter) => {
    const data = getFromSessionStorage("productToDeptData");
    return new Promise((resolve, reject) => {
      fetchDataForExcel(
        {
          headerData: {
            period_id: period || "",
            product_id: data?.product_id,
            comp_to_dept_id: data?.comp_dept_id,
            company_id: companyId || filter?.[0]?.value1 || company_id,
          },
          filters: [] || null, limit: 0, offset: 0
        },
        {
          onSuccess: (result) => {
            const data = result?.data?.map((posting_date, updated_at, ...item) => {
              return {
                ...item,
                posting_date: moment(posting_date).format("DD-MM-YYYY"),
                updated_at: moment(updated_at).format("DD-MM-YYYY"),
              }
            })
            resolve(data || []);
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
    const formattedData = data.map(item => ({
      ...item,
      posting_date: moment(item.posting_date).format("DD-MM-YYYY"),
      updated_at: moment(item.updated_at).format("DD-MM-YYYY"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "item_cost_movement.xlsx");
  };

  const exportToCSV = (data) => {
    const formattedData = data.map(item => ({
      ...item,
      posting_date: moment(item.posting_date).format("DD-MM-YYYY"),
      updated_at: moment(item.updated_at).format("DD-MM-YYYY"),
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "item_cost_movement.csv";
    link.click();
  };

  const exportToJSON = (data) => {
    const formattedData = data.map(item => ({
      ...item,
      posting_date: moment(item.posting_date).format("DD-MM-YYYY"),
    }));

    const jsonString = JSON.stringify(formattedData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "item_cost_movement.json";
    link.click();
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let yOffset = 10;

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
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.text(companyName, pageWidth / 2, yOffset, { align: 'center' });
          yOffset += 4;

          doc.text('Item Cost Movement', pageWidth / 2, yOffset, { align: 'center' });
          yOffset += 4;

          const monthData = fiscalYearMonthData?.data?.map((item) => ({
            value: item?.record_id,
            label: `${getMonthNumber(item.month_name)}-${item.month_year}`,
          })) || [];
          let period = startMonthYear?.label || monthData.find(item => item.value == startMonthYear)?.label || '';
          doc.setFontSize(6);
          doc.text(`Period: ${period}`, pageWidth / 2, yOffset, { align: 'center' });
          yOffset += 5;

          const tableData = [];
          tableData.push([
            'Product Code',
            'Product Name',
            'Posting Date',
            'Bu_Qty',
            'Bu_Price',
            'Bu_Total Price',
            'Prev Qty',
            'Running_Qty',
            'Avg Price',
            'Cost Method',
            'System Cost',
          ]);

          data.forEach(item => {
            tableData.push([
              item.product_code || '',
              item.product_name || '',
              moment(item.posting_date).format("DD-MM-YYYY") || '',
              formatNumberDisplay(item.base_unit_qty) || '0.00',
              formatNumberDisplay(item.base_unit_price) || '0.00',
              formatNumberDisplay(item.base_unit_total_price) || '0.00',
              formatNumberDisplay(item.prev_qty) || '0.00',
              formatNumberDisplay(item.running_qty) || '0.00',
              formatNumberDisplay(item.avg_price) || '0.00',
              formatUnderScoreValue(item.cost_method) || '',
              formatNumberDisplay(item.system_cost) || '0.00',
            ]);
          });

          doc.autoTable({
            head: [tableData[0]],
            body: tableData.slice(1),
            startY: yOffset,
            margin: { left: margin },
            styles: { fontSize: 7, cellPadding: 1.5 },
            headStyles: { fillColor: [103, 159, 243], textColor: [255, 255, 255], fontSize: 7, halign: 'center' },
            bodyStyles: { textColor: [0, 0, 0] },
            columnStyles: {
              0: { cellWidth: 15, halign: 'left' },
              1: { cellWidth: 25, halign: 'left' },
              2: { cellWidth: 25, halign: 'center' },
              3: { cellWidth: 15, halign: 'right' },
              4: { cellWidth: 15, halign: 'right' },
              5: { cellWidth: 15, halign: 'right' },
              6: { cellWidth: 15, halign: 'right' },
              7: { cellWidth: 15, halign: 'right' },
              8: { cellWidth: 15, halign: 'right' },
              9: { cellWidth: 25, halign: 'left' },
              10: { cellWidth: 15, halign: 'right' },
            },
            didDrawPage: (data) => {
              yOffset = data.cursor.y;
            },
          });

          doc.save('item_cost_movement.pdf');
        },
      }
    );
  };

  const fields = [];

  const handleApplyFilters = async (data) => {
    const periodCheck = fiscalYearMonthData?.data?.find(
      (item) => item.record_id === startMonthYear
    );
    if (periodCheck) {
      setAppliedFilters(data);
      const journalIds = jernalIds?.map(item => item.value ? item.value : item).join(',');
      handleFetchdata(data, startMonthYear.value ? startMonthYear.value : startMonthYear);
      handleFetchExcelData(data);
    } else {
      toast.warning("Unable to find the selected period. Please check your selection.")
      // Swal.fire({
      //   icon: "warning",
      //   title: "Missing Data",
      //   text: "Unable to find the selected period. Please check your selection.",
      // });
    }
  };

  const handlefetchYear = async () => {
    fiscalYearMonth({
      filters: [
        { key: "c.id", operator: "equal", value1: mainData?.company_id, logical: "" },
      ],
      limit: 0,
      offset: 0,
      orderby: "fcm.month_year,fcm.start_date_month ASC",
    });
  };

  const handleStartMonthYearChange = (value) => {
    setStartMonthYear(value);
  };

  const handlePrint = () => {
    const monthData = fiscalYearMonthData?.data?.map((item) => ({
      value: item?.record_id,
      label: `${getMonthNumber(item.month_name)}-${item.month_year}`,
    })) || [];
    let period = startMonthYear?.label || monthData.find(item => item.value == startMonthYear)?.label || '';

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

          let content = `
          <div style="text-align: center; font-weight: bold; font-size: 12px; padding: 8px 0;">
            ${companyName}
          </div>
          <div style="text-align: center; font-weight: bold; font-size: 12px; padding: 8px 0;">
            Item Cost Movement
          </div>
          <div style="text-align: center; font-size: 10px; padding: 8px 0;">
            Period: ${period}
          </div>
          <table style="border-collapse: collapse; width: 100%; font-size: 8px;">
            <thead>
              <tr style="background-color: rgb(103, 159, 243); color: #fff;">
                <th style="border: 1px solid #000; padding: 3px; text-align: center;">Product Code</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: center;">Product Name</th>
                <th style="border: 1px solid #ivalign: center;">Posting Date</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: center;">Bu_Qty</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: center;">Bu_Price</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: center;">Bu_Total Price</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: center;">Prev Qty</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: center;">Running_Qty</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: center;">Avg Price</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: center;">Cost Method</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: center;">System Cost</th>
              </tr>
            </thead>
            <tbody>
          `;

          apiData.forEach(item => {
            content += `
              <tr style="border: 1px solid #000;">
                <td style="border: 1px solid #000; padding: 3px; text-align: left;">${item.product_code || ''}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: left;">${item.product_name || ''}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center;">${dayjs(item.posting_date).format("DD-MM-YYYY") || ''}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.base_unit_qty) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.base_unit_price) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.base_unit_total_price) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.prev_qty) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.running_qty) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.avg_price) || '0.00'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: left;">${formatUnderScoreValue(item.cost_method) || ''}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatNumberDisplay(item.system_cost) || '0.00'}</td>
              </tr>
            `;
          });

          content += '</tbody></table>';

          const printWindow = window.open('', '_blank');
          printWindow.document.write(`
          <html>
            <head>
              <title>Item Cost Movement</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 15px; }
                table { border-collapse: collapse; width: 100%; font-size: 8px; }
                th, td { border: 1px solid #000; padding: 3px; }
                th { background-color: rgb(103, 159, 243); color: #fff; text-align: center; }
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
      setJhOption([]);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    handlefetchYear();
  }, []);

  const HeaderFilterSection = () => {
    const getOptions = () =>
      fiscalYearMonthData?.data?.map((item) => ({
        value: item?.record_id,
        label: `${getMonthNumber(item.month_name)}-${item.month_year}`,
      })) || [];

    return (
      <div className="mt-1">
        <p>Period</p>
        <div className="flex bg-white border border-gray-500 rounded-md mb-2.5 mt-1">
          <Select
            showSearch
            style={{ width: "100%" }}
            className="custom-select"
            placeholder="Select Period"
            optionFilterProp="label"
            disabled={fiscalYearMonthLoading}
            value={startMonthYear}
            options={getOptions()}
            onChange={handleStartMonthYearChange}
            defaultValue={startMonthYear}
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (apiData.length > 1) {
      setIsFilterWidth(true);
    }
  }, [apiData]);

  const periodData = fiscalYearMonthData?.data?.find(
    (item) => item?.record_id == startMonthYear
  );

  return (
    <>
      <div className="overflow-hidden">
        <h1 className="text-size text-color font-headingweight mb-2">
          Item Cost Movement
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
            {periodData &&
              getMonthNumber(periodData?.month_name) +
              "-" +
              periodData?.month_year}
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
                  <div>
                    <ResizableTable
                      data={apiData || []}
                      columns={fieldsMapping}
                      isSelect={false}
                      height="300px"
                      isDense={true}
                      onSelectRow={null}
                      scrollableId={"ItemCostMovement"}
                      enableScroll={true}
                      loading={isPending}
                    />
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
`}
      </style>
    </>
  );
};

export default withPermissionCheck(DeptItemCostMovemnt, "dept-item-cost-movemnt");