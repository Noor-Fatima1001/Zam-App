import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import InfiniteScroll from "react-infinite-scroll-component";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../../apis/client/api-endpoints";
import { useGlobelApi } from "../../../apis/useProduct/useCommon";
import Loader from "../../../components/Loader";
import CustomButton from "../../../components/button/CustomButton";
import DynamicFilter from "../../../components/form-elements/DynamicFilter";
import NewGenericTable from "../../../components/table/NewGenericTable";
import { getFromLocalStorage } from "../../../config/crypto-file";
import withPermissionCheck from "../../../config/withPermissionCheck";
import dayjs from "dayjs";
const SubMainHead = ({ SubHeadData }) => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_SUB_HEAD);
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_SUB_HEAD
  );

  const UserId = getFromLocalStorage("UserId");
  const [DataList, setDataList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false) => {
    const baseFilters = [
      {
        key: "cmh.head_name",
        operator: "contains",
        value1: SubHeadData?.main_head_name,
        logical: "",
      },
    ];
    const filters = filter ? [...baseFilters, ...filter] : baseFilters;
    mutate(
      { filters: filters, limit, offset: reset ? 0 : offset },
      {
        onSuccess: (data) => {
          const newUsers = data?.data || [];
          if (reset) {
            setDataList(newUsers);
          } else {
            setDataList((prevUsers) => [...prevUsers, ...newUsers]);
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
          key: "cmh.head_name",
          operator: "contains",
          value1: SubHeadData?.main_head_name,
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
      created_at: dayjs(item.created_at).format("DD-MM-YYYY"),
      updated_at: dayjs(item.updated_at).format("DD-MM-YYYY")
    }));
    
    const limitedData = formattedData.slice(0, 1000);
    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "main-head.xlsx");
  };
  useEffect(() => {
    handleFetchdata();
  }, []);

  const fields = [
    {
      name: "head_name",
      label: "Main Head",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_MAIN_HEAD}`,
      responseWhich: "data",
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
  const fieldsMapping = [{ field: "main_head_name", displayName: "Head" }];

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
        <div className="flex justify-between items-center  my-2">
          <div className="flex flex-wrap gap-2">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              handleClick={exportToExcel}
              addclass="gap-1"
            />
            <div className="flex gap-2">
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
            </div>
          </div>
          <CustomButton
            btntext={<MdRefresh size={18} />}
            addclass={`w-6 rounded-radiusFull max-w-6 min-w-6 h-6 ${isPending && "animate-spin"} `}
            padding="p-0"
            rounded="rounded-full"
            handleClick={() => {
              setOffset(0);
              handleFetchdata(null, true);
            }}          />
        </div>

        <div>
          <InfiniteScroll
            height={300}
            dataLength={DataList.length}
            // next={() => console.log("reached bottom")}
            next={() => handleFetchdata()}
            hasMore={hasMore}
            loader={isPending && <Loader />}
            endMessage={<p className="text-center mt-2">No more records</p>}
          >
            <NewGenericTable
              fieldsMapping={fieldsMapping}
              data={DataList}
              //   selectionMode="single"
              isSelected={false}
              isDense={isDense}
              // selectionMode="multiple"
              // link={"/update-company"}
            />
          </InfiniteScroll>
        </div>
      </div>
    </>
  );
};

export default withPermissionCheck(SubMainHead, "sub-main-head");
