import { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import GenericActionBar from "../../components/action-bar/GenericActionBar";
import CustomButton from "../../components/button/CustomButton";
import DynamicFilter from "../../components/form-elements/DynamicFilter";
import Loader from "../../components/Loader";
import ResizableTable from "../../components/table/ResizableTable";
import {
  getFromLocalStorage,
  getFromSessionStorage,
  saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import { concat } from "lodash";
// import AddProduct from "./AddProduct";
const SelectStatusList = [
  { value: "1", label: "Active" },
  { value: "0", label: "InActive" },
];
const SelectProductType = [
  { value: "recipe", label: "recipe" },
  { value: "batch", label: "batch" },
  // { value: "raw", label: "raw" },
];

const RecipeList = () => {
  const recipeCTD = getFromSessionStorage("recipeCTD");
  console.log(recipeCTD);
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.GET_PRODUCT_LIST);

  const { mutate: fetchProductsForDeptCreation } = useGlobelApi(
    API_ENDPOINTS.GET_DEPT_RECIPE_LIST
  );
  const { mutate: FetchEntries, isPending: EnteriesPending } = useGlobelApi(
    API_ENDPOINTS.GET_RECIPE_ENTRIES
  );

  const { mutate: FetchRecipeDetails, isPending: recipeDetailsPending } =
    useGlobelApi(API_ENDPOINTS.GET_RECIPE_DETAILS);

  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_PRODUCT_LIST
  );
  const { mutate: postPermission } = useGlobelApi(
    API_ENDPOINTS.UPDATE_PRODUCT_LIST
  );
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const [moduleData, setModuleData] = useState([]);
  console.log("🚀 ~ RecipeList ~ moduleData:", moduleData);
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
  const [jrEnteries, setJrEnteries] = useState([]);
  const [recipeDetails, setRecipeDetails] = useState([]);
  const [detailsTotal, setDetailsTotal] = useState(0);
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderBy = "pm.id DESC") => {
    const baseFilters = [
      { key: "pm.product_type", operator: "in", value1: "batch,recipe" },
    ];

    const filters = filter ? [...filter] : baseFilters;

    mutate(
      {
        filters: filters || null,
        limit,
        offset: reset ? 0 : offset,
        orderby: orderBy,
      },
      {
        onSuccess: (data) => {
          console.log("🚀 ~ handleFetchdata ~ data:", data);
          const newUsers = data?.data || [];
          if (reset) {
            setModuleData(newUsers);
            setOffset(limit);
          } else {
            setModuleData((prevUsers) => [...prevUsers, ...newUsers]);
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

  const handleFetchEntries = () => {
    FetchEntries(
      {
        headerData: {
          parent_product_id: selectedIds?.[0]?.record_id,
        },
        filters: null,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (response) => {
          setJrEnteries(response?.data);
        },
        onError: (err) => {
          console.log(err);
        },
      }
    );
  };

  const handleFetchExcelData = (filter) => {
    return new Promise((resolve, reject) => {
      const baseFilters = [
        { key: "pm.product_type", operator: "in", value1: "batch,recipe" },
      ];

      const filters = filter ? [...filter] : baseFilters;
      fetchDataForExcel(
        { filters: filters || null, limit: 0, offset: 0 },
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
    XLSX.writeFile(workbook, "product.xlsx");
  };

  const fields = [
    {
      name: "pm.product_name",
      label: "product name",
      type: "textServer",
      labelKey: "product_name",
      ValueKey: "product_name",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
      concatenateLable: "product_type",
    },
    {
      name: "pcp.description",
      label: "Main category ",
      type: "textServer",
      labelKey: "main_category",
      ValueKey: "main_category",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    {
      name: "pc.description",
      label: "Sub category ",
      type: "textServer",
      labelKey: "sub_category",
      ValueKey: "sub_category",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    {
      name: "pm.product_code",
      label: "product code",
      type: "textServer",
      labelKey: "product_code",
      ValueKey: "product_code",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    {
      name: "pm.plu_code",
      label: "PLU Code",
      type: "textServer",
      labelKey: "plu_code",
      ValueKey: "plu_code",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    // {
    //   name: "pm.product_type",
    //   label: "Product Type",
    //   type: "textServer",
    //   labelKey: "product_type",
    //   ValueKey: "product_type",
    //   endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
    //   responseWhich: "data",
    // },
    {
      name: "product_type",
      label: "Product Type",
      type: "select",
      aliases: "pm.",
      options: SelectProductType,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      aliases: "pm.",
      options: SelectStatusList,
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
  const handlePermissionChange = async (row, updatedPermission) => {
    console.log("🚀 ~ handlePermissionChange ~ row:", row);
    const body = {
      dataUpdate: {
        record_id: row.record_id,
        product_code: row?.product_code || "",
        product_name: row?.product_name || "",
        product_category_id: row?.product_category_id || "",
        base_unit_id: row?.base_unit_id || "",
        status: updatedPermission ? 1 : 0,
        changed_by: UserId,
      },
    };
    try {
      postPermission(body, {
        onSuccess: (data) => {
          if (data.success) {
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
            setModuleData((prevData) =>
              prevData.map((item) =>
                item.record_id === row.record_id
                  ? { ...item, status: !updatedPermission }
                  : item
              )
            );
          }
        },
        onError: (error) => {
          toast.error("Something went wrong")
          // Swal.fire({
          //   title: "Error",
          //   text: "Something went wrong",
          //   icon: "error",
          // });
          setModuleData((prevData) =>
            prevData.map((item) =>
              item.record_id === row.record_id
                ? { ...item, status: !updatedPermission }
                : item
            )
          );
        },
      });
    } catch (error) {
      setModuleData((prevData) =>
        prevData.map((item) =>
          item.record_id === row.record_id
            ? { ...item, status: !updatedPermission }
            : item
        )
      );
    }
  };

  const handlePermissionToggle = (row) => {
    const updatedPermission = !row.status;
    setModuleData((prevData) =>
      prevData.map((item) =>
        item.record_id === row.record_id
          ? { ...item, status: updatedPermission }
          : item
      )
    );
    handlePermissionChange(row, updatedPermission);
  };

  const fieldsMapping = [
    {
      key: "product_name",
      label: " Name",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "main_category",
      label: "Main Category",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "sub_category",
      label: "Sub Category",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "base_unit",
      label: "Unit",
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: "product_code",
      label: "Product Code",
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: "plu_code",
      label: "PLU CODE",
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: "product_type",
      label: "Type",
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: "status",
      label: "status ",
      sortable: true,
      filterable: true,
      width: 150,
      render: (value, row) => {
        return (
          <div className="pt-2">
            <label className="switch">
              <input
                type="checkbox"
                checked={row?.status}
                onChange={() => handlePermissionToggle(row)}
              />
              <span className="slider"></span>
            </label>
          </div>
        );
      },
    },
  ];

  const EnteriesfieldsMapping = [
    {
      key: "product_code",
      label: "Product Code",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "product_name",
      label: "Product Name",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "unit_selected",
      label: "Unit",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "qty",
      label: "Quantity",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "base_unit_coverted",
      label: "Unit Coverted",
      width: 200,
      sortable: true,
      filterable: true,
    },
  ];
  const recipesfieldsMapping = [
    {
      key: "parent_name",
      label: "Parent Product Name",
      width: 300,
      sortable: true,
      filterable: true,
    },
    {
      key: "child_name",
      label: "Child Product Name",
      width: 300,
      sortable: true,
      filterable: true,
    },
    {
      key: "product_type",
      label: "Product Type",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "unit_selected_name",
      label: "Unit Selected",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "qty",
      label: "Quantity",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "cost",
      label: "Cost",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "base_unit_name",
      label: "Base Unit",

      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "base_unit_coverted",
      label: "Unit Converted",

      width: 200,
      sortable: true,
      filterable: true,
    },

    {
      key: "final_qty",
      label: "Final Quantity",

      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "path",
      label: "Path",
      width: 300,

      sortable: true,
      filterable: true,
    },
  ];

  const handleActionClick = (action) => {
    if (action === "edit") {
      saveToSessionStorage("recipeData", selectedIds?.[0]);
      navigate(`${rootFolder}/add-recipe`);
    }
  };

  useEffect(() => {
    handleFetchdata(null, true);
  }, []);
  useEffect(() => {
    handleFetchEntries();
    // handleRecipeDetailsData();
  }, [selectedIds]);

  return (
    <>
      <div>
        <div className="text-end text-color">
          {recipeCTD ? "Company:" + " " + recipeCTD?.company_name : null}
        </div>
        <div className="text-end text-color">
          {recipeCTD ? "Dept:" + " " + recipeCTD?.dept_name : null}
        </div>
        <h1 className="mb-2 text-size text-color font-headingweight">
          Batch & Recipe List
        </h1>

        <div>
          <DynamicFilter
            fields={fields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
        <div className="flex justify-between gap-3 my-2.5">
          <div className="flex flex-wrap gap-2">
            <CustomButton
              btntext={"Export to Excel"}
              icon={<FaFileExport />}
              addclass="gap-1"
              handleClick={exportToExcel}
            />
            <CustomButton
              btntext={"Add New"}
              handleClick={() => {
                sessionStorage.removeItem("recipeData");
                navigate(`${rootFolder}/add-recipe`);
              }}
            />
            <div className=" d-flex align-items-center">
              <label className="me-2 text-color font-regularweight">
                Dense Rows
              </label>
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
              <span className="me-2 text-color font-regularweight">
                server-side sorting
              </span>
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
              addclass={`w-6 rounded-radiusFull max-w-6 min-w-6 h-6 ${
                isPending && "animate-spin"
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
              action={["edit"]}
            />
          </div>
        </div>

        <div className="">
          <ResizableTable
            data={moduleData || []}
            columns={fieldsMapping}
            isDense={isDense}
            height="300px"
            // className="my-4"
            onSort={(key, direction) => {
              if (useServerSorting) {
                let dbField;
                switch (key) {
                  case "status":
                    dbField = "pm.status";
                    break;
                  case "product_code":
                    dbField = "pm.product_code";
                    break;
                  case "plu_code":
                    dbField = "pm.plu_code";
                    break;
                  case "base_unit":
                    dbField = "ump.description";
                    break;
                  case "sub_category":
                    dbField = "pc.description";
                    break;
                  case "main_category":
                    dbField = "pcp.description";
                    break;
                  case "product_name":
                    dbField = "pm.product_name";
                    break;
                  default:
                    dbField = "pm.id";
                }
                setSortField(dbField);
                setSortDirection(direction.toUpperCase());
                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                setOffset(0);
                handleFetchdata(appliedFilters, true, orderbyString);
              }
            }}
            scrollableId={"RecipeList"}
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
          <div className="">
            {selectedIds &&
              selectedIds?.length > 0 &&
              jrEnteries &&
              jrEnteries?.length > 0 &&
              (EnteriesPending ? (
                <Loader />
              ) : (
                <div className="card mt-4 shadow-lg border-0 rounded-lg">
                  <div className="p-2 text-white ">
                    <h2 className="p-0 m-0 text-size text-color font-headingweight">
                      Enteries
                    </h2>
                  </div>
                  <div className="">
                    <ResizableTable
                      data={jrEnteries || []}
                      columns={EnteriesfieldsMapping}
                      isDense={isDense}
                      height="300px"
                      scrollableId={"RecipeEntries"}
                      onFilter={(filters) => console.log("Filters:", filters)}
                      onSelectRow={(selectedData) =>
                        setSelectedIds(selectedData)
                      }
                      hasMore={false}
                      enableScroll={true}
                      onLoadMore={() =>
                        handleFetchdata(appliedFilters, false, "jh.id DESC")
                      }
                      loading={isPending}
                      isSelect={false}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default withPermissionCheck(RecipeList, "recipe-list");
