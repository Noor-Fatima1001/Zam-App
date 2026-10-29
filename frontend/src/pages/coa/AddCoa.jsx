import React from "react";
import { useForm } from "react-hook-form";
import { FaAngleLeft } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import SelectField from "../../components/form-elements/SelectField";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";

const AddCoa = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.Add_COA);
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    mutate(
      {
        dataInsert: {
          gl_code: data?.gl_code,
          gl_name: data?.gl_name,
          gl_type_id: parseInt(data?.gl_type_id?.value),
          created_by: UserId,
        },
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success("Added successfully!.")
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: "added successfully!",
            // });
            // reset();
            // navigate(`${rootFolder}/coa-list`);
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
  const breadcrumbItems = [
    { title: "COA", link: "coa-list" },
    { title: "Add COA" },
  ];
  return (
    <div>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
        <CustomBreadcrumb items={breadcrumbItems} />
        <div className="w-full max-w-md mx-auto bg-white shadow-sm  rounded-radiusRegular p-3">
          <h1 className="mb-2 text-center text-size text-color font-headingweight">
            Add Accounting and finance
          </h1>
          <div className="grid grid-cols-1 gap-2">
            <InputField
              label={"General Ledger Code"}
              type={"number"}
              register={register("gl_code", {
                required: "General Ledger code is required",
              })}
              error={errors.gl_code?.message}
            />
            <InputField
              label={"General Ledger Name"}
              register={register("gl_name", {
                required: "General Ledger name is required",
              })}
              error={errors.gl_name?.message}
            />

            <SelectField
              label="General Ledger type"
              control={control}
              name="gl_type_id"
              endpoint={API_ENDPOINTS.GET_SUB_HEAD}
              queryKey="sub_name"
              valueKey="record_id"
              labelKey="sub_name"
              responseWhich="data"
              rules={{ required: "General Ledger type is required" }}
              error={errors.gl_type_id}
            />
          </div>
          <div className="d-flex justify-content-center mt-3">
            <CustomButton
              btntext={"submit"}
              type="submit"
              isLoading={isPending}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default withPermissionCheck(AddCoa, "add-coa");
