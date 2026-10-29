import { Select } from "antd";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FaAngleLeft } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useAddModule } from "../../apis/useProduct/useModule";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import { moduleIconOptions } from "../../config/selectList";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";


const AddModule = () => {
  const { mutate, isPending } = useAddModule();
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm();
  const onSubmit = (data) => {
    console.log(data);
    mutate(
      {
        dataInsert: {
          module_name: data?.module_name,
          module_text: data?.module_text,
          header_icon: data?.icon,
          header_link: "",
          created_by: UserId,
        },
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success("Module added successfully!")
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: "Module added successfully!",
            // });
            // reset();
            // navigate(`${rootFolder}/module-list`);
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
  console.log("🚀 ~ AddModule ~ selectIcon:", selectIcon);
  const breadcrumbItems = [
    { title: "Module", link: "module-list" },
    { title: "Add Module" },
  ];

  return (
    <>
      <form
        autocomplete="off"
        onSubmit={handleSubmit(onSubmit)}
        className="w-full  mx-auto bg-white  rounded-radiusRegular"
      >
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
              <div className="border w-8 h-7 flex text-base justify-center items-center rounded-radiusRegular">
                {selectIcon && <i className={selectIcon}></i>}
              </div>
            </div>
            {errors.icon && (
              <p className="text-red-500 text-xs">{errors.icon.message}</p>
            )}{" "}
            {/* Error message */}
          </div>
        </div>
        <div className="d-flex justify-content-center mt-3 ">
          <CustomButton addclass=""
            btntext={"submit"}
            type="submit"
            isLoading={isPending}
          />
        </div>
      </form>
    </>
  );
};

export default withPermissionCheck(AddModule, "add-module");
