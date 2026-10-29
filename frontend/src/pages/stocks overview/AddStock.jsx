// import React, { useState } from "react";
import { useForm } from "react-hook-form";
// import { useNavigate } from "react-router-dom";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";

const AddStock = ({ departmentData }) => {
  // console.log("🚀 ~ AddStock ~ departmentData:", departmentData);
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.ADD_STOCK);

  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    // reset,
    setValue,
  } = useForm();

  const onSubmit = (data) => {
    console.log("🚀 ~ onSubmit ~ data:", data);
    console.log(data);
    const body = {
      dataInsert: {
        // assign_product_dept_id: departmentData.record_id,
        assign_product_dept_id: departmentData.record_id,
        opening_qty: data?.opening_qty,
        live_qty: data?.live_qty,
        opening_price: data?.opening_price,
        average_price: data?.opening_price,
        starting_date: moment(data?.starting_date).format("YYYY-MM-DD"),

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
        console.log(error);
        toast.error("Something went wrong")
        // Swal.fire({
        //   title: "Error",
        //   text: "Something went wrong",
        //   icon: "error",
        // });
      },
    });
  };

  return (
    <div>
      <div className=" text-customBlue  font-regularweight">{departmentData?.product_name}</div>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <div className="">
          <h1 className="mb-2 text-center text-size text-color font-headingweight">
            Add Stock List
          </h1>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <InputField
              label={"Opening quantity"}
              register={register("opening_qty", {
                required: "Opening quantity is required",
                validate: (value) =>
                  value >= 0 || "Please enter a positive number",
              })}
              error={errors.opening_qty?.message}
            />
            <InputField
              label={"Opening Price"}
              register={register("opening_price", {
                required: "Opening Price is required",
                validate: (value) =>
                  value >= 0 || "Please enter a positive number",
              })}
              error={errors.opening_price?.message}
            />
            <InputField
              label={"live Quanitity"}
              register={register("live_qty", {
                required: "live Quanitity is required",
                validate: (value) =>
                  value >= 0 || "Please enter a positive number",
              })}
              error={errors.live_qty?.message}
            />
            {/* <InputField
              label={"Average Price"}
              register={register("average_price", {
                required: "Average Price is required",
                validate: (value) =>
                  value >= 0 || "Please enter a positive number",
              })}
              error={errors.average_price?.message}
            /> */}
            <div>
              <label className="mb-1 text-color font-regularweight">Average price</label>
              <div className="h-7 border rounded-lg bg-gray-100 px-2 flex items-center">
                {watch("opening_price")}
              </div>
            </div>
            <InputField
              label="Starting Date"
              control={control}
              type={"date"}
              register={"starting_date"} // ✅ Correct
              rules="Starting Date is required"
              error={errors?.starting_date}
            />
          </div>
          <div className="d-flex  gap-2 justify-content-center mt-3">
            <CustomButton
              btntext={"submit"}
              type="submit"
              isLoading={isPending}
            />
            {/* <CustomButton
              btntext={"Add New Stock Master"}
              handleClick={() => navigate(`${rootFolder}/add-Stock-master`)}
            /> */}
          </div>
        </div>
      </form>
    </div>
  );
};

export default withPermissionCheck(AddStock, "add-stock");
