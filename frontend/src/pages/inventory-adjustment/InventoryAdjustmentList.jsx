import moment from "moment";
import { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
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
import { formatNumberDisplay, formatUnderScoreValue } from "../../utils/helper.function";
import dayjs from "dayjs";
const InventoryAdjustmentList = () => {

  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("iah.id");
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.INVENTORY_ADJUSTMENT_HEAD
  );
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.INVENTORY_ADJUSTMENT_HEAD
  );
  const { mutate: EnteriesMutate, isPending: EnteriesPending } = useGlobelApi(
    API_ENDPOINTS.INVENTORY_ADJUSTMENT_ENTRIES
  );
  const { mutate: UserCompanyMutate, data: userCompanyData } = useGlobelApi(
    API_ENDPOINTS.USER_TO_COMPANY
  );

  const SelectStatusList = [
    { value: "save", label: "Save" },
    ,
    { value: "posted", label: "Posted" },
    ,
  ];
  const DocumentTypeList = [
    { value: "staff_meal", label: "Staff Meal" },
    { value: "wastage", label: "Wastage" },
  ];
  const CompanyIds = userCompanyData?.result
    ? userCompanyData.result.map((item) => item?.company_id).join(",")
    : "";
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const [apiData, setApiData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [jrEnteries, setJrEnteries] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const limit = 10;
  const navigate = useNavigate();
  const inventoryData = getFromSessionStorage("inventoryData");
  console.log("inventoryData", inventoryData)
  const handleFetchdata = (filter, reset = false, orderby = "iah.id DESC") => {
    if (!CompanyIds || CompanyIds?.length === 0) {
      console.error("CompanyIds is required but missing or empty.");
      return;
    }
    const baseFilters = [
      // { key: "iah.document_type", operator: "notEqual", value1: "sales", logical: "" }
    ];
    const filters = filter ? [...baseFilters, ...filter] : baseFilters;
    mutate(
      {
        headerData: {
          comp_to_dept_id: inventoryData?.com_dept_id,
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
          setHasMore(
            newData.length > 0 && (reset ? limit : offset + limit) < total
          );
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
            comp_to_dept_id: inventoryData?.com_dept_id,
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
      total_amount: parseFloat(item.total_amount).toFixed(3),
    }));

    const limitedData = formattedData.slice(0, 1000);
    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "inventory-adjustment.xlsx");
  };
  const fields = [
    {
      name: "status",
      label: "Status",
      type: "select",
      aliases: "iah.",
      options: SelectStatusList,
    },
    {
      name: "posting_date",
      label: "Posting Date",
      type: "date",
      aliases: "iah.",
    },
    {
      name: "document_type",
      label: "Document Type",
      type: "select",
      aliases: "iah.",
      options: DocumentTypeList,
    },
    {
      name: "total_amount",
      label: "Total Amount",
      type: "numerical",
      aliases: "iah.",
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
      key: "posting_date",
      label: "Posting Date",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="">{moment(value).format("DD-MM-YYYY") || "N/A"}</span>
      ),
    },
    {
      key: "document_type",
      label: "Document Type",
      width: 250,
      sortable: true,
      filterable: true,
      render: (value) => {
        return <span>
          {
            formatUnderScoreValue(value)
          }
        </span>
      }
    },
    {
      key: "total_amount",
      label: "Total Amount",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value, row) => (
        row?.status?.toLowerCase() == "posted" ?
          <span className="capitalize text-success fw-bold">{row?.status}</span>
          :
          <span className="capitalize text-warning fw-bold">{row?.status}</span>
      ),
    },
    {
      key: "comment",
      label: "Comment",
      width: 200,
      sortable: true,
      filterable: true,
    },
  ];
  // === enteries
  const EnteriesfieldsMapping = [
    {
      key: "product_name",
      label: "Product Name",
      sortable: true,
      filterable: true,
      width: 180,
      sortable: true,
    },
    {
      key: "product_type",
      label: "Product Type",
      sortable: true,
      filterable: true,
      width: 180,
      sortable: true,
    },
    {
      key: "unit_selected",
      label: "Unit Selected",
      sortable: true,
      filterable: true,
      width: 180,
    },
    {
      key: "us_qty",
      label: "us_qty",
      width: 120,
      render: (value) => formatNumberDisplay(value),
      sortable: true,
      filterable: true,
    },
    {
      key: "base_unit",
      label: "Base Unit",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "bu_qty",
      label: "Bu_Qty",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },

  ];
  const handleActionClick = (action) => {
    if (action === "detail") {
      if (selectedIds?.[0]) {
        const queryData = {
          data: selectedIds?.[0],
        };
        saveToSessionStorage("inventory-adjustment-data", queryData);
        navigate(`${rootFolder}/inventory-adjustment`);
      }
    }
  };

  const handleCopy = () => {
    if (selectedIds?.[0]) {
      const queryData = {
        data: selectedIds?.[0],
        iscopy: true,
      };
      saveToSessionStorage("inventory-adjustment-data", queryData);
      navigate(`${rootFolder}/inventory-adjustment`);
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
            inv_adj_head_id: selectedIds?.[0]?.record_id,
          },
          filters: [],
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
    <>
      <div>
        <h1 className="mb-1 text-size text-color font-headingweight ">Inventory Adjustment</h1>
        <div className="flex gap-1 align-items-center">
          <p className=" text-color font-regularweight"> Company:</p>
          <span className="text-color"> {inventoryData?.company_name}</span>
        </div>
        <div className="flex gap-1 align-items-center">
          <p className=" text-color font-regularweight">Department:</p>
          <span className="text-color"> {inventoryData?.dept_name}</span>
        </div>
        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex justify-between items-center my-2">
          <div className="flex flex-wrap  gap-2 ">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              handleClick={exportToExcel}
              addclass="gap-1"
            />
            <CustomButton
              btntext={"Add New"}
              handleClick={() => {
                navigate(`${rootFolder}/inventory-adjustment`);
                sessionStorage.removeItem("inventory-adjustment-data");
              }}
            />
            <CustomButton btntext={"Copy Entery"} handleClick={handleCopy} />

            <div className=" d-flex align-items-center">
              <label className="me-2">Dense Rows</label>
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
              <span className="me-2">server-side sorting</span>
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

        <div className="h-80">
          <ResizableTable
            data={apiData || []}
            columns={fieldsMapping}
            isDense={isDense}
            height="300px"
            onSort={(key, direction) => {
              if (useServerSorting) {
                let dbField;
                switch (key) {
                  case "document_type":
                    dbField = "iah.document_type";
                    break;
                  case "status":
                    dbField = "iah.status";
                    break;
                  case "posting_date":
                    dbField = "iah.posting_date";
                    break;
                  case "total_amount":
                    dbField = "iah.total_amount";
                    break;
                  default:
                    dbField = "iah.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"InventoryAdjustmentList"}
            onFilter={(filters) => console.log("Filters:", filters)}
            onSelectRow={(selectedData) => setSelectedIds(selectedData)}
            hasMore={hasMore}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "iah.id DESC"
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
            <div className="my-4">
              <div className="">
                <h2 className="p-0 m-0 mb-2 text-size text-color font-headingweight ">Enteries</h2>
              </div>
              <div className="">
                <ResizableTable
                  data={jrEnteries || []}
                  columns={EnteriesfieldsMapping}
                  isDense={isDense}
                  scrollableId={"InventoryAdjustmentListEntries"}
                  hasMore={false}
                  isSelect={false}
                  enableScroll={true}
                  loading={isPending}
                />
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default withPermissionCheck(InventoryAdjustmentList, "inventory-adjustment-list");
