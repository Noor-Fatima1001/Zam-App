// import React, { useEffect, useState } from "react";
// import { FaFileExport } from "react-icons/fa6";
// import { MdRefresh } from "react-icons/md";
// import { useNavigate } from "react-router-dom";
// import Swal from "sweetalert2";
// import * as XLSX from "xlsx";
// import { useGlobelApi } from "../../../apis/useProduct/useCommon";
// import GenericActionBar from "../../../components/action-bar/GenericActionBar";
// import CustomButton from "../../../components/button/CustomButton";
// import DynamicFilter from "../../../components/form-elements/DynamicFilter";
// import MuiGenericTable from "../../../components/table/MuiGernericTable";
// import {
//   getFromLocalStorage,
//   saveToSessionStorage,
// } from "../../../config/crypto-file";
// import withPermissionCheck from "../../../config/withPermissionCheck";
// import { API_ENDPOINTS } from "../../../apis/client/api-endpoints";
// const SelectStatusList = [
//   { value: "1", label: "Active" },
//   { value: "0", label: "InActive" },
// ];
// const Department = ({ productData }) => {
//   const { mutate, isPending } = useGlobelApi(
//     API_ENDPOINTS.GET_PRODUCT_TO_DEPT_LIST
//   );
//   const { mutate: fetchDataForExcel } = useGlobelApi(
//     API_ENDPOINTS.GET_PRODUCT_TO_DEPT_LIST
//   );
//   const { mutate: postPermission } = useGlobelApi(
//     API_ENDPOINTS.UPDATE_PRODUCT_TO_DEPT_LIST
//   );
//   const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

//   const UserId = getFromLocalStorage("UserId");
//   const [moduleData, setModuleData] = useState([]);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [offset, setOffset] = useState(0);
//   const [totalRecords, setTotalRecords] = useState(0);
//   const [hasMore, setHasMore] = useState(true);
//   const [isDense, setIsDense] = useState(true);
//   const [appliedFilters, setAppliedFilters] = useState(null);
//   const limit = 10;
//   const navigate = useNavigate();

//   const handleFetchdata = (filter, reset = false) => {
//     const baseFilters = [
//       {
//         key: "pm.id",
//         operator: "equal",
//         value1: productData?.record_id,
//         logical: "",
//       },
//     ];
//     const filters = filter ? [...baseFilters, ...filter] : baseFilters;
//     mutate(
//       {
//         filters: filters || null,
//         limit,
//         offset: reset ? 0 : offset,
//         orderby: "aptd.id DESC",
//       },
//       {
//         onSuccess: (data) => {
//           const newUsers = data?.data || [];
//           if (reset) {
//             setModuleData(newUsers);
//             setOffset(limit);
//           } else {
//             setModuleData((prevUsers) => [...prevUsers, ...newUsers]);
//             setOffset((prevOffset) => prevOffset + limit);
//           }
//           const total = newUsers?.[0]?.totalRecords || 0;
//           setTotalRecords(total);
//           setHasMore(
//             newUsers.length > 0 && (reset ? limit : offset + limit) < total
//           );
//         },
//         onError: (error) => {
//           console.error("Error fetching data:", error);
//         },
//       }
//     );
//   };
//   const handleFetchExcelData = (filter) => {
//     return new Promise((resolve, reject) => {
//       const baseFilters = [
//         {
//           key: "pm.id",
//           operator: "equal",
//           value1: productData?.record_id,
//           logical: "",
//         },
//       ];
//       const filters = filter ? [...baseFilters, ...filter] : baseFilters;
//       fetchDataForExcel(
//         { filters: filters || null, limit: 0, offset: 0 },
//         {
//           onSuccess: (data) => {
//             resolve(data?.data || []);
//           },
//           onError: (error) => {
//             console.error("Error fetching data:", error);
//             reject(error);
//           },
//         }
//       );
//     });
//   };
//   const exportToExcel = async () => {
//     const data = await handleFetchExcelData(appliedFilters);

//     const limitedData = data.slice(0, 1000);

//     // Convert JSON data to worksheet
//     const worksheet = XLSX.utils.json_to_sheet(limitedData);

//     // Create a new workbook and append the worksheet
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

//     // Generate a file and trigger download
//     XLSX.writeFile(workbook, "product-departments.xlsx");
//   };

