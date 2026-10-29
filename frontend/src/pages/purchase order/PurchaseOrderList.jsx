import moment from "moment";
import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
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
import {toast} from "react-toastify";
import { formatNumberDisplay } from "../../utils/helper.function";
import dayjs from "dayjs";
const PurchaseOrderList = () => {
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.GET_PURCHASE_ORDER_LIST
  );
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_PURCHASE_ORDER_LIST
  );
  const { mutate: EnteriesMutate, isPending: EnteriesPending } = useGlobelApi(
    API_ENDPOINTS.GET_PURCHASE_ORDER_LIST_ENTRIES
  );
  const { mutate: UserCompanyMutate, data: userCompanyData } = useGlobelApi(
    API_ENDPOINTS.USER_TO_COMPANY
  );
  const { mutate: ReversalMutate, isPending: ReversalPending } = useGlobelApi(
    API_ENDPOINTS.SUPPLIER_REVERSAL
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
    { value: "sent", label: "Sent" },
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
  // const [, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [jrEnteries, setJrEnteries] = useState([]);
  console.log("🚀 ~ JournalVoucher ~ jrEnteries:", jrEnteries);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("poh.id");
  const limit = 10;
  const navigate = useNavigate();
  const createOrderData = getFromSessionStorage("createOrderData");
  const handleFetchdata = (filter, reset = false, orderBy = "poh.id DESC") => {
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
      delivery_date: dayjs(item.delivery_date).format("DD-MM-YYYY"),
      order_date: dayjs(item.order_date).format("DD-MM-YYYY"),
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY"),
      gross_amount: parseFloat(item.gross_amount).toFixed(3),
      net_amount: parseFloat(item.net_amount).toFixed(3),
      tax: parseFloat(item.tax).toFixed(3),
    }));

    const limitedData = formattedData.slice(0, 1000);
    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "purchse-order.xlsx");
  };
  const fields = [
    {
      name: "poh.id",
      label: "Order ID",
      type: "text",
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
      name: "purchase_order_status",
      label: "Purchase Order Status",
      type: "select",
      aliases: "poh.",
      options: PurchseSelectStatusList,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      aliases: "poh.",
      options: SelectStatusList,
    },
    {
      name: "order_date",
      label: "Order Date",
      type: "date",
      aliases: "poh.",
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
      width: 250,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "record_id",
      label: "Order ID",
      width: 150,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "order_date",
      label: "Order Date",
      width: 150,
      // editable: true,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <span className="">
          {moment(row?.order_date).format("DD-MM-YYYY") || "N/A"}
        </span>
      ),
    },
    {
      key: "delivery_date",
      label: "Delivery Date",
      width: 200,
      // editable: true,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <span className="">
          {moment(row?.delivery_date).format("DD-MM-YYYY") || "N/A"}
        </span>
      ),
    },
    {
      key: "source_type",
      label: "Source",
      width: 150,
      // editable: true,
      sortable: true,
      filterable: true,
      renderCell: (value, row) => (
        <span className="">
          {row?.source === "manual_invoice" ? "Manual" : "System"}{" "}
        </span>
      ),
    },

    {
      key: "tax",
      label: "Tax",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
      // editable: true,
    },
    {
      key: "net_amount",
      label: "Net Amount",
      width: 150,
      render: (value) => formatNumberDisplay(value),
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "purchase_order_status",
      label: "Order Status",
      width: 160,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <span className="capitalize">
          {(row?.purchase_order_status)?.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        row?.status?.toLowerCase() == "sent" ?
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
      width: 250,
      sortable: true,
      filterable: true,
      // editable: true,
      sortable: true,
    },
    {
      key: "unit_description",
      label: "Unit",
      sortable: true,
      filterable: true,
      width: 200,
      // editable: true,
    },
    {
      key: "qty",
      label: "QTY",
      width: 90,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
      // editable: true,
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      filterable: true,
      width: 90,
      render: (value) => formatNumberDisplay(value),
      // editable: true,
    },
    {
      key: "net_price",
      label: "net price",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
      // editable: true,
    },
    {
      key: "tax_amount",
      label: "tax",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
      // editable: true,
    },
    {
      key: "gross_price",
      label: "Gross price",
      sortable: true,
      filterable: true,
      width: 200,
      render: (value) => formatNumberDisplay(value),
      // editable: true,
    },
  ];
  const handleActionClick = (action) => {
    if (action === "detail") {
      if (selectedIds?.[0]) {
        const queryData = {
          data: selectedIds?.[0],
        };
        saveToSessionStorage("purchase-order-module-data", queryData);
        navigate(`${rootFolder}/create-purchase-order`);
      }
    }
  };

  const handleCopy = () => {
    if (selectedIds?.[0]) {
      const queryData = {
        data: selectedIds?.[0],
        iscopy: true,
      };

      saveToSessionStorage("purchase-order-module-data", queryData);

      navigate(`${rootFolder}/create-purchase-order`);
    }
  };
  const handleLedger = () => {
    if (selectedIds?.[0]) {
      const queryData = {
        data: selectedIds?.[0],
      };
      if (queryData.data.purchase_order_status.toLowerCase() === "finished") {
        toast.error("Delivery of finised order cannot be recived.")
      } else {
        if (queryData?.data?.status === "sent") {
          saveToSessionStorage("item-ledger-data", queryData);
          saveToSessionStorage("ledger-source", "purchase_order");
          navigate(`${rootFolder}/itemledger`);
        } else {
          toast.error("Order must be in send status to create delivery")
        }
      }
    }

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
            purchase_order_id: selectedIds?.[0]?.record_id,
          },
          filters: [],
          limit: 0,
          offset: 0,
        },
        {
          onSuccess: (res) => {
            if (selectedIds) {
              setJrEnteries(res?.data.slice(0, -1) || []);
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
        <h1 className="mb-1 text-size text-color font-headingweight">
          Purchase Order
        </h1>
        <div className=" flex gap-1 items-center">
          <p className="text-color font-regularweight">Company:</p>
          <span className="text-color"> {createOrderData?.company_name}</span>
        </div>
        <div className="flex gap-1 items-center">
          <p className="text-color font-regularweight">  Department: </p>
          <span className="text-color">  {createOrderData?.dept_name}</span>
        </div>
        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex justify-between items-center my-2">
          <div className="flex flex-wrap gap-2 ">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              handleClick={exportToExcel}
              addclass="gap-1"
            />
            <CustomButton
              btntext={"Add New"}
              handleClick={() => {
                navigate(`${rootFolder}/create-purchase-order`);
                sessionStorage.removeItem("purchase-order-module-data");
              }}
            />
            <CustomButton btntext={"Copy Entery"} handleClick={handleCopy} />
            <CustomButton btntext={"Recive Order"} handleClick={handleLedger} />
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

        <div className="h-80 mb-2.5">
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
                  case "status":
                    dbField = "poh.status";
                    break;
                  case "purchase_order_status":
                    dbField = "poh.purchase_order_status";
                    break;
                  // case "net_amount":
                  //   dbField = "poh.net_amount";
                  //   break;
                  // case "tax":
                  //   dbField = "tt.tax";
                  //   break;
                  case "delivery_date":
                    dbField = "poh.delivery_date";
                    break;
                  case "order_date":
                    dbField = "poh.order_date";
                    break;
                  case "source_type":
                    dbField = "poh.source_type";
                    break;
                  default:
                    dbField = "poh.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            onFilter={(filters) => console.log("Filters:", filters)}
            // defaultSort={{ key: "company_code", direction: "asc" }}
            // defaultSort={{ }}
            onSelectRow={(selectedData) => setSelectedIds(selectedData)}
            hasMore={hasMore}
            scrollableId={"PurchaseOrderList"}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            // onLoadMore={() => handleFetchdata(appliedFilters)}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "poh.id DESC"
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
            <div className="my-3">
              <div className="text-white">
                <h2 className="  p-0 m-0 text-size text-color font-headingweight">Enteries</h2>
              </div>
              <div className="">
                <ResizableTable
                  data={jrEnteries || []}
                  columns={EnteriesfieldsMapping}
                  isDense={isDense}
                  height="300px"
                  scrollableId={"ItemLedgerListEntries"}
                  hasMore={false}
                  loading={isPending}
                />
              </div>

            </div>
          ))}
      </div>
    </>
  );
};

export default withPermissionCheck(PurchaseOrderList, "purchase-order-list");
