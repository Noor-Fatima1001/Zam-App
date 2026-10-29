import { Select, Modal } from "antd";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useEffect, useRef, useState } from "react";
import { BsFiletypeJson } from "react-icons/bs";
import { FaInbox, FaPrint, FaRegFileExcel } from "react-icons/fa6";
import { MdFilterAlt, MdFilterAltOff, MdRefresh } from "react-icons/md";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import withPermissionCheck from "../../config/withPermissionCheck";
import { formatNumberDisplay } from "../../utils/helper.function";
import Loader from "../../components/Loader";
import ResizableTable from "../../components/table/ResizableTable";
import { toast } from "react-toastify";
import { getFromLocalStorage } from "../../config/crypto-file";
import useDebounce from "../../hooks/useDebounce";
import AntSelectFieldTable from "../../AntSelectFieldTable";
import moment from "moment";

const VarianceReport = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_VARIANCE_REPORT);
  const { mutate: fetchDataForExcel } = useGlobelApi(API_ENDPOINTS.GET_VARIANCE_REPORT);
  const { mutate: fetchExcelDataItem } = useGlobelApi(API_ENDPOINTS.GET_ITEM_ACTIVITY);
  const { mutate: periodRanges, isPending: periodRangesLoading, data: periodRangesData } = useGlobelApi(API_ENDPOINTS.GET_INVENTORY_PERIOD);
  const { mutate: fetchCompanies } = useGlobelApi(API_ENDPOINTS.USER_TO_COMPANY);
  const { mutate: fetchProducts, isPending: productsLoading } = useGlobelApi(API_ENDPOINTS.GET_PRODUCT_LIST);
  const { mutate: fetchDepartments, isPending: departmentsLoading } = useGlobelApi(API_ENDPOINTS.USER_TO_DEPARTMENT);
  const { mutate: getItemActivity } = useGlobelApi(API_ENDPOINTS.GET_ITEM_ACTIVITY);

  const UserId = getFromLocalStorage("UserId");
  const [apiData, setApiData] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortDirection, setSortDirection] = useState("DESC");
  const [sortField] = useState("product_name");
  const [isFilterWidth, setIsFilterWidth] = useState(false);
  const [periodIds, setPeriodIds] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState(null);
  const [departmentIds, setDepartmentIds] = useState([]);
  const [productIds, setProductIds] = useState([]);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [companyOptions, setCompanyOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [itemActivityData, setItemActivityData] = useState([]);
  const [hasMoreItemActivity, setHasMoreItemActivity] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductName, setSelectedProductName] = useState(null);
  const [selectedBaseUnit, setSelectedBaseUnit] = useState(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [selectedCompToDeptId, setSelectedCompToDeptId] = useState(null);
  const debouncedCompanySearchTerm = useDebounce(companySearchTerm, 500);
  const debouncedDepartmentSearchTerm = useDebounce(departmentSearchTerm, 500);
  const debouncedProductSearchTerm = useDebounce(productSearchTerm, 500);
  const printRef = useRef();

  // Item Activity Columns
  const itemActivityColumns = [
    {
      key: "posting_date",
      label: "Posting date",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => (
        <span>
          {moment(value).isValid() ? moment(value).format("DD-MM-YYYY") : ""}
        </span>
      ),
    },
    {
      key: "data_type",
      label: "Data type",
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: "document_type",
      label: "Document type",
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: "source",
      label: "Source",
      width: 120,
      sortable: true,
      filterable: true,
    },
    {
      key: "root_name",
      label: "Root Name",
      width: 120,
      sortable: true,
      filterable: true,
    },
    {
      key: "product_type",
      label: "Product type",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "original_qty_used",
      label: "Qty used",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "qty",
      label: "Qty",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "unit_selected",
      label: "Unit selected",
      width: 180,
      sortable: true,
      filterable: true,
    },
    {
      key: "child_qty",
      label: "Child qty",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "base_unit_converted",
      label: "Base unit converted",
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: "cost",
      label: "Cost",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "total_amount",
      label: "Total",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
  ];

  const fieldsMapping = [
    {
      key: "product_name",
      label: "Product Name",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value, row) => {
        return (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setIsModalVisible(true);
              setSelectedProductId(row?.product_id);
              setSelectedProductName(row?.product_name);
              setSelectedBaseUnit(row?.base_unit);
              setSelectedPeriodId(row?.inventory_period);
              setSelectedCompToDeptId(row?.comp_to_dept_id);
              handleFetchItemActivity(row?.product_id, row?.inventory_period, row?.comp_to_dept_id, true);
            }}
            className="text-customBlue"
            style={{ textDecoration: "underline" }}
          >
            {value || "Show Item Activity"}
          </a>
        );
      },
    },
    {
      key: "product_category",
      label: "Product Category",
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
      key: "product_cost",
      label: "Product Cost",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "opening_qty",
      label: "Opening Qty",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "in_qty",
      label: "In Qty",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "out_qty",
      label: "Out Qty",
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: "system_qty",
      label: "System Qty",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "actual_qty",
      label: "Actual Qty",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "variance_qty",
      label: "Variance Qty",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "variance_amount",
      label: "Variance Amount",
      sortable: true,
      filterable: true,
      width: 200,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "closing_stock_amount",
      label: "CS_Amount",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
    },
  ];

  const handleFetchdata = (filter, reset = false, orderBy = "product_name DESC") => {
    let customFilters = [];
    // const compToDeptIds=departmentOptions.
    if (departmentIds.length > 0) {
      customFilters.push({
        key: "ih.comp_to_dept_id",
        operator: "in",
        value1: departmentIds.join(","),
        logical: "",
      });
    }
    if (periodIds.length > 0) {
      customFilters.push({
        key: "ih.inventory_period",
        operator: "in",
        value1: periodIds.join(","),
        logical: "",
      });
    }

    if (productIds.length > 0) {
      customFilters.push({
        key: "pm.id",
        operator: "in",
        value1: productIds.join(","),
        logical: "",
      });
    }

    const baseFilters = [];
    const filters = filter ? [...baseFilters, ...filter, ...customFilters] : [...baseFilters, ...customFilters];

    if (periodIds.length === 0) {
      return toast.error("At least one period is required");
    }

    if (!companyId) {
      return toast.error("Please select a company");
    }

    mutate(
      {
        filters: filters || null,
        limit: 0,
        offset: 0,
        orderby: orderBy,
      },
      {
        onSuccess: (response) => {
          const data = response?.data || [];
          if (response?.data.length === 0) {
            return toast.warning("No data found");
          }
          setApiData(data);
          if (reset) {
            setApiData(data);
          } else {
            setApiData((prevUsers) => [...prevUsers, ...data]);
          }
          setHasMore(false);
        },
        onError: (error) => {
          console.error("Error fetching data:", error);
          toast.error("Failed to fetch data");
        },
      }
    );
  };
  const [itemActivityExcel,setItemActivity]=useState({});
  const handleFetchItemActivity = (productId, inventory_period, comp_to_dept_id, reset = false) => {
    setItemActivity({
      productId, inventory_period, comp_to_dept_id
    })
    return new Promise((resolve, reject) => {
      getItemActivity(
        {
          headerData: {
            inventory_period_id: inventory_period,
            comp_to_dept_id: comp_to_dept_id,
            product_id: productId,
          },
          filters: null,
          limit: 0,
          offset: 0,
          orderby: "",
        },
        {
          onSuccess: (response) => {
            const data = response?.data || [];
            if (reset) {
              setItemActivityData(data);
            } else {
              setItemActivityData((prevData) => [...prevData, ...data]);
            }
            setHasMoreItemActivity(data.length > 0);
            resolve(data);
          },
          onError: (error) => {
            console.error("Error fetching item activity:", error);
            toast.error("Failed to fetch item activity data");
            reject(error);
          },
        }
      );
    });
  };

  const handleFetchExcelData = (filter) => {
    let customFilters = [];
    if (departmentIds.length > 0) {
      customFilters.push({
        key: "ih.comp_to_dept_id",
        operator: "in",
        value1: departmentIds.join(","),
        logical: "",
      });
    }
    if (periodIds.length > 0) {
      customFilters.push({
        key: "ih.inventory_period",
        operator: "in",
        value1: periodIds.join(","),
        logical: "",
      });
    }

    if (productIds.length > 0) {
      customFilters.push({
        key: "pm.id",
        operator: "in",
        value1: productIds.join(","),
        logical: "",
      });
    }

    const baseFilters = [];
    const filters = filter ? [...baseFilters, ...filter, ...customFilters] : [...baseFilters, ...customFilters];

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

  const handleFetchItemActivityExcel=()=>{
      return new Promise((resolve, reject) => {
      fetchExcelDataItem(
        {  headerData: {
            inventory_period_id: itemActivityExcel?.inventory_period,
            comp_to_dept_id: itemActivityExcel?.comp_to_dept_id,
            product_id: itemActivityExcel?.productId,
          }, filters: [] || null, limit: 0, offset: 0 },
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
  }


  const handleFetchCompanies = (searchTerm) => {
    const baseFilters = [
      { key: "company_name", operator: "contains", value1: searchTerm, logical: "" },
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

    fetchCompanies(
      {
        filters: baseFilters,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (data) => {
          const newData = data?.result || [];
          setCompanyOptions(newData);
        },
        onError: (error) => {
          console.error("Error fetching companies:", error);
        },
      }
    );
  };

  const handleFetchDepartments = (searchTerm) => {
    if (!companyId) {
      console.log("No companyId, skipping department fetch");
      return;
    }
    const baseFilters = [
      { key: "c.id", operator: "equal", value1: companyId, logical: "" },
      { key: "adu.user_id", operator: "equal", value1: UserId, logical: "" },
      ...(searchTerm ? [{ key: "dept_name", operator: "contains", value1: searchTerm, logical: "AND" }] : []),
    ];

    fetchDepartments(
      {
        filters: baseFilters,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (data) => {
          const newData = data?.result || [];
          console.log("Fetched departments:", newData);
          setDepartmentOptions(newData);
        },
        onError: (error) => {
          console.error("Error fetching departments:", error);
          toast.error("Failed to fetch departments");
        },
      }
    );
  };

  const handleFetchProducts = (searchTerm) => {
    const baseFilters = [
      { key: "product_name", operator: "contains", value1: searchTerm, logical: "" },
      { key: "pm.product_type", operator: "in", value1: "raw", logical: "" },
    ];


    fetchProducts(
      {
        filters: baseFilters,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (data) => {
          const newData = data?.data || [];
          setProductOptions(newData);
        },
        onError: (error) => {
          console.error("Error fetching products:", error);
        },
      }
    );
  };

  const exportToExcel = async () => {
    const data = await handleFetchExcelData(appliedFilters);
    const formattedData = data.map((item) => ({
      ...item,
      product_cost: parseFloat(item.product_cost || 0).toFixed(3),
      opening_qty: parseFloat(item.opening_qty || 0).toFixed(3),
      in_qty: parseFloat(item.in_qty || 0).toFixed(3),
      system_qty: parseFloat(item.system_qty || 0).toFixed(3),
      actual_qty: parseFloat(item.actual_qty || 0).toFixed(3),
      variance_qty: parseFloat(item.variance_qty || 0).toFixed(3),
      variance_amount: parseFloat(item.variance_amount || 0).toFixed(3),
      closing_stock_amount: parseFloat(item.closing_stock_amount || 0).toFixed(3),
    }));

    const limitedData = formattedData.slice(0, 5000);
    const worksheet = XLSX.utils.json_to_sheet(limitedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "variance-report.xlsx");
  };
  const exportToExcelItemActivity = async () => {
    const data = await handleFetchItemActivityExcel();
    const formattedData = data.map((item) => ({
      ...item,
      // product_cost: parseFloat(item.product_cost || 0).toFixed(3),
      // opening_qty: parseFloat(item.opening_qty || 0).toFixed(3),
      // in_qty: parseFloat(item.in_qty || 0).toFixed(3),
      // system_qty: parseFloat(item.system_qty || 0).toFixed(3),
      // actual_qty: parseFloat(item.actual_qty || 0).toFixed(3),
      // variance_qty: parseFloat(item.variance_qty || 0).toFixed(3),
      // variance_amount: parseFloat(item.variance_amount || 0).toFixed(3),
      // closing_stock_amount: parseFloat(item.closing_stock_amount || 0).toFixed(3),
    }));

    const limitedData = formattedData.slice(0, 1000);
    const worksheet = XLSX.utils.json_to_sheet(limitedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "item-activity.csv");
  };

  const exportToCSV = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "variance-report.csv";
    link.click();
  };

  const exportToJSON = (data) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "variance-report.json";
    link.click();
  };

  const exportToPDF = async () => {
    const data = await handleFetchExcelData(appliedFilters);
    if (!data || data.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const header = data?.[0];
    const limitedData = data;
    const lastRow = data[data.length - 1];

    const doc = new jsPDF();
    const periodText = periodIds.length > 0
      ? periodIds.map((id) => periodRangesData?.data?.find((item) => item.record_id === id)?.period_range || id).join(", ")
      : "";
    const departmentNames = departmentIds.length > 0
      ? departmentIds.map((id) => departmentOptions.find((item) => item.depart_id === id)?.dept_name || id).join(", ")
      : "";
    const productNames = productIds.length > 0
      ? productIds.map((id) => {
        const product = productOptions.find((item) => item.record_id === id);
        return product ? product.product_name : "";
      }).join(", ")
      : "";

    doc.setFontSize(8);
    const pageWidth = doc.internal.pageSize.getWidth();
    const title = "Variance Report";
    const titleWidth = doc.getTextWidth(title);
    const x = (pageWidth - titleWidth) / 2;
    doc.text(title, x, 20);

    doc.setFontSize(7);
    doc.text(`Periods: ${periodText}`, 14, 30);
    doc.text(`Company: ${companyName}`, 14, 40);
    doc.text(`Departments: ${departmentNames}`, 14, 50);
    doc.text(`Products: ${productNames}`, 14, 60);

    const tableData = limitedData.map((row) =>
      fieldsMapping.map((col) => (col.render ? row[col.key] || "" : row[col.key] || ""))
    );

    const totalRow = fieldsMapping.map((_, index) => {
      if (index === fieldsMapping.length - 2) return "Total:";
      if (index === fieldsMapping.length - 1) return lastRow?.closing_stock_amount?.toString() || "0";
      return "";
    });

    tableData.push(totalRow);

    const customColumnWidths = {
      0: 20, // Product Name
      1: 25, // Product Category
      2: 15, // Base Unit
      3: 15, // Product Cost
      4: 15, // Opening Qty
      5: 15, // In Qty
      6: 15, // Out Qty
      7: 15, // System Qty
      8: 15, // Actual Qty
      9: 15, // Variance Qty
      10: 15, // Variance Amount
      11: 15, // CS_Amount
    };

    const pageWidthTotal = doc.internal.pageSize.getWidth();
    const totalWidth = Object.values(customColumnWidths).reduce((sum, w) => sum + w, 0);
    const margin = 14;
    if (totalWidth > pageWidthTotal - 2 * margin) {
      const scaleFactor = (pageWidthTotal - 2 * margin) / totalWidth;
      Object.keys(customColumnWidths).forEach((key) => {
        customColumnWidths[key] = customColumnWidths[key] * scaleFactor;
      });
    }

    doc.autoTable({
      head: [fieldsMapping.map((col) => col.label)],
      body: tableData,
      startY: 70,
      theme: "grid",
      headStyles: { fillColor: [0, 102, 204] },
      styles: { fontSize: 5, cellPadding: 1 },
      columnStyles: customColumnWidths,
      didDrawCell: (data) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save("variance-report.pdf");
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

  const handleApplyFilters = async (data) => {
    console.log("Applied Filters:", data);
    setAppliedFilters(data);
    handleFetchdata(data, true);
  };

  const handlefetchYear = async () => {
    if (!companyId) return;
    periodRanges({
      filters: [
        { key: "c.id", operator: "equal", value1: companyId, logical: "" },],
      limit: 0,
      offset: 0,
      orderby: "ip.end_date DESC",
    });
  };

  const handlePeriodChange = (value) => {
    console.log("Period changed:", value);
    setPeriodIds(value);
  };

  const handleDepartmentChange = (value) => {
    console.log("Department changed:", value);
    setDepartmentIds(value);
    setProductIds([]);
  };

  const handleProductChange = (value) => {
    console.log("Product changed:", value);
    setProductIds(value);
  };

  const ItemActivityModal = ({ visible, onClose, data, columns, loading, hasMore }) => {
    const selectedPeriodName = periodRangesData?.data?.find((item) => item.record_id === selectedPeriodId)?.period_range || selectedPeriodId;

    return (
      <Modal
        title={`Item Activity for ${selectedProductName || ''} - ${selectedBaseUnit || ''} - Period: ${selectedPeriodName || ''}`}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={1500}
        bodyStyle={{ padding: "16px", maxHeight: "500px", overflowY: "auto" }}
      >
        <CustomButton btntext="Export To CSV" handleClick={exportToExcelItemActivity} />
        {data && data.length > 0 ? (
          <ResizableTable
            data={data || []}
            columns={columns}
            isSelect={false}
            height="400px"
            isDense={isDense}
            scrollableId={"ItemActivityTable"}
            enableScroll={true}
            hasMore={false}
            loading={loading}
          />
        ) : (
          <div className="flex flex-col justify-center p-4 rounded-md items-center">
            <FaInbox size={40} className="text-gray-400" />
            <p className="text-color">No item activity data available.</p>
          </div>
        )}
      </Modal>
    );
  };

  const HeaderFilterSection = () => {
    const getPeriodOptions = () =>
      (periodRangesData?.data ?? []).map(({ record_id, period_range, company_name }) => ({
        value: record_id,
        label: `${period_range} (${company_name})`,
      }));

    const getDepartmentOptions = () =>
      (departmentOptions ?? []).map(({ dept_name, com_dept_id }) => ({
        value: com_dept_id,
        label: dept_name,
      }));

    const getProductOptions = () =>
      (productOptions ?? []).map(({ record_id, product_name }) => ({
        value: record_id,
        label: product_name,
      }));

    return (
      <div className="mt-1">
        <p>Company</p>
        <div className="flex bg-white border border-gray-500 rounded-md mb-2.5 mt-1">
          <AntSelectFieldTable
            name="company_name"
            endpoint={API_ENDPOINTS.USER_TO_COMPANY}
            queryKey="company_name"
            valueKey="company_id"
            labelKey="company_name"
            responseWhich="result"
            rules={{ required: "Company is required." }}
            onSelectChange={(_, selectedRecord) => {
              console.log("Company selected:", selectedRecord);
              setCompanyId(selectedRecord?.company_id);
              setCompanyName(selectedRecord?.company_name);
              setDepartmentIds([]);
              setProductIds([]);
              setPeriodIds([]);
            }}
            defaultValue={companyId ? { value: companyId, label: companyName } : null}
            baseFilters={[
              { key: "auc.user_id", operator: "equal", value1: UserId, logical: "" },
              { key: "auc.status", operator: "equal", value1: "1", logical: "" },
            ]}
          />
        </div>

        <p>Department</p>
        <div className="flex bg-white border border-gray-500 rounded-md mb-2.5 mt-1">
          <Select
            mode="multiple"
            allowClear
            showSearch
            style={{ width: "100%" }}
            className="custom-select"
            placeholder="Select Departments"
            optionFilterProp="label"
            value={departmentIds}
            options={getDepartmentOptions()}
            onSearch={(value) => {
              console.log("Department search:", value);
              setDepartmentSearchTerm(value);
            }}
            onChange={handleDepartmentChange}
            loading={departmentsLoading}
            disabled={!companyId}
          />
        </div>
        <p>Period</p>
        <div className="flex bg-white border border-gray-500 rounded-md mb-2.5 mt-1">
          <Select
            mode="multiple"
            allowClear
            showSearch
            style={{ width: "100%" }}
            className="custom-select"
            placeholder="Select Periods"
            optionFilterProp="label"
            disabled={periodRangesLoading || !companyId}
            value={periodIds}
            options={getPeriodOptions()}
            onChange={handlePeriodChange}
          />
        </div>
        <p>Product</p>
        <div className="flex bg-white border border-gray-500 rounded-md mb-2.5 mt-1">
          <Select
            mode="multiple"
            allowClear
            showSearch
            style={{ width: "100%" }}
            className="custom-select"
            placeholder="Search Products"
            optionFilterProp="label"
            value={productIds}
            options={getProductOptions()}
            onSearch={(value) => setProductSearchTerm(value)}
            onChange={handleProductChange}
            loading={productsLoading}
            disabled={departmentIds.length === 0}
          />
        </div>
      </div>
    );
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;

    const theadContent = printRef.current?.querySelector("thead")?.innerHTML || "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = `<table><thead>${theadContent}</thead></table>`;
    const columnCount = tempDiv.querySelector("tr")?.children.length || 1;

    const periodText = periodIds.length > 0
      ? periodIds.map((id) => periodRangesData?.data?.find((item) => item.record_id === id)?.month_name || id).join(", ")
      : "";
    const companyName = companyId
      ? companyOptions.find((item) => item.company_id === companyId)?.company_name || companyId
      : "";
    const departmentNames = departmentIds.length > 0
      ? departmentIds.map((id) => departmentOptions.find((item) => item.com_dept_id === id)?.dept_name || id).join(", ")
      : "";
    const productNames = productIds.length > 0
      ? productIds.map((id) => {
        const product = productOptions.find((item) => item.product_id === id);
        return product ? product.product_name : id;
      }).join(", ")
      : "";

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
              border-left: 1px solid #000;
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
            <div class="print-header">Variance Report</div>
            <div class="print-header">Periods: ${periodText}</div>
            <div class="print-header">Company: ${companyName}</div>
            <div class="print-header">Departments: ${departmentNames}</div>
            <div class="print-header">Products: ${productNames}</div>
            <table class="table-auto text-gray-700 text-left text-sm min-w-full ${isDense ? "dense" : ""}">
              <thead>
                <tr class="header-row">
                  <th colspan="${columnCount}" class="print-header">Variance Report</th>
                </tr>
                ${theadContent}
              </thead>
              <tbody>
                ${printRef.current?.querySelector("tbody")?.innerHTML || content || ""}
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

  useEffect(() => {
    if (apiData.length > 0) {
      setIsFilterWidth(true);
    }
  }, [apiData]);

  useEffect(() => {
    if (debouncedCompanySearchTerm) {
      handleFetchCompanies(debouncedCompanySearchTerm);
    } else {
      setCompanyOptions([]);
    }
  }, [debouncedCompanySearchTerm]);

  useEffect(() => {
    if (companyId && debouncedDepartmentSearchTerm !== null) {
      handleFetchDepartments(debouncedDepartmentSearchTerm);
    } else {
      setDepartmentOptions([]);
    }
  }, [companyId, debouncedDepartmentSearchTerm]);

  useEffect(() => {
    if (departmentIds.length > 0 && debouncedProductSearchTerm !== null) {
      handleFetchProducts(debouncedProductSearchTerm);
    } else {
      setProductOptions([]);
    }
  }, [departmentIds, debouncedProductSearchTerm]);

  useEffect(() => {
    if (companyId) {
      handlefetchYear();
    }
  }, [companyId]);

  return (
    <>
      <div className="overflow-hidden">
        <h1 className="text-size text-color font-headingweight mb-2">Variance Report</h1>
        <div className="flex gap-2 items-center">
          <button
            className="flex bg-customBlue shadow-md font-regularweight rounded-radiusRegular text-btnsize text-white duration-300 gap-1 items-center mb-2 px-2 py-1 transition-all"
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
            {periodIds.length > 0
              ? `Periods: ${periodIds.map((id) => periodRangesData?.data?.find((item) => item.record_id === id)?.period_range || id).join(", ")}`
              : ""}
          </div>
        </div>
        <div className="gap-5 lg:flex relative">
          <div
            className={`transform transition-all duration-300 ease-in-out 
              ${isFilterWidth ? "w-0 opacity-0 -translate-x-full" : "opacity-100 translate-x-0 w-96 shrink-0"} 
              sticky top-4`}
          >
            <div className="h-full mb-5 pb-5 md:pr-4">
              <div className="pt-2"></div>
              <DynamicFilter
                parentStateSet={setIsFilterWidth}
                addpartentSectionAppend={HeaderFilterSection()}
                fieldGrid="grid-cols-1"
                fields={[]}
                onApply={handleApplyFilters}
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
                <div className="flex justify-between gap-3 my-2">
                  <div className="flex gap-2 flex-wrap">
                    <CustomButton
                      btntext={"Export to Excel"}
                      icon={<FaRegFileExcel className="me-1" />}
                      handleClick={() => handleExport("excel")}
                    />
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
                        <input type="checkbox" checked={isDense} onChange={(e) => setIsDense(e.target.checked)} />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <CustomButton
                      btntext={<MdRefresh size={18} />}
                      addclass={`w-6 rounded-radiusFull max-w-6 min-w-6 h-6 ${isPending && "animate-spin"}`}
                      padding="p-0"
                      rounded="rounded-full"
                      handleClick={() => {
                        handleFetchdata(appliedFilters, true);
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
                        setSortDirection(direction.toUpperCase());
                        const orderbyString = `${key} ${direction.toUpperCase()}`;
                        handleFetchdata(appliedFilters, true, orderbyString);
                      }}
                      onLoadMore={() =>
                        handleFetchdata(appliedFilters, false, `${sortField} ${sortDirection}`)
                      }
                    />
                    <div className="flex justify-end pr-4"></div>
                    <div className="hidden relative">
                      <div ref={printRef} className="border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                        <div className="print-scrollable">
                          <table className="table-auto text-gray-700 text-left text-sm min-w-full">
                            <thead className="bg-customBlue text-white sticky top-0 z-10">
                              <tr>
                                {fieldsMapping.map((col) => (
                                  <th key={col.key} className="px-4 py-2 truncate">
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {apiData.map((row, index) => (
                                <tr
                                  key={index}
                                  className={`border ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
                                >
                                  {fieldsMapping.map((col) => (
                                    <td key={col.key} className="px-4 py-2 truncate" title={row[col.key]}>
                                      {col.render ? col.render(row[col.key], row) : row[col.key] || ""}
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
                  No data available. Please select at least one period, company, and department to see the results.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ItemActivityModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setItemActivityData([]);
          setSelectedProductId(null);
          setSelectedProductName(null);
          setSelectedBaseUnit(null);
          setSelectedPeriodId(null);
          setSelectedCompToDeptId(null);
        }}
        data={itemActivityData}
        columns={itemActivityColumns}
        loading={isPending}
        hasMore={hasMoreItemActivity}
      />
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

export default withPermissionCheck(VarianceReport, "variance-report");