//   const fields = [
//     {
//       name: "d.dept_name",
//       label: "department",
//       type: "textServer",
//       labelKey: "dept_name",
//       ValueKey: "dept_name",
//       endpoint: `${API_ENDPOINTS.GET_DEPARTMENT}`,
//       responseWhich: "data",
//     },

//     {
//       name: "aptd.status",
//       label: "Status",
//       type: "select",
//       options: SelectStatusList,
//     },
//   ];
//   const handleApplyFilters = (data) => {
//     console.log("Filter Values:", data);
//     setOffset(0);
//     setAppliedFilters(data);
//     handleFetchdata(data, true);
//     handleFetchExcelData(data);
//   };

//   const handleResetFilters = () => {
//     console.log("Filters Reset");
//     setOffset(0);
//     setAppliedFilters(null);
//     handleFetchdata(null, true);
//     handleFetchExcelData(null);
//   };
//   const handlePermissionChange = async (row, updatedPermission) => {
//     console.log("🚀 ~ handlePermissionChange ~ row:", row);
//     const body = {
//       dataUpdate: {
//         record_id: row.record_id,
//         product_id: row?.product_id || "",
//         comp_dept_id: row?.comp_dept_id || "",
//         gl_id: row?.gl_id || "",
//         status: updatedPermission ? 1 : 0,
//         changed_by: UserId,
//       },
//     };
//     try {
//       postPermission(body, {
//         onSuccess: (data) => {
//           if (data.success) {
//             Swal.fire({
//               icon: "success",
//               title: "Success",
//               text: data?.data,
//             });
//           } else {
//             Swal.fire({
//               icon: "error",
//               title: "Error",
//               text: data?.data,
//             });
//             setModuleData((prevData) =>
//               prevData.map((item) =>
//                 item.record_id === row.record_id
//                   ? { ...item, status: !updatedPermission }
//                   : item
//               )
//             );
//           }
//         },
//         onError: (error) => {
//           Swal.fire({
//             title: "Error",
//             text: "Something went wrong",
//             icon: "error",
//           });
//           setModuleData((prevData) =>
//             prevData.map((item) =>
//               item.record_id === row.record_id
//                 ? { ...item, status: !updatedPermission }
//                 : item
//             )
//           );
//         },
//       });
//     } catch (error) {
//       setModuleData((prevData) =>
//         prevData.map((item) =>
//           item.record_id === row.record_id
//             ? { ...item, status: !updatedPermission }
//             : item
//         )
//       );
//     }
//   };

//   const handlePermissionToggle = (row) => {
//     const updatedPermission = !row.status;
//     setModuleData((prevData) =>
//       prevData.map((item) =>
//         item.record_id === row.record_id
//           ? { ...item, status: updatedPermission }
//           : item
//       )
//     );
//     handlePermissionChange(row, updatedPermission);
//   };

//   const fieldsMapping = [
//     {
//       field: "company_to_dept",
//       headerName: "  department",
//       width: 300,
//     },

//     {
//       field: "Created by",
//       headerName: "Created by",
//       width: 200,
//       renderCell: (row) => (
//         <span>
//           {row?.row?.first_name} {row?.row?.last_name}
//         </span>
//       ),
//     },
//     {
//       field: "status",
//       headerName: "status ",
//       width: 150,
//       sortable: false,
//       renderCell: (row) => (
//         <div className="pt-2">
//           <label className="switch">
//             <input
//               type="checkbox"
//               checked={row?.row.status}
//               onChange={() => handlePermissionToggle(row?.row)}
//             />
//             <span className="slider"></span>
//           </label>
//         </div>
//       ),
//     },
//   ];

//   const handleActionClick = (action) => {
//     if (action === "edit") {
//       saveToSessionStorage("productData", selectedIds?.[0]);
//       navigate(`${rootFolder}/product-detail`);
//     }
//   };

//   useEffect(() => {
//     handleFetchdata(null, true);
//   }, []);

//   return (
//     <>
//       <div>
//         <h2 className="mb-2 text-lg font-semibold text-black">Departments</h2>

