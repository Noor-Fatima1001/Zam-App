import moment from "moment";
import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { useGetCompany } from "../../apis/useProduct/useCompany";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import ResizableTable from "../../components/table/ResizableTable";
import {
  getFromLocalStorage,
  saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import { Modal } from "antd";
import Createcompany from "./createcompany";
import dayjs from "dayjs";
const CreateCompany = () => {
  const { mutate, isPending } = useGetCompany();
  const { mutate: fetchDataForExcel } = useGlobelApi(API_ENDPOINTS.GET_COMPANY);
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");

  const [companyData, setCompanyData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDense, setIsDense] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortField, setSortField] = useState("c.id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [useServerSorting, setUseServerSorting] = useState(false);
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderby = "c.id DESC") => {
    mutate(
      {
        filters: filter || null,
        limit,
        offset: reset ? 0 : offset,
        orderby: orderby,
      },
      {
        onSuccess: (data) => {
          const newUsers = data?.data || [];

          if (reset) {
            setCompanyData(newUsers);
            setOffset(limit);
          } else {
            setCompanyData((prevUsers) => [...prevUsers, ...newUsers]);
            setOffset((prevOffset) => prevOffset + limit);
          }
          const total = newUsers?.[0]?.totalRecords || 0;
          setTotalRecords(total);
          setHasMore(
            newUsers.length > 0 && (reset ? limit : offset + limit) < total
          );
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
    // const limitedData = data?.slice(0, 1000);

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "company-list.xlsx");
  };

  const fields = [
    { name: "company_code", label: "Code", type: "text" },
    { name: "company_phone", label: "Phone", type: "text" },
    { name: "company_address", label: "Address", type: "text" },
    {
      name: "company_name",
      label: "Comapny Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.GET_COMPANY}`,
      responseWhich: "data",
    },
    {
      name: "user_name",
      aliases: "u .",
      label: "Created by",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.USERS}`,
      responseWhich: "result",
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
  const fieldsMapping = [
    {
      key: "company_code",
      label: "Code",
      width: 200,
      sortable: true,
      filterable: true,
      // render: (value) => `${value} years`
    },
    {
      key: "company_name",
      label: "Name",
      width: 200,
      sortable: true,
      filterable: true,
      // render: (value) => `${value} years`
    },
    {
      key: "company_phone",
      label: "Phone",
      width: 200,
      sortable: true,
      filterable: true,
      // render: (value) => `${value} years`
    },
    {
      key: "company_address",
      label: "Address",
      width: 200,
      sortable: true,
      filterable: true,
      // render: (value) => `${value} years`
    },
    {
      key: "user_name",
      label: "Created by",
      width: 200,
      sortable: true,
      filterable: true,
      // render: (value) => `${value} years`
    },
    {
      key: "created_at",
      label: "Created at",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="">{moment(value).format("DD-MM-YYYY") || "N/A"}</span>
      ),
    },
  ];
  const handleActionClick = (action) => {
    if (action === "detail") {
      saveToSessionStorage("CompanyData", selectedIds?.[0]);
      navigate(`${rootFolder}/company-detail`);
    }
  };

  useEffect(() => {
    handleFetchdata(null, true);
  }, []);
  useEffect(() => {
    setIsModalOpen(false)
  }, [navigate]);
  return (
    <>
      <div>
        <h1 className="mb-2 text-size text-color font-headingweight">Company List</h1>

        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>

        <div className="flex justify-between gap-3 my-2">
          <div className="flex flex-wrap gap-2 items-center">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              handleClick={exportToExcel}
              addclass="gap-1"
            />
            <CustomButton
              btntext={"Add New"}
              handleClick={() => setIsModalOpen(true)}
            // handleClick={() => navigate(`${rootFolder}/addcompany`)}
            />
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

        <ResizableTable
          data={companyData || []}
          columns={fieldsMapping}
          isDense={isDense}
          height="300px"
          // className="my-4"
          onSort={(key, direction) => {
            if (useServerSorting) {
              let dbField;
              switch (key) {
                case "company_code":
                  dbField = "c.company_code";
                  break;
                case "company_name":
                  dbField = "c.company_name";
                  break;
                case "company_phone":
                  dbField = "c.company_phone";
                  break;
                case "company_address":
                  dbField = "c.company_address";
                  break;
                case "user_name":
                  dbField = "u.user_name"; // adjust based on your actual field name
                  break;
                case "created_at":
                  dbField = "c.created_at";
                  break;
                default:
                  dbField = "c.id";
              }
              setSortField(dbField);
              setSortDirection(direction.toUpperCase());
              const orderbyString = `${dbField} ${direction.toUpperCase()}`;
              setOffset(0);
              handleFetchdata(appliedFilters, true, orderbyString);
            }
          }}
          onFilter={(filters) => console.log("Filters:", filters)}
          defaultSort={{ key: "company_code", direction: "asc" }}
          // defaultSort={{ }}
          onSelectRow={(selectedData) => setSelectedIds(selectedData)}
          hasMore={hasMore}
          scrollableId={"companieslist"}
          enableScroll={true}
          disableInternalSort={useServerSorting}
          // onLoadMore={() => handleFetchdata(appliedFilters)}
          onLoadMore={() =>
            handleFetchdata(
              appliedFilters,
              false,
              useServerSorting ? `${sortField} ${sortDirection}` : "c.id DESC"
            )
          }
          loading={isPending}
        />
      </div>
      <Modal
        title="Create Company"
        open={isModalOpen}
        footer={null}
        onCancel={() => {
          setIsModalOpen(false);
        }}
        centered
      >
        <Createcompany setIsModalOpen={setIsModalOpen} />
      </Modal>
    </>
  );
};

export default withPermissionCheck(CreateCompany, "companieslist");
