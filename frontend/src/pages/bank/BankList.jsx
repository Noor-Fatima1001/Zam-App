import moment from "moment";
import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdDelete, MdDeleteOutline, MdRefresh, MdRemove, MdSave } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import {
  getFromLocalStorage,
  saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import ResizableTable from "../../components/table/ResizableTable";
import { Modal } from "antd";
import InputField from "../../components/form-elements/InputField";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const BankList = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_BANK_LIST);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_BANK_LIST
  );
  const { mutate: addBank } = useGlobelApi(API_ENDPOINTS.ADD_BANK_LIST);
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
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

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
  const [sortField, setSortField] = useState("u.id");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModals, setEditModals] = useState(false);
  const [listmoduleData, setListModuleData] = useState(null);
  const limit = 10;
  const navigate = useNavigate();
  const handleFetchdata = (filter, reset = false, orderBy = "bl.id DESC") => {
    console.log("🚀 ~ handleFetchdata ~ filter:", filter);
    mutate(
      {
        filters: filter || null,
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
          const total = newUsers?.[0]?.totalRecords || 0;
          setTotalRecords(total);
          setHasMore((reset ? 0 : offset) + limit < total);          
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
    const data = await handleFetchExcelData(appliedFilters);
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
    XLSX.writeFile(workbook, "bank-list.xlsx");
  };

  const fields = [
    {
      name: "bl.bank_name",
      label: "Bank Name",
      type: "textServer",
      labelKey: "bank_name",
      ValueKey: "bank_name",
      endpoint: `${API_ENDPOINTS.GET_BANK_LIST}`,
      responseWhich: "data",
    },
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

  const fieldsMapping = [
    {
      key: "bank_name",
      label: "Bank Name",
      width: 200,
      sortable: true,
      filterable: true,
      // editable: true,
    },

    {
      key: "created_at",
      label: "Created at",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="">{ value? moment(value).format("DD-MM-YYYY") || "N/A":""}</span>
      ),
    },

  ];

  const handleActionClick = (action) => {
    if (action === "details") {
      saveToSessionStorage("BankList", selectedIds?.[0]);
      navigate(`${rootFolder}/bank-detail`);
    }
  };
  // const handleActionClick = (action) => {
  //   if (action === "edit") {
  //     saveToSessionStorage("productData", selectedIds?.[0]);
  //     navigate(`${rootFolder}/product-detail`);
  //   }
  // };



  const handleAddRow = () => {
    // Check if an editable row already exists
    const isRowAlreadyAdded = apiData.some(row => row?.isEditable);
    if (isRowAlreadyAdded) return;
    const newRow = {
      isEditable: true,
      bank_name: (
        <InputField
          placeholder="Enter name"
          register={register("bank_name", {
            required: "Name is required",
          })}
          defaultValue={""}
          error={errors.bank_name?.message}
        />
      ),
      created_at:""
    };

    setApiData([newRow, ...apiData]);
  };



  const handleSaveRow = () => {
    const bank_name = getValues("bank_name")
     if (
          !bank_name
        ) {
          toast.error("Bank name is required")
          // Swal.fire({
          //   icon: "error",
          //   title: "Error",
          //   text: "Bank Name is required",
          // });
          return; // prevent API call
        }
    const body = {
      dataInsert: {
        bank_name: bank_name,
        created_by: UserId,
      },
    };
    addBank(body, {
      onSuccess: (data) => {
        if (data.success) {
          handleFetchdata(appliedFilters, true)
          setValue("bank_name","")
          // handleFetchdata(appliedFilters,false)
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
    const isRowAlreadyAdded = apiData.some(row => row?.isEditable);
    if (isRowAlreadyAdded) {
      const newApiData = apiData.slice(1, -1);
      setApiData(newApiData);
    }
  };

  useEffect(() => {
    handleFetchdata(null, true);
  }, []);

  return (
    <>
      <div>
        <h1 className="mb-2 text-size text-color font-headingweight">Bank List</h1>

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
            <CustomButton
              btntext={"Add New"}
              handleClick={() =>
                handleAddRow()
                // setIsModalOpen(true)
                // navigate(`${rootFolder}/add-unit-list`)
              }
            />
            {
              apiData?.[0]?.isEditable ?
              <CustomButton
                  btntext={"Save"}
                  handleClick={() =>
                    handleSaveRow()
                  }
                />
                : null
            }
            {
              apiData?.[0]?.isEditable ?
                <CustomButton
                  btntext={"Cancel"}
                  handleClick={() =>
                    handleDeleteRow()
                    // setIsModalOpen(true)
                    // navigate(`${rootFolder}/add-unit-list`)
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
            <CustomButton
              btntext={<MdRefresh size={18} />}
              addclass={`w-6 rounded-radiusFull max-w-6 min-w-6 h-6 ${isPending && "animate-spin"
                } `}
              padding="p-0"
              rounded="rounded-full"
              handleClick={() => {
                setOffset(0);
                handleFetchdata(null, true);
              }}
            />
            <GenericActionBar
              selectedIds={selectedIds}
              onActionClick={handleActionClick}
              action={["details"]}
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
                  case "bank_name":
                    dbField = "bl.bank_name";
                    break;
                  case "created_at":
                    dbField = "bl.created_at";
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
            scrollableId={"UnitList"}
            onFilter={(filters) => console.log("Filters:", filters)}
            onSelectRow={(selectedData) => setSelectedIds(selectedData)}
            hasMore={hasMore}
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

export default withPermissionCheck(BankList, "bank-list");
