import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import AntdSelectFieldTable from "../../../AntdSelectFieldTable";
import { API_ENDPOINTS } from "../../../apis/client/api-endpoints";
import { useGlobelApi } from "../../../apis/useProduct/useCommon";
import CustomButton from "../../../components/button/CustomButton";
import DynamicFilter from "../../../components/form-elements/DynamicFilter";
import ResizableTable from "../../../components/table/ResizableTable";
import { getFromLocalStorage } from "../../../config/crypto-file";
import withPermissionCheck from "../../../config/withPermissionCheck";
import dayjs from "dayjs";
const Companies = ({ CompanyData }) => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.USER_TO_COMPANY);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.USER_TO_COMPANY
  );
  const { mutate: AssignCompany, isLoading: AssignLoading } = useGlobelApi(
    API_ENDPOINTS.ASSIGN_USER_TO_COMPANY
  );
  const { mutate: UpdateAssignCompany, isLoading: UpdateAssignLoading } =
    useGlobelApi(API_ENDPOINTS.UPDATE_USER_TO_COMPANY);

  const UserId = getFromLocalStorage("UserId");
  const [companyData, setCompanyData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortField, setSortField] = useState("u.id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [rowsData, setRowsData] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const limit = 10;
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
    getValues,
    setValue
  } = useForm();
  const navigate = useNavigate();
  const handleFetchdata = (filter, reset = false,orderBy="u.id DESC") => {
    const baseFilters = [
      {
        key: "company_id",
        operator: "contains",
        value1: CompanyData?.record_id,
        logical: "",
      },
    ];
    const filters = filter ? [...baseFilters, ...filter] : baseFilters;
    mutate(
      {
        filters: filters,
        limit,
        offset: reset ? 0 : offset,
        orderby: orderBy,
      },
      {
        onSuccess: (data) => {
          const newUsers = data?.result || [];
          if (reset) {
            setCompanyData(newUsers);
          } else {
            setCompanyData((prevUsers) => [...prevUsers, ...newUsers]);
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

  const handleAddRow = () => {
    // Check if an editable row already exists
    const isRowAlreadyAdded = companyData.some(row => row?.isEditable);
    if (isRowAlreadyAdded) return;
    const newRow = {
      isEditable: true,
      assigned_user_name: (
        <AntdSelectFieldTable
          control={control}
          name="user_name"
          endpoint={API_ENDPOINTS.USERS}
          defaultValue={null}
          responseWhich="result"
          queryKey="user_name"
          valueKey="record_id"
          labelKey="user_name"
          placeholder="Select User Name"
        />
      ),
      status: undefined
    };

    setCompanyData([newRow, ...companyData]);
  };
  const handleDeleteRow = () => {
    const isRowAlreadyAdded = companyData.some(row => row?.isEditable);
    if (isRowAlreadyAdded) {
      // Filter out the editable row (newly added row)
      const newApiData = companyData.filter(row => !row?.isEditable);
      setCompanyData(newApiData);
    }
  };
  const handleFetchExcelData = (filter) => {
    return new Promise((resolve, reject) => {
      const baseFilters = [
        {
          key: "company_id",
          operator: "contains",
          value1: CompanyData?.record_id,
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
  const exportToExcel = async () => {
    const data = await handleFetchExcelData(appliedFilters);
    // Format both  fields using dayjs
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
    XLSX.writeFile(workbook, "user-company.xlsx");
  };
  const handleSaveRow = async (newRows) => {
    console.log("🚀 ~ saveNewRows ~ newRows:", newRows);
    const user_name = getValues("user_name").value;
    const body = {
      dataInsert: {
        user_id: parseInt(user_name),
        company_id: CompanyData?.record_id,
        created_by: UserId,
      },
    };
    AssignCompany(body, {
      onSuccess: (res) => {
        reset();
        if (res.success) {
          toast.success(res?.result)
          // Swal.fire({
          //   icon: "success",
          //   title: "Success",
          //   text: res?.result,
          // });
          setOffset(0); // Reset offset
          handleFetchdata(null, true);
        } else {
          toast.error(res?.result || "Something went wrong")
          // Swal.fire({
          //   icon: "error",
          //   title: "Error",
          //   text: res?.result || "Something went wrong",
          // });
        }
      },
      onError: (error) => {
        toast.error("Something went wrong")
        // Swal.fire({
        //   title: "Error",
        //   text: "Something went wrong",
        //   icon: "error",
        // });
      },
    });
  };
  const fields = [
    // { name: "company_name", label: "Company Name", type: "text" },
    {
      name: "user_name",
      label: "User Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.USERS}`,
      responseWhich: "result",
    },
    { name: "first_name", label: "First Name", type: "text" },
    { name: "last_name", label: "Last Name", type: "text" },
  ];

  const handleApplyFilters = (data) => {
    console.log("Filter Values:", data);
    setOffset(0); // Reset offset
    setAppliedFilters(data);
    handleFetchdata(data, true);
    handleFetchExcelData(data);
  };

  const handleResetFilters = () => {
    console.log("Filters Reset");
    setOffset(0); // Reset offset
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
        // reset();
        console.log("success edit time", res);
        if (res.success) {
          toast.success(res?.result)
          // Swal.fire({
          //   icon: "success",
          //   title: "Success",
          //   text: res?.result,
          // });
          handleFetchdata(appliedFilters, true);
        } else {
          toast.error(res?.result || "Something went wrong")
          // Swal.fire({
          //   icon: "error",
          //   title: "Error",
          //   text: res?.result || "Something went wrong",
          // });
        }
      },
      onError: (error) => {
        toast.error("Something went wrong")
        // Swal.fire({
        //   title: "Error",
        //   text: "Something went wrong",
        //   icon: "error",
        // });
      },
    });
  };
  const fieldsMapping = [
    {
      key: "assigned_user_name",
      label: " User Name",
      width: 300,
      sortable: true,
      filterable: true,
    },
    {
      key: "status",
      label: "status",
      width: 200,
      // sortable: true,
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
        <div className="flex justify-between gap-3 my-2">
          <div className="flex flex-wrap gap-2">
            {
              <CustomButton
                btntext={"Export to Excel"}
                icon={<FaFileExport />}
                handleClick={exportToExcel}
                addclass="gap-1"
              />
            }
            <CustomButton
              btntext={"Add New"}
              handleClick={() =>
                handleAddRow()
              }
            />
            {
              companyData?.[0]?.isEditable ?
                <CustomButton
                  btntext={"Save"}
                  handleClick={() =>
                    handleSaveRow()
                  }
                />
                : null
            }
            {
              companyData?.[0]?.isEditable ?
                <CustomButton
                  btntext={"Cancel"}
                  handleClick={() =>
                    handleDeleteRow()
                  }
                />
                : null
            }
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
            {
              <CustomButton
                btntext={<MdRefresh size={18} />}
                addclass={`w-6 rounded-radiusFull max-w-6 min-w-6 h-6 ${isPending && "animate-spin"
                  } `}
                padding="p-0"
                rounded="rounded-full"
                handleClick={() => handleFetchdata(null, true)}
              />
            }

          </div>
        </div>
        <div className="h-80 mb-2.5">

          <ResizableTable
            data={companyData}
            columns={fieldsMapping}
            isDense={isDense}
            height="300px"
            onSort={(key, direction) => {
              if (useServerSorting) {
                let dbField;
                switch (key) {
                  case "user_name":
                    dbField = "u.user_name";
                    break;
                  // case "status":
                  //   dbField = "status";
                  //   break;
                  default:
                    dbField = "auc.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"Companies"}
            isSelect={false}
            onSave={handleSaveRow}
            isSaving={AssignLoading}
            onPermissionChange={handlePermissionToggle}
            hasMore={hasMore}
            onFilter={(filters) =>
               console.log("Filters:", filters)}
            onSelectRow={(selectedData) => setSelectedIds(selectedData)}
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
      </div>
    </>
  );
};

export default withPermissionCheck(Companies, "company-users");
