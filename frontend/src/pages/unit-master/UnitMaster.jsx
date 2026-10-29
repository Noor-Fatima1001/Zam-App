import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import MuiGenericTable from "../../components/table/MuiGernericTable";
import {
  getFromLocalStorage,
  saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import moment from "moment";
import ResizableTable from "../../components/table/ResizableTable";
import AddUnitMaster from "./AddUnitMaster";
import { Modal } from "antd";
import UpdateUnitMaster from "./UpdateUnitMaster";
import dayjs from "dayjs";

const UnitMaster = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_UNIT_MASTER);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_UNIT_MASTER
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
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("u.id");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModals, setEditModals] = useState(false);
  const [unitmasterData, setUnitMasterData] = useState(null);
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderBy = "um.id DESC") => {
    console.log("🚀 ~ handleFetchdata ~ filter:", filter);
    mutate(
      {
        filters: filter || null,
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
          setTotalRecords(newUsers?.[0]?.totalRecords || 0);
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
    XLSX.writeFile(workbook, "list-master.xlsx");
  };
  const SelectStatus = [
    { value: "unit", label: "Unit" },
    { value: "family", label: "Family" },
    { value: "packaging", label: "Packaging" },
  ];
  const fields = [
    {
      name: "type",
      aliases: "um.",
      label: "type",
      type: "select",
      options: SelectStatus,
    },
    {
      fieldQueryKey: "um.description",
      name: "um.description",
      label: "description",
      type: "textServer",
      labelKey: "unit_description",
      ValueKey: "unit_description",
      endpoint: `${API_ENDPOINTS.GET_UNIT_MASTER}`,
      responseWhich: "data",
    },
    {
      fieldQueryKey: "ump.description",
      name: "ump.description",
      label: "parent name",
      type: "textServer",
      labelKey: "parent_description",
      ValueKey: "parent_description",
      endpoint: `${API_ENDPOINTS.GET_UNIT_MASTER}`,
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
      key: "type", label: "Type", width: 120, sortable: true,
      filterable: true,
    },
    {
      key: "unit_description",
      label: "Description",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "parent_description",
      label: "Parent Name",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <span className="capitalize">
          {row?.parent_description || "N/A"}
        </span>
      ),
      // renderCell: (row) => (
      //   <span className="capitalize">
      //     {row?.row.parent_description || "N/A"}
      //   </span>
      // ),
    },
    {
      key: "created_at",
      label: "Created at",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="">{moment(value).format("DD-MM-YYYY") || "N/A"}</span>
      ),
      // renderCell: (row) => (
      //   <span className="">
      //     {moment(row?.row.created_at).format("DD-MM-YYYY")}
      //   </span>
      // ),
    },
  ];

  // const handleActionClick = (action) => {
  //   if (action === "edit") {
  //     saveToSessionStorage("unitMasterData", selectedIds?.[0]);
  //     navigate(`${rootFolder}/update-unit-master`);
  //   }
  // };
  const handleActionClick = (action) => {
    if (action === "edit") {
      if (selectedIds?.[0]) {
        const selectedData = selectedIds?.[0];
        setUnitMasterData(selectedData); // Save data in state
        setEditModals(true);
      }
    }
  };
  const handleEditModalClose = () => {
    setEditModals(false);
    setUnitMasterData(null); // Reset data when modal closes
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
    handleFetchdata(null, true);
  }, []);
  useEffect(() => {
    setIsModalOpen(false)
  }, [navigate]);

  return (
    <>
      <div>
        <h1 className="mb-2 text-size text-color font-headingweight">
          Unit Master List
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
              handleClick={() =>
                setIsModalOpen(true)
                // navigate(`${rootFolder}/add-unit-master`)
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
                  case "parent_description":
                    dbField = "uml.description";
                    break;
                  case "unit_description":
                    dbField = "ul.description";
                    break;
                  case "type":
                    dbField = "um.type";
                    break;
                  case "created_at":
                    dbField = "um.created_at";
                    break;
                  default:
                    dbField = "um.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"UnitMaster"}
            onFilter={(filters) => console.log("Filters:", filters)}
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
          title="Add Unit Master"
          open={isModalOpen}
          footer={null}
          onCancel={() => {
            setIsModalOpen(false);
          }}
          centered
        >
          <AddUnitMaster />
          {/* <Createcompany setIsModalOpen={setIsModalOpen} /> */}
        </Modal>
        <Modal
          title="Update Unit Master"
          open={editModals}
          footer={null}
          // onCancel={() => setEditModals(false)}
          onCancel={handleEditModalClose}
          centered
        >
          <UpdateUnitMaster unitmaster={unitmasterData} handleFetchdata={handleFetchdata} />
        </Modal>
      </div>
    </>
  );
};

export default withPermissionCheck(UnitMaster, "unit-master");