//         <div>
//           <DynamicFilter
//             fields={fields}
//             onApply={handleApplyFilters}
//             onReset={handleResetFilters}
//           />
//         </div>
//         <div className="flex justify-between gap-3 my-2.5">
//           <div className="flex gap-2">
//             <CustomButton
//               btntext={"Export to Excel"}
//               icon={<FaFileExport />}
//               handleClick={exportToExcel}
//               addclass="gap-1"
//             />
//             <CustomButton
//               btntext={"Add New"}
//               handleClick={() => navigate(`${rootFolder}/add-product-to-dept`)}
//             />
//             <div className=" d-flex align-items-center">
//               <label className="me-2">Dense Rows</label>
//               <label className="switch">
//                 <input
//                   type="checkbox"
//                   id="denseSwitch"
//                   checked={isDense}
//                   onChange={(e) => setIsDense(e.target.checked)}
//                 />
//                 <span className="slider"></span>
//               </label>{" "}
//             </div>
//           </div>
//           <div className="flex gap-2 items-center">
//             <CustomButton
//               btntext={<MdRefresh size={18} />}
//               addclass={`w-6 max-w-6 min-w-6 h-6 ${
//                 isPending && "animate-spin"
//               } `}
//               padding="p-0"
//               rounded="rounded-full"
//               handleClick={() => handleFetchdata(null, true)}
//             />
//           </div>
//         </div>

//         <div className="h-80">
//           <MuiGenericTable
//             columns={fieldsMapping}
//             initialData={moduleData}
//             enableAdd={false}
//             enableEdit={false}
//             isSelect={false}
//             enableDelete={false}
//             // onAddRow={handleAddRow}
//             dense={isDense}
//             setSelectedRows={setSelectedIds}
//             selectedRows={selectedIds}
//             // onSaveRow={handleSaveRow}
//             // onDeleteRow={handleDeleteRow}
//             hasMore={hasMore}
//             enableScroll={true}
//             onLoadMore={() => handleFetchdata(appliedFilters)}
//             loading={isPending}
//           />
//         </div>
//       </div>
//     </>
//   );
// };

