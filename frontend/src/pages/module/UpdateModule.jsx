import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { FaAngleLeft } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useUpdateModule } from "../../apis/useProduct/useModule";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import {
  getFromLocalStorage,
  getFromSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import { moduleIconOptions } from "../../config/selectList";
import { Select } from "antd";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import { Label } from "recharts";


const UpdateModule = ({editdata,handleFetchdata}) => {
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const location = useLocation();
  const data = editdata;
  const moduleId = data?.record_id;
  console.log("🚀 ~ UpdateSubModule ~ data:", editdata);
  const { mutate, isPending } = useUpdateModule();
  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm();
  const onSubmit = (data) => {
    console.log(data);
    mutate(
      {
        record_id: moduleId,
        dataUpdate: {
          module_name: data?.module_name,
          module_text: data?.module_text,
          header_icon: data?.icon,
        },
        changed_by: UserId,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            handleFetchdata(null, true)
            toast.success("Update successfully!")
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: "update successfully!",
            // });
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
  const selectIcon = watch("icon");

  useEffect(() => {
    setValue("module_name", data?.module_name || "");
    setValue("module_text", data?.module_text || "");
    setValue("icon", data?.header_icon || "");
  }, [moduleId,navigate]);
  // const breadcrumbItems = [
  //   { title: "Module", link: "module-list" },
  //   { title: "Update Module" },
  // ];
  return (
    <>
      <div>
          {/* <CustomBreadcrumb items={breadcrumbItems} /> */}
        <form
          autocomplete="off"
          onSubmit={handleSubmit(onSubmit)}
          className="w-full mx-auto bg-white  rounded-radiusRegular "
        >
          {/* <h2 className="mb-2 text-center text-lg font-semibold text-black">
            Update Module
          </h2> */}

          <div className="grid grid-cols-1 gap-2 ">
            <InputField
              label={"Name"}
              register={register("module_name", {
                required: "name is required",
              })}
              error={errors.module_name?.message}
            />

            <InputField
              label={"Module text"}
              register={register("module_text", {
                required: "module text is required",
              })}
              error={errors.module_text?.message}
            />
            <div className="">
            <label className="text-color font-regularweight">Icon</label>
              <div className="flex gap-2 mt-1">
                <Controller
                  name="icon" // Field name for the select input
                  control={control}
                  rules={{ required: "Please select an icon" }} // Add required validation
                  render={({ field }) => (
                    <Select
                      {...field}
                      showSearch
                      placeholder="Select an icon"
                      optionFilterProp="label"
                      className="custom-ant-select w-full h-7"
                      onSearch
                      options={moduleIconOptions.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                    />
                  )}
                />
                <div className="border w-8 h-7 flex text-base justify-center items-center rounded-md">
                  {selectIcon && <i className={selectIcon}></i>}
                </div>
              </div>
              {errors.icon && (
                <p className="text-red-500 text-xs">{errors.icon.message}</p>
              )}{" "}
              {/* Error message */}
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
    </>
  );
};

export default withPermissionCheck(UpdateModule, "update-module");
