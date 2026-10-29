import { useCallback, useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { useAllUsers } from "../../apis/useProduct/useUser";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import {
  saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import ResizableTable from "../../components/table/ResizableTable";
import { Modal } from "antd";
import AddUser from "./addUser";
import dayjs from "dayjs";

const NewUserList = () => {
  const { mutate, isPending } = useAllUsers();
  const { mutate: fetchDataForExcel } = useGlobelApi(API_ENDPOINTS.USERS);
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const [sortDirection, setSortDirection] = useState("DESC");
  const [isDense, setIsDense] = useState(true);
  const [selectedIds, setSelectedIds] = useState(null);
  const [offset, setOffset] = useState(0);
  const [users, setUsers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("u.id");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const limit = 10;
  const SelectStatus = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "InActive" },
  ];

  const handleFetchdata = (filter, reset = false, orderby = "u.id DESC") => {
    mutate(
      {
        filters: filter || null,
        limit,
        offset: reset ? 0 : offset,
        orderby: orderby,
      },
      {
        onSuccess: (data) => {
          const newUsers = data?.result || [];

          if (reset) {
            setUsers(newUsers);
            setOffset(limit);
          } else {
            setUsers((prevUsers) => [...prevUsers, ...newUsers]);
            setOffset((prevOffset) => prevOffset + limit);
          }
          const total = newUsers?.[0]?.totalRecords || 0;
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
            resolve(data?.result || []);
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
      created_on: dayjs(item.created_on).format("DD-MM-YYYY")
    }));
    const limitedData = formattedData.slice(0, 10000);
    const worksheet = XLSX.utils.json_to_sheet(limitedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "users.xlsx");
  };

  const handleApplyFilters = (data) => {
    console.log("🚀 ~ handleApplyFilters ~ data:", data);
    setAppliedFilters(data);
    setOffset(0);
    handleFetchdata(data, true);
    handleFetchExcelData(data);
  };

  const handleResetFilters = () => {
    setOffset(0);
    setAppliedFilters(null);
    handleFetchdata(null, true);
    handleFetchExcelData(null);
  };

  const handleActionClick = (action) => {
    if (action === "profile") {
      saveToSessionStorage("detailData", selectedIds?.[0]);
      navigate(`${rootFolder}/user-profile`);
    }
  };
  const fieldsMapping = [
    {
      key: "first_name",
      label: "First Name",
      width: 180,
      sortable: true,
      filterable: true,
    },
    {
      key: "last_name",
      label: "Last Name",
      width: 180,
      sortable: true,
      filterable: true,
    },
    {
      key: "email",
      label: "Email",
      width: 250,
      sortable: true,
      filterable: true,
    },
    {
      key: "user_name",
      label: "User Name",
      width: 200,
      sortable: true,
      filterable: true,
    },

    {
      key: "status",
      label: "Status",
      width: 120,
      sortable: true,
      filterable: true,
      type: "singleSelect",
      valueOptions: ["Market", "Finance", "Development"],
    },
  ];
  const filterFields = [
    {
      name: "first_name",
      label: "First Name",
      type: "text",
    },
    {
      name: "last_name",
      label: "Last Name",
      type: "text",
    },
    {
      name: "user_name",
      label: "User Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.USERS}`,
      responseWhich: "result",
    },
    {
      name: "email",
      label: "Email",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.USERS}`,
      responseWhich: "result",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: SelectStatus,
    },
  ];

  useEffect(() => {
    handleFetchdata(null, true);
  }, []);
const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);
  return (
    <>
      <h1 className="mb-2  text-size text-color font-headingweight">Users List</h1>
      <div className="">
        <DynamicFilter
          fields={filterFields}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />
      </div>
      <div className="flex justify-between gap-3 my-2 items-center">
        <div className="flex flex-wrap gap-2 items-center">
          <CustomButton
            btntext={"Export to Excel"}
            icon={<FaFileExport />}
            handleClick={exportToExcel}
            addclass="gap-1"
          />
          <CustomButton
            btntext={"Add New"}
            handleClick={() => {
              setIsModalOpen(true)
            }}
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
            addclass={`w-6  rounded-radiusFull max-w-6 min-w-6 h-6 ${isPending && "animate-spin"} `}
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
            action={["profile"]}
          />
        </div>
      </div>

      <div className="h-80  mb-2.5">
        <ResizableTable
          data={users || []}
          columns={fieldsMapping}
          isDense={isDense}
          height="300px"
          // className="my-4"
          onSort={(key, direction) => {
            if (useServerSorting) {
              let dbField;
              switch (key) {
                case "first_name":
                  dbField = "u.first_name";
                  break;
                case "last_name":
                  dbField = "u.last_name";
                  break;
                case "user_name":
                  dbField = "u.user_name"; // adjust based on your actual field name
                  break;
                case "status":
                  dbField = "u.status";
                  break;
                case "email":
                  dbField = "u.email";
                  break;
                default:
                  dbField = "u.id";
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
          enableScroll={true}
          disableInternalSort={useServerSorting}
          onLoadMore={() =>
            handleFetchdata(
              appliedFilters,
              false,
              useServerSorting ? `${sortField} ${sortDirection}` : "u.id DESC"
            )
          }
          loading={isPending}
        />

        <Modal
          title="Add User"
          className="rounded-radiusRegular"
          open={isModalOpen}
          footer={null}
          onCancel={handleCloseModal}
          centered
        >
          <AddUser setIsModalOpen={setIsModalOpen} />
        </Modal>
      </div>

      {selectedIds?.length > 0 && (
        <div className="card mt-4 shadow-lg border-0 rounded-lg">
          <div className="p-3 text-white border-bottom border-1">
            <h4 className=" text-center text-size text-color font-headingweight p-0 m-0">User Detail</h4>
          </div>
          <div className=" p-3">
            <div className="row mb-3">
              <div className="col-sm-4 ">
                <label className="text-color font-regularweight">
                  First Name:
                </label>
              </div>
              <div className="col-sm-8 text-color">{selectedIds?.[0]?.first_name}</div>
            </div>
            <div className="row mb-3">
              <div className="col-sm-4 ">
                <label className=" text-color font-regularweight">
                  Last Name:
                </label>
              </div>
              <div className="col-sm-8 text-color">{selectedIds?.[0]?.last_name}</div>
            </div>
            <div className="row mb-3">
              <div className="col-sm-4">
                <label className="text-color font-regularweight">
                  Email:
                </label>
              </div>

              <div className="col-sm-8 text-color">{selectedIds?.[0]?.email}</div>
            </div>
            <div className="row mb-3">
              <div className="col-sm-4 ">
                <label className="text-color font-regularweight">
                  Username:
                </label>
              </div>
              <div className="col-sm-8 text-color">{selectedIds?.[0]?.user_name}</div>
            </div>
            <div className="row mb-3">
              <div className="col-sm-4 ">
                <label className="text-color font-regularweight">
                  Gender:
                </label>
              </div>
              <div className="col-sm-8 text-color">{selectedIds?.[0]?.gender}</div>
            </div>
            <div className="row mb-3">
              <div className="col-sm-4 ">
                <label className="text-color font-regularweight">
                  Status:
                </label>
              </div>
              <div className="col-sm-8 text-color">{selectedIds?.[0]?.status}</div>
            </div>
            <div className="row mb-3">
              <div className="col-sm-4 ">
                <label className="text-color font-regularweight">
                  Comments:
                </label>
              </div>
              <div className="col-sm-8 text-color">{selectedIds?.[0]?.comments}</div>
            </div>
            <div className="row mb-3">
              <div className="col-sm-4">
                <label className="text-color font-regularweight">
                  Created On:
                </label>
              </div>
              <div className="col-sm-8 text-color">
                {new Date(selectedIds?.[0]?.created_on).toLocaleString()}
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-sm-4 ">
                <label className="text-color font-regularweight">
                  First Login:
                </label>
              </div>
              <div className="col-sm-8 text-color">
                {selectedIds?.[0]?.first_login ? "true" : "false"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default withPermissionCheck(NewUserList, "user-list");