// export default withPermissionCheck(Department, "product-departments");
import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import InfiniteScroll from "react-infinite-scroll-component";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../../../apis/client/api-endpoints";
import { useGlobelApi } from "../../../apis/useProduct/useCommon";
import Loader from "../../../components/Loader";
import CustomButton from "../../../components/button/CustomButton";
import DynamicFilter from "../../../components/form-elements/DynamicFilter";
import GenericDataTableRowAdd from "../../../components/table/GenericDataTableRowAdd";
import { getFromLocalStorage } from "../../../config/crypto-file";
import withPermissionCheck from "../../../config/withPermissionCheck";
const Department = ({ productData }) => {
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.GET_PRODUCT_TO_DEPT_LIST
  );
  const { mutate: fetchDataForExcel } = useGlobelApi(
    API_ENDPOINTS.GET_PRODUCT_TO_DEPT_LIST
  );
  const { mutate: AssignDepartment, isPending: AssignLoading } = useGlobelApi(
    API_ENDPOINTS.ADD_PRODUCT_TO_DEPT_LIST
  );
  const { mutate: UpdateAssignCompany, isPending: UpdateAssignLoading } =
    useGlobelApi(API_ENDPOINTS.UPDATE_PRODUCT_TO_DEPT_LIST);
  const UserId = getFromLocalStorage("UserId");
  const [apiDataList, setApiDataList] = useState([]);
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
        key: "pm.id",
        operator: "equal",
        value1: productData?.record_id,
        logical: "",
      },
    ];
    const filters = filter ? [...baseFilters, ...filter] : baseFilters;
    mutate(
      {
        filters: filters,
        limit,
        offset: reset ? 0 : offset,
        orderby: "",
      },
      {
        onSuccess: (data) => {
          const newUsers = data?.data || [];
          if (reset) {
            setApiDataList(newUsers);
          } else {
            setApiDataList((prevUsers) => [...prevUsers, ...newUsers]);
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
          key: "pm.id",
          operator: "equal",
          value1: productData?.record_id,
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

    const limitedData = data.slice(0, 1000);

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(limitedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate a file and trigger download
    XLSX.writeFile(workbook, "product-department.xlsx");
  };
  const fields = [
    {
      name: "tax_name",
      label: "Tax Name",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.TAX_LIST}`,
      responseWhich: "data",
      baseFilter: {
        key: "tt.status",
        operator: "equal",
        value1: "1",
        logical: "",
      },
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
  const saveNewRows = async (newRows, properData, edit) => {
    console.log("New rows saved successfully!", newRows);
    const body = edit
      ? {
          dataUpdate: {
            record_id: properData?.record_id,
            // // tax_id: parseInt(newRows?.tax_name?.value),
            // tax_number: newRows?.tax_number,
            // status: properData?.status,
            // changed_by: UserId,
            product_id: properData?.product_id,
            comp_dept_id: newRows?.company_to_dept?.value,
            gl_id: newRows?.gl_name?.value,
            status: properData?.status,
            changed_by: UserId,
          },
        }
      : {
          dataInsert: {
            product_id: productData?.record_id,
            comp_dept_id: newRows?.company_to_dept.value,
            gl_id: newRows?.gl_name.value,
            created_by: UserId,
          },
        };

    const apitHit = edit ? UpdateAssignCompany : AssignDepartment;
    apitHit(body, {
      onSuccess: (res) => {
        // reset();
        if (res.success) {
          toast.success(res?.data)
          // Swal.fire({
          //   icon: "success",
          //   title: "Success",
          //   text: res?.data,
          // });
          handleFetchdata(null, true);
        } else {
          toast.error(res?.data || "Something went wrong")
          // Swal.fire({
          //   icon: "error",
          //   title: "Error",
          //   text: res?.data || "Something went wrong",
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
  const handlePermissionChange = async (row, status) => {
    console.log("🚀 ~ handlePermissionChange ~ row:", row);
    const body = {
      dataUpdate: {
        record_id: row?.record_id,
        tax_number: row?.tax_number || null,
        status: status ? 1 : 0,
        changed_by: UserId,
      },
    };
    UpdateAssignCompany(body, {
      onSuccess: (res) => {
        // reset();
        console.log("success edit time", res);
        if (res.success) {
          toast.success (res?.result)
          // Swal.fire({
          //   icon: "success",
          //   title: "Success",
          //   text: res?.result,
          // });
          handleFetchdata(appliedFilters, true);
        } else {
          toast.error(res?.result || "Something went wrong")
          // Swal.fire({
          //   icon: "error",
          //   title: "Error",
          //   text: res?.result || "Something went wrong",
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
  const fieldsMapping = [
    // { field: "dept_name", displayName: "Department Name" },

    {
      field: "gl_name",
      displayName: "General Ledger",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.TAX_LIST}`,

      queryKey: "coa.gl_name",
      valueKey: "record_id",
      labelKey: "gl_name",
      responseWhich: "data",
      // editable: false,
    },
    {
      field: "company_to_dept",
      displayName: "Company & Department",
      type: "textServer",
      endpoint: `${API_ENDPOINTS.COM_TO_DEPARTMENT}`,

      queryKey: "dept_name",
      valueKey: "record_id",
      labelKey: "company_name",
      valueConcatenateWithLabel: "dept_name",
      responseWhich: "result",
      editLableName:""
      // editable: false,
    },

    {
      field: "status",
      displayName: "status",
      customCell: (row, handlePermissionToggle) => (
        <label className="switch">
          <input
            type="checkbox"
            checked={row.status}
            onChange={() => handlePermissionToggle(row)}
          />
          <span className="slider"></span>
        </label>
      ),
      disabled: true,
    },
  ];
  const handlePermissionToggle = (row) => {
    const updatedstatus = !row.status;
    handlePermissionChange(row, updatedstatus);
  };

  useEffect(() => {
    handleFetchdata();
  }, []);

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

        <InfiniteScroll
          height={300}
          dataLength={apiDataList.length}
          // next={() => console.log("reached bottom")}
          next={() => handleFetchdata()}
          hasMore={hasMore}
          loader={isPending && <Loader />}
          endMessage={<p className="text-center mt-2">No more records</p>}
        >
          {" "}
          <GenericDataTableRowAdd
            fieldsMapping={fieldsMapping}
            data={apiDataList}
            onSave={saveNewRows} // Save new rows to the API
            isSaving={AssignLoading}
            onPermissionChange={handlePermissionToggle}
            onEdit
            rightSideAction={
              <CustomButton
                btntext={"Export to Excel"}
                icon={<FaFileExport />}
                handleClick={exportToExcel}
                addclass="gap-1"
              />
            }
            endAction={
              <CustomButton
                btntext={<MdRefresh size={18} />}
                addclass={`w-6 max-w-6 min-w-6 h-6 ${
                  isPending && "animate-spin"
                } `}
                padding="p-0"
                rounded="rounded-full"
                handleClick={() => {
                  setOffset(0);
                  handleFetchdata(null, true);
                }}              />
            }
          />
        </InfiniteScroll>
      </div>
    </>
  );
};

export default withPermissionCheck(Department, "product-departments");
