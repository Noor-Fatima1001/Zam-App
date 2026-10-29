import moment from "moment";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MuiGernericTable from "../../components/table/MuiGernericTable";
import CustomButton from "../../components/button/CustomButton";
import withPermissionCheck from "../../config/withPermissionCheck";
import Loader from "../../components/Loader";
import * as XLSX from "xlsx";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import {toast} from "react-toastify";
import AntdSelectField from "../../AntdSelectField";
import { useForm } from "react-hook-form";
import { getFromLocalStorage } from "../../config/crypto-file";

const MasterItems = () => {
  const {
    mutate,
    isPending,
    data: saleData,
  } = useGlobelApi(API_ENDPOINTS.GET_SALE_ITEMS);
  const { mutate: postData, isPending: postDataLoading } = useGlobelApi(
    API_ENDPOINTS.POST_DAILY_SALES
  );
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
  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();
  const Brand = import.meta.env.VITE_ROOT_USER || "";

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchPosts = async () => {
    const company_id=getValues("company_name")
    mutate({
      site: company_id,
      startDate: moment(dateFrom).format("DD MMM YYYY hh:mm").toLowerCase(),
      endDate: moment(dateTo).format("DD MMM YYYY hh:mm").toLowerCase(),
    });
  };
  const PostsaleData = async () => {
    if (saleData?.data) {
      postData(
        {
          dataInsert: saleData?.data,
        },
        {
          onSuccess: (res) => {
            if (res?.success) {
              toast.success(res?.data?.[0]?.message);
            } else {
              toast.error(res?.data?.[0]?.message);
            }
          },
          onError: () => {
            toast.error(res?.data?.[0]?.message);
          },
        }
      );
    }
  };

  const handleFetchAllData = () => {
    const company_id = getValues("company_name")
    if (dateFrom && dateTo && company_id ) {
      fetchPosts();
    }
  };
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(saleData?.data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "sales-items.xlsx");
  };

  const fieldsMapping = [
    {
      field: "company_name",
      headerName: "Company",
      width: 120,
    },
    {
      field: "bill_header_id",
      headerName: "bill header id",
      width: 120,
    },

    {
      field: "check_item_id",
      headerName: "Check Item ID",
      width: 120,
    },
    {
      field: "location_name",
      headerName: "Location",
      width: 120,
    },
    {
      field: "covers",
      headerName: "Covers",
      width: 120,
    },
    {
      field: "bill_total",
      headerName: "Bill Total",
      width: 120,
    },
    {
      field: "customer_table",
      headerName: "Customer Table",
      width: 120,
    },
    {
      field: "session_name",
      headerName: "Session",
      width: 120,
    },
    {
      field: "bill_waiter",
      headerName: "Bill Waiter",
      width: 120,
    },
    {
      field: "description",
      headerName: "Description",
      width: 120,
    },
    {
      field: "class_name",
      headerName: "Class ",
      width: 120,
    },
    {
      field: "category_name",
      headerName: "Category ",
      width: 120,
    },
    {
      field: "plu_code",
      headerName: "PLU Code",
      width: 120,
    },
    {
      field: "quantity",
      headerName: "Quantity",
      width: 120,
    },
    {
      field: "menu_price",
      headerName: "MenuPrice",
      width: 120,
    },
    {
      field: "items_total",
      headerName: "items total",
      width: 120,
    },
    {
      field: "net_sales",
      headerName: "net sales",
      width: 120,
    },
    {
      field: "revenue_centre_name",
      headerName: "Revenue Centre ",
      width: 120,
    }
  ];



  return (
    <div>
      <h1 className="mb-2 text-size text-color font-headingweight">Sales Items</h1>

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
          <CustomButton
            handleClick={PostsaleData}
            isLoading={postDataLoading}
            btntext={"Post Data"}
            addclass="my-2"
          />
        </div>
      </div>

      {dateFrom && dateTo ? (
        isPending ? (
          <Loader />
        ) : saleData?.data?.length > 0 ? (
          <div className="h-80">
            <MuiGernericTable
              columns={fieldsMapping}
              initialData={saleData?.data} // API se aane wala data yahan set kiya
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
        ) : (
          <div className="text-red-500 font-regularweight  mt-4 text-center">
            No Data Available
          </div>
        )
      ) : (
        <div className="text-customBlue font-regularweight text-center mt-4">
          📅 Please select a date range to view results.


        </div>
      )}
    </div>
  );
}

export default withPermissionCheck(MasterItems, "items");
