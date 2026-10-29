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
import Swal from "sweetalert2";
import ResizableTable from "../../components/table/ResizableTable";
import { Modal } from "antd";
import Loader from "../../components/Loader";
import jsPDF from "jspdf";
import { toast } from "react-toastify";
import HierarchicalTable from "../../components/table/HierarchicalTable";
import { formatNumberDisplay } from "../../utils/helper.function";

const SelectStatusList = [
  { value: "1", label: "Active" },
  { value: "0", label: "InActive" },
];
const SelectProductType = [
  { value: "recipe", label: "recipe" },
  { value: "batch", label: "batch" },
  // { value: "raw", label: "raw" },
];

const DeptRecipeList = () => {
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
    API_ENDPOINTS.GET_DEPT_RECIPE_LIST
  );
  const { mutate: postPermission } = useGlobelApi(
    API_ENDPOINTS.UPDATE_PRODUCT_LIST
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jrEnteries, setJrEnteries] = useState([]);
  const [recipeDetails, setRecipeDetails] = useState([]);
  const [detailsTotal, setDetailsTotal] = useState(0);
  const [exportFormat, setExportFormat] = useState("expanded");
  const limit = 10;
  const navigate = useNavigate();

  const handleFetchdata = (filter, reset = false, orderBy = "pm.id DESC") => {
    const baseFilters = [
      {
        key: "comp_dept_id",
        operator: "equal",
        value1: recipeCTD?.com_dept_id || null,
        logical: "",
      },
      ...(!filter
        ? [
            {
              key: "product_type",
              operator: "in",
              value1: "batch,recipe",
              logical: "",
            },
          ]
        : []),
    ];

    const filters = filter ? [...baseFilters, ...filter] : baseFilters;

    fetchProductsForDeptCreation(
      {
        filters: filters || null,
        limit: 0,
        offset: 0,
        orderby: "",
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

  const handleRecipeDetailsData = () => {
    FetchRecipeDetails(
      {
        headerData: {
          comp_to_dept_id: recipeCTD?.com_dept_id,
          product_id: selectedIds?.[0]?.product_id,
        },
        filters: null,
        limit: 0,
        offset: 0,
        orderby: "",
      },
      {
        onSuccess: (response) => {
          const hierarchicalData = transformToHierarchical(
            response.data.slice(0, -1)
          );
          setRecipeDetails(hierarchicalData);
          setDetailsTotal(response?.data[response?.data?.length - 1]);
        },
        onError: (err) => {
          console.log(err);
        },
      }
    );
  };

  const transformToHierarchical = (flatData) => {
    const itemMap = new Map();
    const levelColors = [
      "#FF6B6B", // Level 1: Red
      "#4ECDC4", // Level 2: Teal
      "#FFD93D", // Level 3: Yellow
      "#6B7280", // Level 4: Gray
      "#A78BFA", // Level 5: Purple
      "#F472B6", // Level 6: Pink
    ];

    // Create a unique key for each item to handle duplicates
    flatData
      .filter((item) => item.parent_name !== "TOTAL")
      .forEach((item, index) => {
        const uniqueKey = `${item.child_product_id}_${index}`;
        const node = {
          id: item.child_product_id,
          uniqueKey, // Store unique key for reference
          product_name: item.child_name || "",
          product_type: item.product_type || "",
          unit_selected_name: item.unit_selected_name || "",
          base_unit_coverted: item.base_unit_coverted || "",
          qty: item.qty ? Number(item.qty).toFixed(3) : "",
          base_unit_name: item.base_unit_name || "",
          final_qty: item.final_qty ? Number(item.final_qty).toFixed(2) : "",
cost: item.cost ? formatNumberDisplay(item.cost) : "",
          path: item.path || "",
          children: [],
          parent_id: item.parent_id,
          level: item.parent_id === null ? 1 : 0, // Set level 1 for top-level items
          arrowColor: item.parent_id === null ? levelColors[0] : "",
        };
        itemMap.set(uniqueKey, node);
      });

    const tree = [];

    // Build the hierarchy
    itemMap.forEach((item) => {
      if (item.parent_id === null) {
        // Top-level items go directly into the tree
        tree.push(item);
      } else {
        // Find all potential parents with matching child_product_id
        const potentialParents = Array.from(itemMap.values()).filter(
          (p) => p.id === item.parent_id
        );

        if (potentialParents.length > 0) {
          // Add the item to all matching parents where it’s not already nested
          potentialParents.forEach((parent) => {
            // Check if a record with the same child_product_id and parent_id is already nested
            const alreadyNested = parent.children.some(
              (child) =>
                child.id === item.id && child.parent_id === item.parent_id
            );

            // If not already nested, add to this parent's children
            if (!alreadyNested) {
              item.level = parent.level + 1;
              item.arrowColor =
                levelColors[item.level - 1] ||
                levelColors[levelColors.length - 1];
              parent.children.push(item);
            }
          });
        } else {
          // If no parent is found, treat as top-level
          item.level = 1;
          item.arrowColor = levelColors[0];
          tree.push(item);
        }
      }
    });

    return tree;
  };
  const handleFetchExcelData = (filter) => {
    return new Promise((resolve, reject) => {
      const baseFilters = [
        {
          key: "comp_dept_id",
          operator: "equal",
          value1: recipeCTD?.com_dept_id || null,
          logical: "",
        },
        ...(!filter
          ? [
              {
                key: "product_type",
                operator: "in",
                value1: "batch,recipe",
                logical: "",
              },
            ]
          : []),
      ];

      const filters = filter ? [...baseFilters, ...filter] : baseFilters;

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

  const exportToPDF = () => {
    
    if (selectedIds.length === 0) {
      toast.error("Select a product first");
      return;
    }
    const selectedProduct = selectedIds?.[0];
    const data = recipeDetails;
    const recipe = recipeCTD;

    if (!selectedProduct || !data?.length) {
      toast.error("No recipe details available");
      return;
    }

    console.log("Recipe Details:", JSON.stringify(data, null, 2)); // Debug: Check input data

    const doc = new jsPDF();
    doc.setFontSize(10);

    // Company Info (Left & Right)
    const leftCompany = recipe?.company_name || "";
    const rightDept = recipe?.dept_name || "";

    try {
      doc.text(`Company: ${leftCompany}`, 14, 10);
    } catch (error) {
      console.error("Error rendering company name:", error);
    }

    const rightText = `Department: ${rightDept}`;
    if (typeof rightText === "string" && rightText.length > 0) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const textWidth = doc.getTextWidth(rightText);
      const rightX = pageWidth - textWidth - 14;
      try {
        doc.text(rightText, rightX, 10);
      } catch (error) {
        console.error("Error rendering department name:", error);
      }
    }

    // Product Top Details
    const topDetails = [
      `Product Name: ${selectedProduct.product_name || ""}`,
      `Product Code: ${selectedProduct.product_code || ""}`,
      `Product Category: ${selectedProduct.product_category || ""}`,
      `PLU Code: ${selectedProduct.plu_code || ""}`,
    ];

    topDetails.forEach((text, index) => {
      try {
        doc.text(text, 14, 20 + index * 6);
      } catch (error) {
        console.error("Error rendering product details:", error);
      }
    });

    // Custom Table Headers
    const tableHeaders = [
      "Product Name",
      "Product Type",
      "Unit Selected",
      "Quantity",
      "Cost",
      "Base Unit",
      "Unit Converted",
      "Final Qty",
    ];

    let tableData = [];
    let totalCost = 0;
    if (exportFormat === "expanded") {
      // Flatten hierarchical data with doubled spaces and colored arrows
      const flattenWithIndentation = (items) => {
        const result = [];
        items.forEach((item) => {
          if (!item.level) {
            console.warn("Item missing level:", item);
            item.level = 1; // Fallback to level 1 if missing
          }
          // Add doubled spaces based on level (e.g., '  ' for level 1, '    ' for level 2)
          const spaces = "  ".repeat(item.level);
          // Arrows for separate rendering (e.g., '>' for level 1, '>>' for level 2)
          const arrows = ">".repeat(item.level);
          result.push({
            rowData: [
              {
                content: `${spaces}${item.product_name || ""}`, // Doubled spaces + product name (black)
                arrowText: arrows, // Arrows only (colored)
                arrowColor: item.arrowColor || "#000000",
              },
              item.product_type || "",
              item.unit_selected_name || "",
              item.qty || "",
              item.cost || "",
              item.base_unit_name || "",
              item.base_unit_coverted || "",
              item.final_qty || "",
            ],
            y: null,
            height: null,
          });
          if (item.children && item.children.length > 0) {
            result.push(...flattenWithIndentation(item.children));
          }
        });
        return result;
      };

      tableData = flattenWithIndentation(data);
      console.log("Table Data:", JSON.stringify(tableData, null, 2)); // Debug: Check flattened data
      totalCost = detailsTotal?.cost || 0;
    } else {
      // Collapsed: Only top-level products, two spaces and one colored arrow
      tableData = data.map((item) => ({
        rowData: [
          {
            content: `  ${item.product_name || ""}`, // Two spaces + product name (black)
            arrowText: ">", // One arrow (colored)
            arrowColor: item.arrowColor || "#000000",
          },
          item.product_type || "",
          item.unit_selected_name || "",
          item.qty || "",
          item.cost || "",
          item.base_unit_name || "",
          item.base_unit_coverted || "",
          item.final_qty || "",
        ],
        y: null,
        height: null,
      }));
      totalCost = data.reduce(
        (sum, item) => sum + (parseFloat(item.cost) || 0),
        0
      );
    }

    // Render table
    doc.autoTable({
      startY: 50,
      head: [tableHeaders],
      body: tableData.map((item) => item.rowData),
      styles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 18 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 },
      },
      didDrawCell: (data) => {
        // Draw colored arrows separately for Product Name column
        if (
          data.column.index === 0 &&
          data.row.section === "body" &&
          data.cell.raw &&
          typeof data.cell.raw === "object"
        ) {
          const arrowText = data.cell.raw.arrowText;
          const arrowColor = data.cell.raw.arrowColor;
          if (arrowText && arrowColor) {
            // Convert hex color to RGB for jsPDF
            const hexToRgb = (hex) => {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return [r, g, b];
            };
            // Draw arrows at the start of the cell
            doc.setTextColor(...hexToRgb(arrowColor));
            doc.text(
              arrowText,
              data.cell.x,
              data.cell.y + data.cell.height / 2,
              { baseline: "middle" }
            );
            // Reset to black for product name (already rendered by autoTable)
            doc.setTextColor(0, 0, 0);
          }
          // Store cell position for potential future use
          tableData[data.row.index].y = data.cell.y;
          tableData[data.row.index].height = data.cell.height;
        }
      },
      didDrawPage: (data) => {
        try {
          doc.text(
            `Page ${data.pageCount}`,
            doc.internal.pageSize.getWidth() - 30,
            doc.internal.pageSize.getHeight() - 10
          );
        } catch (error) {
          console.error("Error rendering page number:", error);
        }
      },
    });

    try {
      const finalY = doc.lastAutoTable.finalY || 50;
      doc.setFontSize(7);

      const text = `Total Cost: ${totalCost.toFixed(3)}`;
      const pageWidth = doc.internal.pageSize.getWidth();
      const textWidth = doc.getTextWidth(text);
      const rightX = pageWidth - textWidth - 14;

      doc.text(text, rightX, finalY + 10);
    } catch (error) {
      console.error("Error rendering total cost:", error);
    }

    doc.save(`recipe_${exportFormat}.pdf`);
  };

  const exportToExcel = async () => {
    const data = await handleFetchExcelData(appliedFilters);

        const formattedData = data.map(item => ({
      ...item,

      total_cost: parseFloat(item.total_cost).toFixed(3),
    }));

    const limitedData = formattedData.slice(0, 1000);
    // const limitedData = data.slice(0, 1000);

    const worksheet = XLSX.utils.json_to_sheet(limitedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "product.xlsx");
  };

  const fields = [
    {
      name: "product_name",
      label: "product name",
      type: "textServer",
      labelKey: "product_name",
      ValueKey: "product_name",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
      concatenateLable: "product_type",
    },
    {
      name: "description",
      label: "Main category ",
      type: "textServer",
      labelKey: "main_category",
      ValueKey: "main_category",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    {
      name: "description",
      label: "Sub category ",
      type: "textServer",
      labelKey: "sub_category",
      ValueKey: "sub_category",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    {
      name: "product_code",
      label: "product code",
      type: "textServer",
      labelKey: "product_code",
      ValueKey: "product_code",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    {
      name: "plu_code",
      label: "PLU Code",
      type: "textServer",
      labelKey: "plu_code",
      ValueKey: "plu_code",
      endpoint: `${API_ENDPOINTS.GET_PRODUCT_LIST}`,
      responseWhich: "data",
    },
    {
      name: "product_type",
      label: "Product Type",
      type: "select",
      // selectfieldQueryKey:"pm.product_type",
      // aliases: "pm.",
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
      key: "product_code",
      label: "Product Code",
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
      width: 180,
      sortable: true,
      filterable: true,
    },
    {
      key: "base_unit_name",
      label: "Unit",
      sortable: true,
      filterable: true,
      width: 120,
    },
    {
      key: "plu_code",
      label: "plu code",
      sortable: true,
      filterable: true,

      width: 140,
    },
    {
      key: "product_type",
      label: "Type",
      sortable: true,
      filterable: true,
      width: 120,
    },
    {
      key: "total_cost",
      label: "Cost",
      sortable: true,
      filterable: true,
      width: 200,
      render: (value) => formatNumberDisplay(value),
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
      key: "product_name",
      label: "Product Name",
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
      key: "qty",
      label: "Quantity",
      width: 200,
      sortable: true,
      filterable: true,
      render: (value) => formatNumberDisplay(value),
    },
    {
      key: "unit_selected_name",
      label: "Unit Selected",
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
      render: (value) => formatNumberDisplay(value),
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
      render: (value) => formatNumberDisplay(value),
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
      navigate(`${rootFolder}/dept-add-recipe`);
    }
  };

  const handleAddRow = () => ({
    id: Date.now(),
    sub_module_name: "",
    module_name: "",
    user_name: "",
  });

  useEffect(() => {
    handleFetchdata(null, true);
  }, []);
  useEffect(() => {
    handleFetchEntries();
    handleRecipeDetailsData();
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
        <div className="flex justify-between gap-3 my-2">
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
                navigate(`${rootFolder}/dept-add-recipe`);
              }}
            />
            {recipeCTD ? (
              <div className="flex gap-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="expanded">Export PDF (Expanded)</option>
                  <option value="collapsed">Export PDF (Collapsed)</option>
                </select>
                <CustomButton
                  btntext={"Export to PDF"}
                  handleClick={() => {
                    exportToPDF();
                  }}
                />
              </div>
            ) : null}
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
          <div className=""></div>
          {selectedIds &&
            selectedIds?.length > 0 &&
            recipeDetails &&
            recipeDetails?.length > 0 &&
            recipeCTD &&
            (recipeDetailsPending ? (
              <Loader />
            ) : (
              <div className=" mt-4 border-0 rounded-lg">
                <div className="p-2 text-white ">
                  <h4 className="p-0 m-0 text-lg font-medium">Details</h4>
                </div>
                <div className="">
                  <HierarchicalTable
                    data={recipeDetails || []}
                    columns={recipesfieldsMapping}
                    isDense={isDense}
                    height="300px"
                    scrollableId={"recipeDetails"}
                    onFilter={(filters) => console.log("Filters:", filters)}
                    onSelectRow={(selectedData) => setSelectedIds(selectedData)}
                    hasMore={false}
                    enableScroll={true}
                    onLoadMore={() => handleRecipeDetailsData()}
                    loading={isPending}
                    isSelect={false}
                  />
                </div>
                <div className="mt-4 flex justify-end pr-4 m-2">
                  <div className="bg-gray-100 p-3 rounded-md shadow-sm flex gap-8">
                    <div className="font-medium">
                      <strong>Total: </strong>
                      <span className="text-primary">{detailsTotal.cost}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default withPermissionCheck(DeptRecipeList, "dept-recipe");
