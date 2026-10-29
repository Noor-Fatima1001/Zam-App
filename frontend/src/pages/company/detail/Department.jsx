import React, { useEffect, useState } from "react";
import { FaFileExport, FaEdit, FaSave } from "react-icons/fa";
import { MdRefresh, MdCancel } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../../apis/client/api-endpoints";
import { useGlobelApi } from "../../../apis/useProduct/useCommon";
import Loader from "../../../components/Loader";
import CustomButton from "../../../components/button/CustomButton";
import DynamicFilter from "../../../components/form-elements/DynamicFilter";
import { getFromLocalStorage } from "../../../config/crypto-file";
import InfiniteScroll from "react-infinite-scroll-component";
import withPermissionCheck from "../../../config/withPermissionCheck";
import ResizableTable from "../../../components/table/ResizableTable";
import AntdSelectFieldTable from "../../../AntdSelectFieldTable";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import InputField from "../../../components/form-elements/InputField";

const Department = ({ CompanyData }) => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.COM_TO_DEPARTMENT);
  const { mutate: fetchDataForExcel } = useGlobelApi(API_ENDPOINTS.COM_TO_DEPARTMENT);
  const { mutate: AssignDept, isLoading: AssignLoading } = useGlobelApi(API_ENDPOINTS.ASSIGN_DEPARTMENT_TO_COMPANY);
  const { mutate: UpdateAssignCompany, isLoading: UpdateAssignLoading } = useGlobelApi(API_ENDPOINTS.UPDATE_DEPT_TO_COMPANY);
  const UserId = getFromLocalStorage("UserId");
  const [companyData, setCompanyData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [sortField, setSortField] = useState("d.id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null); // Track the row being edited
  const [appliedFilters, setAppliedFilters] = useState(null);
  const limit = 10;
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
    getValues,
    setValue,
  } = useForm();

  const handleFetchdata = (filter, reset = false, orderBy = "d.id DESC") => {
    const baseFilters = [
      {
        key: "company_id",
        operator: "equal",
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
          const newData = data?.result || [];
          if (reset) {
            setCompanyData(newData);
          } else {
            setCompanyData((prevUsers) => [...prevUsers, ...newData]);
          }
          setTotalRecords(newData?.[0]?.totalRecords || 0);
          setHasMore(offset + limit < (newData?.[0]?.totalRecords || 0));
          setOffset((prevOffset) => prevOffset + limit);
        },
        onError: (error) => {
          console.error("Error fetching ", error);
        },
      }
    );
  };

  const handleFetchExcelData = (filter) => {
    return new Promise((resolve, reject) => {
      const baseFilters = [
        {
          key: "company_id",
          operator: "equal",
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
    const formattedData = data.map((item) => ({
      ...item,
      updated_at: dayjs(item.updated_at).format("DD-MM-YYYY"),
      created_at: dayjs(item.created_at).format("DD-MM-YYYY"),
    }));
    const limitedData = formattedData.slice(0, 1000);
    const worksheet = XLSX.utils.json_to_sheet(limitedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "department.xlsx");
  };

  const fields = [
    {
      name: "dept_name",
      label: "Department Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_DEPARTMENT}`,
      responseWhich: "data",
    },
    { name: "email_to", label: "Email", type: "text" },
    { name: "person_contact", label: "Contact", type: "text" },
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

  const handleEditRow = (row) => {
    if (editingRowId || companyData.some((r) => r.isEditable)) {
      toast.warning("Please save or cancel the current operation before editing a new row.")
      // Swal.fire({
      //   icon: "warning",
      //   title: "Warning",
      //   text: "Please save or cancel the current operation before editing another row.",
      // });
      return;
    }

    setEditingRowId(row.record_id);
    setCompanyData(
      companyData.map((r) =>
        r.record_id === row.record_id ? { ...r, isEditing: true } : r
      )
    );
    setValue(`dept_name_${row.record_id}`, {
      label: row.dept_name,
      value: row.dept_id,
    });
    setValue(`email_to_${row.record_id}`, row.email_to);
    setValue(`person_contact_${row.record_id}`, row.person_contact);
  };

  const handleSaveEditRow = (record_id) => {
    const dept_name = getValues(`dept_name_${record_id}`)?.value || getValues(`dept_name_${record_id}`);
    const email_to = getValues(`email_to_${record_id}`);
    const person_contact = getValues(`person_contact_${record_id}`);

    if (!dept_name || !email_to || !person_contact) {
      toast.error("Please fill in all required fields.")
      // Swal.fire({
      //   icon: "error",
      //   title: "Error",
      //   text: "Please fill in all required fields.",
      // });
      return;
    }

    const body = {
      record_id,
      dataUpdate: {
        "status": "1",
        // dept_id: parseInt(dept_name),
        // company_id: CompanyData?.record_id,
        email_to,
        person_contact,
      },
      changed_by: UserId,
    };

    UpdateAssignCompany(body, {
      onSuccess: (res) => {
        reset();
        if (res.success) {
          setEditingRowId(null);
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

  const handleCancelEdit = (record_id) => {
    setEditingRowId(null);
    setCompanyData(
      companyData.map((row) =>
        row.record_id === record_id ? { ...row, isEditing: false } : row
      )
    );
    reset({
      [`dept_name_${record_id}`]: undefined,
      [`email_to_${record_id}`]: "",
      [`person_contact_${record_id}`]: "",
    });
  };

  const handleDeleteRow = () => {
    const isRowAlreadyAdded = companyData.some((row) => row?.isEditable);
    if (isRowAlreadyAdded) {
      const newApiData = companyData.filter((row) => !row?.isEditable);
      setCompanyData(newApiData);
      reset({
        dept_name: undefined,
        email_to: "",
        person_contact: "",
      });
    }
  };

  const handleSaveRow = async () => {
    const dept_name = getValues("dept_name")?.value || getValues("dept_name");
    const email_to = getValues("email_to");
    const person_contact = getValues("person_contact");

    if (!dept_name || !email_to || !person_contact) {
      toast.error("Please fill in all required fields.")
      // Swal.fire({
      //   icon: "error",
      //   title: "Error",
      //   text: "Please fill in all required fields.",
      // });
      return;
    }

    const body = {
      dataInsert: {
        dept_id: parseInt(dept_name),
        company_id: CompanyData?.record_id,
        email_to,
        person_contact,
        created_by: UserId, 
      },
    };
    AssignDept(body, {
      onSuccess: (res) => {
        if (res.success) {
          reset();
          toast.success(res?.result || "Something went wrong")
          // Swal.fire({
          //   icon: "success",
          //   title: "Success",
          //   text: res?.result,
          // });
          setOffset(0);
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

  const handlePermissionChange = async (row, status) => {
    const body = {
      record_id: row?.record_id,
      dataUpdate: {
        status: status ? 1 : 0,
         person_contact:row?.person_contact,
        email_to:row?.email_to
      },
      changed_by: UserId,
    };
    UpdateAssignCompany(body, {
      onSuccess: (res) => {
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

  const handleAddRow = () => {
    if (editingRowId || companyData.some((row) => row.isEditable)) {
      toast.error("Please save or cancel the current operation before adding a new row.")
      // Swal.fire({
      //   icon: "warning",
      //   title: "Warning",
      //   text: "Please save or cancel the current operation before adding a new row.",
      // });
      return;
    }

    const newRow = {
      isEditable: true,
      dept_name: (
        <AntdSelectFieldTable
          control={control}
          name="dept_name"
          endpoint={API_ENDPOINTS.GET_DEPARTMENT}
          responseWhich="data"
          queryKey="dept_name"
          valueKey="record_id"
          labelKey="dept_name"
          placeholder="Select Department Name"
          rules={{ required: "Department Name is required" }}
          error={errors.dept_name?.message}
        />
      ),
      person_contact: (
        <InputField
          placeholder="Enter Contact"
          register={register("person_contact", {
            required: "Contact is required",
          })}
          error={errors.person_contact?.message}
        />
      ),
      email_to: (
        <InputField
          placeholder="Enter Supplier Order Communication"
          register={register("email_to", {
            required: "Email is required",
          })}
          error={errors.email_to?.message}
        />
      ),
      status: undefined,
    };

    setCompanyData([newRow, ...companyData]);
  };

  const handlePermissionToggle = (row) => {
    const updatedStatus = !row.status;
    handlePermissionChange(row, updatedStatus);
  };

  const fieldsMapping = [
    {
      key: "action",
      label: "Action",
      width: 100,
      render: (value, row) =>
        row.isEditing ? (
          <div className="flex gap-2 justify-content-center">
            <FaSave
              size={18}
              className="text-customBlue"
              title="Save"
              onClick={() => handleSaveEditRow(row.record_id)}
            />
            <MdCancel

              size={18}
              title="Cancel"
              className="text-customBlue"
              onClick={() => handleCancelEdit(row.record_id)}
            />
          </div>
        ) : row.isEditable ? null : (
          <div className="d-flex justify-content-center" >
            <FaEdit
              size={18}
              title="Edit"
              className="text-customBlue"
              onClick={() => handleEditRow(row)}
            />
          </div>
        ),
    },
    {
      key: "dept_name",
      label: "Name",
      width: 300,
      sortable: true,
      filterable: true,
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_DEPARTMENT}`,
      responseWhich: "data",
      queryKey: "dept_name",
      valueKey: "record_id",
      labelKey: "dept_name",
    },
    {
      key: "email_to",
      label: "Email",
      width: 300,
      sortable: true,
      filterable: true,
      render: (value, row) =>
        row.isEditing ? (
          <InputField
            placeholder="Enter Supplier Order Communication"
            register={register(`email_to_${row.record_id}`, {
              required: "Email is required",
            })}
            error={errors[`email_to_${row.record_id}`]?.message}
            defaultValue={value}
          />
        ) : row.isEditable ? (
          <InputField
            placeholder="Enter Supplier Order Communication"
            register={register("email_to", {
              required: "Email is required",
            })}
            error={errors.email_to?.message}
          />
        ) : (
          <span>{value || "N/A"}</span>
        ),
    },
    {
      key: "person_contact",
      label: "Contact",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value, row) =>
        row.isEditing ? (
          <InputField
            placeholder="Enter Contact"
            register={register(`person_contact_${row.record_id}`, {
              required: "Contact is required",
            })}
            error={errors[`person_contact_${row.record_id}`]?.message}
            defaultValue={value}
          />
        ) : row.isEditable ? (
          <InputField
            placeholder="Enter Contact"
            register={register("person_contact", {
              required: "Contact is required",
            })}
            error={errors.person_contact?.message}
          />
        ) : (
          <span>{value || "N/A"}</span>
        ),
    },
    {
      key: "dept_code",
      label: "Code",
      width: 200,
      sortable: true,
      filterable: true,
      disabled: true,
    },
    {
      key: "status",
      label: "Status",
      width: 200,
      render: (value, row) =>
        value === undefined ? (
          "Autogenerated"
        ) : (
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
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              handleClick={exportToExcel}
              addclass="gap-1"
            />
            <CustomButton btntext={"Add New"} handleClick={() => handleAddRow()} />
            {companyData?.some((row) => row.isEditable) ? (
              <>
                <CustomButton btntext={"Save"} handleClick={() => handleSaveRow()} />
                <CustomButton btntext={"Cancel"} handleClick={() => handleDeleteRow()} />
              </>
            ) : null}
            {/* {companyData?.[0]?.isEditable ? (
              <CustomButton
                btntext={"Cancel"}
                handleClick={() => handleDeleteRow()}
              />
            ) : null} */}
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
              </label>
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
                  case "dept_name":
                    dbField = "d.dept_name";
                    break;
                  case "dept_code":
                    dbField = "d.dept_code";
                    break;
                  default:
                    dbField = "utd.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"Department"}
            isSelect={false}
            hasMore={hasMore}
            onFilter={(filters) => console.log("Filters:", filters)}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "d.id DESC"
              )
            }
            loading={isPending || AssignLoading || UpdateAssignLoading}
          />
        </div>
      </div>
    </>
  );
};

export default withPermissionCheck(Department, "company-department");