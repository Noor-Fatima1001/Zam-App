import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import InfiniteScroll from "react-infinite-scroll-component";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../../apis/client/api-endpoints";
import { useGlobelApi } from "../../../apis/useProduct/useCommon";
import Loader from "../../../components/Loader";
import CustomButton from "../../../components/button/CustomButton";
import DynamicFilter from "../../../components/form-elements/DynamicFilter";
import GenericDataTableRowAdd from "../../../components/table/GenericDataTableRowAdd";
import { getFromLocalStorage } from "../../../config/crypto-file";
import withPermissionCheck from "../../../config/withPermissionCheck";
import { MdRefresh } from "react-icons/md";
import ResizableTable from "../../../components/table/ResizableTable";
import InputField from "../../../components/form-elements/InputField";
import AntdSelectFieldTable from "../../../AntSelectFieldTable";
import { useForm } from "react-hook-form";
const SupplierTax = ({ routeData }) => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_TAX_SUPPLIER);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_TAX_SUPPLIER
  );
  const { mutate: AssignDepartment, isPending: AssignLoading } = useGlobelApi(
    API_ENDPOINTS.ASSIGN_TAX_SUPPLIER
  );
  const { mutate: UpdateAssignCompany, isPending: UpdateAssignLoading } =
    useGlobelApi(API_ENDPOINTS.UPDATE_TAX_SUPPLIER);
  const UserId = getFromLocalStorage("UserId");
  const [apiDataList, setApiDataList] = useState([]);
  const [sortField, setSortField] = useState("tt.id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [useServerSorting, setUseServerSorting] = useState(false);
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
    setValue
  } = useForm();
  const handleFetchdata = (filter, reset = false, orderBy = "tt.id DESC") => {
    const baseFilters = [
      {
        key: "sl.supplier_name",
        operator: "equal",
        value1: routeData?.supplier_name,
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
          const newUsers = data?.data || [];
          if (reset) {
            setApiDataList(newUsers);
          } else {
            setApiDataList((prevUsers) => [...prevUsers, ...newUsers]);
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
        {
          filters: filter,
          limit: 0,
          offset: 0,
        },
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
    XLSX.writeFile(workbook, "department-company.xlsx");
  };
  const fields = [
    {
      name: "tax_name",
      label: "Tax Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.TAX_LIST}`,
      responseWhich: "data",
      baseFilter: {
        key: "tt.status",
        operator: "equal",
        value1: "1",
        logical: "",
      },
    },
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
  const handleDeleteRow = () => {
    const isRowAlreadyAdded = apiDataList.some(row => row?.isEditable);
    if (isRowAlreadyAdded) {
      // Filter out the editable row (newly added row)
      const newApiData = apiDataList.filter(row => !row?.isEditable);
      setApiDataList(newApiData);
    }
  };
  const handleSaveRow = async (newRows, properData, edit) => {
    console.log("New rows saved successfully!", newRows);
    const tax_name = getValues("tax_name").value;
    const tax_number = getValues("tax_number");
    const body = edit
      ? {
          dataUpdate: {
            record_id: properData?.record_id,
            // tax_id: parseInt(newRows?.tax_name?.value),
            tax_number: newRows?.tax_number,
            status: properData?.status,
            changed_by: UserId,
          },
        }
      : {
          dataInsert: {
            supplier_id: routeData?.record_id,
            tax_id: parseInt(tax_name),
            tax_number: newRows?.tax_number,
            created_by: UserId,
          },
        };
  
    const apitHit = edit ? UpdateAssignCompany : AssignDepartment;
    AssignDepartment({
      dataInsert: {
        supplier_id: routeData?.record_id,
        tax_id: parseInt(tax_name),
        tax_number: tax_number,
        created_by: UserId,
      },
    }, {
      onSuccess: (res) => {
        if (res.success) {
          reset(); // Only reset on success
          toast.success(res?.data)
          // `Swal.fire({
          //   icon: "success",
          //   title: "Success",
          //   text: res?.data,
          // });`
          handleFetchdata(null, true);
        } else {
          // Do not reset on failure, so selected data is preserved
          toast.error(res?.data || "Something went wrong")
          // Swal.fire({
          //   icon: "error",
          //   title: "Error",
          //   text: res?.data || "Something went wrong",
          // });
        }
      },
      onError: (error) => {
        // Do not reset on error, so selected data is preserved
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
    console.log("🚀 ~ handlePermissionChange ~ row:", row);
    const body = {
      dataUpdate: {
        record_id: row?.record_id,
        tax_number: row?.tax_number || null,
        status: status ? 1 : 0,
        changed_by: UserId,
      },
    };
    UpdateAssignCompany(body, {
      onSuccess: (res) => {
        // reset();
        console.log("success edit time", res);
        if (res.success) {
          toast.success(res?.data)
          // Swal.fire({
          //   icon: "success",
          //   title: "Success",
          //   text: res?.data,
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
        // Swal.fire({
        //   title: "Error",
        //   text: "Something went wrong",
        //   icon: "error",
        // });
      },
    });
  };
  const handleAddRow = () => {
    // Check if an editable row already exists
    const isRowAlreadyAdded = apiDataList.some(row => row?.isEditable);
    if (isRowAlreadyAdded) return;
    const newRow = {
      isEditable: true,
      tax_name: (
        <AntdSelectFieldTable
          control={control}
          name="tax_name"
          type="textServer"
          endpoint={API_ENDPOINTS.TAX_LIST}     
          responseWhich="data"
          queryKey="tax_name"
          valueKey="record_id"
          labelKey="tax_name"
          placeholder="Select Tax Name"
        // editable= false,
        />
      ),
      tax_number: (
        <InputField
          placeholder="Enter Tax Number"
          register={register("tax_number", {
            required: "Tax number is required",
          })}
          defaultValue={""}
          error={errors.tax_number?.message}
        />
      ),
      status:undefined
    };

    setApiDataList([newRow, ...apiDataList]);
  };
  const fieldsMapping = [
    // { field: "dept_name", displayName: "Department Name" },
    {
      key: "tax_name",
      label: "Tax ",
      width: 300,
      sortable: true,
      filterable: true,
      type: "textServer",
      endpoint: `${API_ENDPOINTS.TAX_LIST}`,
      baseFilters: [
        {
          key: "tt.status",
          operator: "equal",
          value1: "1",
          logical: "",
        },
        {  
          key: "tt.tax_type",
          operator: "equal",
          value1: "purchase_tax",
          logical: "",
        },
      ],
      responseWhich: "data",
      queryKey: "tax_name",
      valueKey: "record_id",
      labelKey: "tax_name",
      editable: false,
    },
    {
      key: "tax_number",
      label: "Number",
      width: 300,
      sortable: true,
    },
    {
      key: "status",
      label: "status",
      width: 300,
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
          <div className="flex gap-2 flex-wrap" >
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
              apiDataList?.[0]?.isEditable ?
                <CustomButton
                  btntext={"Save"}
                  handleClick={() =>
                    handleSaveRow()
                  }
                />
                : null
            }
            {
              apiDataList?.[0]?.isEditable ?
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
                handleClick={() => {
                  setOffset(0);
                  handleFetchdata(null, true);
                }} />
            }

          </div>
        </div>

        <div className="h-80 mb-2.5">
          <ResizableTable
            data={apiDataList}
            columns={fieldsMapping}
            isDense={isDense}
            height="300px"
            onSort={(key, direction) => {
              if (useServerSorting) {
                let dbField;
                switch (key) {
                  case "tax_name":
                    dbField = "tt.tax_name";
                    break;
                  case "tax_number":
                    dbField = "atts.tax_number";
                    break;
                  default:
                    dbField = "tt.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"SupplierTax"}
            onSave={handleSaveRow}
            isSaving={AssignLoading}
            isSelect={false}
            onPermissionChange={handlePermissionToggle}
            hasMore={hasMore}
            onFilter={(filters) => console.log("Filters:", filters)}
            onSelectRow={(selectedData) => setSelectedIds(selectedData)}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "tt.id DESC"
              )
            }
            loading={isPending}
          />
        </div>
      </div>
    </>
  );
};

export default withPermissionCheck(SupplierTax, "supplier-tax");
