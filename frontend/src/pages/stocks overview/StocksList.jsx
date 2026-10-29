import { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";

import moment from "moment";
import withPermissionCheck from "../../config/withPermissionCheck";
import UpdateStock from "./UpdateStock";
import { useNavigate } from "react-router-dom";
import ResizableTable from "../../components/table/ResizableTable";
import dayjs from "dayjs";
import { formatNumberDisplay } from "../../utils/helper.function";

const StocksList = ({ departmentData }) => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_STOCK);
  const { mutate: fetchDataForExcel } = useGlobelApi(API_ENDPOINTS.GET_STOCK);
  const navigate = useNavigate();
  // const UserId = getFromLocalStorage("UserId");
  const [moduleData, setModuleData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  console.log("🚀 ~ StocksList ~ selectedIds:", selectedIds);
  const [offset, setOffset] = useState(0);
  // const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("u.id");
  const limit = 10;
  // const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderBy = "so.id DESC") => {
    const baseFilters = [
      {
        key: "aptcd.id",
        operator: "equal",
        value1: departmentData?.record_id,
        logical: "",
      },
    ];
    const filters = filter ? [...baseFilters, ...filter] : baseFilters;
    mutate(
      {
        filters: filters || null,
        limit,
        offset: reset ? 0 : offset,
        orderby: orderBy,
      },
      {
        onSuccess: (data) => {
          const newUsers = data?.data || [];
          if (reset) {
            setModuleData(newUsers);
          } else {
            setModuleData((prevUsers) => [...prevUsers, ...newUsers]);
          }
          // setTotalRecords(newUsers?.[0]?.totalRecords || 0);
          setHasMore(offset + limit < (newUsers?.[0]?.totalRecords || 0));
          setOffset((prevOffset) => prevOffset + limit);
        },
        onError: (error) => {
          console.error("Error fetching users:", error);
        },
      }
    );
  };
  const handleFetchExcelData = (filter) => {
    return new Promise((resolve, reject) => {
      const baseFilters = [
        {
          key: "aptcd.id",
          operator: "equal",
          value1: departmentData?.record_id,
          logical: "",
        },
      ];
      const filters = filter ? [...baseFilters, ...filter] : baseFilters;
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
  const exportToExcel = async () => {
    const data = await handleFetchExcelData(appliedFilters);
    const formattedData = data.map(item => ({
      ...item,
      updated_at: dayjs(item.updated_at).format("DD-MM-YYYY"),
      created_at: dayjs(item.created_at).format("DD-MM-YYYY"),
      starting_date: dayjs(item.starting_date).format("DD-MM-YYYY"),
      average_price: parseFloat(item.average_price).toFixed(3),
      opening_price: parseFloat(item.opening_price).toFixed(3),
      live_qty: parseFloat(item.live_qty).toFixed(3),
    }));

    const limitedData = formattedData.slice(0, 1000);

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "stock-list.xlsx");
  };

  const fields = [
    {
      // fieldQueryKey: "um.description",
      name: "pm.product_name",
      label: "product name",
      type: "textServer",
      labelKey: "product_name",
      ValueKey: "product_name",
      endpoint: `${API_ENDPOINTS.GET_STOCK}`,
      responseWhich: "data",
    },
    {
      // fieldQueryKey: "um.description",
      name: "pm.product_code",
      label: "product code",
      type: "textServer",
      labelKey: "product_code",
      ValueKey: "product_code",
      endpoint: `${API_ENDPOINTS.GET_STOCK}`,
      responseWhich: "data",
    },
    {
      // fieldQueryKey: "um.description",
      name: "ump.description",
      label: "packaging",
      type: "textServer",
      labelKey: "packaging",
      ValueKey: "packaging",
      endpoint: `${API_ENDPOINTS.GET_STOCK}`,
      responseWhich: "data",
    },
    {
      // fieldQueryKey: "um.description",
      name: "umu.description",
      label: "unit",
      type: "textServer",
      labelKey: "unit",
      ValueKey: "unit",
      endpoint: `${API_ENDPOINTS.GET_STOCK}`,
      responseWhich: "data",
    },
    {
      name: "so.opening_price",
      label: "opening price",
      type: "textServer",
      labelKey: "opening_price",
      ValueKey: "opening_price",
      endpoint: `${API_ENDPOINTS.GET_STOCK}`,
      responseWhich: "data",
    },
    {
      name: "so.live_qty",
      label: "live qty",
      type: "textServer",
      labelKey: "live_qty",
      ValueKey: "live_qty",
      endpoint: `${API_ENDPOINTS.GET_STOCK}`,
      responseWhich: "data",
    },
    {
      name: "so.average_price",
      label: "average price",
      type: "textServer",
      labelKey: "average_price",
      ValueKey: "average_price",
      endpoint: `${API_ENDPOINTS.GET_STOCK}`,
      responseWhich: "data",
    },
  ];
  const handleApplyFilters = (data) => {
    console.log("Filter Values:", data);
    setOffset(0);
    setAppliedFilters(data);
    handleFetchdata(data, true);
    handleFetchExcelData(data);
  };

  const handleResetFilters = () => {
    console.log("Filters Reset");
    setOffset(0);
    setAppliedFilters(null);
    handleFetchdata(null, true);
    handleFetchExcelData(null);
  };

  const fieldsMapping = [
    { key: "product_name", label: "Product Name", width: 250, sortable: true, filterable: true, },
    { key: "product_code", label: "Product Code", width: 180, sortable: true, filterable: true, },
    { key: "packaging", label: "packaging", width: 150, sortable: true, filterable: true, },
    { key: "unit", label: "unit", width: 150, sortable: true, filterable: true, },
    { key: "base_unit_name", label: "unit name", width: 180, sortable: true, filterable: true, },
    {
      key: "opening_qty", label: "Opening Qty", width: 150,
      sortable: true, filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "live_qty", label: "Live Qty", width: 150, sortable: true, filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "opening_price", label: "opening price", width: 180, sortable: true, filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "average_price", label: "average price", width: 180, sortable: true, filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      field: "starting_date",
      headerName: "Starting Date",
      width: 120,
      renderCell: (row) => (
        <span className="">
          {moment(row?.row.starting_date).format("DD-MM-YYYY")}
        </span>
      ),
    },
  ];

  const handleAddRow = () => ({
    id: Date.now(),
    sub_module_name: "",
    module_name: "",
    user_name: "",
  });

  const handleSaveRow = (row) => {
    console.log("Row saved:", row);
  };

  const handleDeleteRow = (id) => {
    console.log("Row deleted:", id);
  };
  // const handleActionClick = (action) => {
  //   if (action === "edit") {
  //     saveToSessionStorage("stockData", selectedIds?.[0]);
  //     // setCurrentTab("Update");
  //   }
  // };
  useEffect(() => {
    handleFetchdata(null, true);
  }, [navigate]);

  return (
    <>
      <div>
        <h1 className="mb-2 text-size text-color font-headingweight">Stock List</h1>

        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex flex-wrap justify-between gap-3 my-2">
          <div className="flex flex-wrap gap-2">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              handleClick={exportToExcel}
              addclass="gap-1"
            />
            {/* <CustomButton
              btntext={"Add New"}
              // handleClick={() => setCurrentTab("Add")}
            /> */}
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
          </div>
        </div>
        <div className="h-80 mb-2.5">
          <ResizableTable
            data={moduleData || []}
            columns={fieldsMapping}
            isDense={isDense}
            height="300px"
            // className="my-4"
            onSort={(key, direction) => {
              if (useServerSorting) {
                let dbField;
                switch (key) {
                  case "average_price":
                    dbField = "so.average_price";
                    break;
                  case "opening_price":
                    dbField = "so.opening_price";
                    break;
                  case "live_qty":
                    dbField = "so.live_qty";
                    break;
                  // case "opening_qty":
                  //   dbField = "poh.purchase_order_status";
                  //   break;
                  // case "base_unit_name":
                  //   dbField = "poh.net_amount";
                  //   break;
                  // case "unit":
                  //   dbField = "tt.tax";
                  //   break;
                  case "packaging":
                    dbField = "umu.description";
                    break;
                  case "product_code":
                    dbField = "pm.product_code";
                    break;
                  case "product_name":
                    dbField = "pm.product_name";
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
            scrollableId={"StocksList"}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            // onLoadMore={() => handleFetchdata(appliedFilters)}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "so.id DESC"
              )
            }
            loading={isPending}
          />
        </div>
      </div>
      {selectedIds?.[0] && (
        <>
          <UpdateStock
            departmentData={selectedIds?.[0]}
            depId={departmentData?.record_id}
          />
        </>
      )}
    </>
  );
};

export default withPermissionCheck(StocksList, "stock-list");
