import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
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
    saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import ResizableTable from "../../components/table/ResizableTable";
import { formatNumberDisplay } from "../../utils/helper.function";
const SelectStatusList = [
    { value: "raw", label: "raw" },
    { value: "batch", label: "batch" },
    { value: "recipe", label: "recipe" },
];


const ProductInBatchRecipe = ({ departmentData }) => {
    const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.PRODUCT_IN_BATCH_RECIPE);
    const { mutate: fetchDataForExcel } = useGlobelApi(
        API_ENDPOINTS.PRODUCT_IN_BATCH_RECIPE
    );
    const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
    console.log(departmentData)
    const UserId = getFromLocalStorage("UserId");
    const [moduleData, setModuleData] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [offset, setOffset] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isDense, setIsDense] = useState(true);
    const [appliedFilters, setAppliedFilters] = useState(null);
    const [sortDirection, setSortDirection] = useState("DESC");
    const [useServerSorting, setUseServerSorting] = useState(false);
    const [sortField, setSortField] = useState("u.id");

    const limit = 0;
    const navigate = useNavigate();

    const handleFetchdata = (filter, reset = false, orderBy = "") => {

        const baseFilters = [
            { key: "pm.id", operator: "equal", value1: departmentData?.product_id, logical: "" },
            { key: "aptcd.comp_dept_id", operator: "equal", value1: departmentData?.comp_dept_id, logical: "" }
        ];

        const filters = filter ? [...baseFilters, ...filter] : baseFilters;

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

    const handleFetchExcelData = (filter) => {
        const baseFilters = [
            { key: "pm.id", operator: "equal", value1: departmentData?.product_id, logical: "" },
            { key: "aptcd.comp_dept_id", operator: "equal", value1: departmentData?.comp_dept_id, logical: "" }
        ];

        const filters = filter ? [...baseFilters, ...filter] : baseFilters;
        return new Promise((resolve, reject) => {
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
            const formattedData = data.map(item => ({
      ...item,

      base_unit_coverted: parseFloat(item.base_unit_coverted).toFixed(3),
      qty: parseFloat(item.qty).toFixed(3),
    }));

    const limitedData = formattedData.slice(0, 1000);
    
        const worksheet = XLSX.utils.json_to_sheet(limitedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, "product-usage.xlsx");
    };



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



    const fieldsMapping = [
        {
            key: "recipe_batch_type",
            label: "Product Type",
            width: 200,
            sortable: true,
            filterable: true,
        },
        {
            key: "recipe_batch_name",
            label: "Recipe Batch name",
            sortable: true,
            filterable: true,
            width: 210,
        },
        {
            key: "unit_name",
            label: "Unit",
            sortable: true,
            filterable: true,
            width: 200,
        },
        {
            key: "qty",
            label: "Quantity",
            sortable: true,
            filterable: true,
            width: 200,
            render: (value) => formatNumberDisplay(value),
        },
        {
            key: "base_unit_coverted",
            label: "Base Unit Coverted",
            sortable: true,
            filterable: true,
            width: 250,
            render: (value) => formatNumberDisplay(value),
        },
    ];


    useEffect(() => {
        handleFetchdata(null, true);
    }, []);
    useEffect(() => {
        handleFetchdata(null, true);
    }, [navigate]);

    return (
        <>
            <div>
                <h1 className="mb-2 text-size text-color font-headingweight">
                    Product Usage
                </h1>

                <div className="flex justify-between gap-3 my-2">
                    <div className="flex gap-2">
                        <CustomButton
                            btntext={"Export to Excel"}
                            icon={<FaFileExport />}
                            addclass="gap-1"
                            handleClick={exportToExcel}
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
                    </div>
                </div>

                <div className="">
                    <ResizableTable
                        data={moduleData || []}
                        columns={fieldsMapping}
                        isDense={isDense}
                        height="300px"
                        onSort={(key, direction) => {
                            if (useServerSorting) {
                                let dbField;
                                switch (key) {
                                    case "base_unit_coverted":
                                        dbField = "pm.status";
                                        break;
                                    case "qty":
                                        dbField = "pm.product_code";
                                        break;
                                    case "recipe_batch_name":
                                        dbField = "ump.description";
                                        break;
                                    case "unit_name":
                                        dbField = "pc.description";
                                        break;
                                    case "product_type":
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
                        scrollableId={"ProductList"}
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

export default withPermissionCheck(ProductInBatchRecipe, "Product-In-Batch-Recipe");