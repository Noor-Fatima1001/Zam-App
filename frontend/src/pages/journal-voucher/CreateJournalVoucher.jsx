import React, { useEffect, useState, useMemo } from "react";
import ResizableTable from "../../components/table/ResizableTable";
import AntdSelectField from "../../AntdSelectField";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useForm } from "react-hook-form";
import {
  getFromLocalStorage,
  getFromSessionStorage,
} from "../../config/crypto-file";
import InputField from "../../components/form-elements/InputField";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import {toast} from "react-toastify";
import AntdSelectFieldTable from "../../AntSelectFieldTable";
import InputFieldTable from "../../components/form-elements/InputFieldTable";
import CustomButton from "../../components/button/CustomButton";
import { MdDelete } from "react-icons/md";
import Loader from "../../components/Loader";
import withPermissionCheck from "../../config/withPermissionCheck";
import { filterAndSortData } from "../../utils/helper.function";

const CreateJournalVoucher = () => {
  const {
    register,
    control,
    formState: { errors },
    setValue,
    getValues,
    watch,
    trigger,
  } = useForm({ mode: "onChange", reValidateMode: "onChange" });

  const data = getFromSessionStorage("jh-module-detailData");
  const userHeaderData = data?.data;
  const [isCopy, setIsCopy] = useState(data?.iscopy);
  const [headerId, setHeaderId] = useState(userHeaderData?.record_id);
  const UserId = getFromLocalStorage("UserId");
  const [rowsData, setRowsData] = useState([]);
  const [apiData, setApiData] = useState([]); // New state for complete data
  const { mutate: createVoucher } = useGlobelApi(API_ENDPOINTS.Add_JE_VOUCHER);
  const { mutate: fetchData, isPending: headerIsPending } = useGlobelApi(
    API_ENDPOINTS.GET_JE_VOUCHER_HEADER
  );
  const { mutate: getJeEntries, isPending } = useGlobelApi(
    API_ENDPOINTS.GET_JE_VOUCHER_ENTRIES
  );
  const [companyData, setCompanyData] = useState();
  const navigate = useNavigate();
  const [status, setStatus] = useState("save");
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [postingDate, setPostingDate] = useState();
  const headers = [
    { key: "action", label: "Action", width: 100 },
    {
      key: "description",
      label: "Description",
      width: 300,
      sortable: true,
      filterable: true,
    },
    {
      key: "gl_name",
      label: "GL Account",
      width: 300,
      sortable: true,
      filterable: true,
      filterKey: "gl_name_label",
    },
    {
      key: "debit",
      label: "Debit",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      key: "credit",
      label: "Credit",
      width: 200,
      sortable: true,
      filterable: true,
    },
  ];
  const [preservedConfig, setPreservedConfig] = useState();
  const [presfilters, setPresFilters] = useState();
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

  // Sync form state with rowsData
  // useEffect(() => {
  //   // Clear form values for removed rows
  //   const maxIndex = rowsData.length > 0 ? Math.max(...rowsData.map(row => row.index)) + 1 : 0;
  //   Object.keys(watch()).forEach((key) => {
  //     const match = key.match(/^(description|gl_id|debit|credit)(\d+)$/);
  //     if (match) {
  //       const index = parseInt(match[2], 10);
  //       if (!rowsData.some(row => row.index === index)) {
  //         setValue(key, undefined);
  //       }
  //     }
  //   });
  // }, []);

  const calculateTotals = () => {
    const totals = rowsData.reduce(
      (acc, row) => {
        acc.debit += parseFloat(row.debit || 0);
        acc.credit += parseFloat(row.credit || 0);
        return acc;
      },
      { debit: 0, credit: 0 }
    );

    return {
      debit: totals.debit.toFixed(2),
      credit: totals.credit.toFixed(2),
    };
  };

  const totals = calculateTotals();

  const updateRowData = (rowIndex, fieldName, value) => {
    setRowsData((prevData) => {
      const newData = [...prevData];
      let targetRow = newData.find((item) => item.index === rowIndex);

      if (!targetRow) {
        const newRow = {
          index: rowIndex,
          description: "",
          gl_id: "",
          gl_name: "",
          gl_name_label: "",
          debit: "0",
          credit: "0",
        };
        newData.push(newRow);
        targetRow = newRow;
      }

      setApiData((prevApiData) => {
        const newApiData = [...prevApiData];
        let apiRow = newApiData.find((item) => item.index === rowIndex);
        if (!apiRow) {
          newApiData.push({ ...targetRow });
          apiRow = newApiData.find((item) => item.index === rowIndex);
        }

        if (fieldName === "gl_name") {
          targetRow.gl_id = value?.value || "";
          targetRow.gl_name = value?.label || "";
          targetRow.gl_name_label = value?.label || "";
          apiRow.gl_id = value?.value || "";
          apiRow.gl_name = value?.label || "";
          apiRow.gl_name_label = value?.label || "";
          // setValue(`gl_id${rowIndex}`, value || null, { shouldValidate: formSubmitted });
        } else {
          targetRow[fieldName] = value || "";
          apiRow[fieldName] = value || "";
          // setValue(`${fieldName}${rowIndex}`, value || "", { shouldValidate: formSubmitted });
          if (fieldName === "debit" && value && parseFloat(value) > 0) {
            targetRow.credit = "0";
            apiRow.credit = "0";
            // setValue(`credit${rowIndex}`, "0", { shouldValidate: formSubmitted });
          }
          if (fieldName === "credit" && value && parseFloat(value) > 0) {
            targetRow.debit = "0";
            apiRow.debit = "0";
            // setValue(`debit${rowIndex}`, "0", { shouldValidate: formSubmitted });
          }
        }
        return newApiData;
      });

      return newData;
    });
  };

  const handleAddClick = () => {
    const rowIndex = apiData.length > 0 ? Math.max(...apiData.map(row => row.index)) + 1 : 0;
    const newRow = {
      index: rowIndex,
      description: "",
      gl_id: "",
      gl_name: "",
      gl_name_label: "",
      debit: "0",
      credit: "0",
    };
    setRowsData((prevData) => [...prevData, newRow]);
    setApiData((prevApiData) => [...prevApiData, newRow]);
  };

  const validateDebitCredit = (rowIndex) => ({
    validate: (value) => {
      const debit = parseFloat(watch(`debit${rowIndex}`)) || 0;
      const credit = parseFloat(watch(`credit${rowIndex}`)) || 0;

      if (debit === 0 && credit === 0) {
        return "Either Debit or Credit must be greater than zero";
      }
      if (debit > 0 && credit > 0) {
        return "Only one of Debit or Credit can be non-zero";
      }
      if (debit < 0 || credit < 0) {
        return "Values cannot be negative";
      }
      return true;
    },
  });

  const validateAllFields = async () => {
    
    // const isValid = await trigger();
    let rowValid = true;

    apiData.forEach((row) => {
      
      const debit = row?.debit || 0 ;
      const credit = row?.credit || 0 ;
      const glAccount = row.gl_id

      if (!glAccount) {
        rowValid = false;
      }

      if (debit === 0 && credit === 0) {
        rowValid = false;
      }
    });
    
    setFormSubmitted(true);
    return rowValid;
  };

  const HandleSave = async (status) => {
    
    const isFormValid = await validateAllFields();

    if (!isFormValid) {
      toast.error("Please fix all validation errors before saving");
      return;
    }

    if (status === "posted") {
      const totals = calculateTotals();
      if (parseFloat(totals.debit) !== parseFloat(totals.credit)) {
        toast.error("Total Debit must equal Total Credit for posting");
        return;
      }
    }

    const company_id = getValues("company_name");
    const posting_date = getValues("posting_date");
    const header_description = getValues("header_description");

    if (!company_id || !posting_date || !header_description) {
      toast.error("Please fill all required fields");
      return;
    }

    const finalArray = {
      header: {
        header_description,
        posting_date: moment(posting_date).format("YYYY-MM-DD"),
        company_id: company_id.value ? company_id.value : company_id,
        created_by: UserId,
        status: status,
        source: "manual",
        source_id: 0,
        ...(headerId && !isCopy ? { header_id: headerId } : {}),
      },
      entries: apiData.map((row) => ({
        gl_id: row.gl_id,
        description: row.description,
        debit: parseFloat(row.debit) || 0,
        credit: parseFloat(row.credit) || 0,
      })),
    };

    createVoucher(
      { dataInsert: finalArray },
      {
        onSuccess: (response) => {
          const data = response?.data?.[0];
          if (data?.msgType === "success") {
            setIsCopy(false);
            setHeaderId(data?.headerId);
          }
          toast[data.msgType](data?.message);
        },
        onError: (err) => {
          console.error("Save error:", err);
          toast.error("Failed to save journal voucher");
        },
      }
    );
  };

  const handleFetchData = () => {
    const filters = [
      { key: "jh.id", operator: "equal", value1: headerId, logical: "" },
    ];
    fetchData(
      { filters, limit: 0, offset: 0, orderby: "" },
      {
        onSuccess: (response) => {
          const data = response.data?.[0];
          if (data) {
            setValue(
              "company_name",
              { value: data.company_id, label: data.company_name },
              { shouldValidate: true }
            );
            setCompanyData({ value: data.company_id, label: data.company_name });
            setValue("posting_date", data.posting_date);
            setPostingDate(data.posting_date)
            setValue("header_description", data.header_description, {
              shouldValidate: true,
            });
          }
        },
        onError: (err) => console.error("Fetch header error:", err),
      }
    );

    getJeEntries(
      { filters, limit: 0, offset: 0 },
      {
        onSuccess: (res) => {
          const fetchedEntries = res?.data || [];
          const formattedRows = fetchedEntries.map((item, index) => ({
            index,
            gl_id: item.gl_id?.toString() || "",
            gl_name: item.gl_name || "",
            gl_name_label: item.gl_name || "",
            description: item.description || "",
            debit: parseFloat(item.debit || 0).toFixed(2),
            credit: parseFloat(item.credit || 0).toFixed(2),
          }));
          setApiData(formattedRows);
          setRowsData(formattedRows); // Initially, rowsData = apiData
        },
        onError: (error) => console.error("Error fetching entries:", error),
      }
    );
  };

  useEffect(() => {
    if (headerId) {
      console.log("Fetching data for headerId:", headerId);
      handleFetchData();
    } else {
      console.log("Create mode: No headerId provided");
      const initialRow = {
        index: 0,
        description: "",
        gl_id: "",
        gl_name: "",
        gl_name_label: "",
        debit: "0",
        credit: "0",
      };
      setRowsData([initialRow]);
      setApiData([initialRow]);
    }
  }, [headerId]);

  useEffect(() => {
    const data = getFromSessionStorage("jh-module-detailData");
    const userHeaderData = data?.data;
    const id = userHeaderData?.record_id;
    if (headerId !== id) {
      setIsCopy(data?.iscopy);
      setHeaderId(id);
    }
  }, [navigate]);

  const deleteEntry = (rowIndex) => {
    setRowsData((prevData) => {
      const newRowsData = prevData.filter((item) => item.index !== rowIndex);
      return newRowsData.map((item, index) => ({
        ...item,
        index,
      }));
    });
    setApiData((prevApiData) => {
      const newApiData = prevApiData.filter((item) => item.index !== rowIndex);
      return newApiData.map((item, index) => ({
        ...item,
        index,
      }));
    });
  };

  const renderCell = (value, row, columnKey) => {
    const rowIndex = row.index;
    const fieldName =
      columnKey === "gl_name" ? `gl_id${rowIndex}` : `${columnKey}${rowIndex}`;

    if (columnKey === "action") {
      return (
        <div className="d-flex justify-content-around">
          <button
            type="button"
            onClick={() => deleteEntry(rowIndex)}
            className="bg-customBlue w-7 h-7 rounded-md flex justify-center items-center text-white"
          >
            <MdDelete />
          </button>
        </div>
      );
    }

    if (columnKey === "gl_name") {
      return (
        <div>
          <AntdSelectFieldTable
            control={control}
            name={fieldName}
            endpoint={API_ENDPOINTS.GET_COA}
            queryKey="coa.gl_name"
            valueKey="record_id"
            labelKey="gl_name"
            ContcatenateLabel="gl_code"
            responseWhich="data"
            placeholder="Select GL"
            rules={{ required: "GL account is required" }}
            defaultValue={row.gl_id ? { value: row.gl_id, label: row.gl_name } : null}
            onSelectChange={(selected) =>
              updateRowData(rowIndex, "gl_name", selected)
            }
          />
        </div>
      );
    }

    return (
      <div>
        <InputFieldTable
          control={control}
          name={fieldName}
          error={errors?.[fieldName]?.message}
          value={row[columnKey] || ""}
          onChange={(e) => updateRowData(rowIndex, columnKey, e.target.value)}
          type={columnKey === "debit" || columnKey === "credit" ? "number" : "text"}
          useComma={columnKey === "debit" || columnKey === "credit" ? true : false}
        />
      </div>
    );
  };

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(
    () =>
      headers.map((header) => ({
        ...header,
        render: (value, row) => renderCell(value, row, header.key),
      })),
    [errors, watch, rowsData]
  );

  if (isPending || headerIsPending) {
    return <Loader />;
  }

  return (
    <div>
      <div className="bg-white shadow-sm p-3 rounded-radiusRegular my-3">
        <h1 className="text-size text-color font-headingweight text-center mb-2">
          {headerId ? "Update Journal Voucher" : "Add Journal Voucher"}
        </h1>
        <div>
          <div className="grid grid-cols-3 gap-x-2">
            <div>
              <AntdSelectField
                label="Company"
                control={control}
                name="company_name"
                endpoint={API_ENDPOINTS.USER_TO_COMPANY}
                queryKey="company_name"
                valueKey="company_id"
                labelKey="company_name"
                responseWhich="result"
                rules={{ required: "Company is required" }}
                error={errors.company_name?.message}
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
                defaultValue={companyData}
              />
              {errors.company_name && (
                <div className="text-red-500 text-xs mt-1">
                  {errors.company_name?.message}
                </div>
              )}
            </div>

            <div>
              <InputFieldTable
                label="Posting date"
                control={control}
                name="posting_date"
                type="date"
                defaultValue={postingDate}
                register={register("posting_date", {
                  required: "Posting date is required",
                })}
                error={errors?.posting_date?.message}
              />
            </div>

            <div>
              <InputField
                label="Header Description"
                register={register("header_description", {
                  required: "Description is required",
                })}
                error={errors.header_description?.message}
              />
            </div>
          </div>

          <div className="flex my-2 gap-3">
            <CustomButton
              type="button"
              btntext="Save"
              handleClick={() => {
                setStatus("save");
                HandleSave("save");
              }}
            />
            <CustomButton
              type="button"
              btntext="Posted"
              handleClick={() => {
                setStatus("posted");
                HandleSave("posted");
              }}
            />
            <CustomButton
              type="button"
              btntext="Add Row"
              handleClick={handleAddClick}
            />
          </div>
        </div>
      </div>

      <div>
        <ResizableTable
          data={rowsData}
          columns={columns}
          height="400px"
          isDense={true}
          customFilterFunction={customFilterFunction}
          scrollableId="journal-entries"
          isSelect={false}
          enableScroll={false}
        />

        <div className="mt-4 flex justify-end pr-4">
          <div className="bg-gray-100 p-4 rounded-md shadow-sm flex gap-8">
            <div className="font-semibold">
              Total Debit: <span className="text-green-600">{totals.debit}</span>
            </div>
            <div className="font-semibold">
              Total Credit: <span className="text-red-600">{totals.credit}</span>
            </div>
            {parseFloat(totals.debit) !== parseFloat(totals.credit) &&
              status === "posted" && (
                <div className="text-red-500 text-sm">
                  Debit and Credit must be equal for posting
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default withPermissionCheck(CreateJournalVoucher, "add-journal-voucher");