import moment from "moment";
import React, { Component, useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import Loader from "../../components/Loader";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import {
  getFromLocalStorage,
  getFromSessionStorage,
  saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import ResizableTable from "../../components/table/ResizableTable";
import {toast} from "react-toastify";
import { formatNumberDisplay, formatUnderScoreValue } from "../../utils/helper.function";
import dayjs from "dayjs";
import AntdSelectField from "../../AntdSelectField";
import InputField from "../../components/form-elements/InputField";
import { useForm } from "react-hook-form";
import { Checkbox } from "antd";
import useCheckPermission from "../../config/useCheckPermission";
const ClosingStockList = () => {

  const {
    control,
    errors,
    getValues,
  } = useForm();

  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.CLOSING_STOCK_HEADER
  );
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.CLOSING_STOCK_HEADER
  );
  const { mutate: EnteriesMutate, isPending: EnteriesPending } = useGlobelApi(
    API_ENDPOINTS.CLOSING_STOCK_ENTRIES
  );
  const { mutate: fetchEntriesForExcel } = useGlobelApi(
    API_ENDPOINTS.CLOSING_STOCK_ENTRIES
  );
  const { mutate: UserCompanyMutate, data: userCompanyData } = useGlobelApi(
    API_ENDPOINTS.USER_TO_COMPANY
  );
  const { mutate: createClosingStock, isPending: ClosingStockPending } = useGlobelApi(
    API_ENDPOINTS.CREATE_STOCK_LIST
  );
  const { mutate: lockVariance } = useGlobelApi(
    API_ENDPOINTS.LOCK_FOR_VARIANCE
  );
  const { mutate: unLockVariance } = useGlobelApi(
    API_ENDPOINTS.UNLOCK_FOR_VARIANCE
  );
  const { mutate: postVariance } = useGlobelApi(
    API_ENDPOINTS.POST_VARIANCE
  );

  // i want filter the ides and  show ths format {1,2,4} in object
  const CompanyIds = userCompanyData?.result
    ? userCompanyData.result.map((item) => item?.company_id).join(",")
    : "";
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const [apiData, setApiData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [jrEnteries, setJrEnteries] = useState([]);
  console.log("🚀 ~ JournalVoucher ~ jrEnteries:", jrEnteries);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const [sortField, setSortField] = useState("csl.id");
  const limit = 10;
  const navigate = useNavigate();
  const createOrderData = getFromSessionStorage("createOrderData");

  const postVariancePermission = useCheckPermission("post-variance", UserId);

  const handleFetchdata = (filter, reset = false, orderBy = "csl.id DESC") => {
  
    if (!CompanyIds || CompanyIds?.length === 0) {
      console.error("CompanyIds is required but missing or empty.");
      return;
    }
    const baseFilters = [
      { key: "c.id", operator: "in", value1: CompanyIds, logical: "" },
    ];
    const filters = filter ? [...baseFilters, ...filter] : baseFilters;
    mutate(
      {
        headerData: {
          comp_to_dept_id: createOrderData?.com_dept_id,
        },
        filters: filters,
        limit,
        offset: reset ? 0 : offset,
        orderby: "",
        orderby: orderBy,
      },
      {
        onSuccess: (data) => {
          const newData = data?.data || [];
          if (reset) {
            setApiData(newData);
            setOffset(limit);
          } else {
            setApiData((prevUsers) => [...prevUsers, ...newData]);
            setOffset((prevOffset) => prevOffset + limit);
          }
          const total = newData?.[0]?.totalRecords || 0;
          setTotalRecords(total);
          setHasMore(
            newData.length > 0 && (reset ? limit : offset + limit) < total
          );
          console.log("newData.length:", newData.length);
          console.log("Offset + Limit:", offset + newData.length);
          console.log("Total Records:", total);
          console.log(
            "Has More:",
            newData.length > 0 &&
            (reset ? limit : offset + newData.length) < total
          );
          console.log(hasMore);
        },
        onError: (error) => {
          console.error("Error fetching ", error);
        },
      }
    );
  };
  const handleFetchExcelData = (filter) => {
    return new Promise((resolve, reject) => {
      fetchDataForExcel(
        {
          headerData: {
            comp_to_dept_id: createOrderData?.com_dept_id,
          },
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
  const handleFetchEntriesExcelData = (filter) => {
    return new Promise((resolve, reject) => {
      fetchEntriesForExcel(
        {
          filters: [{ key: "cse.closing_stock_id", operator: "equal", value1: selectedIds?.[0]?.closing_stock_list_id, logical: "" }],
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
    const formattedData = data.map(item => ({
      ...item,
      stock_count_date: dayjs(item.stock_count_date).format("DD-MM-YYYY"),
    }));

    const limitedData = formattedData.slice(0, 1000);
    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "closing-stock.xlsx");
  };
  const exportEntriesToExcel = async () => {
    const data = await handleFetchEntriesExcelData(appliedFilters);
    const formattedData = data.map(item => ({
      ...item,
      delivery_date: dayjs(item.delivery_date).format("DD-MM-YYYY"),
      order_date: dayjs(item.order_date).format("DD-MM-YYYY"),
      posting_date: dayjs(item.posting_date).format("DD-MM-YYYY")
    }));

    const limitedData = formattedData.slice(0, 5000);
    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "closing-stock-entries.xlsx");
  };
  const fields = [
    {
      name: "csl.id",
      label: "Document ID",
      type: "text",
    },
    {
      name: "company_name",
      label: "Company name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_COMPANY}`,
      responseWhich: "data",
      aliases: "c.",
    },
    {
      name: "stock_count_date",
      label: "Stock Count Date",
      type: "date",
      aliases: "csl.",
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


  const handleLockVariance = (record_id) => {
    lockVariance({
      dataInsert: {
        record_id: record_id,
        created_by: UserId
      }
    }, {
      onSuccess: (response) => {
        const data = response?.data?.[0];
        handleFetchdata(null, true)
        if (data.msgtype === "success") {
          toast.success("Locked For variance succesfuly");
        }
        if (data?.msgType === "error") {
          toast.error(data?.message);
        }
      },
      onError: (err) => {
        toast.error(err);
      }
    })
  }
  const HandleUnLockVariance = (record_id) => {
    unLockVariance({
      dataInsert: {
        record_id: record_id,
        created_by: UserId
      }
    }, {
      onSuccess: (response) => {
        const data = response?.data?.[0];
        handleFetchdata(null, true)
        if (data.msgtype === "success") {
          toast.success("UnLocked For variance succesfuly");
        }
        if (data?.msgType === "error") {
          toast.error(data?.message);
        }
      },
      onError: (err) => {
        toast.error(err); 
      }
    })
  }
  const HandlePostVariance = (record_id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to proceed with this action?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, proceed!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        postVariance({
          dataInsert: {
            record_id: record_id,
            created_by: UserId
          }
        }, {
          onSuccess: (response) => {
            const data = response?.data?.[0];
            if (data.msgtype === "success") {
              toast.success(data?.message);
              handleFetchdata(null, true)
            }
            if (data?.msgType === "error") {
              toast.error(data?.message);
            }
          },
          onError: (err) => {
            toast.error(err);
          }
        })
      }
    })
  }

  const fieldsMapping = [
    {
      key: "closing_stock_list_id",
      label: "Document ID",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "company_name",
      label: "Company",
      width: 350,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        row?.dept_name ?
          <span className="">
            {value + "-" + row?.dept_name || ""}
          </span>
          : value
      ),
    },
    {
      key: "stock_count_date",
      label: "Stock Count Date",
      width: 250,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        row?.stock_count_date && !row.isEditable ?
          <span className="">
            {moment(row?.stock_count_date).format("DD-MM-YYYY") || "N/A"}
          </span>
          : value
      ),
    },
    {
      key: "Lock",
      label: "Lock",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        row?.status === "save" ?
          <div className="d-flex justify-content-center" >
            <Checkbox checked={false} onClick={() => { handleLockVariance(row?.closing_stock_list_id) }} />
          </div>
          :
          <div className="d-flex justify-content-center" >
            <Checkbox checked={true} onClick={() => { HandleUnLockVariance(row?.closing_stock_list_id) }} />
          </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: 150,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        row?.status?.toLowerCase() == "posted" ?
          <span className="capitalize text-success fw-bold">{formatUnderScoreValue(row?.status)}</span>
          :
          <span className="capitalize text-warning fw-bold">{formatUnderScoreValue(row?.status)}</span>
      ),
    },
    ...(postVariancePermission?.permission
      ? [
        {
          key: "Post",
          label: "Post",
          sortable: false,
          filterable: false,
          render: (value, row) =>
            row?.status?.toLowerCase() === "posted" ? (
              <span className="capitalize text-warning fw-bold"></span>
            ) : (
              <CustomButton
              btntext={"Post"}
              handleClick={() => {
                HandlePostVariance(row?.closing_stock_list_id);
              }}
              />
            ),
        },
      ]
      : []),
  ];
  // === enteries
  const EnteriesfieldsMapping = [
    {
      key: "location_name",
      label: "Location Name",
      width: 250,
      sortable: true,
      filterable: true,
      sortable: true,
    },
    {
      key: "product_name",
      label: "Product Name",
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: "product_category",
      label: "Category",
      width: 250,
      sortable: true,
      filterable: true,
    },
    {
      key: "unit_selected_name",
      label: "Unit Selected",
      sortable: true,
      filterable: true,
      width: 250,
    },
    {
      key: "us_qty",
      label: "US_Qty",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "unit_base_name",
      label: "Base Unit",
      sortable: true,
      filterable: true,
      width: 150,
    },
    {
      key: "bu_qty",
      label: "Bu_Qty",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => formatNumberDisplay(value),
    },
  ];
  const handleActionClick = (action) => {
    if (action === "detail") {
      if (selectedIds?.[0]) {
        const queryData = {
          data: selectedIds?.[0],
        };
        saveToSessionStorage("closing-stock-module-data", queryData);
        navigate(`${rootFolder}/create-closing-stock`);
      }
    }
  };

  const handleCopy = () => {
    if (selectedIds?.[0]) {
      const queryData = {
        data: selectedIds?.[0],
        iscopy: true,
      };

      saveToSessionStorage("closing-stock-module-data", queryData);

      navigate(`${rootFolder}/create-closing-stock`);
    }
  };
  const handleLedger = () => {
    if (selectedIds?.[0]) {
      const queryData = {
        data: selectedIds?.[0],
      };
      if (queryData.data.closting_stock_status.toLowerCase() === "finished") {
        toast.error("Delivery of finised order cannot be recived.")
      } else {
        if (queryData?.data?.status === "sent") {
          saveToSessionStorage("item-ledger-data", queryData);
          saveToSessionStorage("ledger-source", "closting_stock");
          navigate(`${rootFolder}/itemledger`);
        } else {
          toast.error("Order must be in send status to create delivery")
        }
      }
    }

  };


  useEffect(() => {
    if (CompanyIds) {
      handleFetchdata();
    }
  }, [userCompanyData, CompanyIds]);

  useEffect(() => {
    if (selectedIds && selectedIds?.[0]?.closing_stock_list_id) {
      EnteriesMutate(
        {
          // headerData: {
          //   closting_stock_id: selectedIds?.[0]?.closing_stock_list_id,
          // },
          filters: [{ key: "cse.closing_stock_id", operator: "equal", value1: selectedIds?.[0]?.closing_stock_list_id, logical: "" }],
          limit: 0,
          offset: 0,
        },
        {
          onSuccess: (res) => {
            if (selectedIds) {
              setJrEnteries(res?.data || []);
            }
          },
          onError: (error) => {
            console.error("Error fetching ", error);
          },
        }
      );
    }
  }, [selectedIds]);
  useEffect(() => {
    UserCompanyMutate({
      filters: [
        {
          key: "auc.user_id",
          operator: "equal",
          value1: UserId,
          logical: "",
        },
        { key: "auc.status", operator: "equal", value1: "1", logical: "" },
      ],
      limit: 0,
      offset: 0,
    });
  }, []);

  const addRow = () => {
    const alreadyRowPresent = apiData?.filter(item => item.isEditable == true);
    if (alreadyRowPresent.length > 0) {
      return
    }
    const newRow = {
      isEditable: true,
      company_name: <AntdSelectField
        control={control}
        name={`company_name`}
        endpoint={API_ENDPOINTS.USER_TO_COMPANY}
        queryKey="company_name"
        valueKey="company_id"
        labelKey="company_name"
        responseWhich="result"
        rules={{ required: "Company is required." }}
        error={errors?.company_name}
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
      />,
      stock_count_date: <InputField
        control={control}
        type="date"
        register="stock_count_date"
        rules="Stock Count Date is required"
        error={errors?.stock_count_date}
      />
    }
    setApiData([newRow, ...apiData])
  }

  const handleSaveRow = () => {
    const company_id = getValues("company_name")?.value || getValues("company_name");
    const stock_count_date = getValues("stock_count_date")?.value || getValues("stock_count_date");

    if (
      !company_id ||
      !stock_count_date
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
        header: {
          company_id,
          stock_count_date: moment(stock_count_date).format("YYYY-MM-DD"),
          status: "save",
          created_by: UserId,
        }
      },
    };
    createClosingStock(body, {
      onSuccess: (response) => {
        const data = response?.data?.[0];
        if (data.success) {
          handleFetchdata(appliedFilters, true);
          handleDeleteRow();
          reset();
          toast.success(data?.message)
          // Swal.fire({
          //   icon: "success",
          //   title: "Success",
          //   text: data?.message,
          // });
        } else {
          toast.error(data?.message)
          // Swal.fire({
          //   icon: "error",
          //   title: "Error",
          //   text: data?.message,
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
  }
  useEffect(() => {
    apiData
  }, [apiData])

  return (
    <>
      <div>
        <h1 className="mb-1 text-size text-color font-headingweight">
          Closing Stock
        </h1>
        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex justify-between items-center my-2">
          <div className="flex flex-wrap gap-2 ">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              handleClick={exportToExcel}
              addclass="gap-1"
            />
            <CustomButton
              btntext={"Add New"}
              handleClick={() => {
                addRow()
              }}
            />
            {
              apiData.some((row) => row.isEditable) ? (
                <>
                  <CustomButton
                    btntext={"Save"}
                    handleClick={() => {
                      handleSaveRow()
                    }}
                  />
                  <CustomButton
                    btntext={"Cancel"}
                    handleClick={() => {
                      handleDeleteRow()
                    }}
                  />
                </>
              )
                :
                null
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
              action={["detail"]}
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
                  case "company_name":
                    dbField = "c.company_name";
                    break;
                  case "stock_count_date":
                    dbField = "csl.stock_count_date";
                    break;
                  case "status":
                    dbField = "csl.status";
                    break;
                  default:
                    dbField = "";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            onFilter={(filters) => console.log("Filters:", filters)}
            onSelectRow={(selectedData) => setSelectedIds(selectedData)}
            hasMore={hasMore}
            scrollableId={"PurchaseOrderList"}
            enableScroll={true}
            disableInternalSort={useServerSorting}
            onLoadMore={() =>
              handleFetchdata(
                appliedFilters,
                false,
                useServerSorting ? `${sortField} ${sortDirection}` : "csl.id DESC"
              )
            }
            loading={isPending}
          />
        </div>

        <div>
          {selectedIds &&
            selectedIds?.length > 0 &&
            jrEnteries &&
            jrEnteries?.length > 0 &&
            (EnteriesPending ? (
              <Loader />
            ) : (
              <div>


                <div className="my-3">
                  <div className="text-white">
                    <h2 className="  p-0 m-0 text-size text-color font-headingweight">Enteries</h2>
                  </div>
                  <CustomButton
                    btntext={"Export to Excel"}
                    icon={<FaFileExport />}
                    handleClick={exportEntriesToExcel}
                    addclass="gap-1"
                  />
                  <div className="">
                    <ResizableTable
                      data={jrEnteries || []}
                      columns={EnteriesfieldsMapping}
                      isDense={isDense}
                      height="300px"
                      isSelect={false}
                      scrollableId={"ItemLedgerListEntries"}
                      hasMore={false}
                      loading={isPending}
                    />
                  </div>

                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default withPermissionCheck(ClosingStockList, "closing-stock-list");
