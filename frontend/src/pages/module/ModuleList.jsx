import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import InfiniteScroll from "react-infinite-scroll-component";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { useGetModule } from "../../apis/useProduct/useModule";
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
import MuiGernericTable from "../../components/table/MuiGernericTable";
import { MdRefresh } from "react-icons/md";
import ResizableTable from "../../components/table/ResizableTable";
import { Modal } from "antd";
import AddModule from "./AddModule";
import UpdateModule from "./UpdateModule";
import dayjs from "dayjs";
const ModuleList = () => {
  const { mutate, isPending } = useGetModule();
  const { mutate: fetchDataForExcel } = useGlobelApi(API_ENDPOINTS.GET_MODULE);
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const [useServerSorting, setUseServerSorting] = useState(false);
  const UserId = getFromLocalStorage("UserId");
  const [moduleData, setModuleData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortField, setSortField] = useState("m.id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editmoduleData, seteditModuleData] = useState(null); // State to store data
  const limit = 10;
  const navigate = useNavigate();
  const handleFetchdata = (filter, reset = false, orderby = "m.id DESC") => {
    mutate(
      { filters: filter || null, limit, offset: reset ? 0 : offset, orderBy: orderby },
      {
        onSuccess: (data) => {
          const newUsers = data?.data || [];

          if (reset) {
            setModuleData(newUsers);
            setOffset(limit);
          } else {
            setModuleData((prevUsers) => [...prevUsers, ...newUsers]);
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
    XLSX.writeFile(workbook, "module.xlsx");
  };
  // const exportToExcel = async () => {
  //   // Limit the data to 1000 rows
  //   const data = await handleFetchExcelData(appliedFilters);

  //   // Format both updated_at and created_at fields using dayjs
  //   const formattedData = data.map(item => ({
  //     ...item,
  //     updated_at: dayjs(item.updated_at).format("DD-MM-YYYY"),
  //     created_at: dayjs(item.created_at).format("DD-MM-YYYY")
  //   }));

  //   const limitedData = formattedData.slice(0, 1000);

  //   // Convert JSON data to worksheet
  //   const worksheet = XLSX.utils.json_to_sheet(limitedData);

  //   // Create a new workbook and append the worksheet
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  //   // Generate a file and trigger download
  //   XLSX.writeFile(workbook, "user-permissions.xlsx");
  // };
  const fields = [
    {
      name: "module_name",
      label: "Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_MODULE}`,
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
    setOffset(0); // Reset offset
    setAppliedFilters(null);
    handleFetchdata(null, true);
    handleFetchExcelData(null);
  };

  const fieldsMapping = [
    {
      key: "module_name",
      label: "Module Name",
      width: 250,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "module_text", label: "Text", width: 250, editable: true,
      sortable: true,
      filterable: true,
    },
    {
      key: "user_name",
      label: "Created By",
      width: 250,
      sortable: true,
      filterable: true,
      // editable: true,
    },
  ];

  // const handleActionClick = (action) => {
  //   if (action === "edit" ) {
  //     if (selectedIds?.[0]) {
  //       saveToSessionStorage("detailData", selectedIds?.[0]);
  //       setEditModal(true);
  //     }
  //     // navigate(`${rootFolder}/update-module`);
  //   }
  //   // alert(`Performing ${action} on IDs: ${selectedIds.join(", ")}`);
  // };
  const handleActionClick = (action) => {
    if (action === "edit") {
      if (selectedIds?.[0]) {
        const selectedData = selectedIds?.[0];
        seteditModuleData(selectedData); // Save data in state
        setEditModal(true); // Open the modal
      }
    }
  };
  const handleAddRow = () => ({
    id: Date.now(),
    first_name: "",
    last_name: "",
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
        <h1 className="mb-2 text-size text-color font-headingweight">Modules List</h1>

        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex justify-between  my-2">
          <div className="flex flex-wrap gap-2">
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
            // handleClick={() =>
            //   navigate(`${rootFolder}/add-module`)
            // }
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
            {/* <GenericActionBar
              selectedIds={selectedIds}
              // onActionClick={handleActionClick}
              handleClick={()=>{
                setEditModal(true)
              }}
              action={["edit"]}
            /> */}
            <GenericActionBar
              selectedIds={selectedIds}
              onActionClick={handleActionClick}
              action={["edit"]}
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
                  // case "user_name":
                  //   dbField = "u.user_name";
                  //   break;
                  case "module_text":
                    dbField = "m.module_text";
                    break;
                  case "module_name":
                    dbField = "m.module_name"; // adjust based on your actual field name
                    break;
                  default:
                    dbField = "m.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"ModuleList"}
            onFilter={(filters) => console.log("Filters:", filters)}
            // defaultSort={{ key: "module_name", direction: "asc" }}
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
                useServerSorting ? `${sortField} ${sortDirection}` : "m.id DESC"
              )
            }
            loading={isPending}
          />
        </div>

        <Modal
          title="Add Module"
          open={isModalOpen}
          footer={null}
          onCancel={() => {
            setIsModalOpen(false);
          }}
          centered
        >
          <AddModule />
        </Modal>
        <Modal
          title="Add Module"
          open={editModal}
          footer={null}
          onCancel={() => setEditModal(false)}
          centered
        >
          <UpdateModule editdata={editmoduleData} handleFetchdata={handleFetchdata} />
        </Modal>

      </div>
    </>
  );
};

export default withPermissionCheck(ModuleList, "module-list");
