import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import {
  getFromLocalStorage,
  getFromSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";

import { MdRefresh } from "react-icons/md";
import ResizableTable from "../../components/table/ResizableTable";
import dayjs from "dayjs";
const FiscalYearMonth = () => {
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.GET_FISCAL_YEAR_MONTH
  );
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_FISCAL_YEAR_MONTH
  );

  const { mutate: UpdateFiscalYear } = useGlobelApi(
    API_ENDPOINTS.CLOSE_FISCAL_YEAR_MONTH
  );
  const location = useLocation();
  const pathData = getFromSessionStorage("fiscal-yearData") || "";
  console.log("🚀 ~ FiscalYearMonth ~ pathData:", pathData);
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const [apiData, setApiData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("u.id");
  const limit = 10;
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState();
  const handleFetchdata = (filter, reset = false,orderBy="fc.id") => {
    console.log("🚀 ~ handleFetchdata ~ filter:", filter);
    const baseFilters = [
      {
        key: "fc.id",
        operator: "equal",
        value1: pathData?.record_id || "",
        logical: "",
      },
    ];
    const filters = filter ? [...baseFilters, ...filter] : baseFilters;
    mutate(
      {
        filters: filters,
        limit,
        offset: reset ? 0 : offset,
        orderBy:orderBy
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
      const baseFilters = [
        {
          key: "fc.id",
          operator: "equal",
          value1: pathData?.record_id || "",
          logical: "",
        },
      ];
      const filters = filter ? [...baseFilters, ...filter] : baseFilters;
      fetchDataForExcel(
        {
          filters: filters,
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
      updated_at: dayjs(item.updated_at).format("DD-MM-YYYY"),
      created_at: dayjs(item.created_at).format("DD-MM-YYYY"),
      start_date: dayjs(item.start_date).format("DD-MM-YYYY"),
      end_date: dayjs(item.end_date).format("DD-MM-YYYY"),
      start_date_month: dayjs(item.start_date_month).format("DD-MM-YYYY"),
      end_date_month: dayjs(item.end_date_month).format("DD-MM-YYYY"),
    }));
    
    const limitedData = formattedData.slice(0, 1000);
    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "fiscal-year-month.xlsx");
  };
  const fields = [
    {
      name: "month_name",
      label: "Month",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_FISCAL_YEAR_MONTH}`,
      responseWhich: "data",
      baseFilters: [
        {
          key: "fc.id",
          operator: "equal",
          value1: pathData?.record_id || "",
          logical: "",
        },
      ],
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

  const handlePermissionChange = async (row, status) => {
    const body = {
      record_id: row?.record_id,
      dataUpdate: {
        status: status ? 1 : 0,
      },
      changed_by: UserId,
    };
    UpdateFiscalYear(body, {
      onSuccess: (res) => {
        // reset();
        console.log("success edit time", res);
        if (res.success) {
          toast.success(res?.data)
          // Swal.fire({
          //   icon: "success",
          //   title: "Success",
          //   text: res?.data,
          // });
          handleFetchdata(appliedFilters, true);
        } else {
          toast.error(res?.data || "Something went wrong")
          // Swal.fire({
          //   icon: "error",
          //   title: "Error",
          //   text: res?.data || "Something went wrong",
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
    });
  };
  const handlePermissionToggle = (row) => {
    const updatedstatus = !row.fcm_status;
    handlePermissionChange(row, updatedstatus);
  };
  const fieldsMapping = [
    {
      key: "month_name",
      label: "Month Name",
      width: 250,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "month_year",
      label: "Month Year",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
      sortable: false,
    },
    {
      key: "status",
      label: "status",
      width: 250,
      sortable: false,
      render: (value,row) => (
        <div className="pt-2">
          <label className="switch">
            <input
              type="checkbox"
              checked={row?.fcm_status}
              onChange={() => handlePermissionToggle(row)}
            />
            <span className="slider"></span>
          </label>
        </div>
      ),
    },
  ];

  const handleAddRow = () => ({
    id: "",
    month_name: "",
    month_year: "",
    status: "",
  });

  const handleSaveRow = (row) => {
    console.log("Row saved:", row);
  };

  const handleDeleteRow = (id) => {
    console.log("Row deleted:", id);
  };
  useEffect(() => {
    handleFetchdata();
  }, []);
  const breadcrumbItems = [
    { title: "COA", link: "coa-list" },
    { title: "Fiscal Year", link: "fiscal-year" },
    { title: "Fiscal Month" },
  ];
  return (
    <>
      <div>
        <CustomBreadcrumb items={breadcrumbItems} />
        <h2 className="mb-1 text-size text-color font-headingweight">
          Fiscal Year Month
        </h2>
        <p className="text-color font-regularweight">
          {pathData?.year_value}-{pathData?.company_name}
        </p>
        <div className="mt-2">
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
          <CustomButton
            btntext={<MdRefresh size={18} />}
            addclass={`w-6 rounded-radiusFull max-w-6 min-w-6 h-6 ${isPending && "animate-spin"} `}
            padding="p-0"
            rounded="rounded-full"
            handleClick={() => {
              setOffset(0);
              handleFetchdata(null, true);
            }} />
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
                  case "month_name":
                    dbField = "fc.month_name";
                    break;
                  case "month_year":
                    dbField = "fc.month_year";
                    break;
                  case "delivery_tax":
                    dbField = "fc.delivery_tax";
                    break;
                  default:
                    dbField = "fc.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"FiscalYearMonth"}
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
      </div>
    </>
  );
};

export default withPermissionCheck(FiscalYearMonth, "fiscal-year-months-list");
