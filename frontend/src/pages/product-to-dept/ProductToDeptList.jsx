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
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import UpdateProductToDept from "./UpdateProductToDept";
import ResizableTable from "../../components/table/ResizableTable";
const SelectStatusList = [
  { value: "1", label: "Active" },
  { value: "0", label: "InActive" },
];
const ProductToDeptList = ({ productData }) => {
  console.log("🚀 ~ ProductToDeptList ~ productData:", productData)
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.GET_PRODUCT_TO_DEPT_LIST
  );
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_PRODUCT_TO_DEPT_LIST
  );
  const { mutate: postPermission } = useGlobelApi(
    API_ENDPOINTS.UPDATE_PRODUCT_TO_DEPT_LIST
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
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false,orderBy="aptd.id DESC") => {
    console.log("🚀 ~ handleFetchdata ~ filter:", filter);
    const baseFilters = [
      {
        key: "pm.id",
        operator: "equal",
        value1: productData?.record_id,
        logical: "",
      },
    ];
    const filters = filter ? [...baseFilters, ...filter] : baseFilters;
    mutate(
      {
        filters: filters || null,
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
   
      average_price: parseFloat(item.average_price).toFixed(3),
      invoice_tax: parseFloat(item.invoice_tax).toFixed(3),
    }));


    const limitedData = formattedData.slice(0, 1000);

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "assign-product-to-dept.xlsx");
  };

  const fields = [
    {
      // fieldQueryKey: "ump.description",
      name: "pm.product_name",
      label: "Product Name",
      type: "textServer",
      labelKey: "product_name",
      ValueKey: "product_name",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    {
      // fieldQueryKey: "ump.description",
      name: "pm.product_code",
      label: "Product Code",
      type: "textServer",
      labelKey: "product_code",
      ValueKey: "product_code",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    {
      name: "d.dept_name",
      label: "department",
      type: "textServer",
      labelKey: "dept_name",
      ValueKey: "dept_name",
      endpoint: `${API_ENDPOINTS.GET_DEPARTMENT}`,
      responseWhich: "data",
    },

    {
      name: "aptd.status",
      label: "Status",
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
  const handlePermissionChange = async (row, updatedPermission) => {
    console.log("🚀 ~ handlePermissionChange ~ row:", row);
    const body = {
      dataUpdate: {
        record_id: row.record_id,
        product_id: row?.product_id || "",
        comp_dept_id: row?.comp_dept_id || "",
        gl_id: row?.gl_id || "",
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
            setApiData((prevData) =>
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
          setApiData((prevData) =>
            prevData.map((item) =>
              item.record_id === row.record_id
                ? { ...item, status: !updatedPermission }
                : item
            )
          );
        },
      });
    } catch (error) {
      setApiData((prevData) =>
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
    setApiData((prevData) =>
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
      key: "product_name",
      label: "Product Name",
      width: 250,
      sortable: true,
      filterable: true,
      // editable: true,
    },
    { key: "product_code", label: "Product Code", width: 200,      sortable: true,
      filterable: true, },
    {
      key: "company_to_dept",
      label: "Department",
      width: 350,
      sortable: true,
      filterable: true,
      // editable: true,
    },

    {
      field: "status",
      headerName: "status ",
      width: 150,
      sortable: true,
      filterable: true,
      sortable: false,
      render: (value,row) => (
        <div className="pt-2">
          <label className="switch">
            <input
              type="checkbox"
              checked={row?.status}
              onChange={() => handlePermissionToggle(row)}
            />
            <span className="slider"></span>
          </label>
        </div>
      ),
    },
  ];

  const handleActionClick = (action) => {
    if (action === "detail") {
      saveToSessionStorage("productToDeptData", selectedIds?.[0]);
      navigate(`${rootFolder}/product-to-dept-detail`);
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
  }, [navigate]);

  return (
    <>
      <div>
        <h1 className="mb-2 text-size text-color font-headingweight">
          Product to Department List
        </h1>

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
            {/* <CustomButton
              btntext={"Add New"}
              handleClick={() => navigate(`${rootFolder}/add-product-to-dept`)}
            /> */}
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
            data={apiData || []}
            columns={fieldsMapping}
            isDense={isDense}
            height="300px"
            // className="my-4"
            onSort={(key, direction) => {
              if (useServerSorting) {
                let dbField;
                switch (key) {
                  case "product_name":
                    dbField = "pm.product_name";
                    break;
                  case "product_code":
                    dbField = "pm.product_code";
                    break;
                  case "company_to_dept":
                    dbField = "d.dept_name";
                    break;
                  default:
                    dbField = "aptd.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"ProductToDeptList"}
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
                useServerSorting ? `${sortField} ${sortDirection}` : "aptd.id DESC"
              )
            }
            loading={isPending}
          />
        </div>
        {selectedIds?.[0] && (
          <>
            <UpdateProductToDept
              productData={selectedIds?.[0]}
              prodId={productData?.record_id}
            />
          </>
        )}
      </div>
    </>
  );
};

export default withPermissionCheck(ProductToDeptList, "product-to-dept-list");
