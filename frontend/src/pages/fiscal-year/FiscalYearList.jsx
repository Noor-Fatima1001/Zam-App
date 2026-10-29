import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import InfiniteScroll from "react-infinite-scroll-component";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import Loader from "../../components/Loader";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import GenericDataTable from "../../components/table/GenericDataTable";
import {
  getFromLocalStorage,
  saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import { MdRefresh } from "react-icons/md";
import ResizableTable from "../../components/table/ResizableTable";
import AddFiscalYear from "./AddFiscalYear";
import { Modal } from "antd";
import dayjs from "dayjs";
const FiscalYearList = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_FISCAL_YEAR);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_FISCAL_YEAR
  );

  const { mutate: UpdateFiscalYear } = useGlobelApi(
    API_ENDPOINTS.CLOSE_FISCAL_YEAR
  );
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const [apiData, setApiData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("fc.id");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderBy = "fc.id DESC") => {
    mutate(
      {
        filters: filter,
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
      start_date: dayjs(item.start_date).format("DD-MM-YYYY"),
      end_date: dayjs(item.end_date).format("DD-MM-YYYY"),
    }));

    const limitedData = formattedData.slice(0, 1000);

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "fiscal-year.xlsx");
  };
  const fields = [
    {
      name: "year_value",
      label: "Year",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_FISCAL_YEAR}`,
      responseWhich: "data",
    },
    {
      name: "company_name",
      label: "Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_COMPANY}`,
      responseWhich: "data",
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
    console.log("🚀 ~ handlePermissionToggle ~ row:", row);
    const updatedstatus = !row.status;
    handlePermissionChange(row, updatedstatus);
  };
  const fieldsMapping = [
    {
      key: "year_value",
      label: "Year",
      width: 120,
      // editable: true,
      sortable: true,
      filterable: true,
    },

    {
      key: "company_name",
      label: "Company Name",
      width: 300,
      sortable: true,
      filterable: true,
    },
    {
      key: "status",
      label: "status",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value, row) => {
        return (
          <div className="pt-2">
            <label className="switch ">
              <input
                type="checkbox"
                checked={row?.status}
                onChange={() => handlePermissionToggle(row)}
              />
              <span className="slider"></span>
            </label>
          </div>
        );
      },
      // renderCell: (row) => (
      //   <div className="pt-2">
      //     <label className="switch ">
      //       <input
      //         type="checkbox"
      //         checked={row?.row.status}
      //         onChange={() => handlePermissionToggle(row?.row)}
      //       />
      //       <span className="slider"></span>
      //     </label>
      //   </div>
      // ),
    },
  ];

  const handleActionClick = (action) => {
    if (action === "months") {
      saveToSessionStorage("fiscal-yearData", selectedIds?.[0]);
      navigate(`${rootFolder}/fiscal-year-months-list`);
    }
  };

  const handleAddRow = () => ({
    id: "",
    year_value: "",
    company_name: "",
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
  useEffect(() => {
    setIsModalOpen(false)
  }, [navigate]);
  return (
    <>
      <div>
        <h1 className="mb-2 text-size text-color font-headingweight">
          Fiscal Year
        </h1>

        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-wrap gap-2 my-2 items-center">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              handleClick={exportToExcel}
              addclass="gap-1"
            />
            <CustomButton
              btntext={"Add New"}
              handleClick={
                () => setIsModalOpen(true)
                // navigate(`${rootFolder}/add-fiscal-year`)
              }
            />
            <div className=" d-flex align-items-center">
              <label className="me-2 text-color font-regularweight">
                Dense Rows
              </label>
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
              <span className="me-2 text-color font-regularweight">
                server-side sorting
              </span>
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
              action={["months"]}
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
                  case "year_value":
                    dbField = "fc.year_value";
                    break;
                  case "status":
                    dbField = "status";
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
            scrollableId={"FiscalYearList"}
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
                useServerSorting
                  ? `${sortField} ${sortDirection}`
                  : "fc.id DESC"
              )
            }
            loading={isPending}
          />
        </div>
        <Modal
          title="Add Fiscal Year"
          open={isModalOpen}
          footer={null}
          onCancel={() => {
            setIsModalOpen(false);
          }}
          centered
        >
          <div>

            <AddFiscalYear />
          </div>
        </Modal>
      </div>
    </>
  );
};

export default withPermissionCheck(FiscalYearList, "fiscal-year");
