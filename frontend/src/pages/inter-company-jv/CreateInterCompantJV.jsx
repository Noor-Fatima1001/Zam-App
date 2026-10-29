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
import { toast } from "react-toastify";
import AntdSelectFieldTable from "../../AntSelectFieldTable";
import InputFieldTable from "../../components/form-elements/InputFieldTable";
import CustomButton from "../../components/button/CustomButton";
import { MdDelete } from "react-icons/md";
import Loader from "../../components/Loader";
import withPermissionCheck from "../../config/withPermissionCheck";
import { filterAndSortData } from "../../utils/helper.function";
import AntSelectFieldTable from "../../AntSelectFieldTable";
import AntSSelectField from "../../AntSSelectField";

const CreateInterCompantJV = () => {
  const {
    register,
    control,
    formState: { errors },
    setValue,
    getValues,
    watch,
    trigger,
  } = useForm({ mode: "onChange", reValidateMode: "onChange" });

  const data = getFromSessionStorage("inter-company-jv-data");
  const userHeaderData = data?.data;
  const [isCopy, setIsCopy] = useState(data?.iscopy || false);
  const [headerId, setHeaderId] = useState(userHeaderData?.header?.header_id || userHeaderData?.record_id);
  const UserId = getFromLocalStorage("UserId");
  const [rowsData, setRowsData] = useState([]);
  const [apiData, setApiData] = useState([]);
  const { mutate: createInterCompanyJV } = useGlobelApi(API_ENDPOINTS.CREATE_INTER_COMP_JV);
  const { mutate: fetchData, isPending: headerIsPending } = useGlobelApi(
    API_ENDPOINTS.GET_INTER_COMP_JV_HEAD
  );
  const { mutate: getJeEntries, isPending } = useGlobelApi(
    API_ENDPOINTS.GET_INTER_COMP_JV_ENTRIES
  );
  const { mutate: fetchCompanies, isPending: companiesPending } = useGlobelApi(API_ENDPOINTS.USER_TO_COMPANY);
  const [companies, setCompanies] = useState([]);
  const [companyData, setCompanyData] = useState();
  const navigate = useNavigate();
  const [status, setStatus] = useState("save");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [postingDate, setPostingDate] = useState();

  const baseFilters = [
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
  ];

  useEffect(() => {
    fetchCompanies(
      { filters: baseFilters, limit: 0, offset: 0 },
      {
        onSuccess: (res) => setCompanies(res?.result || []),
      }
    );
  }, []);

  const companyMap = useMemo(
    () =>
      companies.reduce((map, company) => {
        map[company.company_id] = company.company_name;
        return map;
      }, {}),
    [companies]
  );

  const headers = [
    { key: "company_id", label: "Company", width: 200, sortable: true, filterable: true },
    { key: "description", label: "Description", width: 300, sortable: true, filterable: true },
    { key: "gl_name", label: "GL Account", width: 300, sortable: true, filterable: true, filterKey: "gl_name_label" },
    { key: "debit", label: "Debit", width: 200, sortable: true, filterable: true },
    { key: "credit", label: "Credit", width: 200, sortable: true, filterable: true },
    { key: "action", label: "Action", width: 100, sortable: false, filterable: false },
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
          pairId: null,
          isLeading: false,
          company_id: "",
          company_label: "",
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
        } else if (fieldName === "company_id") {
          targetRow.company_id = value?.value || "";
          targetRow.company_label = value?.label || "";
          apiRow.company_id = value?.value || "";
          apiRow.company_label = value?.label || "";
        } else {
          targetRow[fieldName] = value || "";
          apiRow[fieldName] = value || "";
          if (fieldName === "debit" && value && parseFloat(value) > 0) {
            targetRow.credit = "0";
            apiRow.credit = "0";
          }
          if (fieldName === "credit" && value && parseFloat(value) > 0) {
            targetRow.debit = "0";
            apiRow.debit = "0";
          }
        }
        return newApiData;
      });

      return newData;
    });
  };

  const handleAddClick = () => {
    const leadingCompany = companyData;
    if (!leadingCompany) {
      toast.error("Please select the leading company first");
      return;
    }

    const maxPairId = apiData.length > 0 ? Math.max(...apiData.map((row) => row.pairId || 0)) : 0;
    const pairId = maxPairId + 1;
    const nextIndex = apiData.length;

    const newLeadingRow = {
      index: nextIndex,
      pairId,
      isLeading: true,
      company_id: leadingCompany.value,
      company_label: leadingCompany.label,
      description: "",
      gl_id: "",
      gl_name: "",
      gl_name_label: "",
      debit: "0",
      credit: "0",
    };

    const newOtherRow = {
      index: nextIndex + 1,
      pairId,
      isLeading: false,
      company_id: "",
      company_label: "",
      description: "",
      gl_id: "",
      gl_name: "",
      gl_name_label: "",
      debit: "0",
      credit: "0",
    };

    setRowsData((prevData) => [...prevData, newLeadingRow, newOtherRow]);
    setApiData((prevApiData) => [...prevApiData, newLeadingRow, newOtherRow]);
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
    let rowValid = true;

    apiData.forEach((row) => {
      const debit = parseFloat(row.debit) || 0;
      const credit = parseFloat(row.credit) || 0;
      const glAccount = row.gl_id;
      const companyId = row.company_id;

      if (!glAccount || !companyId) {
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

    const company_id = companyData?.value;
    const posting_date = getValues("posting_date");
    const header_text = getValues("header_text");
    const gl_type = getValues("gl_type");
    if (!company_id || !posting_date || !header_text || !gl_type) {
      toast.error("Please fill all required fields");
      return;
    }

    const finalArray = {
      header: {
        header_text,
        posting_date: moment(posting_date).format("YYYY-MM-DD"),
        leading_company_id: company_id.value ? company_id.value : company_id,
        created_by: UserId,
        status: status,
        type: gl_type,
        amount: 0,
        ...(headerId && !isCopy ? { header_id: headerId } : {}),
      },
      entries: apiData.map((row) => ({
        company_id: parseInt(row.company_id) || 0,
        gl_id: parseInt(row.gl_id) || 0,
        description: row.description || "",
        debit: parseFloat(row.debit) || 0,
        credit: parseFloat(row.credit) || 0,
      })),
    };

    createInterCompanyJV(
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
          toast.error("Failed to save Inter Company JV");
        },
      }
    );
  };

  const handleFetchData = () => {
    const filters = [
      { key: "ich.id", operator: "equal", value1: headerId, logical: "" },
    ];
    const eFilters = [
      { key: "ice.inter_comp_header_id", operator: "equal", value1: headerId, logical: "" },
    ];
    fetchData(
      { filters, limit: 0, offset: 0, orderby: "" },
      {
        onSuccess: (response) => {
          const data = response.data?.[0] || userHeaderData?.header;
          if (data) {
            setValue(
              "company_name",
              { value: data.company_id || data.leading_company_id, label: data.company_name || "" },
              { shouldValidate: true }
            );
            setCompanyData({ value: data.company_id || data.leading_company_id, label: data.company_name || "" });
            setValue("posting_date", data.posting_date);
            setValue("amount", data.amount);
            setValue("gl_type", data.type);
            setPostingDate(data.posting_date);
            setValue("header_text", data.header_text || data.header_text, {
              shouldValidate: true,
            });
          }
        },
        onError: (err) => console.error("Fetch header error:", err),
      }
    );

    if (headerId) {
      getJeEntries(
        { filters: eFilters, limit: 0, offset: 0 },
        {
          onSuccess: (res) => {
            const fetchedEntries = res?.data || [];
            let formattedRows = fetchedEntries.map((item, idx) => ({
              index: idx,
              pairId: Math.floor(idx / 2),
              isLeading: idx % 2 === 0,
              company_id: item.company_id?.toString() || "",
              company_label: companyMap[item.company_id] || "",
              gl_id: item.gl_id?.toString() || "",
              gl_name: item.gl_code || "",
              gl_name_label: item.gl_code || "",
              description: item.description || "",
              debit: parseFloat(item.debit || 0).toFixed(2),
              credit: parseFloat(item.credit || 0).toFixed(2),
            }));

            const leadingId = getValues("company_name")?.value || companyData?.value;
            const pairedRows = [];
            const numPairs = Math.floor(formattedRows.length / 2);

            for (let p = 0; p < numPairs; p++) {
              let pair = formattedRows.filter((r) => r.pairId === p);
              if (pair.length === 2) {
                if (
                  pair[0].company_id !== leadingId &&
                  pair[1].company_id === leadingId
                ) {
                  const temp = pair[0];
                  pair[0] = pair[1];
                  pair[1] = temp;
                }
                pair[0].isLeading = true;
                pair[1].isLeading = false;
                pairedRows.push(...pair);
              }
            }

            // Handle odd number of rows if any
            const remaining = formattedRows.filter((r) => r.pairId >= numPairs);
            remaining.forEach((r) => {
              r.isLeading = r.company_id === leadingId;
              pairedRows.push(r);
            });

            // Reassign indices
            const finalRows = pairedRows.map((row, index) => ({
              ...row,
              index,
            }));

            setApiData(finalRows);
            setRowsData(finalRows);
          },
          onError: (error) => console.error("Error fetching entries:", error),
        }
      );
    } else {
      // Initialize with session data if available
      const formattedRows = userHeaderData.entries.map((item, idx) => ({
        index: idx,
        pairId: Math.floor(idx / 2),
        isLeading: idx % 2 === 0,
        company_id: item.company_id?.toString() || "",
        company_label: companyMap[item.company_id] || "",
        gl_id: item.gl_id?.toString() || "",
        gl_name: item.gl_name || "",
        gl_name_label: item.gl_name || "",
        description: item.description || "",
        debit: parseFloat(item.debit || 0).toFixed(2),
        credit: parseFloat(item.credit || 0).toFixed(2),
      }));

      // Apply same pairing logic as above
      const leadingId = getValues("company_name")?.value || companyData?.value;
      const pairedRows = [];
      const numPairs = Math.floor(formattedRows.length / 2);

      for (let p = 0; p < numPairs; p++) {
        let pair = formattedRows.filter((r) => r.pairId === p);
        if (pair.length === 2) {
          if (
            pair[0].company_id !== leadingId &&
            pair[1].company_id === leadingId
          ) {
            const temp = pair[0];
            pair[0] = pair[1];
            pair[1] = temp;
          }
          pair[0].isLeading = true;
          pair[1].isLeading = false;
          pairedRows.push(...pair);
        }
      }

      const remaining = formattedRows.filter((r) => r.pairId >= numPairs);
      remaining.forEach((r) => {
        r.isLeading = r.company_id === leadingId;
        pairedRows.push(r);
      });

      const finalRows = pairedRows.map((row, index) => ({
        ...row,
        index,
      }));

      setApiData(finalRows);
      setRowsData(finalRows);
    }
  };

  useEffect(() => {
    if (headerId || userHeaderData?.header) {
      handleFetchData();
    } else {
      setRowsData([]);
      setApiData([]);
    }
  }, [headerId, companies]); // Re-run if companies change to update labels

  useEffect(() => {
    const data = getFromSessionStorage("inter-company-jv-data");
    const userHeaderData = data?.data;
    const id = userHeaderData?.header?.header_id || userHeaderData?.record_id;
    if (headerId !== id) {
      setIsCopy(data?.iscopy || false);
      setHeaderId(id);
    }
  }, [navigate]);

  const deleteEntry = (rowIndex) => {
    const rowToDelete = apiData.find((item) => item.index === rowIndex);
    if (!rowToDelete) return;

    const pairIdToDelete = rowToDelete.pairId;

    setRowsData((prevData) => {
      const newRowsData = prevData.filter((item) => item.pairId !== pairIdToDelete);
      return newRowsData.map((item, index) => ({
        ...item,
        index,
      }));
    });

    setApiData((prevApiData) => {
      const newApiData = prevApiData.filter((item) => item.pairId !== pairIdToDelete);
      return newApiData.map((item, index) => ({
        ...item,
        index,
      }));
    });
  };

  const renderCell = (value, row, columnKey) => {
    const rowIndex = row.index;
    const fieldName =
      columnKey === "gl_name"
        ? `gl_id${rowIndex}`
        : columnKey === "company_id"
          ? `company_id${rowIndex}`
          : `${columnKey}${rowIndex}`;

    if (columnKey === "action") {
      return row?.company_id == companyData?.value ? (
        <div className="d-flex justify-content-around">
          <button
            type="button"
            onClick={() => deleteEntry(rowIndex)}
            className="bg-customBlue w-7 h-7 rounded-md flex justify-center items-center text-white"
          >
            <MdDelete />
          </button>
        </div>
      ) : "";
    }

    if (columnKey === "company_id") {
      const defaultValue = {
        value: row.company_id,
        label: row.company_label || companyMap[row.company_id] || "",
      };
      return (
        <div>
          <AntSelectFieldTable
            control={control}
            name={fieldName}
            endpoint={API_ENDPOINTS.USER_TO_COMPANY}
            queryKey="company_name"
            valueKey="company_id"
            labelKey="company_name"
            responseWhich="result"
            placeholder="Select Company"
            rules={{ required: "Company is required" }}
            defaultValue={defaultValue}
            disabled={row?.company_id == companyData?.value}
            onSelectChange={(selected) => updateRowData(rowIndex, "company_id", selected)}
            baseFilters={[...baseFilters, ...[{
              key: "c.id",
              operator: "not equal",
              value1: companyData?.value,
              logical: "",
            },]]}
          />
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
            defaultValue={row.gl_id ? { value: row.gl_id, label: row.gl_name_label } : null}
            onSelectChange={(selected) => updateRowData(rowIndex, "gl_name", selected)}
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

  const columns = useMemo(
    () =>
      headers.map((header) => ({
        ...header,
        render: (value, row) => renderCell(value, row, header.key),
      })),
    [errors, watch, rowsData, companyMap]
  );

  if (isPending || headerIsPending || companiesPending) {
    return <Loader />;
  }

  const handleCompanyChange = (value) => {
    setCompanyData(value)
  }

  return (
    <div>
      <div className="bg-white shadow-sm p-3 rounded-radiusRegular my-3">
        <h1 className="text-size text-color font-headingweight text-center mb-2">
          {headerId ? "Update Inter Company JV" : "Create Inter Company JV"}
        </h1>
        <div>
          <div className="grid grid-cols-4 gap-x-2">
            <div>
              <AntSelectFieldTable
                label="Leading Company"
                control={control}
                name="company_name"
                endpoint={API_ENDPOINTS.USER_TO_COMPANY}
                queryKey="company_name"
                valueKey="company_id"
                labelKey="company_name"
                responseWhich="result"
                rules={{ required: "Company is required" }}
                disabled={apiData?.length > 0}
                error={errors.company_name?.message}
                baseFilters={baseFilters}
                defaultValue={companyData}
                onSelectChange={handleCompanyChange}
              />
            </div>

            <div>
              <InputFieldTable
                label="Posting Date"
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
                register={register("header_text", {
                  required: "Description is required",
                })}
                error={errors.header_text?.message}
              />
            </div>
            <div>
              <InputField
                label="Amount"
                type="number"
                step="0.001"
                allowNegative={true}
                maxDecimalLength={3}
                register={register("amount")}
                error={errors.amount?.message}
                field_disable={true}
              />
            </div>
            <div className="mt-2" >
              <AntSSelectField
                control={control}
                label={"Type"}
                isClearable={false}
                name={`gl_type`}
                options={[
                  { value: "receivable", label: "Receivable" },
                  { value: "payable", label: "Payable" },
                ]}
                rules={{ required: "Please select Type" }}
                error={errors[`gl_type`]?.message}
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
              btntext="Post"
              handleClick={() => {
                setStatus("posted");
                HandleSave("posted");
              }}
            />
            <CustomButton
              type="button"
              btntext="Add Pair"
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

export default withPermissionCheck(CreateInterCompantJV, "create-inter-company-jv");