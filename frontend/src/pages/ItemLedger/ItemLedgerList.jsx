import moment from "moment";
import React, { useEffect, useState, useRef } from "react";
import { FaFileExport, FaFileUpload, FaTimes } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi, useGlobelApiFormDara } from "../../apis/useProduct/useCommon";
import Loader from "../../components/Loader";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import {
  getFromLocalStorage,
  getFromSessionStorage,
  saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import ResizableTable from "../../components/table/ResizableTable";
import { formatNumberDisplay } from "../../utils/helper.function";
import dayjs from "dayjs";
const ItemLedgerList = () => {

  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("u.id");
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.GET_ITEM_LEDGER_HEAD
  );
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_ITEM_LEDGER_HEAD
  );
  const { mutate: EnteriesMutate, isPending: EnteriesPending } = useGlobelApi(
    API_ENDPOINTS.GET_ITEM_LEDGER_ENTRIES
  );
  const { mutate: UserCompanyMutate, data: userCompanyData } = useGlobelApi(
    API_ENDPOINTS.USER_TO_COMPANY
  );
  const { mutate: ReversalMutate,  } = useGlobelApi(
    API_ENDPOINTS.SUPPLIER_REVERSAL
  );
  const { mutate: UploadExcelFile, isPending: UploadExcelFilePending } = useGlobelApiFormDara(
    API_ENDPOINTS.UPLOAD_EXCEL_ITEM_LEDGER // Assuming a new endpoint for item ledger upload; adjust if different
  );
  const PurchseSelectStatusList = [
    { value: "draft", label: "Draft" },
    ,
    { value: "delivery_pending", label: "Delivery Pending" },
    ,
  ];
  const SelectStatusList = [
    { value: "save", label: "Save" },
    ,
    { value: "posted", label: "Posted" },
    ,
  ];
  const SelectStatusPaid = [
    { value: "cancelled", label: "Cancelled" },
    { value: "unpaid", label: "Unpaid" },
    { value: "paid", label: "Paid" },
  ];
  const location = useLocation();
  const pathname = location.pathname;
  // i want filter the ides and  show ths format {1,2,4} in object
  const CompanyIds = userCompanyData?.result
    ? userCompanyData.result.map((item) => item?.company_id).join(",")
    : "";
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const [apiData, setApiData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  console.log("🚀 ~ JournalVoucher ~ selectedIds:", selectedIds);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [jrEnteries, setJrEnteries] = useState([]);
  console.log("🚀 ~ JournalVoucher ~ jrEnteries:", jrEnteries);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadInterface, setShowUploadInterface] = useState(false);
  const fileInputRef = useRef(null);
  const limit = 10;
  const navigate = useNavigate();
  const createOrderData = getFromSessionStorage("createOrderData");
  const handleFetchdata = (filter, reset = false, orderby = "ilh.id DESC") => {
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
        headerData: {
          comp_to_dept_id: createOrderData?.com_dept_id,
        },
        filters: filters,
        limit,
        offset: reset ? 0 : offset,
        orderby: orderby,
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
          console.log("newData.length:", newData.length);
          console.log("Offset + Limit:", offset + newData.length);
          console.log("Total Records:", total);
          console.log(
            "Has More:",
            newData.length > 0 &&
            (reset ? limit : offset + newData.length) < total
          );
          console.log(hasMore);
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
          headerData: {
            comp_to_dept_id: createOrderData?.com_dept_id,
          },
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
    const formattedData = data.map(item => ({
      ...item,
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY"),
         delivery_total: parseFloat(item.delivery_total).toFixed(3),
         delivery_tax: parseFloat(item.delivery_tax).toFixed(3),
    }));
    
    const limitedData = formattedData.slice(0, 1000);
    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "item-ledger.xlsx");
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
      name: "status",
      label: "Status",
      type: "select",
      aliases: "ilh.",
      options: SelectStatusList,
    },
    {
      name: "posting_date",
      label: "Posting Date",
      type: "date",
      aliases: "ilh.",
      options: SelectStatusPaid,
    },
    {
      name: "external_ref",
      label: "External Ref",
      type: "text",
      aliases: "ilh.",
      options: SelectStatusPaid,
    },
  ];

  const handleApplyFilters = (data) => {
    console.log("Filter Values:", data);
    setOffset(0); // Reset offset
    setAppliedFilters(data);
    handleFetchdata(data, true);
    handleFetchExcelData(data);
  };

  const handleResetFilters = () => {
    console.log("Filters Reset");
    setOffset(0); // Reset offset
    setAppliedFilters(null);
    handleFetchdata(null, true);
    handleFetchExcelData(null);
  };

  const fieldsMapping = [
    {
      key: "supplier_name",
      label: "Supplier",
      width: 150,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "company_name",
      label: "Company",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "external_ref",
      label: "External Ref",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "posting_date",
      label: "Posting Date",
      width: 165,
      // editable: true,
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="">{moment(value).format("DD-MM-YYYY") || "N/A"}</span>
      ),
    },
    {
      key: "delivery_date",
      label: "Delivery Date",
      width: 200,
      // editable: true,
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="">{moment(value).format("DD-MM-YYYY") || "N/A"}</span>
      ),
    },
    {
      key: "source",
      label: "Source",
      width: 120,
      // editable: true,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <span className="">
          {row?.source === "manual"
            ? "Manual"
            : row?.source === "purchase_order"
            ? "Purchase Order"
            : ""}{" "}
        </span>
      ),
    },

    {
      key: "delivery_total",
      label: "Delivery total",
      width: 200,
      sortable: true,
      filterable: true,
       render: (value) => formatNumberDisplay(value),
      // editable: true,
    },
    {
      key: "delivery_tax",
      label: "Delivery Tax",
      width: 150,
      sortable: true,
      filterable: true,
       render: (value) => formatNumberDisplay(value),
      // editable: true,
    },
    // {
    //   field: "purchase_order_status",
    //   headerName: "Order Status",
    //   width: 150,
    //   renderCell: (row) => (
    //     <span className="capitalize">{(row?.row.purchase_order_status).replace("_"," ")}</span>
    //   ),
    // },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value,row) => (
        row?.status?.toLowerCase() == "posted" ?
        <span className="capitalize text-success fw-bold">{row?.status}</span>
        :
        <span className="capitalize text-warning fw-bold">{row?.status}</span>
      ),
    },
    // {
    //   field: "internal_status",
    //   headerName: "Status",
    //   width: 90,
    //   // editable: true,

    //   renderCell: (row) => (
    //     <span className="capitalize">{row?.row.internal_status}</span>
    //   ),
    // },
  ];
  // === enteries
  const EnteriesfieldsMapping = [
    {
      key: "product_name",
      label: "Product Name",
      sortable: true,
      filterable: true,
      width: 180,
      // editable: true,

      sortable: false,
    },
    {
      key: "unit_description",
      label: "unit",
      width: 120,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "qty",
      label: "QTY",
      width: 90,
      sortable: true,
       render: (value) => formatNumberDisplay(value),
      filterable: true,
      // editable: true,
    },
    {
      key: "price",
      label: "Price",
      width: 90,
      sortable: true,
      filterable: true,
       render: (value) => formatNumberDisplay(value),
      // editable: true,
    },
    {
      key: "net_price",
      label: "net price",
      width: 140,
      sortable: true,
      filterable: true,
      // editable: true,
       render: (value) => formatNumberDisplay(value),
    },
    {
      key: "tax_amount",
      label: "tax",
      width: 120,
      sortable: true,
      filterable: true,
       render: (value) => formatNumberDisplay(value),
      // editable: true,
    },
    {
      key: "gross_price",
      label: "Gross price",
      width: 150,
      sortable: true,
      filterable: true,
       render: (value) => formatNumberDisplay(value),
      // editable: true,
    },
    {
      key: "created_by",
      label: "Created By",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },

  ];
  const handleActionClick = (action) => {
    if (action === "detail") {
      if (selectedIds?.[0]) {
        const queryData = {
          data: selectedIds?.[0],
        };
        saveToSessionStorage("item-ledger-data", queryData);
        saveToSessionStorage("ledger-source", "manual");
        navigate(`${rootFolder}/itemledger`);
      }
    }
  };

  const handleCopy = () => {
    if (selectedIds?.[0]) {
      const queryData = {
        data: selectedIds?.[0],
        iscopy: true,
      };
      queryData.data.status="save"
      saveToSessionStorage("item-ledger-data", queryData);
      saveToSessionStorage("ledger-source", "manual");
      navigate(`${rootFolder}/itemledger`);
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
          headerData: {
            item_ledger_head_id: selectedIds?.[0]?.record_id,
          },
          filters: [],
          limit: 0,
          offset: 0,
        },
        {
          onSuccess: (res) => {
            if (selectedIds) {
              setJrEnteries(res?.data?.slice(0, -1)  || []);
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
    <>
      <div>
        <h1 className="mb-1 text-size text-color font-headingweight">Item Ledger</h1>
         <div className=" flex gap-1 items-center">
          <p className="text-color font-regularweight">Company:</p>
          <span className="text-color"> {createOrderData?.company_name}</span>
        </div>
         <div className=" flex gap-1 items-center">
          <p className="text-color font-regularweight">Department:</p>
          <span className="text-color"> {createOrderData?.dept_name}</span>
        </div>
        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-wrap  gap-2 my-2">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              handleClick={exportToExcel}
              addclass="gap-1"
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
                navigate(`${rootFolder}/itemledger`);
                saveToSessionStorage("ledger-source", "manual");
                sessionStorage.removeItem("item-ledger-data");
              }}
            />
            <CustomButton btntext={"Copy Entery"} handleClick={handleCopy} />
            {/* <CustomButton btntext={"Item Ledger"} handleClick={handleLedger} /> */}
            {/* <CustomButton btntext={"Reversal"} handleClick={handleReversal} /> */}

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
              </label>{" "}
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
              handleClick={() => handleFetchdata(null, true)}
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
          className={`mb-4 p-4 bg-white border-2 border-dashed rounded-lg transition-colors ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
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
                className={`${
                  !selectedFile || UploadExcelFilePending
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

        <div className="h-80">
          <ResizableTable
            data={apiData || []}
            columns={fieldsMapping}
            isDense={isDense}
            height="300px"
            // className="my-4"
            onSort={(key, direction) => {
              if (useServerSorting) {
                let dbField;
                switch (key) {
                  case "company_name":
                    dbField = "c.company_name";
                    break;
                  case "supplier_name":
                    dbField = "sl.supplier_name";
                    break;
                  case "delivery_tax":
                    dbField = "ilh.delivery_tax";
                    break;
                  case "status":
                    dbField = "ilh.status";
                    break;
                  case "posting_date":
                    dbField = "ilh.posting_date";
                    break;
                  case "delivery_total":
                    dbField = "ilh.delivery_total";
                    break;
                  default:
                    dbField = "ilh.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"ItemLedgerList"}
            onFilter={(filters) => console.log("Filters:", filters)}
            // defaultSort={{ key: "company_code", direction: "asc" }}
            // defaultSort={{ }}
            onSelectRow={(selectedData) => setSelectedIds(selectedData)}
            hasMore={hasMore}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            // onLoadMore={() => handleFetchdata(appliedFilters)}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "ilh.id DESC"
              )
            }
            loading={isPending}
          />
        </div>
        {selectedIds &&
          selectedIds?.length > 0 &&
          jrEnteries &&
          jrEnteries?.length > 0 &&
          (EnteriesPending ? (
            <Loader />
          ) : (
            <div className=" my-4">
              {/* Card Header */}
              <div className="">
                <h2 className="mb-2  p-0 m-0 text-size text-color font-headingweight">Enteries</h2>
                {/* <input type="search" className="focus:border-none" /> */}
              </div>
              <div className="">
                <ResizableTable
                  data={jrEnteries || []}
                  columns={EnteriesfieldsMapping}
                  isDense={isDense}
                  height="300px"
                  scrollableId={"ItemLedgerListEntries"}
                  onFilter={(filters) => console.log("Filters:", filters)}
                  onSelectRow={(selectedData) => setSelectedIds(selectedData)}
                  hasMore={false}
                  enableScroll={true}
                  isSelect={false}
                  onLoadMore={() =>
                    handleFetchdata(
                      appliedFilters,
                      false,
                      useServerSorting ? `${sortField} ${sortDirection}` : "ilh.id DESC"
                    )
                  }
                  loading={isPending}
                />
              </div>
              {/* Card Body */}
            </div>
          ))}
      </div>
    </>
  );
};

export default withPermissionCheck(ItemLedgerList, "item-ledger-list");