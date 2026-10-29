import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
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
import AddCategory from "./AddCategory";
import { Modal } from "antd";
import UpdateCategory from "./UpdateCategory";
const SelectStatusList = [
  { value: "1", label: "Active" },
  { value: "0", label: "InActive" },
];
const CategoryList = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_CATEGORY_LIST);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_CATEGORY_LIST
  );
  const { mutate: postPermission } = useGlobelApi(
    API_ENDPOINTS.UPDATE_CATEGORY_LIST
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
  const [categorylist, setCategoryList] = useState(null);
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderBy = "pc.id DESC") => {
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

    const limitedData = data.slice(0, 1000);

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "prodct-category.xlsx");
  };

  const fields = [
    {
      // fieldQueryKey: "ump.description",
      name: "pc.description",
      label: "Main Category",
      type: "textServer",
      labelKey: "main_category",
      ValueKey: "main_category",
      endpoint: `${API_ENDPOINTS.GET_CATEGORY_LIST}`,
      responseWhich: "data",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      aliases: "pc.",
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
        description: row?.main_category,
        parent_id: row?.parent_id || "",
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
      key: "main_category",
      label: "Sub Category ",
      width: 350,
      sortable: true,
      filter: true,
      render: (value, row) => {
        return <span className="">
          {
            (row?.category_name ? row?.category_name + " > " : "") + row?.main_category
          }
        </span>

      }
    },
    {
      key: "status",
      label: "status ",
      width: 150,
      sortable: false,
      filter: true,
      render: (value, row) => (
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
    if (action === "edit") {
      if (selectedIds?.[0]) {
        const selectedData = selectedIds?.[0];
        setCategoryList(selectedData);
        setEditModals(true);
      }
    }
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
        <h1 className="mb-2 text-size text-color font-headingweight">Category List</h1>

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
              handleClick={
                () => setIsModalOpen(true)
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
        <div className="">
        </div>
        <ResizableTable
          data={apiData || []}
          columns={fieldsMapping}
          isDense={isDense}
          height="300px"
          onSort={(key, direction) => {
            if (useServerSorting) {
              let dbField;
              switch (key) {
                case "main_category":
                  dbField = "pc.description";
                  break;
                case "status":
                  dbField = "pc.status";
                  break;
                default:
                  dbField = "pc.id";
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
          scrollableId={"CategoryList"}
          enableScroll={true}
          disableInternalSort={useServerSorting}
          onLoadMore={() =>
            handleFetchdata(
              appliedFilters,
              false,
              useServerSorting ? `${sortField} ${sortDirection}` : "pc.id DESC"
            )
          }
          loading={isPending}
        />
        <Modal
          title="Add Category"
          open={isModalOpen}
          footer={null}
          onCancel={() => {
            setIsModalOpen(false);
          }}
          centered
        >
          <AddCategory />
        </Modal>
        <Modal
          title="Update Unit Master"
          open={editModals}
          footer={null}
          onCancel={() => setEditModals(false)}
          centered
          key={categorylist?.record_id || 'modal'} // Add this line
        >
          <UpdateCategory categories={categorylist} handleFetchdata={handleFetchdata} />

        </Modal>
      </div>
    </>
  );
};

export default withPermissionCheck(CategoryList, "categories");
