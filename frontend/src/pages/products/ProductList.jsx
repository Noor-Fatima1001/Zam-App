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
import moment from "moment";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import ResizableTable from "../../components/table/ResizableTable";
import { Modal } from "antd";
import AddProduct from "./AddProduct";
const SelectStatusList = [
  { value: "1", label: "Active" },
  { value: "0", label: "InActive" },
];

const ProductList = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_PRODUCT_LIST);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_PRODUCT_LIST
  );
  const { mutate: postPermission } = useGlobelApi(
    API_ENDPOINTS.UPDATE_PRODUCT_LIST
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
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderBy = "pm.id DESC") => {
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

    const limitedData = data.slice(0, 1000);

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "product.xlsx");
  };

  const fields = [
    {
      name: "pm.product_name",
      label: "product name",
      type: "textServer",
      labelKey: "product_name",
      ValueKey: "product_name",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    {
      name: "pcp.description",
      label: "Main category ",
      type: "textServer",
      labelKey: "main_category",
      ValueKey: "main_category",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    {
      name: "pc.description",
      label: "Sub category ",
      type: "textServer",
      labelKey: "sub_category",
      ValueKey: "sub_category",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    {
      name: "pm.product_code",
      label: "product code",
      type: "textServer",
      labelKey: "product_code",
      ValueKey: "product_code",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      aliases: "pm.",
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
  const handlePermissionChange = async (row, updatedPermission) => {
    console.log("🚀 ~ handlePermissionChange ~ row:", row);
    const body = {
      dataUpdate: {
        record_id: row.record_id,
        product_code: row?.product_code || "",
        product_name: row?.product_name || "",
        product_category_id: row?.product_category_id || "",
        base_unit_id: row?.base_unit_id || "",
        status: updatedPermission ? 1 : 0,
        changed_by: UserId,
      },
    };
    try {
      postPermission(body, {
        onSuccess: (data) => {
          if (data.success) {
            toast.success(data?.data)
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: data?.data,
            // });
          } else {
            toast.error(data?.data)
            // Swal.fire({
            //   icon: "error",
            //   title: "Error",
            //   text: data?.data,
            // });
            setModuleData((prevData) =>
              prevData.map((item) =>
                item.record_id === row.record_id
                  ? { ...item, status: !updatedPermission }
                  : item
              )
            );
          }
        },
        onError: (error) => {
          toast.error("Something went wrong")
          // Swal.fire({
          //   title: "Error",
          //   text: "Something went wrong",
          //   icon: "error",
          // });
          setModuleData((prevData) =>
            prevData.map((item) =>
              item.record_id === row.record_id
                ? { ...item, status: !updatedPermission }
                : item
            )
          );
        },
      });
    } catch (error) {
      setModuleData((prevData) =>
        prevData.map((item) =>
          item.record_id === row.record_id
            ? { ...item, status: !updatedPermission }
            : item
        )
      );
    }
  };

  const handlePermissionToggle = (row) => {
    const updatedPermission = !row.status;
    setModuleData((prevData) =>
      prevData.map((item) =>
        item.record_id === row.record_id
          ? { ...item, status: updatedPermission }
          : item
      )
    );
    handlePermissionChange(row, updatedPermission);
  };

  const fieldsMapping = [
    {
      key: "product_name", label: " Name", width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "main_category",
      label: "Main Category",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "product_type",
      label: "Product Type",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "sub_category",
      label: "Sub Category",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "base_unit",
      label: "Unit List",
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: "product_code",
      label: "Product Code",
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: "status",
      label: "status ",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value, row) => {
        return <div className="pt-2">
          <label className="switch">
            <input
              type="checkbox"
              checked={row?.status}
              onChange={() => handlePermissionToggle(row)}
            />
            <span className="slider"></span>
          </label>
        </div>
      }

      // renderCell: (row) => (
      //   <div className="pt-2">
      //     <label className="switch">
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
    if (action === "edit") {
      saveToSessionStorage("productData", selectedIds?.[0]);
      navigate(`${rootFolder}/product-detail`);
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
        <h1 className="mb-2 text-size text-color font-headingweight">Product List</h1>

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
                // navigate(`${rootFolder}/add-product`)
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
                  case "status":
                    dbField = "pm.status";
                    break;
                  case "product_code":
                    dbField = "pm.product_code";
                    break;
                  case "base_unit":
                    dbField = "ump.description";
                    break;
                  case "sub_category":
                    dbField = "pc.description";
                    break;
                  case "main_category":
                    dbField = "pcp.description";
                    break;
                  case "product_name":
                    dbField = "pm.product_name";
                    break;
                  default:
                    dbField = "pm.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"ProductList"}
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
        </div>

        <Modal
          title="Add Product"
          open={isModalOpen}
          footer={null}
          onCancel={() => {
            setIsModalOpen(false);
          }}
          centered
        >
          <AddProduct />
          {/* <Createcompany setIsModalOpen={setIsModalOpen} /> */}
        </Modal>

        {/* </InfiniteScroll> */}
      </div>
    </>
  );
};

export default withPermissionCheck(ProductList, "product-list");
