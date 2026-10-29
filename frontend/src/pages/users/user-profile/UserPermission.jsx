import { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../../apis/client/api-endpoints";
import { useGetAccessUser } from "../../../apis/useProduct/useAccessUser";
import { useGlobelApi } from "../../../apis/useProduct/useCommon";
import CustomButton from "../../../components/button/CustomButton";
import DynamicFilter from "../../../components/form-elements/DynamicFilter";
import withPermissionCheck from "../../../config/withPermissionCheck";
import { MdRefresh } from "react-icons/md";
import ResizableTable from "../../../components/table/ResizableTable";
import dayjs from "dayjs";
import PropTypes from "prop-types";
const UserPermission = ({ UserData }) => {
  const { mutate, isPending: userLoading } = useGetAccessUser();
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.ACCESS_USER_MODULE
  );
  const { mutate: handlePermis_api_handle } = useGlobelApi(
    API_ENDPOINTS.UPDATE_ACCESS_USER_MODULE
  );
  const UserId = UserData?.record_id || "";

  const [moduleData, setModuleData] = useState([]);
  console.log("🚀 ~ UserPermission ~ moduleData:", moduleData);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("u.id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const limit = 10;
  const handleFetchdata = async (
    filter,
    reset = false,
    orderby = "m.id DESC"
  ) => {
    const body = {
      userId: UserId,
      filters: filter || null,
      limit,
      offset: reset ? 0 : offset,
      orderby: orderby,
    };
    mutate(body, {
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
        setHasMore(
          newUsers.length > 0 && (reset ? limit : offset + limit) < total
        );
      },
      onError: (error) => {
        console.error("Error fetching users:", error);
      },
    });
  };

  const handleFetchExcelData = (filter) => {
    return new Promise((resolve, reject) => {
      fetchDataForExcel(
        { userId: UserId, filters: filter || null, limit: 0, offset: 0 },
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
    const formattedData = data.map((item) => ({
      ...item,
      updated_at: dayjs(item.updated_at).format("DD-MM-YYYY"),
      created_at: dayjs(item.created_at).format("DD-MM-YYYY"),
    }));

    const limitedData = formattedData.slice(0, 1000);
    const worksheet = XLSX.utils.json_to_sheet(limitedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "user-permissions.xlsx");
  };
  const fields = [
    {
      name: "sub_module_name",
      label: "Sub Module Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.ACCESS_USER_MODULE}`,
      responseWhich: "result",
      additionalParams: { userId: UserId },
    },
    {
      name: "module_name",
      label: "Module Name",
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
  const handlePermissionChange = async (row, updatedPermission) => {
    const body = {
      record_id: row.record_id,
      dataUpdate: {
        permission: updatedPermission ? 1 : 0,
      },
      changed_by: UserId,
    };
    handlePermis_api_handle(body, {
      onSuccess: () => {
      },
      onError: () => {
        setModuleData((prevData) =>
          prevData.map((item) =>
            item.record_id === row.record_id
              ? { ...item, permission: !updatedPermission }
              : item
          )
        );
      },
    });
  };

  const handlePermissionToggle = (row) => {
    const updatedPermission = !row.permission;
    setModuleData((prevData) =>
      prevData.map((item) =>
        item.record_id === row.record_id
          ? { ...item, permission: updatedPermission }
          : item
      )
    );
    handlePermissionChange(row, updatedPermission);
  };

  const fieldsMapping = [
    {
      key: "sub_module_name",
      label: "Sub Module ",
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: "module_name",
      label: "Module ",
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: "permission",
      label: "permission ",
      filterable: true,
      width: 150,
      sortable: true,
      render: (value, row) => {
        return (
          <div className="pt-2">
            <label className="switch">
              <input
                type="checkbox"
                checked={value}
                onChange={() => handlePermissionToggle(row)}
              />
              <span className="slider"></span>
            </label>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    handleFetchdata();
  }, [UserId]);

  return (
    <>
      <div>
        <div className="mb-2.5">
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex justify-between gap-3 my-2 items-center">
          <div className="  flex flex-wrap gap-2 items-center">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              handleClick={exportToExcel}
              addclass="gap-1"
            />
            <div className=" d-flex align-items-center">
              <label className="me-2 text-color font-regularweight">
                Dense Rows
              </label>
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
              <span className="me-2 text-color font-regularweight">
                server-side sorting
              </span>
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
          <CustomButton
            btntext={<MdRefresh size={18} />}
            addclass={`w-6 rounded-radiusFull max-w-6 min-w-6 h-6 ${
              userLoading && "animate-spin"
            } `}
            padding="p-0"
            rounded="rounded-radiusFull"
            handleClick={() => {
              setOffset(0);
              handleFetchdata(null, true);
            }}
          />
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
                  case "sub_module_name":
                    dbField = "sm.sub_module_name";
                    break;
                  case "module_name":
                    dbField = "m.module_name";
                    break;
                  case "permission":
                    dbField = "permission";
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
            onFilter={(filters) => console.log("Filters:", filters)}
            scrollableId={"UserPermission"}
            hasMore={hasMore}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "m.id DESC"
              )
            }
            loading={userLoading}
            isSelect={false}
          />
        </div>
      </div>
    </>
  );
};


UserPermission.propTypes ={
  UserData:{
    record_id:PropTypes.number
  }
}
export default withPermissionCheck(UserPermission, "user-permissions");
