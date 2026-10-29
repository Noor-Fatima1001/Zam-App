import moment from "moment";
import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdCancel, MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import {
  getFromLocalStorage,
  getFromSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import ResizableTable from "../../components/table/ResizableTable";
import { useForm } from "react-hook-form";
import InputField from "../../components/form-elements/InputField";
import AntdSelectField from "../../AntdSelectField";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaEdit, FaSave } from "react-icons/fa";
import dayjs from "dayjs";

const AssignLocation = () => {
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

  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.ASSIGN_LOCATION_LIST);
  const { mutate: fetchDataForExcel } = useGlobelApi(API_ENDPOINTS.ASSIGN_LOCATION_LIST);
  const { mutate: AssignStockLocation, isPending: AssignStockLocationPending } = useGlobelApi(API_ENDPOINTS.ASSIGN_LOCATION_TO_DEPT);
  const { mutate: UpdateStockLocation, isPending: UpdateStockLocationPending } = useGlobelApi(API_ENDPOINTS.UPDATE_ASSIGN_LOCATION);
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const stockLocationData = getFromSessionStorage("StockLocation");
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
  const [sortField, setSortField] = useState("altcd.id");
  const [editingRowId, setEditingRowId] = useState(null); // Track the row being edited
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderBy = "altcd.id DESC") => {
    const filters = [
      ...(filter ? filter : appliedFilters || []),
      {
        key: "altcd.location_id",
        operator: "equal",
        value1: stockLocationData?.record_id,
        logical: "",
      },
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
    const baseFilters = [
      {
        key: "altcd.id",
        operator: "equal",
        value1: stockLocationData?.record_id,
        logical: "",
      },
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
    XLSX.writeFile(workbook, "assign-bank-list.xlsx");
  };

  const fields = [
    {
      name: "c.company_name",
      label: "Company",
      type: "textServer",
      labelKey: "company_name",
      ValueKey: "company_name",
      endpoint: `${API_ENDPOINTS.USER_TO_DEPARTMENT}`,
      responseWhich: "result",
      baseFilters: [
        {
          key: "adu.user_id",
          operator: "equal",
          value1: UserId,
          logical: "",
        },
        {
          key: "adu.status",
          operator: "equal",
          value1: "1",
          logical: "",
        },
      ]
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
      toast.warning("Please save or cancel the current operation before editing another row.")
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
    setValue(`company_to_dept_${row.record_id}`, {
      label: row.company_name,
      value: row.company_id,
    });
  };

  const handleSaveEditRow = (row) => {
    const company_id = getValues(`company_to_dept_${row?.record_id}`)?.value || getValues(`company_to_dept_${row?.record_id}`);
    const location_id = stockLocationData?.record_id;
    if (
      !company_id
    ) {
      toast.error("Please fill in all requ")
      // Swal.fire({
      //   icon: "error",
      //   title: "Error",
      //   text: "Please fill in all required fields.",
      // });
      return;
    }

    const body = {
      dataUpdate: {
        record_id: row?.record_id,
        status: row?.status,
        location_id,
        comp_dept_id: company_id,
        changed_by: UserId,
      },
    };

    UpdateStockLocation(body, {
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
      [`company_to_dept_${record_id}`]: undefined,
      [`gl_id_${record_id}`]: undefined,
      [`account_number_${record_id}`]: "",
      [`iban_number_${record_id}`]: "",
      [`swift_code_${record_id}`]: "",
      [`branch_name_${record_id}`]: "",
      [`bank_address_${record_id}`]: "",
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
              className="text-customBlue "
              title="Save"
              onClick={() => handleSaveEditRow(row)}
            />

            <MdCancel
              size={18}
              title="Cancel"
              className="text-customBlue "
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
      key: "company_name",
      label: "Company Name",
      width: 380,
      sortable: true,
      filterable: true,
      render: (value, row) =>
        row.isEditing ? (
          <AntdSelectField
            control={control}
            name={`company_to_dept_${row.record_id}`}
            endpoint={API_ENDPOINTS.USER_TO_DEPARTMENT}
            queryKey="company_name"
            valueKey="com_dept_id"
            labelKey="company_name"
            responseWhich="result"
            ContcatenateLabel={"dept_name"}
            rules={{ required: "Company is required." }}
            error={errors[`company_to_dept_${row.record_id}`]}
            baseFilters={[
              {
                key: "adu.user_id",
                operator: "equal",
                value1: UserId,
                logical: "",
              },
              {
                key: "adu.status",
                operator: "equal",
                value1: "1",
                logical: "",
              },
            ]}
            defaultValue={row.company_id ? { label: value, value: row.company_id } : undefined}
          />
        ) : row.isEditable ? (
          <AntdSelectField
            control={control}
            name="company_to_dept"
            endpoint={API_ENDPOINTS.USER_TO_DEPARTMENT}
            queryKey="company_name"
            valueKey="com_dept_id"
            labelKey="company_name"
            responseWhich="result"
            ContcatenateLabel={"dept_name"}
            rules={{ required: "Company is required." }}
            error={errors[`company_to_dept_${row.record_id}`]}
            baseFilters={[
              {
                key: "adu.user_id",
                operator: "equal",
                value1: UserId,
                logical: "",
              },
              {
                key: "adu.status",
                operator: "equal",
                value1: "1",
                logical: "",
              },
            ]}
          />
        ) : (
          <span>{`${value}-${row?.dept_name}` || "N/A"}</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      width: 320,
      sortable: true,
      filterable: true,
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
    },

  ];


  const handlePermissionToggle = (row) => {
    const body = {
      dataUpdate: {
        record_id: row?.record_id,
        comp_dept_id: row?.comp_dept_id,
        location_id: row?.location_id,
        status: row?.status === 1 ? 0 : 1,
        changed_by: UserId,
      },
    };
    UpdateStockLocation(body, {
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
  }

  const handleAddRow = () => {
    // Prevent adding a new row if another row is being edited
    if (editingRowId || apiData.some((row) => row.isEditable)) {
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
      bank_name: stockLocationData?.bank_name,
      created_at: "",
      status: "",
    };
    setApiData([newRow, ...apiData]);
  };

  const handleSaveRow = () => {
    const company_id = getValues("company_to_dept")?.value || getValues("company_to_dept");
    const location_id = stockLocationData?.record_id;
    if (!company_id) {
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
        // bank_id: stockLocationData?.record_id,
        comp_dept_id: company_id,
        location_id,
        created_by: UserId,
      },
    };
    AssignStockLocation(body, {
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
      account_number: "",
      iban_number: "",
      swift_code: "",
      branch_name: "",
      bank_address: "",
    });
  };

  useEffect(() => {
    handleFetchdata(null, true);
  }, [navigate]);

  return (
    <>
      <div>
        <h1 className="mb-2 text-size text-color font-headingweight">Assign Location</h1>
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
            {/* Remove GenericActionBar since the Edit action is now in the table */}
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
                  case "company_name":
                    dbField = "c.company_name";
                    break;
                  default:
                    dbField = "altcd.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"UnitList"}
            isSelect={false}
            onSelectRow={(selectedData) => setSelectedIds(selectedData)}
            hasMore={hasMore}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "altcd.id DESC"
              )
            }
            loading={isPending}
          />
        </div>
      </div>
    </>
  );
};

export default withPermissionCheck(AssignLocation, "assign-location");