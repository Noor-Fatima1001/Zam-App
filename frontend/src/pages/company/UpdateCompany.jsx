import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useUpdateCompany } from "../../apis/useProduct/useCompany";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";

const UpdateCompany = ({ CompanyData }) => {
  const data = CompanyData;
  const companyId = data?.record_id;

  console.log("🚀 ~ UpdateCompany ~ data:", data);

  const { mutate, isPending } = useUpdateCompany();
  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();
  const onSubmit = (data) => {
    console.log(data);
    mutate(
      {
        record_id: companyId,
        dataUpdate: {
          company_code: data?.company_code,
          company_name: data?.company_name,
          company_phone: data?.company_phone,
          company_address: data?.company_address,
        },
        changed_by: UserId,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success("Update successfully!")
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: "update successfully!",
            // });
            // reset();
          } else {
            toast.error(data?.result)
            // Swal.fire({
            //   icon: "error",
            //   title: "Error",
            //   text: data?.result,
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
      }
    );
  };
  useEffect(() => {
    setValue("company_code", data?.company_code || "");
    setValue("company_name", data?.company_name || "");
    setValue("company_phone", data?.company_phone || "");
    setValue("company_address", data?.company_address || "");
  }, [data, navigate]);

  return (
    <div>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <InputField
            label={"Code"}
            register={register("company_code", {
              required: "code is required",
            })}
            error={errors.company_code?.message}
          />

          <InputField
            label={"Name"}
            register={register("company_name", {
              required: "name is required",
            })}
            error={errors.company_name?.message}
          />
          <InputField
            label={"Company Phone"}
            register={register("company_phone", {
              required: "Company Phone is required",
            })}
            error={errors.company_phone?.message}
          />
          <InputField
            label={"Company Adderess"}
            register={register("company_address", {
              required: "Company Adderess is required",
            })}
            error={errors.company_address?.message}
          />
        </div>
        <div className=" mt-3">
          <CustomButton
            btntext={"submit"}
            type="submit"
            isLoading={isPending}
          />
        </div>
      </form>
    </div>
  );
};

export default withPermissionCheck(UpdateCompany, "update-company");
