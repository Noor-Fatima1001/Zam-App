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
import moment from "moment";
import ResizableTable from "../../components/table/ResizableTable";
import { formatNumberDisplay } from "../../utils/helper.function";

const ItemPurchaseHistroy = ({ departmentData }) => {
    const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.ITEM_PURCHASE_ACTIVITY);
    const { mutate: fetchDataForExcel } = useGlobelApi(
        API_ENDPOINTS.ITEM_PURCHASE_ACTIVITY
    );

    const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

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
    const data = getFromSessionStorage("productToDeptData_card")
    const [company, setCompany] = useState({ company_id: data?.company_id, company_name: data?.company_name });
    const [dept_name, setDept_name] = useState({ dept_id: data?.com_dept_id, dept_name: data?.dept_name });
    const limit = 0;
    const navigate = useNavigate();
    const [totalLast, setTotal] = useState({
        base_unit_total_price: 0
    });

    const handleFetchdata = (filter, reset = false, orderBy = "posting_date DESC") => {
        const today = moment().format("YYYY-MM-DD");
        const oneMonthAgo = moment().subtract(1, "month").format("YYYY-MM-DD");
        const isPostingDate = filter?.find(item => item.key === "posting_date");
        const baseFilters = [
            { key: "product_id", operator: "equal", value1: departmentData?.product_id, logical: "" },
            {
                key: "c.id",
                operator: "equal",
                value1: company?.company_id,
                logical: "",
            },
            {
                key: "adtc.id",
                operator: "equal",
                value1: dept_name?.dept_id,
                logical: "",
            }
        ];

        const filters = filter ? [...baseFilters, ...filter] : baseFilters;

        if (!isPostingDate) {
            filters.push({

                key: "posting_date",

                operator: "between",
                value1: oneMonthAgo,
                value2: today,
                logical: ""
            });
        }

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
                    const lastRecord = data?.data[data?.data.length - 1]; // last item
                    if (lastRecord?.base_unit_total_price) {
                        setTotal(lastRecord);
                    }
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

        const today = moment().format("YYYY-MM-DD");
        const oneMonthAgo = moment().subtract(1, "month").format("YYYY-MM-DD");


        const isPostingDate = filter?.find(item => item.key === "posting_date");
        const baseFilters = [
            { key: "product_id", operator: "equal", value1: departmentData?.product_id, logical: "" },
            // { key: "status", operator: "equal", value1: "posted", logical: "" }
            {
                key: "c.id",
                operator: "equal",
                value1: company?.company_id,
                logical: "",
            },
            {
                key: "adtc.id",
                operator: "equal",
                value1: dept_name?.dept_id,
                logical: "",
            }
        ];

        const filters = filter ? [...baseFilters, ...filter] : baseFilters;

        if (!isPostingDate) {
            filters.push({

                key: "posting_date",

                operator: "between",
                value1: oneMonthAgo,
                value2: today,
                logical: ""
            });
        }

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
        const limitedData = data.slice(0, 1000);
        const worksheet = XLSX.utils.json_to_sheet(limitedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, "purchase-history.xlsx");
    };

    const fields = [
        {
            name: "posting_date",
            label: "Posting Date",
            type: "date",

            aliases: "",

        },
    ];

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
            key: "posting_date",
            label: "Posting Date",
            width: 200,
            sortable: true,
            filterable: true,
            render: (value) => (
                value ?
                    <span className="">{moment(value).format("DD-MM-YYYY") || "N/A"}</span>
                    : value
            ),
        },
        {
            key: "supplier_name",
            label: "Supplier Name",
            width: 330,

            sortable: true,
            filterable: true,
        },
        {
            key: "base_unit",
            label: "Base Unit",
            sortable: true,
            filterable: true,

            width: 150,

        },
        {
            key: "base_unit_qty",
            label: "Bu_Qty",
            sortable: true,
            filterable: true,

            width: 150,

        },
        {
            key: "qty",
            label: "Total Qty",
            sortable: true,
            filterable: true,
            width: 150,
            render: (value) => {
                return formatNumberDisplay(value)
            }
        },
        {
            key: "base_unit_price",
            label: "Bu_Price",
            sortable: true,
            filterable: true,

            width: 150,

        },
        {
            key: "base_unit_total_price",
            label: "Bu_Amount",
            sortable: true,
            filterable: true,
            width: 150,
            render: (value) => {
                return formatNumberDisplay(value)
            }
        },
        {
            key: "unit_selected",
            label: "Unit Selected",
            sortable: true,
            filterable: true,
            width: 200,
        },
        {
            key: "qty",
            label: "Us_Qty",
            sortable: true,
            filterable: true,

            width: 150,
            render: (value) => {
                return formatNumberDisplay(value)
            }
        },
        {
            key: "price",
            label: "Us_Price",
            sortable: true,
            filterable: true,

            width: 150,
            render: (value) => {
                return formatNumberDisplay(value)
            }
        },
        {
            key: "total_price",
            label: "Us_Amount ",
            sortable: true,
            filterable: true,
            width: 150,
            render: (value) => {
                return formatNumberDisplay(value)
            }
        }

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
        handleFetchdata(null, true);
    }, [navigate]);

    return (
        <>
            <div>
                <h1 className="mb-2 text-size text-color font-headingweight">
                    Purchase history
                </h1>

                <div>
                    <DynamicFilter
                        fields={fields}
                        onApply={handleApplyFilters}
                        onReset={handleResetFilters}
                    />
                </div>
                <div className="flex flex-wrap justify-between gap-3 my-2">
                    <div className="flex flex-wrap gap-2">
                        <CustomButton
                            btntext={"Export to Excel"}
                            icon={<FaFileExport />}
                            addclass="gap-1"
                            handleClick={exportToExcel}
                        />
                        {/* <CustomButton
                            btntext={"Add New"}
                            handleClick={() => {
                                sessionStorage.removeItem("recipeData")
                                navigate(`${rootFolder}/add-recipe`)
                            }}
                        /> */}
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
                        {/* <GenericActionBar
                            selectedIds={selectedIds}
                            onActionClick={handleActionClick}
                            action={["edit"]}
                        /> */}
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
                                    case "status":
                                        dbField = "pm.status";
                                        break;
                                    case "product_code":
                                        dbField = "pm.product_code";
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
                                    case "supplier_name":
                                        dbField = "sl.supplier_name";
                                        break;
                                    case "product_name":
                                        dbField = "pm.product_name";
                                        break;
                                    default:

                                        dbField = "product_id";

                                }
                                setSortField(dbField);
                                setSortDirection(direction.toUpperCase());
                                const orderbyString = `${dbField} ${direction.toUpperCase()}`;
                                setOffset(0);
                                handleFetchdata(appliedFilters, true, orderbyString);
                            }
                        }}
                        scrollableId={"ProductList"}
                        isSelect={false}
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
                <div>
                    <div className=" flex justify-end pr-4">
                        <div className="bg-gray-100 p-3 rounded-md shadow-sm d-flex justify-content-end flex-column ">
                            {
                                "Total:" + " " + totalLast?.base_unit_total_price
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default withPermissionCheck(ItemPurchaseHistroy, "purchase-history");