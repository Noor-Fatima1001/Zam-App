import moment from "moment";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomButton from "../../components/button/CustomButton";
import Loader from "../../components/Loader";
import MuiGernericTable from "../../components/table/MuiGernericTable";
import withPermissionCheck from "../../config/withPermissionCheck";
import * as XLSX from "xlsx";
import { getFromLocalStorage } from "../../config/crypto-file";
import { useForm } from "react-hook-form";
import AntdSelectField from "../../AntdSelectField";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";

const MasterDataDelete = () => {

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

  const navigate = useNavigate();
  const baseUrl_live_POS = import.meta.env.VITE_ROOT_LIVE_POS || "";
  const BrandID = import.meta.env.VITE_ROOT_BRANDED_ID || "";
  const Password = import.meta.env.VITE_ROOT_PASSWORD || "";
  const SiteId = import.meta.env.VITE_ROOT_SITE_ID || "";
  const PosUser = import.meta.env.VITE_ROOT_USER || "";
  const UserId = getFromLocalStorage("UserId");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const subdomain = window.location.hostname.split(".")[0];
  const fetchPosts = async () => {
    setIsLoading(true);
    setIsError(false);
    const company_id = getValues("company_name")
    try {
      const params = new URLSearchParams({
        Brandid: BrandID,
        Password: Password,
        siteid: company_id,
        Datefrom: moment(dateFrom).format("DD MMM YYYY HH:mm"),
        Dateto: moment(dateTo).format("DD MMM YYYY HH:mm"),
        User: PosUser,
      }).toString();

      const response = await fetch(`/SQLAPI/api/masterdata_deleted?${params}`, {
        headers: {
          "X-Tenant-Subdomain": subdomain
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when date changes
  const handleFetchAllData = () => {
    const company_id = getValues("company_name")
    if (dateFrom && dateTo &&company_id ) {
      fetchPosts();
    }
  };
  const datafilter = data.filter(
    (item) => item.ParentReasonText === "Not Produced"
  );
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(datafilter);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "delete-sales-items.xlsx");
  };

  const fieldsMapping = [
    {
      field: "Sitename",
      headerName: "Site name",
      width: 120,
    },
    {
      field: "BillHeaderID",
      headerName: "Bill Header ID",
      width: 120,
    },
    {
      field: "CheckItemID",
      headerName: "Check Item ID",
      width: 120,
    },
    {
      field: "ReportGroupName",
      headerName: "Report Group",
      width: 120,
    },
    {
      field: "LocationName",
      headerName: "Location",
      width: 120,
    },
    {
      field: "ItemTotal",
      headerName: "Item Total",
      width: 120,
    },
    {
      field: "BillTotal",
      headerName: "Bill Total",
      width: 120,
    },
    {
      field: "TaxTotal",
      headerName: "Tax Total",
      width: 120,
    },
    {
      field: "ServiceCharge",
      headerName: "Service Charge",
      width: 120,
    },
    {
      field: "CustomerTable",
      headerName: "Customer Table",
      width: 120,
    },
    {
      field: "SessionName",
      headerName: "Session",
      width: 120,
    },
    {
      field: "BillWaiter",
      headerName: "Bill Waiter",
      width: 120,
    },
    {
      field: "Description",
      headerName: "Description",
      width: 120,
    },
    {
      field: "ClassName",
      headerName: "Class ",
      width: 120,
    },
    {
      field: "CategoryName",
      headerName: "Category ",
      width: 120,
    },
    {
      field: "PLUCode",
      headerName: "PLU Code",
      width: 120,
    },
    {
      field: "Quantity",
      headerName: "Quantity",
      width: 120,
    },
    {
      field: "MenuPrice",
      headerName: "MenuPrice",
      width: 120,
    },
    {
      field: "RevenueCentreName",
      headerName: "Revenue Centre ",
      width: 120,
    },
    {
      field: "ReasonText",
      headerName: "Reason Text",
      width: 120,
    },
    {
      field: "DeletedbyName",
      headerName: "Deleted by",
      width: 120,
    },
    {
      field: "ParentReasonText",
      headerName: "Parent Reason Text",
      width: 120,
    },
    {
      field: "Closedbyname",
      headerName: "Closedbyname",
      width: 120,
    },
  ];
  return (
    <div>
      <h1 className="mb-2 text-size text-color font-headingweight">
        Delete Sales Items
      </h1>

      <div className="text-sm">
        <div className="grid grid-cols-3 gap-3">
          <AntdSelectField
            control={control}
            label="Company"
            name={`company_name`}
            endpoint={API_ENDPOINTS.USER_TO_COMPANY}
            queryKey="company_name"
            valueKey="company_id"
            labelKey="company_name"
            responseWhich="result"
            rules={{ required: "Company is required." }}
            error={errors.company_name}
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
          <div>
            {/* Date Pickers */}
            <label className="text-color font-regularweight">From:</label>
            <input
              type="datetime-local"
              className="w-full border p-1 rounded-lg focus:outline-none"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-color font-regularweight">To:</label>
            <input
              type="datetime-local"
              className="w-full border p-1 rounded-lg focus:outline-none"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <CustomButton
            handleClick={exportToExcel}
            btntext={"Export to Excel"}
            addclass="my-2"
          />
          <CustomButton
            handleClick={handleFetchAllData}
            btntext={"Fetch Data"}
            addclass="my-2"
          />
        </div>
      </div>

      {dateFrom && dateTo ? (
        data && data.length > 0 ? (
          isLoading ? (
            <Loader />
          ) : (
            <div className="h-80">
              <MuiGernericTable
                columns={fieldsMapping}
                initialData={datafilter} // API se aane wala data yahan set kiya
                enableAdd={false}
                enableEdit={false}
                enableDelete={false}
                isSelect={false}
                onAddRow={(row) => console.log("text")}
                //  setSelectedRows={setSelectedIds}
                //  selectedRows={selectedIds}
                onSaveRow={(row) => console.log("text")}
                onDeleteRow={(row) => console.log("text")}
                validateRow={(row) => console.log("text")}
                enableScroll={false}
              />
            </div>
          )
        ) : (
          <div className="text-red-500 font-regularweight mt-4 text-center">
            No Data Available
          </div>
        )
      ) : (
        <div className="text-blue-500 font-regularweight text-center mt-4">
          📅 Please select a date range to view results.
        </div>
      )}
    </div>
  );
};

export default withPermissionCheck(MasterDataDelete, "delete-items");
