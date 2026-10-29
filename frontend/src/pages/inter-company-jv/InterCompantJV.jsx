import moment from "moment";
import { useEffect, useState, useRef } from "react";
import { FaFileExport } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
const InterCompantJV = () => {

  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("u.id");
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.GET_INTER_COMP_JV_HEAD
  );
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_ITEM_LEDGER_HEAD
  );
  const { mutate: EnteriesMutate, isPending: EnteriesPending } = useGlobelApi(
    API_ENDPOINTS.GET_INTER_COMP_JV_ENTRIES
  );
  const { mutate: UserCompanyMutate, data: userCompanyData } = useGlobelApi(
    API_ENDPOINTS.USER_TO_COMPANY
  );
  const location = useLocation();
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
  const [appliedFilters, setAppliedFilters] = useState(null);
  const fileInputRef = useRef(null);
  const limit = 10;
  const navigate = useNavigate();
  const createOrderData = getFromSessionStorage("createOrderData");
  const handleFetchdata = (filter, reset = false, orderby = "ich.id DESC") => {
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
    XLSX.writeFile(workbook, "inter-company-jv.xlsx");
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

  const fields = [
    {
      name: "company_name",
      label: "Company name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_COMPANY}`,
      responseWhich: "data",
      aliases: "c.",
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
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => (
        <span>{moment(value).format("DD-MM-YYYY")}</span>
      )
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
      key: "type",
      label: "Type",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "header_text",
      label: "Header Text",
      width: 165,
      sortable: true,
      filterable: true,
    },
    {
      key: "amount",
      label: "Amount",
      width: 200,
      // editable: true,
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="">{formatNumberDisplay(value)}</span>
      ),
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
  ];
  // === enteries
  const EnteriesfieldsMapping = [
    {
      key: "company_name",
      label: "Company Name",
      sortable: true,
      filterable: true,
      width: 280,
    },
    {
      key: "gl_code",
      label: "GL Code",
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: "gl_name",
      label: "GL Name",
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: "debit",
      label: "Debit",
      width: 150,
      sortable: true,
      render: (value) => formatNumberDisplay(value),
      filterable: true,
    },
    {
      key: "credit",
      label: "Credit",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "description",
      label: "Description",
      width: 150,
      sortable: true,
      filterable: true,
    },

  ];
  const handleActionClick = (action) => {
    if (action === "detail") {
      if (selectedIds?.[0]) {
        const queryData = {
          data: selectedIds?.[0],
        };
        saveToSessionStorage("inter-company-jv-data", queryData);
        navigate(`${rootFolder}/create-inter-company-jv`);
      }
    }
  };

  const handleCopy = () => {
    if (selectedIds?.[0]) {
      const queryData = {
        data: selectedIds?.[0],
        iscopy: true,
      };
      queryData.data.status = "save"
      saveToSessionStorage("inter-company-jv-data", queryData);
      saveToSessionStorage("ledger-source", "manual");
      navigate(`${rootFolder}/interCompanyJv`);
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
          filters: [ {"key":"ice.inter_comp_header_id", "operator":"equal","value1":selectedIds?.[0]?.record_id,"logical":""}],
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
        <h1 className="mb-1 text-size text-color font-headingweight">Inter Company Jv</h1>
        <div className=" flex gap-1 items-center">
        </div>
        <div className=" flex gap-1 items-center">
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
              btntext={"Add New"}
              handleClick={() => {
                navigate(`${rootFolder}/create-inter-company-jv`);
                sessionStorage.removeItem("inter-company-jv-data");
              }}
            />
            <CustomButton btntext={"Copy Entery"} handleClick={handleCopy} />

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
                  case "company_name":
                    dbField = "c.company_name";
                    break;
                  case "type":
                    dbField = "ich.type";
                    break;
                  case "header_text":
                    dbField = "ich.header_text";
                    break;
                  case "amount":
                    dbField = "ich.amount";
                    break;
                  case "status":
                    dbField = "ich.status";
                    break;
                  case "posting_date":
                    dbField = "ich.posting_date";
                    break;
                  default:
                    dbField = "ich.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"interCompanyJvList"}
            onSelectRow={(selectedData) => setSelectedIds(selectedData)}
            hasMore={hasMore}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "ich.id DESC"
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
              <div className="">
                <h2 className="mb-2  p-0 m-0 text-size text-color font-headingweight">Enteries</h2>
              </div>
              <div className="">
                <ResizableTable
                  data={jrEnteries || []}
                  columns={EnteriesfieldsMapping}
                  isDense={isDense}
                  height="300px"
                  scrollableId={"interCompanyJvListEntries"}
                  hasMore={false}
                  enableScroll={true}
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

export default withPermissionCheck(InterCompantJV, "inter-company-jv");