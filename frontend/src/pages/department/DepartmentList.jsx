import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { useGetDepartment } from "../../apis/useProduct/useDepartment";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import {
  getFromLocalStorage,
  saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import ResizableTable from "../../components/table/ResizableTable";
import AddDepartment from "./AddDepartment";
import { Modal } from "antd";
import dayjs from "dayjs";
const DepartmentList = () => {
  const { mutate, isPending } = useGetDepartment();
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_DEPARTMENT
  );
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const [departmentData, setDepartmentData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("u.id");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderby = "d.id ASC") => {
    mutate(
      {
        filters: filter || null,
        limit,
        offset: reset ? 0 : offset,
        orderby: orderby,
      },
      {
        onSuccess: (data) => {
          const newUsers = data?.data || [];

          if (reset) {
            setDepartmentData(newUsers);
            setOffset(limit);
          } else {
            setDepartmentData((prevUsers) => [...prevUsers, ...newUsers]);
            setOffset((prevOffset) => prevOffset + limit);
          }
          const total = newUsers?.[0]?.totalRecords || 0;
          setTotalRecords(total);
          setHasMore(
            newUsers.length > 0 && (reset ? limit : offset + limit) < total
          );
        },
        onError: (error) => {
          console.error("Error fetching users:", error);
        },
      }
    );
  };
  const handleFetchExcelData = (filter) => {
    return new Promise((resolve, reject) => {
      fetchDataForExcel(
        { filters: filter || null, limit: 0, offset: 0 },
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
    // Format both  fields using dayjs
    const formattedData = data.map(item => ({
      ...item,
      updated_at: dayjs(item.updated_at).format("DD-MM-YYYY")
    }));

    const limitedData = formattedData.slice(0, 1000);
    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "department.xlsx");
  };
  const handleApplyFilters = (data) => {
    console.log("Filter Values:", data);
    setOffset(0); // Reset offset
    setAppliedFilters(data);
    handleFetchdata(data, true);
    handleFetchExcelData(data);
  };

  const handleResetFilters = () => {
    setOffset(0); // Reset offset
    setAppliedFilters(null);
    handleFetchdata(null, true);
    handleFetchExcelData(null);
  };
  const fields = [
    { name: "dept_code", label: "Code", type: "text" },
    {
      name: "dept_name",
      label: "Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_DEPARTMENT}`,
      responseWhich: "data",
    },
    // {
    //   name: "user_name",
    //   aliases: "u.",
    //   label: "Created by",
    //   type: "textServer",
    //   endpoint: `${API_ENDPOINTS.USERS}`,
    //   responseWhich: "result",
    // },
  ];

  const fieldsMapping = [
    {
      key: "dept_code",
      label: "Code",
      sortable: true,
      filterable: true,
      width: 150,
      // editable: true,
    },
    {
      key: "dept_name",
      label: "Name",
      sortable: true,
      filterable: true,
      width: 250,
      // editable: true,
    },
    {
      key: "user_name",
      label: "Created by",
      // sortable: true,
      // filterable: true,
      filterable: true,
      width: 200,
      // editable: true,
    },
  ];
  const handleActionClick = (action) => {
    if (action === "detail") {
      saveToSessionStorage("depDetail", selectedIds?.[0]);
      navigate(`${rootFolder}/department-detail`);
    }
    // alert(`Performing ${action} on IDs: ${selectedIds.join(", ")}`);
  };

  const handleAddRow = () => ({
    id: Date.now(),
    name: "",
    dept_code: "",
    dept_name: "",
    user_name: "",
  });

  const handleSaveRow = (row) => {
    console.log("Row saved:", row);
  };

  const handleDeleteRow = (id) => {
    console.log("Row deleted:", id);
  };

  useEffect(() => {
    handleFetchdata(null, true);
  }, []);
    useEffect(() => {
  setIsModalOpen(false)
}, [navigate]);
  return (
    <>
      <div>
        <h1 className="mb-2 text-size text-color font-headingweight">
          Department List
        </h1>

        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex justify-between gap-3 my-2">
          <div className="flex gap-2 items-center">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              handleClick={exportToExcel}
              addclass="gap-1"
            />
            <CustomButton
              btntext={"Add New"}
              handleClick={() =>
                setIsModalOpen(true)
                // navigate(`${rootFolder}/add-department`)
              }
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
              }} />
            <GenericActionBar
              selectedIds={selectedIds}
              onActionClick={handleActionClick}
              action={["detail"]}
            />
          </div>
        </div>
        <div className="h-80 mb-2.5">
          <ResizableTable
            data={departmentData || []}
            columns={fieldsMapping}
            isDense={isDense}
            height="300px"
            // className="my-4"
            onSort={(key, direction) => {
              if (useServerSorting) {
                let dbField;
                switch (key) {
                  case "dept_code":
                    dbField = "d.dept_code";
                    break;
                  case "dept_name":
                    dbField = "d.dept_name";
                    break;
                  case "user_name":
                    dbField = "d.user_name"; // adjust based on your actual field name
                    break;
                  default:
                    dbField = "d.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"DepartmentList"}
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
                useServerSorting ? `${sortField} ${sortDirection}` : "u.id DESC"
              )
            }
            loading={isPending}
          />
        </div>

        <Modal
          title="Add Department"
          open={isModalOpen}
          footer={null}
          onCancel={() => {
            setIsModalOpen(false);
          }}
          centered
        >
          <AddDepartment />
          {/* <Createcompany setIsModalOpen={setIsModalOpen} /> */}
        </Modal>

      </div>
    </>
  );
};

export default withPermissionCheck(DepartmentList, "department-list");
