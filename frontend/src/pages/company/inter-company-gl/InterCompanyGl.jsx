import moment from "moment";
import { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdCancel, MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  getFromLocalStorage,
  getFromSessionStorage,
} from "../../../config/crypto-file";
import withPermissionCheck from "../../../config/withPermissionCheck";
import ResizableTable from "../../../components/table/ResizableTable";
import { useForm } from "react-hook-form";
import AntdSelectField from "../../../AntdSelectField";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaEdit, FaSave } from "react-icons/fa";
import dayjs from "dayjs";
import { API_ENDPOINTS } from "../../../apis/client/api-endpoints";
import { useGlobelApi } from "../../../apis/useProduct/useCommon";
import CustomButton from "../../../components/button/CustomButton";
import DynamicFilter from "../../../components/form-elements/DynamicFilter";
import AntSSelectField from "../../../AntSSelectField";

const InterCompanyGl = ({ CompanyData }) => {
  const {
    control,
    formState: { errors },
    reset,
    getValues,
    setValue,
  } = useForm();

  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_INTER_COMPANY_GL);
  const { mutate: fetchDataForExcel } = useGlobelApi(API_ENDPOINTS.GET_INTER_COMPANY_GL);
  const { mutate: AssignInterCompanyGl, isPending: AssignInterCompanyGlPending } = useGlobelApi(API_ENDPOINTS.ASSIGN_INTER_COMPANY_GL);
  const { mutate: UpdateInterCompanyGl, isPending: UpdateInterCompanyGlPending } = useGlobelApi(API_ENDPOINTS.UPDATE_INTER_COMPANY_GL);
  const UserId = getFromLocalStorage("UserId");
  const [apiData, setApiData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("record_id");
  const [editingRowId, setEditingRowId] = useState(null); // Track the row being edited
  const limit = 10;
  const navigate = useNavigate();
  console.log("CompanyData:", CompanyData);

  const handleFetchdata = (filter, reset = false, orderBy = "record_id DESC") => {
    const filters = [
      ...(filter ? filter : appliedFilters || []),
      { "key": "aic.company_id", "operator": "equal", "value1": CompanyData?.record_id, "logical": "" }
    ];

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
          } else {
            setApiData((prevUsers) => [...prevUsers, ...newUsers]);
          }
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
    const baseFilters = [
        { "key": "aic.company_id", "operator": "equal", "value1": CompanyData?.record_id, "logical": "" }
    ];

    const filters = [...(appliedFilters || []), ...baseFilters];
    const data = await handleFetchExcelData(filters);
    const formattedData = data.map(item => ({
      ...item,
      updated_at: dayjs(item.updated_at).format("DD-MM-YYYY"),
      created_at: dayjs(item.created_at).format("DD-MM-YYYY")
    }));
    const limitedData = formattedData.slice(0, 1000);
    const worksheet = XLSX.utils.json_to_sheet(limitedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "inter-company-gl-list.xlsx");
  };

  const fields = [
    {
      name: "coa.gl_name",
      label: "GL",
      type: "textServer",
      labelKey: "gl_name",
      ValueKey: "gl_name",
      endpoint: `${API_ENDPOINTS.GET_COA}`,
      responseWhich: "data",
    },
  ];

  const handleApplyFilters = (data) => {
    setOffset(0);
    setAppliedFilters(data);
    handleFetchdata(data, true);
    handleFetchExcelData(data);
  };

  const handleResetFilters = () => {
    setOffset(0);
    setAppliedFilters(null);
    handleFetchdata(null, true);
    handleFetchExcelData(null);
  };

  const handleEditRow = (row) => {
    // Prevent editing if another row is already being edited or a new row is being added
    if (editingRowId || apiData.some((r) => r.isEditable)) {
      toast.warning("Please save or cancel the current operation before editing a new row.")
      // Swal.fire({
      //   icon: "warning",
      //   title: "Warning",
      //   text: "Please save or cancel the current operation before editing another row.",
      // });
      return;
    }

    setEditingRowId(row.record_id);
    setApiData(
      apiData.map((r) =>
        r.record_id === row.record_id ? { ...r, isEditing: true } : r
      )
    );
    // Set form values for editing
    setValue(`gl_id_${row.record_id}`, {
      label: row.gl_name,
      value: row.gl_id,
    });
    setValue(`gl_type_${row.record_id}`,row?.gl_type);
  };

  const handleSaveEditRow = (record_id) => {
    const company_id = CompanyData?.record_id;
    const gl_id = getValues(`gl_id_${record_id}`)?.value || getValues(`gl_id_${record_id}`);
    const type = getValues(`gl_type_${record_id}`)?.value || getValues(`gl_type_${record_id}`);

    if (!company_id || !gl_id || !type) {
      toast.error("Please fill in all required fields.")
      // Swal.fire({
      //   icon: "error",
      //   title: "Error",
      //   text: "Please fill in all required fields.",
      // });
      return;
    }

    const body = {
      dataUpdate: {
        record_id,
        company_id,
        gl_id,
        type,
        changed_by: UserId,
      },
    };

    UpdateInterCompanyGl(body, {
      onSuccess: (response) => {
        reset();
        if (response.success) {
          setEditingRowId(null);
          handleFetchdata(appliedFilters, true);
          toast.success(response.data)
          // Swal.fire({
          //   icon: "success",
          //   title: "Success",
          //   text: response.data,
          // });
        } else {
          toast.error(response.data)
          // Swal.fire({
          //   icon: "error",
          //   title: "Error",
          //   text: response.data,
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
    setApiData(
      apiData.map((row) =>
        row.record_id === record_id ? { ...row, isEditing: false } : row
      )
    );
    // Reset form values for this row
    reset({
      [`company_id_${record_id}`]: undefined,
      [`gl_id_${record_id}`]: undefined,
      [`gl_type_${record_id}`]: undefined,
    });
  };

  const fieldsMapping = [
    {
      key: "action",
      label: "Action",
      width: 150,
      render: (value, row) =>
        row.isEditing ? (
          <div className="flex gap-2">
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
          <FaEdit
            size={18}
            title="Edit"
            className="text-customBlue"
            onClick={() => handleEditRow(row)}
          />
        ),
    },
    {
      key: "gl_code",
      label: "GL Code",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "gl_name",
      label: "GL",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value, row) =>
        row.isEditing ? (
          <AntdSelectField
            labelCLass="capitalize"
            name={`gl_id_${row.record_id}`}
            control={control}
            type="select"
            endpoint={API_ENDPOINTS.GET_COA}
            queryKey="gl_name"
            valueKey="record_id"
            labelKey="gl_name"
            ContcatenateLabel="gl_code"
            rules={{ required: "GL is required" }}
            error={errors[`gl_id_${row.record_id}`]}
            baseFilters={[]}
            defaultValue={row.gl_id ? { label: value, value: row.gl_id } : undefined}
          />
        ) : row.isEditable ? (
          <AntdSelectField
            labelCLass="capitalize"
            name="gl_id"
            control={control}
            type="select"
            endpoint={API_ENDPOINTS.GET_COA}
            queryKey="gl_name"
            valueKey="record_id"
            labelKey="gl_name"
            ContcatenateLabel="gl_code"
            rules={{ required: "GL is required" }}
            error={errors.gl_id}
            baseFilters={[]}
          />
        ) : (
          <span>{value || "N/A"}</span>
        ),
    },
    {
      key: "created_at",
      label: "Created at",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="">{value ? moment(value).format("DD-MM-YYYY") || "N/A" : ""}</span>
      ),
    },
    {
      key: "updated_at",
      label: "Updated at",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="">{value ? moment(value).format("DD-MM-YYYY") || "N/A" : ""}</span>
      ),
    },
    {
      key: "gl_type",
      label: "Type",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value, row) =>
        row.isEditing ? (
          <AntSSelectField
            control={control}
            isClearable={false}
            name={`gl_type_${row.record_id}`}
            options={[
              { value: "receivable", label: "Receivable" },
              { value: "payable", label: "Payable" },
            ]}
            rules={{ required: "Please select Type" }}
            error={errors[`gl_type_${row.record_id}`]?.message}
            defaultValue={value ? { label: value, value: value } : undefined}
          />
        ) : row.isEditable ? (
          <AntSSelectField
            control={control}
            isClearable={false}
            name="gl_type"
            options={[
              { value: "receivable", label: "Receivable" },
              { value: "payable", label: "Payable" },
            ]}
            rules={{ required: "Please select Type" }}
            error={errors.gl_type?.message}
          />
        ) : (
          <span>{value || "N/A"}</span>
        ),
    },
  ];

  const handleAddRow = () => {
    if (editingRowId || apiData.some((row) => row.isEditable)) {
      toast.warning("Please save or cancel the current operation before adding a new row.")
      return;
    }

    const newRow = {
      isEditable: true,
      created_at: "",
    };
    setApiData([newRow, ...apiData]);
  };

  const handleSaveRow = () => {
    const company_id = CompanyData?.record_id;
    const gl_id = getValues("gl_id")?.value || getValues("gl_id");
    const type = getValues("gl_type")?.value || getValues("gl_type");

    if (!company_id || !gl_id || !type) {
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
        company_id,
        gl_id,
        type,
        created_by: UserId,
      },
    };
    AssignInterCompanyGl(body, {
      onSuccess: (data) => {
        if (data.success) {
          handleFetchdata(appliedFilters, true);
          reset();
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

  const handleDeleteRow = () => {
    setApiData(apiData.filter((row) => !row.isEditable));
    reset({
      company_id: undefined,
      gl_id: undefined,
      gl_type:undefined,
    });
  };

  useEffect(() => {
    handleFetchdata(null, true);
  }, [navigate]);

  return (
    <>
      <div>
        <h1 className="mb-2 text-size text-color font-headingweight">INTER COMPANY GL</h1>
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
            <CustomButton btntext={"Add New"} handleClick={handleAddRow} />
            {apiData.some((row) => row.isEditable) ? (
              <>
                <CustomButton btntext={"Save"} handleClick={handleSaveRow} />
                <CustomButton btntext={"Cancel"} handleClick={handleDeleteRow} />
              </>
            ) : null}
            <div className="d-flex align-items-center">
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
            <CustomButton
              btntext={<MdRefresh size={18} />}
              addclass={`w-6 rounded-radiusFull max-w-6 min-w-6 h-6 ${isPending && "animate-spin"} `}
              padding="p-0"
              rounded="rounded-full"
              handleClick={() => {
                setOffset(0);
                handleFetchdata(null, true);
              }}
            />
          </div>
        </div>
        <div className="h-80 mb-2.5">
          <ResizableTable
            data={apiData || []}
            columns={fieldsMapping}
            isDense={isDense}
            height="300px"
            onSort={(key, direction) => {
              if (useServerSorting) {
                let dbField;
                switch (key) {
                  case "gl_name":
                    dbField = "coa.gl_name";
                    break;
                  case "gl_code":
                    dbField = "coa.gl_code";
                    break;
                  case "created_at":
                    dbField = "created_at";
                    break;
                  case "updated_at":
                    dbField = "updated_at";
                    break;
                  default:
                    dbField = "record_id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"InterCompanyGl"}
            isSelect={false}
            hasMore={hasMore}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "record_id DESC"
              )
            }
            loading={isPending}
          />
        </div>
      </div>
    </>
  );
};

export default withPermissionCheck(InterCompanyGl, "inter-company-gl");