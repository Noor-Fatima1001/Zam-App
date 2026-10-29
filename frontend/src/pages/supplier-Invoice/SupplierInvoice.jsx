import moment from "moment";
import React, { useEffect, useState, useRef } from "react";
import { FaFileExport, FaFileUpload, FaTimes } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi, useGlobelApiFormDara } from "../../apis/useProduct/useCommon";
import Loader from "../../components/Loader";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import {
  getFromLocalStorage,
  saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import ResizableTable from "../../components/table/ResizableTable";
import { formatNumberDisplay } from "../../utils/helper.function";
import dayjs from "dayjs";
import { toast } from "react-toastify";

const SupplierInvoice = () => {
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.GET_SUPPLIER_INVOICE_HEADER
  );
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_SUPPLIER_INVOICE_HEADER
  );
  const { mutate: EnteriesMutate, isPending: EnteriesPending } = useGlobelApi(
    API_ENDPOINTS.GET_SUPPLIER_INVOICE_ENTERIES
  );
  const { mutate: UserCompanyMutate, data: userCompanyData } = useGlobelApi(
    API_ENDPOINTS.USER_TO_COMPANY
  );
  const { mutate: ReversalMutate, isPending: ReversalPending } = useGlobelApi(
    API_ENDPOINTS.SUPPLIER_REVERSAL
  );
  const { mutate: UploadExcelFile, isPending: UploadExcelFilePending } = useGlobelApiFormDara(
    API_ENDPOINTS.UPLOAD_SUPPLIER_EXCEL
  );
  const { mutate: deleteSupplierInvoice } = useGlobelApi(API_ENDPOINTS.SUPPLIER_INVOICE_DELETE);

  const SelectStatusList = [
    { value: "posted", label: "Posted" },
    { value: "save", label: "Save" },
    { value: "cancelled", label: "Cancelled" },
  ];
  const SelectStatusPaid = [
    { value: "cancelled", label: "Cancelled" },
    { value: "unpaid", label: "Unpaid" },
    { value: "paid", label: "Paid" },
  ];
  const location = useLocation();
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const UserId = getFromLocalStorage("UserId");
  const [apiData, setApiData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [jrEnteries, setJrEnteries] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("u.id");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadInterface, setShowUploadInterface] = useState(false);
  const fileInputRef = useRef(null);
  const limit = 10;
  const navigate = useNavigate();

  const CompanyIds = userCompanyData?.result
    ? userCompanyData.result.map((item) => item?.company_id).join(",")
    : "";

  const handleFetchdata = (filter, reset = false, orderBy = "sih.id DESC") => {
    if (!CompanyIds || CompanyIds?.length === 0) {
      console.error("CompanyIds is required but missing or empty.");
      return;
    }
    const baseFilters = [
      { key: "c.id", operator: "in", value1: CompanyIds, logical: "" },
    ];
    const filters = filter ? [...baseFilters, ...filter] : baseFilters;
    mutate(
      {
        filters: filters,
        limit,
        offset: reset ? 0 : offset,
        orderby: orderBy,
      },
      {
        onSuccess: (data) => {
          const newData = data?.data || [];
          if (reset) {
            setApiData(newData);
            setOffset(limit);
          } else {
            setApiData((prevUsers) => [...prevUsers, ...newData]);
            setOffset((prevOffset) => prevOffset + limit);
          }
          const total = newData?.[0]?.totalRecords || 0;
          setTotalRecords(total);
          setHasMore(
            newData.length > 0 && (reset ? limit : offset + limit) < total
          );
        },
        onError: (error) => {
          console.error("Error fetching ", error);
        },
      }
    );
  };

  const handleFetchExcelData = (filter) => {
    return new Promise((resolve, reject) => {
      fetchDataForExcel(
        {
          filters: filter,
          limit: 0,
          offset: 0,
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

  const exportToExcel = async () => {
    const data = await handleFetchExcelData(appliedFilters);
    const formattedData = data.map((item) => ({
      ...item,
      updated_at: dayjs(item.updated_at).format("DD-MM-YYYY"),
      created_at: dayjs(item.created_at).format("DD-MM-YYYY"),
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY"),
      invoice_total: parseFloat(item.invoice_total).toFixed(3),
      invoice_tax: parseFloat(item.invoice_tax).toFixed(3),
    }));

    const limitedData = formattedData.slice(0, 1000);
    const worksheet = XLSX.utils.json_to_sheet(limitedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "supplier-invoice.xlsx");
  };

  const validateFile = (file) => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please select an Excel file (.xls or .xlsx).");
      return false;
    }
    if (file.size > maxSize) {
      toast.error("File size exceeds 5MB. Please select a smaller file.");
      return false;
    }
    return true;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      toast.success(`File "${file.name}" selected. Click Submit to upload.`);
    } else {
      setSelectedFile(null);
      if (file) fileInputRef.current.value = null;
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      toast.success(`File "${file.name}" selected. Click Submit to upload.`);
    } else {
      setSelectedFile(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSubmit = () => {
    if (!selectedFile) {
      toast.error("Please select a file before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    UploadExcelFile(
      formData,
      {
        onSuccess: (response) => {
          clearInterval(progressInterval);
          setUploadProgress(100);
          const data = response?.data?.[0];
          if (data?.messageType === "error") {
            toast.error(data?.message);
          } else {
            toast.success(`File "${selectedFile.name}" uploaded successfully: ${data?.message}`);
            setSelectedFile(null);
            fileInputRef.current.value = null;
            setTimeout(() => setUploadProgress(0), 500);
            setShowUploadInterface(false);
          }
        },
        onError: (error) => {
          clearInterval(progressInterval);
          setUploadProgress(0);
          const errorMessage = error.response?.data?.message || error.message || "An error occurred during file upload";
          toast.error(errorMessage);
        },
      }
    );
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    fileInputRef.current.value = null;
    toast.success("File selection cleared.");
  };

  const handleToggleUpload = () => {
    setShowUploadInterface(true);
  };

  const handleCancelUpload = () => {
    setShowUploadInterface(false);
    setSelectedFile(null);
    fileInputRef.current.value = null;
    setUploadProgress(0);
    toast.success("Upload interface closed.");
  };

  const fields = [
    {
      name: "sih.id",
      label: "Document ID",
      type: "text",
    },
    {
      name: "supplier_name",
      label: "Supplier Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_SUPPLIER}`,
      responseWhich: "data",
      aliases: "sl.",
    },
    {
      name: "supplier_code",
      label: "Supplier Code",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_SUPPLIER}`,
      responseWhich: "data",
      aliases: "sl.",
    },
    {
      name: "company_name",
      label: "Company Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_COMPANY}`,
      responseWhich: "data",
      aliases: "c.",
    },
    {
      name: "posting_date",
      label: "Posting Date",
      type: "date",
      aliases: "sih.",
    },
    {
      name: "invoice_total",
      label: "Invoice Total",
      responseWhich: "data",
      aliases: "sih.",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      aliases: "sih.",
      options: SelectStatusList,
    },
    {
      name: "invoice_status",
      label: "Invoice Status",
      type: "select",
      aliases: "sih.",
      options: SelectStatusPaid,
    },
    {
      name: "external_ref",
      label: "External Ref",
      type: "text",
      aliases: "sih.",
      options: SelectStatusPaid,
    },
  ];

  const handleApplyFilters = (data) => {
    setOffset(0);
    setAppliedFilters(data);
    handleFetchdata(data, true);
    handleFetchExcelData(data);
  };

  const handleResetFilters = () => {
    setOffset(0);
    setAppliedFilters(null);
    handleFetchdata(null, true);
    handleFetchExcelData(null);
  };

  const fieldsMapping = [
    {
      key: "record_id",
      label: "Document ID",
      width: 170,
      sortable: true,
      filterable: true,
    },
    {
      key: "supplier_name",
      label: "Supplier",
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: "company_name",
      label: "Company",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "posting_date",
      label: "Posting Date",
      width: 190,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <span>{moment(row?.posting_date).format("DD-MM-YYYY") || "N/A"}</span>
      ),
    },
    {
      key: "external_ref",
      label: "External Ref",
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: "source",
      label: "Source",
      width: 130,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <span>{row?.source === "manual_invoice" ? "Manual" : "System"}</span>
      ),
    },
    {
      key: "invoice_tax",
      label: "Tax",
      width: 90,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "invoice_total",
      label: "Total",
      width: 90,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "internal_status",
      label: "Status",
      width: 130,
      sortable: true,
      filterable: true,
      renderCell: (value, row) => (
        <span className="capitalize">{row?.internal_status}</span>
      ),
    },
    {
      key: "invoice_status",
      label: "Invoice Status",
      width: 180,
      sortable: true,
      filterable: true,
      renderCell: (value, row) => (
        <span className="capitalize">{row?.invoice_status}</span>
      ),
    },
  ];

  const EnteriesfieldsMapping = [
    {
      key: "description",
      label: "Description",
      width: 250,
      sortable: false,
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
      sortable: false,
      filterable: true,
      render: (value, row) => (
        <span>{moment(row?.created_at).format("DD-MM-YYYY")}</span>
      ),
    },
  ];

  const handleActionClick = (action) => {
    if (action === "detail") {
      if (selectedIds?.[0]) {
        const queryData = { data: selectedIds?.[0] };
        saveToSessionStorage("supplier_invoice_edit_module-detailData", queryData);
        navigate(`${rootFolder}/edit-supplier-Invoice`);
      }
    }
  };

  const handleCopy = () => {
    if (selectedIds?.[0]) {
      const queryData = { data: selectedIds?.[0], iscopy: true };
      saveToSessionStorage("supplier_invoice_edit_module-detailData", queryData);
      navigate(`${rootFolder}/edit-supplier-Invoice`);
    }
  };

  const handleDelete = () => {
    if (selectedIds?.[0]) {
      deleteSupplierInvoice({
        dataInsert: {
          record_id: selectedIds?.[0]?.record_id,
          created_by: UserId
        }
      }, {
        onSuccess: (response) => {
          if (response?.data?.[0]?.msgType === "error") {
            toast.error(response?.data?.[0]?.message)
            // Swal.fire({
            //   icon: "error",
            //   title: "Error",
            //   text: response?.data?.[0]?.message
            // });
          } else {
            toast.error("Invoice deleted successfully")
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: "Invoice deleted successfully"
            // });
            handleFetchdata(null, true);
          }
        },
        onError: () => {
          toast.error("Error")
          // Swal.fire({
          //   icon: "error",
          //   title: "Error",
          //   text: "Error"
          // });
        }
      });
    }
  };

  const handleReversal = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to Reversal this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#696cff",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Reversal it!",
    }).then((result) => {
      if (result.isConfirmed) {
        if (selectedIds?.[0]) {
          ReversalMutate(
            {
              dataInsert: {
                record_id: selectedIds?.[0]?.record_id,
                created_by: UserId,
              },
            },
            {
              onSuccess: (res) => {
                if (res.success) {
                  toast.success(res?.data?.[0]?.message)
                  // Swal.fire({
                  //   icon: "success",
                  //   title: "Success",
                  //   text: res?.data?.[0]?.message,
                  // });
                  handleFetchdata(appliedFilters);
                } else {
                  toast.error(res?.data?.[0]?.message || "Something went wrong")
                  // Swal.fire({
                  //   icon: "error",
                  //   title: "Error",
                  //   text: res?.data?.[0]?.message || "Something went wrong",
                  // });
                }
              },
              onError: (error) => {
                toast.error("Something went wrong")
                // Swal.fire({
                //   title: "Error",
                //   text: "Something went wrong",
                //   icon: "error",
                // });
              },
            }
          );
        }
      }
    });
  };

  const handleAddRow = () => ({
    id: "",
    supplier_name: "",
    company_name: "",
    posting_date: "",
    external_ref: "",
    source: "",
    invoice_tax: "",
    invoice_total: "",
    internal_status: "",
    invoice_status: "",
  });

  const handleSaveRow = (row) => {
    console.log("Row saved:", row);
  };

  const handleDeleteRow = (id) => {
    console.log("Row deleted:", id);
  };

  useEffect(() => {
    if (CompanyIds) {
      handleFetchdata();
    }
  }, [userCompanyData, CompanyIds]);

  useEffect(() => {
    if (selectedIds && selectedIds?.[0]?.record_id) {
      EnteriesMutate(
        {
          filters: [
            {
              key: "sie.supplier_header_id",
              operator: "equal",
              value1: selectedIds?.[0]?.record_id,
              logical: "",
            },
          ],
          limit: 0,
          offset: 0,
        },
        {
          onSuccess: (res) => {
            if (selectedIds) {
              setJrEnteries(res?.data || []);
            }
          },
          onError: (error) => {
            console.error("Error fetching ", error);
          },
        }
      );
    }
  }, [selectedIds]);

  useEffect(() => {
    UserCompanyMutate({
      filters: [
        {
          key: "auc.user_id",
          operator: "equal",
          value1: UserId,
          logical: "",
        },
        { key: "auc.status", operator: "equal", value1: "1", logical: "" },
      ],
      limit: 0,
      offset: 0,
    });
  }, []);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="mb-1 text-size text-color font-headingweight">
        Supplier Invoice
      </h1>
      <DynamicFilter
        fields={fields}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        className="mb-4"
      />
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap gap-2 mb-1">
          <CustomButton
            btntext={"Export to Excel"}
            icon={<FaFileExport className="mr-2" />}
            handleClick={exportToExcel}
            className="bg-blue-600 text-white hover:bg-blue-700"
          />
          <CustomButton
            btntext={"Upload Excel"}
            icon={<FaFileUpload className="mr-2" />}
            handleClick={handleToggleUpload}
            className="bg-blue-600 text-white hover:bg-blue-700"
            aria-label="Toggle Excel upload interface"
            aria-expanded={showUploadInterface}
          />
          <CustomButton
            btntext={"Add New"}
            handleClick={() => {
              navigate(`${rootFolder}/edit-supplier-Invoice`);
              sessionStorage.removeItem("supplier_invoice_edit_module-detailData");
            }}
            className="bg-green-600 text-white hover:bg-green-700"
          />
          <CustomButton
            btntext={"Copy Entry"}
            handleClick={handleCopy}
            className="bg-yellow-600 text-white hover:bg-yellow-700"
          />
          <CustomButton
            btntext={"Reversal"}
            handleClick={handleReversal}
            className="bg-red-600 text-white hover:bg-red-700"
          />
          <CustomButton
            btntext={"Delete"}
            handleClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
          />
          <div className="flex items-center gap-2">
            <label className="text-gray-700 font-medium">Dense Rows</label>
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
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">Server-side Sorting</span>
            <label className="switch">
              <input
                type="checkbox"
                id="serverSortSwitch"
                checked={useServerSorting}
                onChange={(e) => setUseServerSorting(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CustomButton
            btntext={<MdRefresh size={18} />}
            addclass={`w-6 rounded-radiusFull max-w-6 min-w-6 h-6 ${isPending && "animate-spin"
              } `}
            padding="p-0"
            handleClick={() => {
              setOffset(0);
              handleFetchdata(null, true);
            }}
          />
          <GenericActionBar
            selectedIds={selectedIds}
            onActionClick={handleActionClick}
            action={["detail"]}
          />
        </div>
      </div>
      {showUploadInterface && (
        <div
          className={`mb-4 p-4 bg-white border-2 border-dashed rounded-lg transition-colors ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="region"
          aria-label="Excel file upload area"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="file"
                  accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  id="file-upload"
                  ref={fileInputRef}
                  aria-label="Select Excel file"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <FaFileUpload className="mr-2" />
                  Choose Excel File
                </label>
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 bg-gray-200 px-3 py-2 rounded-md max-w-xs">
                  <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
                  <button
                    onClick={handleClearFile}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Clear selected file"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
              <CustomButton
                btntext={UploadExcelFilePending ? "Uploading..." : "Submit File"}
                handleClick={handleFileSubmit}
                disabled={!selectedFile || UploadExcelFilePending}
                className={`${!selectedFile || UploadExcelFilePending
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                  } text-white transition-colors`}
              />
              <CustomButton
                btntext="Cancel"
                handleClick={handleCancelUpload}
                className="bg-gray-600 text-white hover:bg-gray-700"
                aria-label="Cancel Excel upload"
              />
            </div>
            <p className="text-sm text-gray-500">
              {isDragging ? "Drop your Excel file here" : "Drag and drop Excel file here or click to select"}
            </p>
            {UploadExcelFilePending && (
              <div className="w-full max-w-xs mt-2">
                <div className="bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Uploading: {uploadProgress}%</p>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md overflow-auto">
        <ResizableTable
          data={apiData || []}
          columns={fieldsMapping}
          isDense={isDense}
          height="300px"
          onSort={(key, direction) => {
            if (useServerSorting) {
              let dbField;
              switch (key) {
                case "invoice_status":
                  dbField = "sih.invoice_status";
                  break;
                case "source":
                  dbField = "sih.source";
                  break;
                case "supplier_name":
                  dbField = "sl.supplier_name";
                  break;
                case "posting_date":
                  dbField = "sih.posting_date";
                  break;
                case "company_name":
                  dbField = "c.company_name";
                  break;
                case "external_ref":
                  dbField = "sih.external_ref";
                  break;
                case "invoice_tax":
                  dbField = "sih.invoice_tax";
                  break;
                case "invoice_total":
                  dbField = "sih.invoice_total";
                  break;
                default:
                  dbField = "sih.id";
              }
              setSortField(dbField);
              setSortDirection(direction.toUpperCase());
              const orderbyString = `${dbField} ${direction.toUpperCase()}`;
              setOffset(0);
              handleFetchdata(appliedFilters, true, orderbyString);
            }
          }}
          scrollableId={"SupplierInvoice"}
          onFilter={(filters) => console.log("Filters:", filters)}
          onSelectRow={(selectedData) => setSelectedIds(selectedData)}
          hasMore={hasMore}
          enableScroll={true}
          disableInternalSort={useServerSorting}
          onLoadMore={() =>
            handleFetchdata(
              appliedFilters,
              false,
              useServerSorting ? `${sortField} ${sortDirection}` : "sih.id DESC"
            )
          }
          loading={isPending}
        />
      </div>
      {selectedIds && selectedIds?.length > 0 && jrEnteries && jrEnteries?.length > 0 && (
        EnteriesPending ? (
          <Loader />
        ) : (
          <div className="mt-4 bg-white rounded-lg shadow-md">
            <div className="p-2 text-white border-b">
              <h2 className="p-0 m-0 text-lg font-bold">Entries</h2>
            </div>
            <div className="h-80">
              <ResizableTable
                data={jrEnteries || []}
                columns={EnteriesfieldsMapping}
                isDense={isDense}
                height="300px"
                scrollableId={"SupplierInvoiceEntries"}
                onFilter={(filters) => console.log("Filters:", filters)}
                onSelectRow={(selectedData) => setSelectedIds(selectedData)}
                hasMore={false}
                enableScroll={true}
                onLoadMore={() =>
                  handleFetchdata(
                    appliedFilters,
                    false,
                    "poh.id DESC"
                  )
                }
                loading={isPending}
                isSelect={false}
              />
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default withPermissionCheck(SupplierInvoice, "supplier-Invoice");