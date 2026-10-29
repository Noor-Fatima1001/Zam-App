import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../../../apis/client/api-endpoints";
import { useGlobelApi } from "../../../apis/useProduct/useCommon";
import { useGetUserCompany } from "../../../apis/useProduct/useUser";
import CustomButton from "../../../components/button/CustomButton";
import DynamicFilter from "../../../components/form-elements/DynamicFilter";
import { getFromLocalStorage } from "../../../config/crypto-file";
import withPermissionCheck from "../../../config/withPermissionCheck";
import ResizableTable from "../../../components/table/ResizableTable";
import { useForm } from "react-hook-form";
import AntdSelectFieldTable from "../../../AntdSelectFieldTable";
import PropTypes from "prop-types";
const UserToCompanyListing = ({ UserData }) => {
  console.log("🚀 ~ UserToCompanyListing ~ UserData:", UserData);
  const { mutate, isPending: userLoading } = useGetUserCompany();
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.USER_TO_COMPANY
  );
  const {
    control,
    formState: { errors },
    getValues,
    reset,
  } = useForm({})
  const { mutate: AssignCompany } = useGlobelApi(
    API_ENDPOINTS.ASSIGN_USER_TO_COMPANY
  );
  const { mutate: UpdateAssignCompany } =
    useGlobelApi(API_ENDPOINTS.UPDATE_USER_TO_COMPANY);
  const UserId = getFromLocalStorage("UserId");

  const [moduleData, setModuleData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [isDense, setIsDense] = useState(true);
  const limit = 10;
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("user_id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const handleFetchdata = async (filter, reset = false, orderBy = "auc.user_id") => {
    const baseFilters = [
      {
        key: "auc.user_id",
        operator: "equal",
        value1: UserData?.record_id,
        logical: "",
      },
    ];
    const filters = filter ? [...baseFilters, ...filter] : baseFilters;

    const body = {
      filters: filters,
      limit,
      offset: reset ? 0 : offset,
      orderby: orderBy
    };
    mutate(body, {
      onSuccess: (data) => {
        const newUsers = data?.result || [];
        const total = newUsers?.[0]?.totalRecords || 0;

        if (reset) {
          setModuleData(newUsers);
          setOffset(limit);
        } else {
          setModuleData((prevUsers) => [...prevUsers, ...newUsers]);
          setOffset((prevOffset) => prevOffset + limit);
        }
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
      const baseFilters = [
        {
          key: "auc.user_id",
          operator: "equal",
          value1: UserData?.record_id,
          logical: "",
        },
      ];
      const filters = filter ? [...baseFilters, ...filter] : baseFilters;
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

  const handleSaveRow = async (data) => {
    console.log("🚀 ~ saveNewRows ~ newRows:", data);
    const company_name = getValues("company_name").value;
    const body = {
      dataInsert: {
        user_id: UserData?.record_id,
        company_id: parseInt(company_name),
        created_by: UserId,
      },
    };
    AssignCompany(body, {
      onSuccess: (res) => {
        reset();
        if (res.success) {
          toast.success(res?.result)
          setOffset(0);
          handleFetchdata(null, true);
        } else {
          toast.error(res?.result ||"Something went wrong")
        }
      },
      onError: (error) => {
        console.log(error);
        toast.error(error)
      },
    });
  };

  const fields = [
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
    UpdateAssignCompany(body, {
      onSuccess: (res) => {
        console.log("success edit time", res);
        if (res.success) {
          toast.success(res?.result)
          setOffset(0);
          setHasMore(true);
          handleFetchdata(appliedFilters, true);
        } else {
          toast.error(res?.result ||"Something went wrong")
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
      company_name: (
        <AntdSelectFieldTable
          control={control}
          name="company_name"
          endpoint={API_ENDPOINTS.GET_COMPANY}
          queryKey="company_name"
          valueKey="record_id"
          labelKey="company_name"
          responseWhich="data"
          rules={{ required: "Company is required." }}
          error={errors.company_name}
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
      key: "company_name",
      label: "Company Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_COMPANY}`,
      responseWhich: "data",
      queryKey: "company_name",
      valueKey: "record_id",
      labelKey: "company_name",
      width: 400,
      filterable: true,
      sortable: true
    },
    {
      key: "status",
      label: "status",
      width: 200,
      render: (value, row) => (
        value == undefined ? "Autogenerated" :
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
          </div >
          <div className="flex flex-wrap gap-2 mx-2" >

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
                // onSubmit={handleSubmit(onSubmit)}
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
        <div>
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
                  case "company_name":
                    dbField = "c.company_name";
                    break;

                  default:
                    dbField = "auc.user_id";
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
                useServerSorting ? `${sortField} ${sortDirection}` : "auc.user_id DESC"
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

UserToCompanyListing.propTypes ={
  UserData:{
    record_id:PropTypes.number
  }
}

export default withPermissionCheck(UserToCompanyListing, "user-companies");
