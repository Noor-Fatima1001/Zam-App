import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import InputField from "../../components/form-elements/InputField";
import SelectField from "../../components/form-elements/SelectField";

import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import AntdSelectField from "../../AntdSelectField";

const AddUnitList = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.ADD_UNIT_LIST);

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
   
    console.log("🚀 ~ onSubmit ~ data:", data);
    console.log(data);
    const body = {
      dataInsert: {
        packaging_id: data?.packaging_id,
        size: data?.size,
        unit_id: data?.unit_id,
        created_by: UserId,
      },
    };
    mutate(body, {
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

  const breadcrumbItems = [
    { title: "Unit List", link: "unit-list" },
    { title: "Add Unit List" },
  ];

  return (
    <div>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>

          <div className="mt-2">
            <AntdSelectField
              label="packaging"
              control={control}
              name="packaging_id"
              endpoint={API_ENDPOINTS.GET_UNIT_MASTER}
              queryKey="um.description"
              valueKey="record_id"
              labelKey="unit_description"
              responseWhich="data"
              baseFilters={[
                {
                  key: "um.type",
                  operator: "equal",
                  value1: "packaging",
                  logical: "",
                },
              ]}
              rules={{
                required: "packaging is required",
              }}
              error={errors.packaging_id}
            />
            <InputField
              label={"size"}
              register={register("size", {
                required: "size is required",
                validate: (value) =>
                  value > 0 || "Please enter a positive number",
              })}
              error={errors.size?.message}
            />

            <AntdSelectField
              label="Unit"
              control={control}
              name="unit_id"
              endpoint={API_ENDPOINTS.GET_UNIT_MASTER}
              queryKey="um.description"
              valueKey="record_id"
              labelKey="unit_description"
              responseWhich="data"
              baseFilters={[
                {
                  key: "um.type",
                  operator: "equal",
                  value1: "unit",
                  logical: "",
                },
              ]}
              rules={{
                required: "Unit is required",
              }}
              error={errors.unit_id}
            />
          </div>
          <div className="d-flex  gap-2 justify-content-center mt-3">
            <CustomButton
              btntext={"submit"}
              type="submit"
              isLoading={isPending}
            />
            <CustomButton
              btntext={"Add New Unit Master"}
              handleClick={() => navigate(`${rootFolder}/add-unit-master`)}
            />
          </div>
      </form>
    </div>
  );
};

export default withPermissionCheck(AddUnitList, "add-unit-list");
