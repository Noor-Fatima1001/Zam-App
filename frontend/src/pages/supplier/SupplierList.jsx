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
import {
  getFromLocalStorage,
  saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import ResizableTable from "../../components/table/ResizableTable";
import { Modal } from "antd";
import AddSuppliers from "./AddSuppliers";
import dayjs from "dayjs";

const SupplierList = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_SUPPLIER);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_SUPPLIER
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
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderBy = "sl.id DESC") => {
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
      updated_at: dayjs(item.updated_at).format("DD-MM-YYYY"),
      created_at: dayjs(item.created_at).format("DD-MM-YYYY"),

    }));
    const limitedData = formattedData.slice(0, 1000);
    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "supplier-list.xlsx");
  };

  const fields = [
    {
      name: "supplier_code",
      label: " Code",
      type: "textServer",
      //   aliases:"11.",
      endpoint: `${API_ENDPOINTS.GET_SUPPLIER}`,
      responseWhich: "data",
    },
    {
      name: "supplier_name",
      label: "Name",
      type: "textServer",
      //   aliases:"11.",
      endpoint: `${API_ENDPOINTS.GET_SUPPLIER}`,
      responseWhich: "data",
    },
    { name: "supplier_phone", label: "Phone No", type: "text" },
    { name: "supplier_order_communication", label: "Supplier Order Communication", type: "text" },

    {
      name: "gl_name",
      label: "Gl Name",
      type: "textServer",
      //   aliases:"11.11.",
      endpoint: `${API_ENDPOINTS.GET_COA}`,
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
      key: "supplier_code",
      label: "Code",
      width: 150,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "supplier_name",
      label: "Name",
      width: 150,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "supplier_phone",
      label: "Phone No",
      width: 150,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "supplier_order_communication",
      label: "Supplier Order Communication",
      width: 350,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    {
      key: "gl_name",
      label: "Gl name",
      sortable: true,
      filterable: true,
      width: 150,
      // editable: true,
    },
  ];

  const handleActionClick = (action) => {
    if (action === "detail") {
      saveToSessionStorage("supplierData", selectedIds?.[0]);
      navigate(`${rootFolder}/supplier-detail`);
    }
  };
  const handleAddRow = () => ({
    id: "",
    supplier_code: "",
    supplier_name: "",
    supplier_phone: "",
    gl_name: "",
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
        <h1 className="mb-2 text-size text-color font-headingweight">Supplier List</h1>

        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex justify-between gap-3 my-2">
          <div className="flex gap-2">
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
                // navigate(`${rootFolder}/create-supplier`)
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
              action={["detail"]}
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
                  case "status":
                    dbField = "pm.status";
                    break;
                  case "supplier_code":
                    dbField = "sl.supplier_code";
                    break;
                  case "supplier_name":
                    dbField = "sl.supplier_name";
                    break;
                  case "supplier_phone":
                    dbField = "sl.supplier_phone";
                    break;
                  case "supplier_order_communication":
                    dbField = "sl.supplier_order_communication";
                    break;
                  case "gl_name":
                    dbField = "coa.gl_name";
                    break;
                  default:
                    dbField = "sl.id";
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
            scrollableId={"SupplierList"}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "sl.id DESC"
              )
            }
            loading={isPending}
          />
        </div>
        <Modal
          title="Add Supplier" width={800}
          open={isModalOpen}
          footer={null}
          onCancel={() => {
            setIsModalOpen(false);
          }}
          centered
        >
          <AddSuppliers />
          {/* <Createcompany setIsModalOpen={setIsModalOpen} /> */}
        </Modal>
      </div>
    </>
  );
};

export default withPermissionCheck(SupplierList, "supplier-list");
