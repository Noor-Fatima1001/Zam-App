import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import * as yup from "yup";
import {toast} from "react-toastify";
import { MdDelete } from "react-icons/md";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { getFromLocalStorage, getFromSessionStorage } from "../../config/crypto-file";
import {  filterAndSortData } from "../../utils/helper.function";
import withPermissionCheck from "../../config/withPermissionCheck";
import CustomButton from "../../components/button/CustomButton";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import InputField from "../../components/form-elements/InputField";
import Loader from "../../components/Loader";
import ResizableTable from "../../components/table/ResizableTable";
import InputFieldTable from "../../components/form-elements/InputFieldTable";
import AntSSelectField from "../../AntSSelectField";
import AntSelectFieldTable from "../../AntSelectFieldTable";

const CreateManualSales = () => {
    const schema = yup.object().shape({
        posting_date: yup.string().required("Posting Date is required"),
        items: yup
            .array()
            .of(
                yup.object().shape({
                    unit_selected: yup.string().required("Unit is required"),
                    us_qty: yup
                        .string()
                        .required("Quantity is required")
                })
            )
            .min(1, "At least one item is required"),
    });

    const { data: sessionData, iscopy } = getFromSessionStorage("manual-sales-data") || {};
    const ManualSalesData = getFromSessionStorage("ManualSalesData") || {};
    const userId = getFromLocalStorage("UserId");

    const [isLoading, setIsLoading] = useState(false);
    const [rowsData, setRowsData] = useState([]);
    const [apiData, setApiData] = useState([]);
    const [headerId, setHeaderId] = useState(sessionData?.record_id);
    const [isCopyHeader, setIsCopyHeader] = useState(iscopy);
    const [status, setStatus] = useState("");
    const [presfilters, setPresFilters] = useState();
    const [preservedConfig, setPreservedConfig] = useState();

    const { mutate: getUnitList } = useGlobelApi(API_ENDPOINTS.GET_PRODUCT_UNITS);
    const { mutate: createInventoryAdjustment } = useGlobelApi(API_ENDPOINTS.CREATE_INVENTORY_ADJUSTMENT);
    const { mutate: fetchEntries } = useGlobelApi(API_ENDPOINTS.INVENTORY_ADJUSTMENT_ENTRIES);
    const { mutate: inventoryAdjustmentHeader } = useGlobelApi(API_ENDPOINTS.INVENTORY_ADJUSTMENT_HEAD);
    const { mutate: deleteEntryMutate } = useGlobelApi(API_ENDPOINTS.DELETE_INVENTORY_ADJUSTMENT_DETAIL);
    const { mutate: taxOption } = useGlobelApi(API_ENDPOINTS.TAX_LIST);
    const { mutate: getConversionQty } = useGlobelApi(API_ENDPOINTS.GET_CONVERSION_QTY_PRICE);

    const {
        register,
        control,
        formState: { errors },
        setValue,
        watch,
        handleSubmit,
    } = useForm({
        resolver: yupResolver(schema),
        mode: "onChange",
        defaultValues: {
            posting_date: "",
            total_amount: "0.00",
            comment: "",
            items: [],
        },
    });

    useEffect(() => {
        taxOption({ filters: null, limit: 0, offset: 0 });
    }, []);

    useEffect(() => {
        if (headerId) {
            setIsLoading(true);
            fetchHeaderData();
            fetchEntriesData();
        }
    }, [headerId]);

    const fetchHeaderData = () => {
        if (!headerId) return;
        inventoryAdjustmentHeader(
            {
                headerData: { comp_to_dept_id: ManualSalesData?.com_dept_id },
                filters: [{ key: "iah.id", operator: "equal", value1: headerId, logical: "" }],
                limit: 0,
                offset: 0,
            },
            {
                onSuccess: ({ data }) => {
                    const header = data?.[0];
                    if (header) {
                        setValue("posting_date", header.posting_date);
                        setValue("comment", header.comment);
                        setValue("total_amount", header.total_amount);
                    }
                },
                onError: (error) => {
                    console.error("Error fetching header:", error);
                    toast.error("Failed to fetch header data");
                },
            }
        );
    };

    const fetchEntriesData = () => {
        fetchEntries(
            {
                headerData: { inv_adj_head_id: headerId },
                filters: null,
                limit: 0,
                offset: 0,
            },
            {
                onSuccess: ({ data }) => {

                    const formattedData = (data || []).map((item, index) => {
                        return {
                            index,
                            record_id: isCopyHeader ? "" : item.record_id || "",
                            product_id: item.product_id,
                            product_label: item.product_name,
                            product_type: item.product_type,
                            base_unit: item.base_unit,
                            unit_selected: (item.unit_selected_id).toString(),
                            unit_selected_label: item.unit_selected,
                            us_qty: parseFloat(item.us_qty).toFixed(3),
                            total_amount: (parseFloat(item.net_price) + parseFloat(item.tax_amount)).toFixed(3),
                        }
                    });
                    setRowsData(formattedData);
                    setApiData(formattedData);
                    setValue(
                        "items",
                        formattedData.map(({ product_id, unit_selected, unit_selected_label, us_qty, total_amount }) => ({
                            product_id,
                            unit_selected: unit_selected,
                            unit_selected_label: unit_selected_label,
                            us_qty,
                            total_amount,
                        }))
                    );
                    setIsLoading(false);
                },
                onError: (error) => {
                    console.error("Error fetching entries:", error);
                    toast.error("Failed to fetch entries");
                    setIsLoading(false);
                },
            }
        );
    };

    const updateRowData = (rowIndex, fieldName, value, record) => {
        setRowsData((prevData) => {
            const newData = [...prevData];
            let targetRow = newData.find((item) => item.index === rowIndex);
            
            if (!targetRow) {
                targetRow = {
                    index: rowIndex,
                    record_id: "",
                    product_id: "",
                    product_label: "",
                    product_type: "",
                    base_unit: "",
                    unit_selected: "",
                    unit_selected_label: "",
                    us_qty: "1.000",
                    total_amount: "0.000",
                };
                newData.push(targetRow);
            }
            
            setApiData((prevApiData) => {
                const newApiData = [...prevApiData];
                let apiRow = newApiData.find((item) => item.index === rowIndex);
                if (!apiRow) {
                    newApiData.push({ ...targetRow });
                    apiRow = newApiData.find((item) => item.index === rowIndex);
                }

                const prevUnitId = apiRow.unit_selected;
                
                if (["product_label", "unit_selected_label"].includes(fieldName)) {
                    if (fieldName === "product_label") {
                        apiRow["product_id"] = value.value;
                        apiRow[`product_label`] = value.label;
                    }
                    if (fieldName === "unit_selected_label") {
                        targetRow["unit_selected"] = value.value;
                        targetRow[`unit_selected_label`] = value.label;
                    }
                    // setValue(`items.${rowIndex}.${fieldName}`, value.value, { shouldValidate: true });
                } else {
                    apiRow[fieldName] = value;
                    targetRow[fieldName] = value;
                    setValue(`items.${rowIndex}.${fieldName}`, value, { shouldValidate: true });
                }

                const us_qty = parseFloat(apiRow.us_qty) || 0;
                let price = parseFloat(apiRow.price) || 0;

                if (fieldName === "product_label" && value.value && record) {
                    apiRow.product_type = record?.product_type;
                    apiRow.base_unit = record?.base_unit;
                    targetRow.product_type = record?.product_type;
                    targetRow.base_unit = record?.base_unit;
                    price = parseFloat(record.average_price || 0).toFixed(3);
                    apiRow.price = price;
                    targetRow.price = price;
                    setValue(`items.${rowIndex}.price`, price, { shouldValidate: true });
                }
                
                if (fieldName === "product_label" && value.value) {
                    fetchProductUnits(rowIndex, value.value, newApiData);
                } else if (fieldName === "unit_selected_label" && value.value && prevUnitId !== value.value) {
                    convertUnit(rowIndex, prevUnitId, value.value, price, us_qty, 0, newApiData); // taxValue is 0 as no tax field
                }
                
                // setValue(
                //     "items",
                //     newApiData.map(({ product_id, unit_selected, unit_selected_label, us_qty, total_amount }) => ({
                //         product_id,
                //         unit_selected: unit_selected,
                //         unit_selected_label: unit_selected_label,
                //         us_qty,
                //         total_amount,
                //     }))
                // );
                
                return newApiData;
            });
            
            return newData;
        });
    };
    
    const fetchProductUnits = (rowIndex, productId, newData) => {
        getUnitList(
            {
                headerData: { product_id: productId, search_term: "" },
                filters: null,
                limit: 0,
                offset: 0,
                orderby: "",
            },
            {
                onSuccess: ({ data }) => {
                    const unit = data?.[0];
                    if (unit) {
                        const targetRow = newData.find((item) => item.index === rowIndex);
                        if (targetRow) {
                            targetRow.unit_selected = unit.record_id;
                            targetRow.unit_selected_label = unit.unit_description;
                            targetRow.base_unit = unit.unit_description;
                        }
                        setValue(`items.${rowIndex}.unit_selected`, unit.record_id, { shouldValidate: true });
                    }
                },
                onError: (error) => console.error("Error fetching units:", error),
            }
        );
    };

    const convertUnit = (rowIndex, prevUnitId, unitId, price, us_qty, taxValue, newData) => {
        getConversionQty(
            {
                dataInsert: { unit_from: prevUnitId || unitId, unit_to: unitId, unit_from_price: price, unit_from_us_qty: us_qty },
            },
            {
                onSuccess: ({ data }) => {
                    const { converted_price, converted_us_qty } = data?.[0] || {};
                    if (converted_price && converted_us_qty) {
                        const newPrice = parseFloat(converted_price).toFixed(3);
                        const newQty = parseFloat(converted_us_qty).toFixed(3);
                        const targetRow = newData.find((item) => item.index === rowIndex);
                        if (targetRow) {
                            targetRow.price = newPrice;
                            targetRow.us_qty = newQty;
                        }
                        setValue(`items.${rowIndex}.price`, newPrice, { shouldValidate: true });
                        setValue(`items.${rowIndex}.us_qty`, newQty, { shouldValidate: true });

                        const newNetPrice = parseFloat(newQty) * parseFloat(newPrice);
                        const newTaxAmount = newNetPrice * taxValue;
                        if (targetRow) {
                            targetRow.net_price = newNetPrice.toFixed(3);
                            targetRow.tax_amount = newTaxAmount.toFixed(3);
                            targetRow.total_amount = (newNetPrice + newTaxAmount).toFixed(3);
                        }
                        setValue(`items.${rowIndex}.net_price`, newNetPrice.toFixed(3));
                        setValue(`items.${rowIndex}.tax_amount`, newTaxAmount.toFixed(3));
                        setValue(`items.${rowIndex}.total_amount`, (newNetPrice + newTaxAmount).toFixed(3));
                    }
                },
                onError: (error) => console.error("Error fetching conversion:", error),
            }
        );
    };

    const addRow = () => {
        const rowIndex = apiData.length;
        const newRow = {
            index: rowIndex,
            record_id: "",
            product_id: "",
            product_label: "",
            product_type: "",
            base_unit: "",
            unit_selected: "",
            unit_selected_label: "",
            us_qty: "1.000",
            price: "0.000",
            tax_id: "",
            tax_name: "",
            net_price: "0.000",
            tax_amount: "0.000",
            total_amount: "0.000",
            comments: "",
        };
        setRowsData((prev) => [...prev, newRow]);
        setApiData((prev) => [...prev, newRow]);
        setValue(`items.${rowIndex}`, {
            product_id: newRow.product_id,
            unit_selected: newRow.unit_selected,
            unit_selected_label: newRow.unit_selected_label,
            us_qty: newRow.us_qty,
            total_amount: newRow.total_amount,
        });
    };

    const deleteEntry = (row) => {
        const rowIndex = row.index;
        if (apiData.length <= 1) {
            toast.error("You cannot delete the last record!");
            return;
        }

        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#696cff",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, Delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                if (!row.record_id) {
                    removeRow(rowIndex);
                    toast.success("Entry deleted successfully.");
                } else {
                    deleteEntryMutate(
                        { dataInsert: { record_id: row.record_id, created_by: userId } },
                        {
                            onSuccess: ({ success, data }) => {
                                if (success) {
                                    removeRow(rowIndex);
                                    toast.success(data?.[0]?.message || "Entry deleted successfully.");
                                } else {
                                    toast.error(data?.[0]?.message || "Failed to delete entry.");
                                }
                            },
                            onError: (error) => toast.error(error.response?.data?.message || "Something went wrong."),
                        }
                    );
                }
            }
        });
    };

    const removeRow = (rowIndex) => {
        setRowsData((prevData) => {
            const updatedRows = prevData.filter((item) => item.index !== rowIndex).map((item, index) => ({ ...item, index }));
            return updatedRows;
        });
        setApiData((prevApiData) => {
            const updatedApi = prevApiData.filter((item) => item.index !== rowIndex).map((item, index) => ({ ...item, index }));
            setValue(
                "items",
                updatedApi.map(({ product_id, unit_selected, unit_selected_label, us_qty, total_amount }) => ({
                    product_id,
                    unit_selected: unit_selected,
                    unit_selected_label: unit_selected_label,
                    us_qty,
                    total_amount,
                }))
            );
            return updatedApi;
        });
    };

    const onSubmit = (data) => {

        const payload = {
            dataInsert: {
                header: {
                    company_id: ManualSalesData.company_id,
                    total_amount: parseFloat(data.total_amount).toFixed(3),
                    posting_date: moment(data.posting_date).format("YYYY-MM-DD"),
                    document_type: "sales",
                    comment: data.comment,
                    status,
                    created_by: userId,
                    ...(headerId && !isCopyHeader ? { header_id: headerId } : {}),
                },
                entries: apiData.map((row) => ({
                    record_id: row.record_id || "",
                    comp_to_dept_id: ManualSalesData?.com_dept_id,
                    product_id: row.product_id || 0,
                    unit_selected: row.unit_selected,
                    us_qty: parseFloat(row.us_qty).toFixed(3),
                })),
            },
        };

        createInventoryAdjustment(payload, {
            onSuccess: ({ data }) => {
                if (data?.[0]?.msgType !== "error") {
                    const newHeaderId = data?.[0]?.headerId;
                    if (newHeaderId) {
                        setHeaderId(newHeaderId);
                        setIsCopyHeader(false);
                        fetchHeaderData();
                        fetchEntriesData();
                    }
                    toast.success(data?.[0]?.message);
                } else {
                    toast.error(data?.[0]?.message);
                }
                setIsLoading(false);
            },
            onError: (error) => {
                toast.error(error.data?.[0]?.message || "Failed to save Manual Sales List");
                setIsLoading(false);
            },
        });
    };

    const confirmPrint = (withPrices) => {
        Swal.fire({
            icon: "warning",
            title: "Warning",
            text: "Make sure to save order before printing; only saved orders will be printed",
            cancelButtonText: "Cancel",
            cancelButtonColor: "#d33",
            showCancelButton: true,
            confirmButtonText: "Continue",
            confirmButtonColor: "#696cff",
        }).then((result) => {
            if (result.isConfirmed) {
                printItemLedger(withPrices); // Ensure printItemLedger is defined elsewhere
            }
        });
    };

    const headers = [
        { key: "action", label: "Action", width: 100, sortable: false, filterable: true },
        { key: "product_label", label: "Product", width: 270, sortable: true, filterable: true },
        { key: "product_type", label: "Product Type", width: 270, sortable: true, filterable: true },
        { key: "base_unit", label: "Base Unit", width: 270, sortable: true, filterable: true },
        { key: "unit_selected_label", label: "Unit ", width: 200, sortable: true, filterable: true },
        { key: "us_qty", label: "Quantity", width: 100, sortable: true, filterable: true },
    ];

    const customFilterFunction = (data, filters, sortConfig, preservedFilter, preservedSortConfig) => {
        return filterAndSortData(
            data,
            apiData,
            setRowsData,
            presfilters,
            preservedConfig,
            setPresFilters,
            setPreservedConfig,
            filters || {},
            sortConfig || {},
            preservedFilter,
            preservedSortConfig
        );
    };

    const renderCell = (value, row, columnKey) => {
        const rowIndex = row.index;
        const fieldName = `items.${rowIndex}.${columnKey}`;

        if (columnKey === "action") {
            return (
                <div className="flex justify-around">
                    <button
                        type="button"
                        onClick={() => deleteEntry(row)}
                        className="bg-primary w-7 h-7 rounded-md flex justify-center items-center text-white hover:bg-secondary"
                        aria-label={`Delete row ${rowIndex + 1}`}
                    >
                        <MdDelete />
                    </button>
                </div>
            );
        }

        if (columnKey === "product_label") {
            return (
                <div>
                    <AntSelectFieldTable
                        control={control}
                        name={fieldName}
                        endpoint={API_ENDPOINTS.GET_PRODUCT_FOR_RECIPE_CREATION}
                        queryKey="pm.product_name"
                        valueKey="record_id"
                        labelKey="product_name"
                        ContcatenateLabel="product_type"
                        responseWhich="data"
                        placeholder="Select Product"
                        onSelectChange={(selected, selectedRecord) => updateRowData(rowIndex, "product_label", selected, selectedRecord)}
                        headerData={{ user_id: ManualSalesData?.user_id, comp_to_dept_id: ManualSalesData?.com_dept_id }}
                        baseFilters={[
                            {
                                key: "aptcd.comp_dept_id",
                                operator: "equal",
                                value1: ManualSalesData?.com_dept_id,
                                logical: ""
                            },
                            { key: "aptcd.status", operator: "equal", value1: "1", logical: "" },
                            { key: "pm.status", operator: "equal", value1: "1", logical: "" },
                            { key: "pm.product_type", operator: "in", value1: "recipe", logical: "" },
                        ]}
                        defaultValue={row.product_id ? { value: row.product_id, label: row.product_label } : null}
                    />
                    {errors?.items?.[rowIndex]?.product_id && (
                        <div className="text-red-500 text-xs mt-1">{errors.items[rowIndex].product_id.message}</div>
                    )}
                </div>
            );
        }

        if (columnKey === "unit_selected_label") {
            return (
                <div>
                    <AntSelectFieldTable
                        control={control}
                        name={fieldName}
                        endpoint={API_ENDPOINTS.GET_PRODUCT_UNITS}
                        queryKey="ump.description"
                        valueKey="record_id"
                        labelKey="unit_description"
                        responseWhich="data"
                        placeholder="Select Unit"
                        onSelectChange={(selected) => updateRowData(rowIndex, "unit_selected_label", selected)}
                        disabled={!row.product_id}
                        headerData={{ product_id: row.product_id, search_term: "" }}
                        baseFilters={[]}
                        sendFiltersWithSearchTerm={false}
                        defaultValue={row.unit_selected ? { value: row.unit_selected, label: row.unit_selected_label } : null}
                    />
                    {errors?.items?.[rowIndex]?.unit_selected && (
                        <div className="text-red-500 text-xs mt-1">{errors.items[rowIndex].unit_selected.message}</div>
                    )}
                </div>
            );
        }
        if (columnKey === "product_type" || columnKey === "base_unit") {
            return <span>
                {
                    value
                }
            </span>
        }
        return (
            <div>
                <InputFieldTable
                    control={control}
                    name={fieldName}
                    register={register(fieldName)}
                    maxDecimalLength={3}
                    allowNegative={true}
                    error={errors?.items?.[rowIndex]?.[columnKey]?.message}
                    value={row[columnKey]}
                    useComma={true}
                    onChange={(e) => updateRowData(rowIndex, columnKey, e.target.value)}
                    type="number"
                />
            </div>
        );
    };

    const columns = useMemo(
        () =>
            headers.map((header) => ({
                ...header,
                render: (value, row) => renderCell(value, row, header.key),
            })),
        [errors, watch, rowsData]
    );

    const breadcrumbItems = [
        { title: "Manual Sales List", link: "manual-sales-list" },
        { title: "Manual Sales List" },
    ];

    return (
        <div>
            {isLoading ? (
                <Loader />
            ) : (
                <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                    <CustomBreadcrumb items={breadcrumbItems} />
                    <div className="flex gap-1 align-items-center">
                        <p className=" text-color font-regularweight"> Company:</p>
                        <span className="text-color"> {ManualSalesData?.company_name}</span>
                    </div>
                    <div className="flex gap-1 align-items-center">
                        <p className=" text-color font-regularweight">Department:</p>
                        <span className="text-color">{ManualSalesData?.dept_name}</span>
                    </div>
                    <div className="bg-white shadow-sm p-3  rounded-radiusRegular mt-2">
                        <h1 className="text-size text-color font-headingweight text-center mb-2">Manual Sales List</h1>
                        <div className="d-flex justify-content-between">
                            <div>
                                <InputField
                                    label="Posting Date"
                                    control={control}
                                    type="date"
                                    register="posting_date"
                                    name="posting_date"
                                    rules={{ required: "Posting Date is required" }}
                                    error={errors.posting_date?.message}
                                />
                            </div>
                            <InputField
                                label="Total Amount"
                                type="number"
                                step="0.001"
                                register={register("total_amount")}
                                defaultValue="0.00"
                                maxDecimalLength={3}
                                allowNegative={true}
                                name="total_amount"
                                field_disable={true}
                                rules={{ required: "Total Amount is required" }}
                                error={errors.total_amount?.message}
                                mainClass="w-36"
                            />
                        </div>
                        <div className="py-2">
                            <InputField
                                label="Comment"
                                name="comment"
                                register={register("comment")}
                                rules={{ required: "Comment is required" }}
                                error={errors.comment?.message} inputClass="h-24"
                            />
                        </div>
                        <div className="flex gap-1 items-center my-2">
                            <CustomButton
                                type="button"
                                btntext="Add Row"
                                handleClick={addRow}
                                className="bg-primary hover:bg-secondary text-white"
                            />
                            <CustomButton
                                type="submit"
                                btntext="Save"
                                handleClick={() => setStatus("save")}
                                className="bg-primary hover:bg-secondary text-white"
                            />
                            <CustomButton
                                type="submit"
                                btntext="Posted"
                                handleClick={() => setStatus("posted")}
                                className="bg-primary hover:bg-secondary text-white"
                            />
                        </div>
                        {sessionData && (
                            <div className="flex gap-1 align-items-center justify-content-end">
                                <p className=" text-color font-regularweight">Data Copied from user:</p>
                                <span className="text-color capitalize">  {sessionData?.first_name} {sessionData?.last_name}</span>
                            </div>
                        )}
                    </div>
                    <div className="my-3">
                        <h2 className="text-size text-color font-headingweight mb-1 ">Entries</h2>
                        <div className="shrink-0 whitespace-nowrap overflow-x-auto w-full bg-card">
                            <ResizableTable
                                data={rowsData}
                                columns={columns}
                                height="400px"
                                scrollableId="item-ledger-entries"
                                isDense
                                isSelect={false}
                                enableScroll={false}
                                customFilterFunction={customFilterFunction}
                            />
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default withPermissionCheck(CreateManualSales, "create-manual-sale");