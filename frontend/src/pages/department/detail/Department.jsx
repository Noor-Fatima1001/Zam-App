import React, { useEffect, useState } from "react";
import { FaFileExport, FaEdit, FaSave } from "react-icons/fa";
import { MdRefresh, MdCancel } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../../apis/client/api-endpoints";
import { useGlobelApi } from "../../../apis/useProduct/useCommon";
import CustomButton from "../../../components/button/CustomButton";
import DynamicFilter from "../../../components/form-elements/DynamicFilter";
import { getFromLocalStorage } from "../../../config/crypto-file";
import withPermissionCheck from "../../../config/withPermissionCheck";
import ResizableTable from "../../../components/table/ResizableTable";
import AntdSelectFieldTable from "../../../AntdSelectFieldTable";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import InputField from "../../../components/form-elements/InputField";

const Department = ({ DepartmentData }) => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.COM_TO_DEPARTMENT);
  const { mutate: fetchDataForExcel } = useGlobelApi(API_ENDPOINTS.COM_TO_DEPARTMENT);
  const { mutate: AssignDepartment, isPending: AssignLoading } = useGlobelApi(API_ENDPOINTS.ASSIGN_DEPARTMENT_TO_COMPANY);
  const { mutate: UpdateAssignCompany, isPending: UpdateAssignLoading } = useGlobelApi(API_ENDPOINTS.UPDATE_DEPT_TO_COMPANY);
  const UserId = getFromLocalStorage("UserId");
  const [departmentDataList, setDepartmentDataList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortField, setSortField] = useState("d.id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [editingRowId, setEditingRowId] = useState(null);
  const limit = 10;
  const navigate = useNavigate();
  const {
    register,
    control,
    formState: { errors },
    reset,
    getValues,
    setValue,
  } = useForm();

  const handleFetchdata = (filter, reset = false, orderBy = "d.id DESC") => {
    const baseFilters = [
      {
        key: "dept_id",
        operator: "equal",
        value1: DepartmentData?.record_id,
        logical: "",
      },
    ];
    const filters = filter ? [...baseFilters, ...filter] : baseFilters;
    mutate(
      { filters: filters, limit, offset: reset ? 0 : offset, orderby: orderBy },
      {
        onSuccess: (data) => {
          const newUsers = data?.result || [];
          if (reset) {
            setDepartmentDataList(newUsers);
          } else {
            setDepartmentDataList((prevUsers) => [...prevUsers, ...newUsers]);
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
      const baseFilters = [
        {
          key: "dept_id",
          operator: "equal",
          value1: DepartmentData?.record_id,
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
    XLSX.writeFile(workbook, "department-company.xlsx");
  };

  const fields = [
    {
      name: "company_name",
      label: "Company Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_COMPANY}`,
      responseWhich: "data",
      baseFilters: [
        {
          key: "auc.user_id",
          operator: "equal",
          value1: UserId,
          logical: "",
        },
        {
          key: "auc.status",
          operator: "equal",
          value1: "1",
          logical: "",
        },
      ],
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
    if (editingRowId || departmentDataList.some((r) => r.isEditable)) {
      toast.warning("Please save or cancel the current operation before editing a new row.")
      // Swal.fire({
      //   icon: "warning",
      //   title: "Warning",
      //   text: "Please save or cancel the current operation before editing another row.",
      // });
      return;
    }

    setEditingRowId(row.record_id);
    setDepartmentDataList(
      departmentDataList.map((r) =>
        r.record_id === row.record_id ? { ...r, isEditing: true } : r
      )
    );
    setValue(`company_name_${row.record_id}`, {
      label: row.company_name,
      value: row.company_id,
    });
    setValue(`email_to_${row.record_id}`, row.email_to);
    setValue(`person_contact_${row.record_id}`, row.person_contact);
  };

  const handleSaveEditRow = (record_id) => {
    const company_name = getValues(`company_name_${record_id}`)?.value || getValues(`company_name_${record_id}`);
    const email_to = getValues(`email_to_${record_id}`);
    const person_contact = getValues(`person_contact_${record_id}`);

    if (!company_name || !email_to || !person_contact) {
      toast.error("please fill in all required fields.")
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
        "status":"1",
        // company_id: parseInt(company_name),
        // dept_id: DepartmentData?.record_id,
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
    setDepartmentDataList(
      departmentDataList.map((row) =>
        row.record_id === record_id ? { ...row, isEditing: false } : row
      )
    );
    reset({
      [`company_name_${record_id}`]: undefined,
      [`email_to_${record_id}`]: "",
      [`person_contact_${record_id}`]: "",
    });
  };

  const handleSaveRow = async () => {
    const company_name = getValues("company_name")?.value || getValues("company_name");
    const person_contact = getValues("person_contact");
    const email_to = getValues("email_to");

    if (!company_name || !email_to || !person_contact) {
      toast.error("Please fill in all required fields")
      // Swal.fire({
      //   icon: "error",
      //   title: "Error",
      //   text: "Please fill in all required fields.",
      // });
      return;
    }

    const body = {
      dataInsert: {
        company_id: parseInt(company_name),
        dept_id: DepartmentData?.record_id,
        person_contact,
        email_to,
        created_by: UserId,
      },
    };

    AssignDepartment(body, {
      onSuccess: (res) => {
        reset();
        if (res.success) {
          toast.success(res?.result)
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

  const handleCancelRow = () => {
    const isRowAlreadyAdded = departmentDataList.some((row) => row?.isEditable);
    if (isRowAlreadyAdded) {
      const newApiData = departmentDataList.filter((row) => !row?.isEditable);
      setDepartmentDataList(newApiData);
      reset({
        company_name: undefined,
        email_to: "",
        person_contact: "",
      });
    }
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
          toast.success(res?.result || "Something went wrong")
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
    if (editingRowId || departmentDataList.some((row) => row.isEditable)) {
      toast.warning("Please save or cancel the current operation before adding a new row.")
      // Swal.fire({
      //   icon: "warning",
      //   title: "Warning",
      //   text: "Please save or cancel the current operation before adding a new row.",
      // });
      return;
    }

    const newRow = {
      isEditable: true,
      company_name: (
        <AntdSelectFieldTable
          control={control}
          name="company_name"
          endpoint={API_ENDPOINTS.GET_COMPANY}
          responseWhich="data"
          queryKey="company_name"
          valueKey="record_id"
          labelKey="company_name"
          placeholder="Select Company Name"
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

    setDepartmentDataList([newRow, ...departmentDataList]);
  };

  const handlePermissionToggle = (row) => {
    const updatedStatus = !row.status;
    handlePermissionChange(row, updatedStatus);
  };

  useEffect(() => {
    handleFetchdata();
  }, []);

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
          <div className="d-flex justify-content-center">
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
      key: "company_name",
      label: "Company Name",
      width: 300,
      sortable: true,
      filterable: true,
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_COMPANY}`,
      responseWhich: "data",
      queryKey: "company_name",
      valueKey: "record_id",
      labelKey: "company_name",
      baseFilters: [
        {
          key: "auc.user_id",
          operator: "equal",
          value1: UserId,
          logical: "",
        },
        {
          key: "auc.status",
          operator: "equal",
          value1: "1",
          logical: "",
        },
      ],
      render: (value, row) =>
        row.isEditing ? (value
          // <AntdSelectFieldTable
          //   control={control}
          //   name={`company_name_${row.record_id}`}
          //   endpoint={API_ENDPOINTS.GET_COMPANY}
          //   responseWhich="data"
          //   queryKey="company_name"
          //   valueKey="record_id"
          //   labelKey="company_name"
          //   placeholder="Select Company Name"
          //   rules={{ required: "Company Name is required" }}
          //   error={errors[`company_name_${row.record_id}`]?.message}
          //   defaultValue={row.company_id ? { label: value, value: row.company_id } : undefined}
          //   baseFilters={[
          //     {
          //       key: "auc.user_id",
          //       operator: "equal",
          //       value1: UserId,
          //       logical: "",
          //     },
          //     {
          //       key: "auc.status",
          //       operator: "equal",
          //       value1: "1",
          //       logical: "",
          //     },
          //   ]}
          // />
        ) : row.isEditable ? (
          <AntdSelectFieldTable
            control={control}
            name="company_name"
            endpoint={API_ENDPOINTS.GET_COMPANY}
            responseWhich="data"
            queryKey="company_name"
            valueKey="record_id"
            labelKey="company_name"
            placeholder="Select Company Name"
            rules={{ required: "Company Name is required" }}
            error={errors.company_name?.message}
          />
        ) : (
          <span>{value || "N/A"}</span>
        ),
    },
    {
      key: "email_to",
      label: "Email",
      width: 350,
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
      width: 350,
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
            {
              departmentDataList?.[0]?.isEditable ?
                <CustomButton
                  btntext={"Save"}
                  handleClick={() =>
                    handleSaveRow()
                  }
                />
                : null
            }
            {
              departmentDataList?.[0]?.isEditable ?
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
            data={departmentDataList}
            columns={fieldsMapping}
            isDense={isDense}
            isSelect={false}
            height="300px"
            onSort={(key, direction) => {
              if (useServerSorting) {
                let dbField;
                switch (key) {
                  case "company_name":
                    dbField = "c.company_name";
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

export default withPermissionCheck(Department, "department-company");