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

const AssignBankList = () => {
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

  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.ASSIGN_BANK_LIST);
  const { mutate: fetchDataForExcel } = useGlobelApi(API_ENDPOINTS.ASSIGN_BANK_LIST);
  const { mutate: AssignBank, isPending: AssignBankPending } = useGlobelApi(API_ENDPOINTS.ASSIGN_BANK);
  const { mutate: UpdateBank, isPending: UpdateBankPending } = useGlobelApi(API_ENDPOINTS.UPDATE_ASSIGN_BANK);
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const bankData = getFromSessionStorage("BankList");
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
  const [sortField, setSortField] = useState("bl.id");
  const [editingRowId, setEditingRowId] = useState(null); // Track the row being edited
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderBy = "abtc.id DESC") => {
    const filters = [
      ...(filter ? filter : appliedFilters || []),
      {
        key: "abtc.bank_id",
        operator: "equal",
        value1: bankData?.record_id,
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
        key: "abtc.bank_id",
        operator: "equal",
        value1: bankData?.record_id,
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
      name: "coa.gl_name",
      label: "GL",
      type: "textServer",
      labelKey: "gl_name",
      ValueKey: "gl_name",
      endpoint: `${API_ENDPOINTS.GET_COA}`,
      responseWhich: "data",
    },
    {
      name: "c.company_name",
      label: "Company",
      type: "textServer",
      labelKey: "company_name",
      ValueKey: "company_name",
      endpoint: `${API_ENDPOINTS.USER_TO_COMPANY}`,
      responseWhich: "result",
    },
    {
      name: "abtc.account_number",
      label: "Account Number",
      type: "text",
      endpoint: `${API_ENDPOINTS.GET_BANK_LIST}`,
      responseWhich: "data",
    },
    {
      name: "abtc.branch_name",
      label: "Branch Name",
      type: "text",
      endpoint: `${API_ENDPOINTS.GET_BANK_LIST}`,
      responseWhich: "data",
    },
    {
      name: "abtc.iban_number",
      label: "IBAN Number",
      type: "text",
      endpoint: `${API_ENDPOINTS.GET_BANK_LIST}`,
      responseWhich: "data",
    },
    {
      name: "abtc.bank_address",
      label: "Bank Address",
      type: "text",
      endpoint: `${API_ENDPOINTS.GET_BANK_LIST}`,
      responseWhich: "data",
    },
    {
      name: "abtc.swift_code",
      label: "Swift Code",
      type: "text",
      endpoint: `${API_ENDPOINTS.GET_BANK_LIST}`,
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
      toast.error("Please save or cancel the current operation before editing another row.")
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
    setValue(`company_id_${row.record_id}`, {
      label: row.company_name,
      value: row.company_id,
    });
    setValue(`gl_id_${row.record_id}`, {
      label: row.gl_name,
      value: row.gl_id,
    });
    setValue(`account_number_${row.record_id}`, row.account_number);
    setValue(`iban_number_${row.record_id}`, row.iban_number);
    setValue(`swift_code_${row.record_id}`, row.swift_code);
    setValue(`branch_name_${row.record_id}`, row.branch_name);
    setValue(`bank_address_${row.record_id}`, row.bank_address);
  };

  const handleSaveEditRow = (record_id) => {
    const company_id = getValues(`company_id_${record_id}`)?.value || getValues(`company_id_${record_id}`);
    const gl_id = getValues(`gl_id_${record_id}`)?.value || getValues(`gl_id_${record_id}`);
    const account_number = getValues(`account_number_${record_id}`);
    const iban_number = getValues(`iban_number_${record_id}`);
    const swift_code = getValues(`swift_code_${record_id}`);
    const branch_name = getValues(`branch_name_${record_id}`);
    const bank_address = getValues(`bank_address_${record_id}`);

    if (
      !company_id ||
      !gl_id ||
      !account_number ||
      !iban_number ||
      !swift_code ||
      !branch_name ||
      !bank_address
    ) {
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
        bank_id: bankData?.record_id,
        company_id,
        gl_id,
        account_number,
        iban_number,
        swift_code,
        branch_name,
        bank_address,
        changed_by: UserId,
      },
    };

    UpdateBank(body, {
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
              onClick={() => handleSaveEditRow(row.record_id)}
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
      key: "bank_name",
      label: "Bank Name",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "company_name",
      label: "Company Name",
      width: 280,
      sortable: true,
      filterable: true,
      render: (value, row) =>
        row.isEditing ? (
          <AntdSelectField
            control={control}
            name={`company_id_${row.record_id}`}
            endpoint={API_ENDPOINTS.USER_TO_COMPANY}
            queryKey="company_name"
            valueKey="company_id"
            labelKey="company_name"
            responseWhich="result"
            rules={{ required: "Company is required." }}
            error={errors[`company_id_${row.record_id}`]}
            baseFilters={[
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
            ]}
            defaultValue={row.company_id ? { label: value, value: row.company_id } : undefined}
          />
        ) : row.isEditable ? (
          <AntdSelectField
            control={control}
            name="company_id"
            endpoint={API_ENDPOINTS.USER_TO_COMPANY}
            queryKey="company_name"
            valueKey="company_id"
            labelKey="company_name"
            responseWhich="result"
            rules={{ required: "Company is required." }}
            error={errors.company_id}
            baseFilters={[
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
            ]}
          />
        ) : (
          <span>{value || "N/A"}</span>
        ),
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
      key: "account_number",
      label: "Account Number",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value, row) =>
        row.isEditing ? (
          <InputField
            placeholder="Enter Account Number"
            register={register(`account_number_${row.record_id}`, {
              required: "Account Number is required",
            })}
            maxLength={16}
            error={errors[`account_number_${row.record_id}`]?.message}
            defaultValue={value}
            type="text"
            onKeyPress={(e) => {
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
          />
        ) : row.isEditable ? (
          <InputField
            placeholder="Enter Account Number"
            register={register("account_number", {
              required: "Account Number is required",
            })}
            maxLength={16}
            error={errors.account_number?.message}
            type="text"
            onKeyPress={(e) => {
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
          />
        ) : (
          <span>{value || "N/A"}</span>
        ),
    },
    {
      key: "iban_number",
      label: "IBAN Number",
      width: 320,
      sortable: true,
      filterable: true,
      render: (value, row) =>
        row.isEditing ? (
          <InputField
            placeholder="Enter IBAN Number"
            register={register(`iban_number_${row.record_id}`, {
              required: "IBAN Number is required",
            })}
            maxLength={23}
            error={errors[`iban_number_${row.record_id}`]?.message}
            defaultValue={value}
            type="text"
          />
        ) : row.isEditable ? (
          <InputField
            placeholder="Enter IBAN Number"
            register={register("iban_number", {
              required: "IBAN Number is required",
            
            })}
            maxLength={23}
            error={errors.iban_number?.message}
            type="text"
          />
        ) : (
          <span>{value || "N/A"}</span>
        ),
    },
    {
      key: "bank_address",
      label: "Bank Address",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value, row) =>
        row.isEditing ? (
          <InputField
            placeholder="Bank Address"
            register={register(`bank_address_${row.record_id}`, {
              required: "Bank Address is required",
            })}
            error={errors[`bank_address_${row.record_id}`]?.message}
            defaultValue={value}
          />
        ) : row.isEditable ? (
          <InputField
            placeholder="Bank Address"
            register={register("bank_address", {
              required: "Bank Address is required",
            })}
            error={errors.bank_address?.message}
          />
        ) : (
          <span>{value || "N/A"}</span>
        ),
    },
    {
      key: "branch_name",
      label: "Branch Name",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value, row) =>
        row.isEditing ? (
          <InputField
            placeholder="Branch Name"
            register={register(`branch_name_${row.record_id}`, {
              required: "Branch Name is required",
            })}
            error={errors[`branch_name_${row.record_id}`]?.message}
            defaultValue={value}
          />
        ) : row.isEditable ? (
          <InputField
            placeholder="Branch Name"
            register={register("branch_name", {
              required: "Branch Name is required",
            })}
            error={errors.branch_name?.message}
          />
        ) : (
          <span>{value || "N/A"}</span>
        ),
    },
    {
      key: "swift_code",
      label: "Swift Code",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value, row) =>
        row.isEditing ? (
          <InputField
            placeholder="Swift Code"
            register={register(`swift_code_${row.record_id}`, {
              required: "Swift Code is required",
            })}
            error={errors[`swift_code_${row.record_id}`]?.message}
            defaultValue={value}
          />
        ) : row.isEditable ? (
          <InputField
            placeholder="Swift Code"
            register={register("swift_code", {
              required: "Swift Code is required",
            })}
            error={errors.swift_code?.message}
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
    }
   
  ];

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
      bank_name: bankData?.bank_name,
      created_at: "",
    };
    setApiData([newRow, ...apiData]);
  };

  const handleSaveRow = () => {
    const company_id = getValues("company_id")?.value || getValues("company_id");
    const gl_id = getValues("gl_id")?.value || getValues("gl_id");
    const account_number = getValues("account_number");
    const iban_number = getValues("iban_number");
    const swift_code = getValues("swift_code");
    const branch_name = getValues("branch_name");
    const bank_address = getValues("bank_address");

    if (
      !company_id ||
      !gl_id ||
      !account_number ||
      !iban_number ||
      !swift_code ||
      !branch_name ||
      !bank_address
    ) {
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
        bank_id: bankData?.record_id,
        company_id,
        gl_id,
        account_number,
        iban_number,
        swift_code,
        branch_name,
        bank_address,
        created_by: UserId,
      },
    };
    AssignBank(body, {
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
        <h1 className="mb-2 text-size text-color font-headingweight">Assign Bank List</h1>
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
                  case "bank_name":
                    dbField = "bl.bank_name";
                    break;
                  case "account_number":
                    dbField = "abtc.account_number";
                    break;
                  case "iban_number":
                    dbField = "abtc.iban_number";
                    break;
                  case "bank_address":
                    dbField = "abtc.bank_address";
                    break;
                  case "branch_name":
                    dbField = "abtc.branch_name";
                    break;
                  case "company_name":
                    dbField = "c.company_name";
                    break;
                  case "gl_name":
                    dbField = "coa.gl_name";
                    break;
                  case "swift_code":
                    dbField = "abtc.swift_code";
                    break;
                  case "created_at":
                    dbField = "abtc.created_at";
                    break;
                  default:
                    dbField = "bl.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"AssignBankList"}
            isSelect={false}
            onSelectRow={(selectedData) => setSelectedIds(selectedData)}
            hasMore={hasMore}
            enableScroll={true}
            disableInternalSort={useServerSorting}
          onLoadMore={() =>
            handleFetchdata(
              appliedFilters,
              false,
              useServerSorting ? `${sortField} ${sortDirection}` : "bl.id DESC"
            )
          }
          loading={isPending}
        />

        </div>
      </div>
    </>
  );
};

export default withPermissionCheck(AssignBankList, "assign-bank-list");