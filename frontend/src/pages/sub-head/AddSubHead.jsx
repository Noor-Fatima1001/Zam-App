import React, { useState } from "react";
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


const AddSubHead = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.Add_SUB_HEAD);

  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const [moduleData, setModuleData] = useState([]);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm();
  // const inputValue = watch("module_id");
  // const debouncedSearch = useDebounce(inputValue, 500);
  const onSubmit = (data) => {
    console.log(data);
    mutate(
      {
        dataInsert: {
          coa_main_head_id: parseInt(data?.coa_main_head_id?.value),
          sub_name: data?.sub_name,
          created_by: UserId,
        },
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success("Moddule added successfully!")
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: "Module added successfully!",
            // });
            // reset();
            // navigate(`${rootFolder}/sub-head-list`);
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
    { title: "Sub Head", link: "sub-head-list" },
    { title: "Add Sub Head" },
  ];
  return (
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
          <div className="gap-x-3 gap-y-2 grid grid-cols-2">
            <InputField
              label={"Name"}
              register={register("sub_name", {
                required: "name is required",
              })}
              error={errors.sub_name?.message}
            />

            <SelectField
              label="Module"
              control={control}
              name="coa_main_head_id"
              endpoint={API_ENDPOINTS.GET_MAIN_HEAD}
              queryKey="head_name"
              valueKey="record_id"
              labelKey="head_name"
              responseWhich="data"
              rules={{ required: "head name is required" }}
              error={errors.coa_main_head_id}
            />
          </div>
          <div className="d-flex justify-content-center mt-3">
            <CustomButton
              btntext={"submit"}
              type="submit"
              isLoading={isPending}
            />
          </div>
      </form>
  );
};

export default withPermissionCheck(AddSubHead, "sub-module-list");
