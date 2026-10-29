import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { useGetSubModule } from "../../apis/useProduct/useSubModule";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import MuiGenericTable from "../../components/table/MuiGernericTable";
import {
  getFromLocalStorage,
  saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import ResizableTable from "../../components/table/ResizableTable";
import { Modal } from "antd";
import AddSubModule from "./AddSubModule";
import UpdateSubModule from "./UpdateSubModule";
import dayjs from "dayjs";

const SubModuleList = () => {
  const { mutate, isPending } = useGetSubModule();
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_SUBMODULE
  );
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const [moduleData, setModuleData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("u.id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModals, setEditModals] = useState(false);
  const [submoduleData, setsubModuleData] = useState(null);

  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderby = "sm.id ASC") => {
    mutate(
      { filters: filter || null, limit, offset: reset ? 0 : offset, orderby: orderby },
      {
        onSuccess: (data) => {
          const newUsers = data?.result || [];

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

    // Format both  fields using dayjs
    const formattedData = data.map(item => ({
      ...item,
      updated_at: dayjs(item.updated_at).format("DD-MM-YYYY"),
      created_at: dayjs(item.created_at).format("DD-MM-YYYY")
    }));

    const limitedData = formattedData.slice(0, 1000);


    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "sub-module-list.xlsx");
  };

  const fields = [
    {
      name: "sub_module_name",
      label: "SubModule",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_SUBMODULE}`,
      responseWhich: "result",
    },
    {
      name: "module_name",
      label: "Module",
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
    setOffset(0);
    setAppliedFilters(null);
    handleFetchdata(null, true);
    handleFetchExcelData(null);
  };

  const fieldsMapping = [
    {
      key: "sub_module_name",
      label: "SubModule",
      sortable: true,
      filterable: true,
      width: 250,
    },
    {
      key: "module_name",
      label: "Module",
      sortable: true,
      filterable: true,
      sortable: true,
      width: 250,
    },
    {
      key: "user_name",
      label: "Created By",
      filterable: true,
      width: 250,
    },
  ];

  const handleActionClick = (action) => {
    if (action === "edit") {
      if (selectedIds?.[0]) {
        const selectedData = selectedIds?.[0];
        setsubModuleData(selectedData);
        setEditModals(true);
      }
    }
  };

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

  useEffect(() => {
    handleFetchdata();
  }, []);

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
          Sub Modules List
        </h1>

        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex justify-between gap-3 my-2">
          <div className="flex flex-wrap gap-2">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              handleClick={exportToExcel}
              addclass="gap-1"
            />
            <CustomButton
              btntext={"Add New"}
              handleClick={() => setIsModalOpen(true)}
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
            onSort={(key, direction) => {
              if (useServerSorting) {
                let dbField;
                switch (key) {
                  case "module_name":
                    dbField = "m.module_name";
                    break;
                  case "sub_module_name":
                    dbField = "sm.sub_module_name";
                    break;
                  case "user_name":
                    dbField = "u.user_name";
                    break;
                  default:
                    dbField = "sm.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            onFilter={(filters) => console.log("Filters:", filters)}
            scrollableId={"SubModuleList"}
            onSelectRow={(selectedData) => setSelectedIds(selectedData)}
            hasMore={hasMore}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "sm.id DESC"
              )
            }
            loading={isPending}
          />
          <Modal
            title="Add SubModule"
            open={isModalOpen}
            footer={null}
            onCancel={() => setIsModalOpen(false)}
            centered
          >
            <AddSubModule />
          </Modal>
          <Modal
            title="Update SubModule"
            open={editModals}
            footer={null}
            onCancel={() => setEditModals(false)}
            centered
          >
            <UpdateSubModule subedit={submoduleData} refreshParentData={handleFetchdata} />
          </Modal>
        </div>
      </div>
    </>
  );
};

export default withPermissionCheck(SubModuleList, "sub-module-list");