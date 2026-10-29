import { DatePicker, Descriptions, Select } from "antd";
import React, { useEffect, useState } from "react";
import { BsFiletypeJson } from "react-icons/bs";
import { FaFileCsv, FaInbox, FaRegFileExcel } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import useDebounce from "../../hooks/useDebounce";
import { formatNumberDisplay, getMonthNumber } from "../../utils/helper.function";
import Loader from "../../components/Loader";
import dayjs from "dayjs";
import ResizableTable from "../../components/table/ResizableTable";
import { MdCancel, MdFilterAlt, MdFilterAltOff } from "react-icons/md";
import { FaEdit, FaSave } from "react-icons/fa";
import InputField from "../../components/form-elements/InputField";
import { useForm } from "react-hook-form";
import moment from "moment";
const SalesPlu = () => {

    const {
      register,
      formState: { errors },
      reset,
      getValues,
    } = useForm();  

  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_PLU_SALES);
  const { mutate: fetchDataForExcel } = useGlobelApi(API_ENDPOINTS.GET_PLU_SALES);
  const { mutate: J_Vochor, isPending: jhisPending } = useGlobelApi(API_ENDPOINTS.GET_COA);
  const { mutate: UpdateSales } = useGlobelApi(API_ENDPOINTS.PLU_SALES_UPDATE);
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const [apiData, setApiData] = useState([])
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterWidth, setIsFilterWidth] = useState(false);
  const [jernalIds, setJernalIds] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [start_date,set_start_date]=useState(null);
  const [end_date,set_end_date]=useState(null);
  const [endDate, setEndDate] = useState(null);
  const navigate = useNavigate();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [companyId, setCompanyId] = useState();
  const [company, setCompany] = useState();
  const [editingRowId, setEditingRowId] = useState(null);
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
              className="text-customBlue"
              onClick={() => handleCancelEdit(row.index)}
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
      key: "company_code",
      label: "Company Code",
      width: 200,
      sortable: false,
      // render: (value) => {
      //   return <span className="fw-bold " style={{ color: "red" }}></span>;
      // },
      filterable: false,
    },
    {
      key: "description",
      label: "Description",
      width: 220,
      sortable: true,
      filterable: true,
    },
    {
      key: "plu_code",
      label: "Plu Code",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value, row) =>
        row.isEditing ? (
          <InputField
            placeholder="PLU Code"
            register={register(`plu_code_${row?.index}`)}
            error={errors[`plu_code_${row?.index}`]?.message}
            defaultValue={value}
          />
        ) : row.isEditable ? (
          ""
        ) : (
          <span>{value || "N/A"}</span>
        ),
    },
    {
      key: "category_name",
      label: "Category Name",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "class_name",
      label: "Class Name",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "revenue_centre_name",
      label: "Revenue Centre",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "qty_sold",
      label: "Qty Sold",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "revenue",
      label: "Revenue",
      width: 200,
      sortable: true,
      filterable: true,
    },
  ];

  const handleFetchdata = (filter, startDate, endDate, journalIds, company_id) => {
    set_end_date(dayjs(endDate).format("YYYY-MM-DD"));
    set_start_date(dayjs(startDate).format("YYYY-MM-DD"));
    setCompanyId(company_id)
    if (filter?.[0]?.value1 != "" && filter?.[0]?.value1 != undefined) {
      setCompanyId(filter?.[0]?.value1);
    }
    mutate(
      {
        headerData: {
          start_date: startDate ? dayjs(startDate).format("YYYY-MM-DD") : "",
          end_date: endDate ? dayjs(endDate).format("YYYY-MM-DD") : "",
          company_id: companyId || filter?.[0]?.value1 || company_id,
        },
        filters: null,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (response) => {
          const data = response?.data || [];
          const newData=data.map((item,index)=>{
            return {
              index,
              ...item,
            }
          })
          setApiData(newData);
        },
        onError: (error) => {
          console.error("Error fetching users:", error);
        },
      }
    );
  };


  const handleSaveEditRow = (row) => {
      const plu_code = getValues(`plu_code_${row?.index}`)

      if (
        !plu_code
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
          header:{
            company_id:companyId,
            description:row?.description,
            plu_code,
            start_date:moment(start_date).format("YYYY-MM-DD"),
            end_date:moment(end_date).format("YYYY-MM-DD"),
          }
        },
      };
  
      UpdateSales(body, {
        onSuccess: (response) => {
          reset();
          if (response.success) {
            setEditingRowId(null);
            const data=apiData.map((item) =>
                item.index === row?.index ? { ...row,plu_code, isEditing: false } : item
              ) 
             setApiData(data);
             toast.success(response.data?.[0]?.message)
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: response.data?.[0]?.message,
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

  const handleCancelEdit = (index) => {
    setEditingRowId(null);
    setApiData(
      apiData.map((row) =>
        row.index === index ? { ...row, isEditing: false } : row
      )
    );
    // Reset form values for this row
    reset({
      [`plu_code_${record_id}`]: undefined,
    });
  };

  const handleEditRow = (row) => {
    if (editingRowId || apiData.some((r) => r.isEditable)) {
      toast.warning("Please save or cancel the current operation before editing another row.")
      // Swal.fire({
      //   icon: "warning",
      //   title: "Warning",
      //   text: "Please save or cancel the current operation before editing another row.",
      // });
      return;
    }

    setEditingRowId(row.plu_code);
    setApiData(
      apiData.map((r) =>
        r.index === row.index ? { ...r, isEditing: true } : r
      )
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

  const handleFetchdataJh = (filer) => {
    const baseFilters = [
      { key: "gl_name", operator: "contains", value1: filer, logical: "" },
    ];
    J_Vochor(
      {
        filters: baseFilters,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (data) => {
          const newData = data?.data || [];
        },
        onError: (error) => {
          console.error("Error fetching ", error);
        },
      }
    );
  };

  const handleExport = async (format) => {
    switch (format) {
      case "excel":
        exportToExcel(apiData);
        break;
      case "csv":
        exportToCSV(apiData);
        break;
      case "json":
        exportToJSON(apiData);
        break;
      default:
        console.log("Invalid format");
    }
  };

  const exportToExcel = (data) => {
    const formattedData = data.map((item) => ({
      ...item,
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "sales_plu.xlsx");
  };

  const exportToCSV = (data) => {
    const formattedData = data.map((item) => ({
      ...item,
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY"),
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "balance_sheet.csv";
    link.click();
  };

  const exportToJSON = (data) => {
    const formattedData = data.map((item) => ({
      ...item,
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY"),
    }));

    const jsonString = JSON.stringify(formattedData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "balance_sheet.json";
    link.click();
  };

  const fields = [
    {
      name: "company_name",
      label: "Company name",
      type: "textServer",
      aliases: "",
      endpoint: `${API_ENDPOINTS.USER_TO_COMPANY}`,
      responseWhich: "result",
      ValueKey: "company_id",
      filterQueryKey: "company_id",
      serverDefaultValue: company,
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
  ];

  const handleApplyFilters = async (data) => {
    if (data.length > 0 || companyId) {
      if (startDate && endDate) {
        if (dayjs(startDate).isAfter(dayjs(endDate))) {
          toast.error("Start date should be before or equal to the end date.")
          // Swal.fire({
          //   icon: "error",
          //   title: "Invalid Date Range",
          //   text: "Start date should be before or equal to the end date.",
          // });
          return;
        }

        setAppliedFilters(data);
        const journalIds = jernalIds?.map((item) => (item.value ? item.value : item)).join(",");
        handleFetchdata(data, startDate, endDate, journalIds, companyId || data?.[0]?.value1);
        handleFetchExcelData(data);
      } else {
        toast.warning("Please select both start and end dates.")
        // Swal.fire({
        //   icon: "warning",
        //   title: "Missing Data",
        //   text: "Please select both start and end dates.",
        // });
      }
    } else {
      toast.error("Please select company")
      // Swal.fire({
      //   icon: "error",
      //   title: "Oops...",
      //   text: "Please select company",
      // });
    }
  };

  const HeaderFilterSection = () => {
    return (
      <div className="mt-1">
        <p>Start Date - End Date</p>
        <div className="flex bg-white border border-gray-500 rounded-md mb-2.5 mt-1">
          <DatePicker
            style={{ width: "100%" }}
            className="custom-select"
            placeholder="Start Date"
            value={startDate}
            onChange={(date) => setStartDate(date)}
            format="DD-MM-YYYY"
          />
          <DatePicker
            style={{ width: "100%" }}
            className="custom-select"
            placeholder="End Date"
            value={endDate}
            onChange={(date) => setEndDate(date)}
            format="DD-MM-YYYY"
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (debouncedSearchTerm) {
      handleFetchdataJh(debouncedSearchTerm);
    } else {

    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (apiData.length > 1) {
      setIsFilterWidth(true);
    }
  }, [apiData]);

  return (
    <>
      <div className="overflow-hidden">
        <h1 className="text-size text-color font-headingweight mb-2">Sales Plu</h1>
        <div className="flex gap-2 items-center">
          <button
            className="flex bg-customBlue text-btnsize rounded-radiusRegular shadow-md text-white font-regularweight duration-300 gap-1 items-center mb-2 px-2 py-1 transition-all"
            onClick={() => setIsFilterWidth(!isFilterWidth)}
          >
            {isFilterWidth ? (
              <>
                <MdFilterAltOff size={16} /> Filters
              </>
            ) : (
              <>
                <MdFilterAlt size={16} /> Filters
              </>
            )}
          </button>
          <div className="text-color">
            {startDate && dayjs(startDate).format("DD-MM-YYYY")} -{" "}
            {endDate && dayjs(endDate).format("DD-MM-YYYY")}
          </div>
        </div>
        <div className="gap- lg:flex relative">
          <div
            className={`transform transition-all duration-300 ease-in-out 
              ${isFilterWidth ? "w-0 opacity-0 -translate-x-full" : "opacity-100 translate-x-0 w-96 shrink-0"} 
              sticky top-4`}
          >
            <div className="h-full mb-2 md:pr-4">
              <DynamicFilter
                parentStateSet={setIsFilterWidth}
                addpartentSectionAppend={HeaderFilterSection()}
                fieldGrid="grid-cols-1"
                fields={fields}
                onApply={handleApplyFilters}
                watchName="company_name"
                className="bg-white border border-gray-100 h-full p-4 rounded-radiusRegular shadow-lg"
              />
            </div>
          </div>

          <div
            class classes="flex-1 transition-all duration-300 xs:mt-2 sm:mt-2 md:mt-2 lg:mt-0"
            style={{ width: "100%", overflowX: "auto", zIndex: 2 }}
          >
            {apiData && apiData.length > 1 ? (
              <div>
                <div className="flex justify-content-end gap-2 my-2">
                  <CustomButton
                    icon={"Excel"}
                    btntext={<FaRegFileExcel className="me-1" />}
                    handleClick={() => handleExport("excel")}
                  />
                  {/* <CustomButton
                    icon={"CSV"}
                    btntext={<FaFileCsv className="me-1" />}
                    handleClick={() => handleExport("csv")}
                  />
                  <CustomButton
                    icon={"JSON"}
                    btntext={<BsFiletypeJson className="me-1" />}
                    handleClick={() => handleExport("json")}
                  /> */}
                </div>
                {isPending && apiData.length <= 0 ? (
                  <Loader />
                ) : (
                  <div>
                    <ResizableTable
                      data={apiData || []}
                      columns={fieldsMapping}
                      isSelect={false}
                      height="300px"
                      isDense={true}
                      onSelectRow={null}
                      scrollableId={"BalanceSheet"}
                      enableScroll={true}
                      loading={isPending}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col bg-white justify-center p-4 rounded-radiusRegular items-center">
                <FaInbox size={40} className="text-color" />
                <p>No data available. Please apply a filter to see the results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>
        {`.custom-select.ant-select {
  box-shadow: none !important;
}

.custom-select.ant-select-focused {
  box-shadow: none !important;
  border-color: transparent !important;
}

.custom-select .ant-select-selector {
  box-shadow: none !important;
  border-color: transparent !important;
}

.custom-select .ant-select-selector:focus {
  outline: none !important;
  border-color: transparent !important;
}
.custom-select .ant-select-selection-placeholder {
  color: #9CA3AF !important;
}`}
      </style>
    </>
  );
};

export default withPermissionCheck(SalesPlu, "sales-plu");