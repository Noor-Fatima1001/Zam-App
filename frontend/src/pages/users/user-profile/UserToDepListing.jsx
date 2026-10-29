import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../../../apis/client/api-endpoints";
import { useGlobelApi } from "../../../apis/useProduct/useCommon";
import CustomButton from "../../../components/button/CustomButton";
import DynamicFilter from "../../../components/form-elements/DynamicFilter";
import { getFromLocalStorage } from "../../../config/crypto-file";
import withPermissionCheck from "../../../config/withPermissionCheck";
import ResizableTable from "../../../components/table/ResizableTable";
import { useForm } from "react-hook-form";
import AntdSelectFieldTable from "../../../AntdSelectFieldTable";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
const UserToDepListing = ({ UserData }) => {
  const { mutate, isPending: userLoading } = useGlobelApi(
    API_ENDPOINTS.USER_TO_DEPARTMENT
  );

  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.USER_TO_DEPARTMENT
  );
  const { mutate: AssignDepartment } = useGlobelApi(
    API_ENDPOINTS.ASSIGN_USER_TO_DEPARTMENT
  );
  const { mutate: UpdateAssignDepartment } =
    useGlobelApi(API_ENDPOINTS.USER_USER_TO_DEPARTMENT);
  const UserId = getFromLocalStorage("UserId");
  const [moduleData, setModuleData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [isDense, setIsDense] = useState(true);
  const { control, errors, getValues } = useForm();
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("user_id");
  const [sortDirection, setSortDirection] = useState("DESC");

  const handleFetchdata = async (filter, reset = false, orderbyString = "user_id") => {
    const baseFilter = [
      {
        key: "user_id",
        operator: "equal",
        value1: UserData?.record_id,
        logical: "",
      },
    ];
    const filters = filter ? [...baseFilter, ...filter] : baseFilter;
    const body = {
      filters: filters,
      limit,
      offset: reset ? 0 : offset,
      orderby: orderbyString
    };
    mutate(body, {
      onSuccess: (data) => {
        const newUsers = data?.result || [];
        if (reset) {
          setModuleData(newUsers);
        } else {
          setModuleData((prevUsers) => [...prevUsers, ...newUsers]);
        }
        setHasMore(offset + limit < (newUsers?.[0]?.totalRecords || 0));
        setOffset((prevOffset) => prevOffset + limit);
      },
      onError: (error) => {
        console.error("Error fetching users:", error);
      },
    });
  };
  const handleFetchExcelData = (filter) => {
    return new Promise((resolve, reject) => {
      const baseFilter = [
        {
          key: "adu.user_id",
          operator: "equal",
          value1: `${UserData?.record_id}`,
          logical: "",
        },
      ];
      const filters = filter ? [...baseFilter, ...filter] : baseFilter;

      fetchDataForExcel(
        {
          filters: filters,
          limit: 0,
          offset: 0,
        },
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

  const fields = [
    {
      name: "dept_name",
      label: "Department name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_DEPARTMENT}`,
      responseWhich: "data",
    },
    {
      name: "company_name",
      label: "Company Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_COMPANY}`,
      responseWhich: "data",
    },
  ];

  const handleApplyFilters = (data) => {
    console.log("Filter Values:", data);
    setOffset(0);
    handleFetchdata(data, true);
    setAppliedFilters(data);
    handleFetchExcelData(data);
  };

  const handleResetFilters = () => {
    console.log("Filters Reset");
    setOffset(0); 
    setAppliedFilters(null);
    handleFetchdata(null, true);
    handleFetchExcelData(null);
  };
  const handlePermissionChange = async (row, status) => {
    console.log("🚀 ~ handlePermissionChange ~ row:", row);
    console.log("🚀 ~ handlePermissionChange ~ status:", status);
    const body = {
      record_id: row?.record_id,
      dataUpdate: {
        status: status ? 1 : 0,
      },
      changed_by: UserId,
    };
    UpdateAssignDepartment(body, {
      onSuccess: (res) => {
        console.log("success edit time", res);
        if (res.success) {
          toast.success(res?.result)
          setOffset(0); 
          handleFetchdata(appliedFilters, true);
        } else {
          toast.error(res?.result || "Something went wrong")
        }
      },
      onError: (error) => {
        console.log(error);
        toast.error("Something went wrong")
      },
    });
  };
  const handleAddRow = () => {
    const isRowAlreadyAdded = moduleData.some(row => row?.isEditable);
    if (isRowAlreadyAdded) return;
    const newRow = {
      isEditable: true,
      dept_name: (
        <AntdSelectFieldTable
          control={control}
          name="dept_name"
          endpoint={API_ENDPOINTS.COM_TO_DEPARTMENT}
          queryKey="dept_name"
          ContcatenateLabel={"company_name"}
          valueKey="record_id"
          labelKey="dept_name"
          responseWhich="result"
          rules={{ required: "Department is required." }}
          error={errors?.dept_name}
        />
      ),
      status: undefined

    };

    setModuleData([newRow, ...moduleData]);
  };
  const handleDeleteRow = () => {
    const isRowAlreadyAdded = moduleData.some(row => row?.isEditable);
    if (isRowAlreadyAdded) {

      const newApiData = moduleData.filter(row => !row?.isEditable);
      setModuleData(newApiData);
    }
  }; 
  const fieldsMapping = [
    {
      key: "dept_name",
      label: "Department Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.COM_TO_DEPARTMENT}`,
      responseWhich: "result",
      queryKey: "dept_name",
      valueKey: "record_id",
      valueConcatenateWithLabel: "company_code",
      labelKey: "dept_name",
      width: 400,
      sortable: true,
      filterable: true
    },
    {
      key: "company_name",
      label: "Company Name",
      width: 400,
      sortable: true,
      filterable: true
    },
    {
      key: "status",
      label: "status",
      width: 200,
      render: (value, row) => (
        value==undefined?"Autogenerated":
        <label className="switch">
          <input
            type="checkbox"
            checked={row.status}
            onChange={() => handlePermissionToggle(row)}
          />
          <span className="slider"></span>
        </label>
      ),
      disabled: true,

    },
  ];
  const handlePermissionToggle = (row) => {
    const updatedstatus = !row.status;
    handlePermissionChange(row, updatedstatus);
  };
  const handleSaveRow = async (data) => {
    console.log("🚀 ~ saveNewRows ~ newRows:", data);
    const dept_name = getValues("dept_name").value;

    const body = {
      dataInsert: {
        user_id: UserData?.record_id.toString(),
        com_dept_id: parseInt(dept_name),
        created_by: UserId,
      },
    };
    AssignDepartment(body, {
      onSuccess: (res) => {
        if (res.success) {
          toast.success(res?.result)
          setOffset(0); 
          handleFetchdata(null, true);
        } else {
          toast.error(res?.result || "Something went wrong")
        }
      },
      onError: (error) => {
        console.log(error);
        toast.error("Something went wrong")
      },
    });
  };

  useEffect(() => {
    handleFetchdata();
  }, []);
  return (
    <>
      <div>
        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center my-2" >
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
          <div className="flex flex-wrap gap-2 " >
            <CustomButton
              btntext={"Add New"}
              handleClick={() =>
                handleAddRow()
              }
            />
            {
              moduleData?.[0]?.isEditable ?
                <CustomButton
                  btntext={"Save"}
                  handleClick={() =>
                    handleSaveRow()
                  }
                />
                : null
            }
            {
              moduleData?.[0]?.isEditable ?
                <CustomButton
                  btntext={"Cancel"}
                  handleClick={() =>
                    handleDeleteRow()
                  }
                />
                : null
            }
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
        <ResizableTable
          data={moduleData || []}
          columns={fieldsMapping}
          isDense={isDense}
          height="300px"
          onFilter={(filters) => console.log("Filters:", filters)}
          defaultSort={{ key: "company_code", direction: "asc" }}
          onSort={(key, direction) => {
            if (useServerSorting) {
              let dbField;
              switch (key) {
                case "dept_name":
                  dbField = "d.dept_name";
                  break;
                case "company_name":
                  dbField = "c.company_name";
                  break;
                default:
                  dbField = "user_id";
              }
              setSortField(dbField);
              setSortDirection(direction.toUpperCase());
              const orderbyString = `${dbField} ${direction.toUpperCase()}`;
              setOffset(0);
              handleFetchdata(appliedFilters, true, orderbyString);
            }
          }}
          hasMore={hasMore}
          scrollableId={"companieslist"}
          enableScroll={true}
          onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "c.id DESC"
              )
          }
          loading={userLoading}
          isSelect={false}
        />
      </div>
    </>
  );
};

UserToDepListing.propTypes ={
  UserData:{
    record_id:PropTypes.number
  }
}

export default withPermissionCheck(UserToDepListing, "user-departments");
