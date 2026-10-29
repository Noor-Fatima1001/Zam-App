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
import { formatNumberDisplay } from "../../utils/helper.function";
import dayjs from "dayjs";

const DeptClosingStockList = () => {
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.DEPT_CLOSING_STOCK_HEADER
  );
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.DEPT_CLOSING_STOCK_HEADER
  );
  const { mutate: EnteriesMutate, isPending: EnteriesPending } = useGlobelApi(
    API_ENDPOINTS.CLOSING_STOCK_ENTRIES
  );
  const { mutate: fetchEntriesForExcel } = useGlobelApi(
    API_ENDPOINTS.CLOSING_STOCK_ENTRIES
  );
  const { mutate: UserCompanyMutate, data: userCompanyData } = useGlobelApi(
    API_ENDPOINTS.USER_TO_COMPANY
  );
  const { mutate: LocationMutate, data: LocationData } = useGlobelApi(
    API_ENDPOINTS.ASSIGN_LOCATION_LIST
  );

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
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("cse.id");
  const limit = 10;
  const navigate = useNavigate();
  const ClosingStockData = getFromSessionStorage("deptClosingStock");

  const handleFetchdata = (filter, reset = false) => {
    if (!CompanyIds || CompanyIds?.length === 0) {
      console.error("CompanyIds is required but missing or empty.");
      return;
    }
    const baseFilters = [
      { key: "adtc.id", operator: "in", value1: ClosingStockData?.com_dept_id, logical: "" },
    ];
    const filters = filter ? [...baseFilters, ...filter] : baseFilters;
    mutate(
      {
        filters: filters,
        limit,
        offset: reset ? 0 : offset,
        orderby: "",
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
        },
        onError: (error) => {
          console.error("Error fetching ", error);
        },
      }
    );
  };

  const handleFetchLocation = () => {
    LocationMutate({
      filters: [
        { key: "altcd.comp_dept_id", operator: "equal", value1: ClosingStockData?.com_dept_id, logical: "" },
        { key: "altcd.status", operator: "equal", value1: "1", logical: "" },
      ],
      limit: 0,
      offset: 0,
      orderby: "",
    });
  };

  useEffect(() => {
    handleFetchLocation();
  }, []);

  const handleFetchExcelData = (filter) => {
    const baseFilters = [
      { key: "adtc.id", operator: "in", value1: ClosingStockData?.com_dept_id, logical: "" },
    ];
    return new Promise((resolve, reject) => {
      fetchDataForExcel(
        {
          headerData: {
            comp_to_dept_id: ClosingStockData?.com_dept_id,
          },
          filters: [
            ...(baseFilters || []),
            ...(filter ? filter : [{}])
          ],
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
  const handleFetchExcelEntriesData = () => {
    return new Promise((resolve, reject) => {
      fetchEntriesForExcel(
        {
          filters: [{ key: "cse.closing_stock_id", operator: "equal", value1: selectedIds?.[0]?.closing_stock_list_id, logical: "" },
          { key: "cse.comp_to_dept_id", operator: "equal", value1: ClosingStockData?.com_dept_id, logical: "" }],
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
      stock_count_date: dayjs(item.stock_count_date).format("DD-MM-YYYY"),
    }));

    const limitedData = formattedData.slice(0, 1000);
    const worksheet = XLSX.utils.json_to_sheet(limitedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "closing-stock.xlsx");
  };
  const exportToExcelEntries = async () => {
    const data = await handleFetchExcelEntriesData();
    const formattedData = data.map(item => ({
      ...item,
    }));

    const limitedData = formattedData.slice(0, 1000);
    const worksheet = XLSX.utils.json_to_sheet(limitedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "closing-stock-entries.xlsx");
  };

  const fields = [
    {
      name: "stock_count_date",
      label: "Stock Count Date",
      type: "date",
      aliases: "",
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
      key: "closing_stock_list_id",
      label: "Document ID",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "company_name",
      label: "Company",
      width: 350,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        row?.dept_name ?
          <span className="">
            {value + "-" + row?.dept_name}
          </span>
          : value
      ),
    },
    {
      key: "stock_count_date",
      label: "Stock Count Date",
      width: 250,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        row?.stock_count_date && !row.isEditable ?
          <span className="">
            {moment(row?.stock_count_date).format("DD-MM-YYYY") || "N/A"}
          </span>
          : value
      ),
    },
    {
      key: "status",
      label: "Status",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        row?.status?.toLowerCase() == "posted" ?
          <span className="capitalize text-success fw-bold">{row?.status}</span>
          :
          <span className="capitalize text-warning fw-bold">{row?.status}</span>
      ),
    },
  ];

  const EnteriesfieldsMapping = [
    {
      key: "location_name",
      label: "Location Name",
      width: 250,
      sortable: true,
      filterable: true,
    },
    {
      key: "product_name",
      label: "Product Name",
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: "product_category",
      label: "Category",
      width: 250,
      sortable: true,
      filterable: true,
    },
    {
      key: "unit_selected_name",
      label: "Unit Selected",
      sortable: true,
      filterable: true,
      width: 250,
    },
    {
      key: "us_qty",
      label: "US_Qty",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "unit_base_name",
      label: "Unit Base",
      sortable: true,
      filterable: true,
      width: 150,
    },
    {
      key: "bu_qty",
      label: "Bu_Qty",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
    },
  ];

  const handleActionClick = (action) => {
    const seletcedIdData = LocationData?.data?.find(item => item?.location_name === action)
    const queryData = {
      data: { ...selectedIds?.[0], comp_to_location_id: seletcedIdData.record_id, location_name: seletcedIdData.location_name },
    };
    saveToSessionStorage("closing-stock-dept-data", queryData);
    navigate(`${rootFolder}/dept-create-closing-stock`);
  };

  const actionOptions = LocationData?.data?.map((location) => (
    location.location_name
  )) || [];

  useEffect(() => {
    console.log(actionOptions)
  }, [actionOptions])

  useEffect(() => {
    if (CompanyIds) {
      handleFetchdata();
    }
  }, [userCompanyData, CompanyIds]);

  useEffect(() => {
    if (selectedIds && selectedIds?.[0]?.closing_stock_list_id) {
      EnteriesMutate(
        {
          filters: [{ key: "cse.closing_stock_id", operator: "equal", value1: selectedIds?.[0]?.closing_stock_list_id, logical: "" },
          { key: "cse.comp_to_dept_id", operator: "equal", value1: ClosingStockData?.com_dept_id, logical: "" }
          ],
          limit: 0,
          offset: 0,
        },
        {
          onSuccess: (res) => {
            setJrEnteries(res?.data || []);
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
          Closing Stock
        </h1>
        <div className="flex gap-1 items-center">
          <p className="text-color font-regularweight">Company:</p>
          <span className="text-color">{ClosingStockData?.company_name}</span>
        </div>
        <div className="flex gap-1 items-center">
          <p className="text-color font-regularweight">Department:</p>
          <span className="text-color">{ClosingStockData?.dept_name}</span>
        </div>
        <div className="flex gap-1 items-center">
          <p className="text-color font-regularweight">Locations:</p>
          <span className="text-color">
            {LocationData?.data?.map(loc => loc.location_name).join(", ") || "No locations available"}
          </span>
        </div>
        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex justify-between items-center my-2">
          <div className="flex flex-wrap gap-2">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              handleClick={exportToExcel}
              addclass="gap-1"
            />
            <div className="d-flex align-items-center">
              <label className="me-2 text-color font-regularweight">Dense Rows</label>
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
              addclass={`w-6 rounded-radiusFull max-w-6 min-w-6 h-6 ${isPending && "animate-spin"} `}
              padding="p-0"
              rounded="rounded-full"
              handleClick={() => {
                setOffset(0);
                handleFetchdata(null, true);
              }}
            />
            <GenericActionBar
              selectedIds={[1]}
              onActionClick={handleActionClick}
              action={actionOptions}
            />
          </div>
        </div>

        <div className="h-80 mb-2.5">
          <ResizableTable
            data={apiData || []}
            columns={fieldsMapping}
            isDense={isDense}
            height="300px"
            onSort={(key, direction) => {
              if (useServerSorting) {
                let dbField;
                switch (key) {
                  case "company_name":
                    dbField = "c.company_name";
                    break;
                  case "stock_count_date":
                    dbField = "cse.stock_count_date";
                    break;
                  case "status":
                    dbField = "cse.status";
                    break;
                  default:
                    dbField = "";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            onFilter={(filters) => console.log("Filters:", filters)}
            onSelectRow={(selectedData) => setSelectedIds(selectedData)}
            hasMore={hasMore}
            scrollableId={"PurchaseOrderList"}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "cse.id DESC"
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
                <h2 className="p-0 m-0 text-size text-color font-headingweight">Entries</h2>
              </div>
              <CustomButton
                btntext={"Export to Excel"}
                icon={<FaFileExport />}
                handleClick={exportToExcelEntries}
                addclass="gap-1"
              />
              <div className="">
                <ResizableTable
                  data={jrEnteries || []}
                  columns={EnteriesfieldsMapping}
                  isDense={isDense}
                  height="300px"
                  scrollableId={"ItemLedgerListEntries"}
                  hasMore={false}
                  isSelect={false}
                  loading={isPending}
                />
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default withPermissionCheck(DeptClosingStockList, "dept-closing-stock-list");