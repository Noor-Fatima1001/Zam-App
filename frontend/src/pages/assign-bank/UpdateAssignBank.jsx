import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import AntdSelectField from "../../AntdSelectField";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import Loader from "../../components/Loader";

// const UpdateAssignBank = ({ listedit, handleFetchdata }) => {
  const UpdateAssignBank = ({ listedit, handleFetchdata }) => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.UPDATE_ASSIGN_BANK);
  const { mutate: getBankdata, isPending: isloading } = useGlobelApi(API_ENDPOINTS.ASSIGN_BANK_LIST);
  const [company,setCompany]=useState();
  const [gl,setGl]=useState();
  const [bank,setBank]=useState();
  const bankData = listedit;
  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      company_id: null,
      gl_id: null,
      bank_id: null,
      bank_address: "",
      branch_name: "",
      swift_code: "",
      iban_number: "",
      account_number: ""
    }
  });

  const onSubmit = (data) => {
    const body = {
      dataUpdate: {
        record_id: listedit?.record_id,
        bank_id: data.bank_id?.value ||  data.bank_id ,
        company_id: data.company_id?.value ||  data.company_id,
        gl_id: data.gl_id?.value|| data.gl_id,
        bank_address: data.bank_address,
        branch_name: data.branch_name,
        swift_code: data.swift_code,
        iban_number: data.iban_number,
        account_number: data.account_number,
        changed_by: UserId,
      },
    };

    mutate(body, {
      onSuccess: (response) => {
        handleFetchdata(null, true);
        toast.error(response.data)
        // Swal.fire({
        //   icon: response.success ? "success" : "error",
        //   title: response.success ? "Success" : "Error",
        //   text: response.data,
        // });
      },
      onError: (error) => {
        toast.error(error.message || "Something went wrong")
        // Swal.fire({
        //   title: "Error",
        //   text: error.message || "Something went wrong",
        //   icon: "error",
        // });
      },
    });
  };

  const getFetchbyId = () => {
    if (!bankData?.record_id) return;

    getBankdata(
      {
        filters: [{
          key: "abtc.id",
          operator: "equal",
          value1: bankData.record_id,
          logical: "",
        }],
        limit: 0,
        offset: 0,
      },
      {
        onSuccess: (data) => {
          if (data?.data?.length > 0) {
            const bankDetails = data.data[0];
            setValue("bank_id", {
              label: bankDetails.bank_name || "Unknown Bank",
              value: bankDetails.bank_id || "",
            });
            setValue("company_id", {
              label: bankDetails.company_name || "Unknown Company",
              value: bankDetails.company_id || "",
            });
            setValue("gl_id", {
              label: bankDetails.gl_name || "Unknown GL",
              value: bankDetails.gl_id || "",
            });
            setBank({
              label: bankDetails.bank_name,
              value: bankDetails.bank_id,
            });
            setCompany({
              label: bankDetails.company_name,
              value: bankDetails.company_id,
            });
            setGl({
              label: bankDetails.gl_name,
              value: bankDetails.gl_id,
            });
            setValue("bank_address", bankDetails.bank_address || "");
            setValue("branch_name", bankDetails.branch_name || "");
            setValue("swift_code", bankDetails.swift_code || "");
            setValue("iban_number", bankDetails.iban_number || "");
            setValue("account_number", bankDetails.account_number || "");
          }
        },
        onError: (error) => {
          console.error("Error fetching bank data:", error);
          toast.error("Failed to fetch bank data")
          // Swal.fire({
          //   icon: "error",
          //   title: "Error",
          //   text: "Failed to fetch bank data"
          // });
        },
      }
    );
  };

  useEffect(() => {
    if (bankData?.record_id) {
      getFetchbyId();
    } else {
      reset();
    }
  }, [bankData?.record_id, reset]);

  return (
    <div>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <div className="w-full mx-auto bg-white  rounded-radiusRegular">
          {(isloading || isPending) ? (
            <Loader />
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-x-2">
              <AntdSelectField
                label="Company"
                control={control}
                name="company_id"
                endpoint={API_ENDPOINTS.USER_TO_COMPANY}
                queryKey="company_name"
                valueKey="company_id"
                labelKey="company_name"
                responseWhich="result"
                rules={{ required: "Company is required" }}
                error={errors.company_id}
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
                defaultValue={
                  company
                }
              />
              <AntdSelectField
                label="GL"
                labelCLass="capitalize"
                name="gl_id"
                control={control}
                endpoint={API_ENDPOINTS.GET_COA}
                queryKey="gl_name"
                valueKey="record_id"
                labelKey="gl_name"
                ContcatenateLabel="gl_code"
                rules={{ required: "GL Payable is required" }}
                error={errors.gl_id}
                baseFilters={[]}
                defaultValue={
                  gl
                }
              />
              <InputField
                label="Branch Name"
                placeholder="Branch Name"
                register={register("branch_name", {
                  required: "Branch Name is required",
                })}
                error={errors.branch_name?.message}
              />
              <InputField
                label="Bank Address"
                placeholder="Bank Address"
                name="bank_address"
                register={register("bank_address", {
                  required: "Bank Address is required",
                })}
                error={errors.bank_address?.message}
              />
              <InputField
                label="Account Number"
                placeholder="Enter Account Number"
                register={register("account_number", {
                  required: "Account Number is required",
                })}
                error={errors.account_number?.message}
              />
              <InputField
                label="IBAN Number"
                placeholder="Enter IBAN Number"
                register={register("iban_number", {
                  required: "IBAN Number is required",
                })}
                error={errors.iban_number?.message}
              />
              <InputField
                label="Swift Code"
                placeholder="Swift Code"
                register={register("swift_code", {
                  required: "Swift Code is required",
                })}
                error={errors.swift_code?.message}
              />
            </div>
          )}
          <div className="flex gap-2 justify-content-center mt-3">
            <CustomButton
              btntext="Submit"
              type="submit"
              isLoading={isPending}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default withPermissionCheck(UpdateAssignBank, "update-bank-list");