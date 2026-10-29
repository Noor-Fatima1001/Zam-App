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
import { Modal } from "antd";
import AddConversions from "./AddConversions";
import UpdateConversions from "./UpdateConversions";
import { formatNumberDisplay } from "../../utils/helper.function";
const SelectStatusList = [
  { value: "divide", label: "divide" },
  { value: "multiply", label: "multiply" },
];
const ConversionsList = () => {
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.GET_CONVERSIONS_LIST
  );
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_CONVERSIONS_LIST
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
      const [conversationlist, setConversationList] = useState(null);
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false,orderBy="cl.id DESC") => {
    console.log("🚀 ~ handleFetchdata ~ filter:", filter);
    mutate(
      {
        filters: filter || null,
        limit,
        offset: reset ? 0 : offset,
        orderby:orderBy ,
      },
      {
        onSuccess: (data) => {
          const newUsers = data?.data || [];
          if (reset) {
            setApiData(newUsers);
            setOffset(limit);
          } else {
            setApiData((prevUsers) => [...prevUsers, ...newUsers]);
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
    const formattedData = data.map(item => ({
      ...item,

      conversion_value: parseFloat(item.conversion_value).toFixed(3),
    }));

    const limitedData = formattedData.slice(0, 1000);


    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "conversion.xlsx");
  };

  const fields = [
   
    {
      name: "cl.conversion_value",
      label: " value",
      type: "textServer",
      labelKey: "conversion_value",
      ValueKey: "conversion_value",
      endpoint: `${API_ENDPOINTS.GET_CONVERSIONS_LIST}`,
      responseWhich: "data",
    },
    {
      // fieldQueryKey: "umu.description",
      name: "umf.description",
      label: "unit from",
      type: "textServer",
      labelKey: "unit_from_description",
      ValueKey: "unit_from_description",
      endpoint: `${API_ENDPOINTS.GET_CONVERSIONS_LIST}`,
      responseWhich: "data",
    },
    {
      name: "umt.description",
      label: "unit to",
      type: "textServer",
      labelKey: "unit_to_description",
      ValueKey: "unit_to_description",
      endpoint: `${API_ENDPOINTS.GET_CONVERSIONS_LIST}`,
      responseWhich: "data",
    },
    {
      name: "cl.type_factor",
      label: "type",
      type: "select",
      options: SelectStatusList,
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
    { key: "conversion", label: "Conversion", width: 200,
      sortable: true,
      filterable: true,
     },
    {
      key: "conversion_value",
      label: " Value",
      width: 120,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
      // editable: true,
    },
    {
      key: "unit_from_description",
      label: "Unit From",
      width: 150,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "unit_to_description",
      label: "Unit To",
      width: 120,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "type_factor",
      label: "type",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },

    // {
    //   field: "created_at",
    //   headerName: "Created at",
    //   width: 200,
    //   renderCell: (row) => (
    //     <span className="">
    //       {moment(row?.row.created_at).format("DD-MM-YYYY")}
    //     </span>
    //   ),
    // },
  ];

  // const handleActionClick = (action) => {
  //   if (action === "edit") {
  //     saveToSessionStorage("conversionData", selectedIds?.[0]);
  //     navigate(`${rootFolder}/update-conversions`);
  //   }
  // };
  const handleActionClick = (action) => {
    if (action === "edit") {
      if (selectedIds?.[0]) {
        const selectedData = selectedIds?.[0]; 
        setConversationList(selectedData); 
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
        <h1 className="mb-2 text-size text-color font-headingweight">
          Conversion List
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
                // navigate(`${rootFolder}/add-conversions`)
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
              addclass={`w-6 rounded-radiusFull max-w-6 min-w-6 h-6 ${
                isPending && "animate-spin"
              } `}
              padding="p-0"
              rounded="rounded-full"
              handleClick={() => {
                setOffset(0);
                handleFetchdata(null, true);
              }}            />
            <GenericActionBar
              selectedIds={selectedIds}
              onActionClick={handleActionClick}
              action={["edit"]}
            />
          </div>
        </div>
        {/* <InfiniteScroll
          height={300}
          dataLength={apiData.length}
          next={() => handleFetchdata()}
          hasMore={hasMore}
          loader={isPending && <Loader />}
          endMessage={<p className="text-center mt-2">No more records</p>}
        > */}
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
                        case "type_factor":
                          dbField = "cl.type_factor";
                          break;
                        case "unit_to_description":
                          dbField = "um.description";
                          break;
                        case "unit_from_description":
                          dbField = "um.id";
                          break;
                        case "cl.conversion_value":
                          dbField = "cl.conversion_value";
                          break;
                        case "cl.conversion":
                          dbField = "cl.conversion";
                          break;
                        default:
                          dbField = "cl.id";
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
                  enableScroll={true}
                  scrollableId={"conversions"}
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
            title="Add Conversion"
            open={isModalOpen}
            footer={null}
            onCancel={() => {
              setIsModalOpen(false);
            }}
            centered
          >
            <AddConversions/>
            {/* <Createcompany setIsModalOpen={setIsModalOpen} /> */}
          </Modal>
                <Modal
                title="Update Conversion List"
                open={editModals}
                footer={null}
                onCancel={() => {
                  setEditModals(false);
                  setConversationList(null);
                }}
               
                centered
                destroyOnClose 
              >
         <UpdateConversions  key={conversationlist?.record_id}   listconversion={conversationlist} handleFetchdata={handleFetchdata} />
          {/* <UpdateUnitMaster  unitmaster={unitmasterData} handleFetchdata={handleFetchdata} /> */}
              </Modal>
              
        {/* </InfiniteScroll> */}
        
      </div>
    </>
  );
};

export default withPermissionCheck(ConversionsList, "conversions");
