import moment from "moment";
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
import ResizableTable from "../../components/table/ResizableTable";
import { Modal } from "antd";
import AddUnitList from "./AddUnitList";
import { formatNumberDisplay } from "../../utils/helper.function";
import UpdateUnitList from "./UpdateUnitList";
import dayjs from "dayjs";
const UnitList = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_UNIT_LIST);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_UNIT_LIST
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
  const [sortField, setSortField] = useState("u.id");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModals, setEditModals] = useState(false);
  const [listmoduleData, setListModuleData] = useState(null);
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderBy = "ul.id DESC") => {

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
            setApiData(newUsers);
          } else {
            setApiData((prevUsers) => [...prevUsers, ...newUsers]);
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
      created_at: dayjs(item.created_at).format("DD-MM-YYYY"),
          size: parseFloat(item.size).toFixed(3),
    }));
    const limitedData = formattedData.slice(0, 1000);
    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "uni-list.xlsx");
  };

  const fields = [
    {
      // fieldQueryKey: "ump.description",
      name: "ump.description",
      label: "Packaging Name",
      type: "textServer",
      labelKey: "pack_name",
      ValueKey: "pack_name",
      endpoint: `${API_ENDPOINTS.GET_UNIT_LIST}`,
      responseWhich: "data",
    },
    {
      // fieldQueryKey: "umu.description",
      name: "umu.description",
      label: "unit name",
      type: "textServer",
      labelKey: "unit_name",
      ValueKey: "unit_name",
      endpoint: `${API_ENDPOINTS.GET_UNIT_LIST}`,
      responseWhich: "data",
    },
    {
      name: "size",
      label: "Size",
      type: "text",
      aliases: "ul.",
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
      key: "size", label: "size", width: 120, sortable: true,
      render: (value) => formatNumberDisplay(value),
      filterable: true,
    },
    {
      key: "pack_name",
      label: "packag name",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "unit_name",
      label: "unit name",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "unit",
      label: "unit",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },

    {
      key: "created_at",
      label: "Created at",
      width: 200,
      filterable: true,
      sortable: true,
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

  const handleActionClick = (action) => {
    if (action === "edit") {
      if (selectedIds?.[0]) {
        const selectedData = selectedIds?.[0];
        setListModuleData(selectedData);
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
    handleFetchdata(null, true);
  }, []);
  useEffect(() => {
    setIsModalOpen(false)
  }, [navigate]);
  return (
    <>
      <div>
        <h1 className="mb-2 text-size text-color font-headingweight">Unit List</h1>

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
                // navigate(`${rootFolder}/add-unit-list`)
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
          {/* <MuiGenericTable
            columns={fieldsMapping}
            initialData={apiData}
            enableAdd={false}
            enableEdit={false}
            enableDelete={false}
            onAddRow={handleAddRow}
            dense={isDense}
            setSelectedRows={setSelectedIds}
            selectedRows={selectedIds}
            onSaveRow={handleSaveRow}
            onDeleteRow={handleDeleteRow}
            hasMore={hasMore}
            enableScroll={true}
            onLoadMore={() => handleFetchdata(appliedFilters)}
            loading={isPending}
          /> */}

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
                  case "size":
                    dbField = "ul.size";
                    break;
                  // case "pack_name":
                  //   dbField = "ul.description";
                  //   break;
                  case "unit_name":
                    dbField = "ump.description";
                    break;
                  case "ul.unit":
                    dbField = "ul.description";
                    break;
                  case "created_at":
                    dbField = "ul.created_at";
                    break;
                  default:
                    dbField = "ul.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"UnitList"}
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
          title="Add Unit List"
          open={isModalOpen}
          footer={null}
          onCancel={() => {
            setIsModalOpen(false);
          }}
          centered
        >
          <AddUnitList />
          {/* <Createcompany setIsModalOpen={setIsModalOpen} /> */}
        </Modal>
        <Modal
          title="Update Bank List"
          open={editModals}
          footer={null}
          onCancel={() => setEditModals(false)}
          centered
        >
          <UpdateUnitList listedit={listmoduleData} handleFetchdata={handleFetchdata} />
          {/* <UpdateSubModule subedit={submoduleData} /> */}
        </Modal>
      </div>
    </>
  );
};

export default withPermissionCheck(UnitList, "unit-list");
