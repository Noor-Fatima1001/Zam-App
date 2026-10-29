import { DatePicker } from "antd";
import moment from "moment";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
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
import dayjs from "dayjs";

const UpdateTax = ({ routeData }) => {
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.UPDATE_TAX);
  const { mutate: GlMutate, data: optionData } = useGlobelApi(
    API_ENDPOINTS.GET_COA
  );

  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    reset,
  } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    mutate(
      {
        dataUpdate: {
          record_id: routeData?.record_id,
          tax_type: data?.tax_type,
          tax_name: data?.tax_name,
          tax_value: parseFloat(data.tax_value).toFixed(3),
          date_wef: moment(data?.date_wef).format("YYYY-MM-DD"),
          gl_id: parseInt(data?.gl_id?.value),
          status: data?.status ? 1 : 0,
          changed_by: UserId,
        },
      },
      {
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
      }
    );
  };
  useEffect(() => {
    if (routeData) {
      setValue("tax_name", routeData?.tax_name);
      setValue("tax_type", routeData?.tax_type);
      setValue("tax_value", routeData?.tax_value);
      setValue("status", routeData?.status);
      const formattedDate = moment(routeData?.date_wef).format("DD-MM-YYYY");
      setValue("date_wef", moment(formattedDate, "DD-MM-YYYY").toDate());
    }
  }, [ navigate]);
  useEffect(() => {
    GlMutate({ filters: null, limit: 0, offset: 1 });
  }, []);

  useEffect(() => {
    if (routeData && optionData?.data?.length > 0) {
      const selectedModule = optionData?.data?.find(
        (m) => m.record_id === routeData?.gl_id
      );
      setValue(
        "gl_id",
        selectedModule
          ? {
              value: selectedModule.record_id,
              label: selectedModule.gl_name,
            }
          : null
      );
    }
  }, [optionData,  navigate]);
  return (
    <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="w-full text-color font-regularweight mb-1">Tax type</label>

          <select
            {...register("tax_type", {
              required: "Tax type is required",
            })}
            className="w-full border focus:outline-none h-7 rounded-lg text-sm text-gray-400"
            defaultValue=""
          >
            <option value="" disabled>
              Select tax
            </option>
            <option value="sales_tax">Sales Tax</option>
            <option value="purchase_tax">Purchase Tax</option>
          </select>

          {errors.tax_type && (
            <div className="form-text text-xs text-danger mt-1">
              {errors.tax_type?.message}
            </div>
          )}
        </div>
        <InputField
          label={"Tax name"}
          placeholder={"Enter tax name"}
          register={register("tax_name", {
            required: "tax name is required",
          })}
          error={errors.tax_name?.message}
        />
        <InputField
          label={"Tax value"}
          placeholder={"Enter tax value"}
          register={register("tax_value", {
            required: "Tax value is required",
            validate: (value) => {
              value = value.toString();
              if (value.startsWith(".")) {
                value = `0${value}`; // Agar '.' se start ho, to '0' add kar dein
                setValue("tax_value", value, { shouldValidate: true }); // Automatically update field
              }

              const parsedValue = parseFloat(value);
              if (isNaN(parsedValue)) {
                return "Value must be a number";
              }
              if (parsedValue < 0 || parsedValue > 1) {
                return "Value must be greater than 0 and less than or equal to 1";
              }
              if (!/^\d+(\.\d{1,2})?$/.test(value)) {
                return "Value can have up to 2 decimal places only";
              }
              return true;
            },
          })}
          error={errors.tax_value?.message}
        />

        <div>
          {/* <p className="text-sm">Posted date</p>
          <Controller
            name="date_wef"
            control={control}
            defaultValue={null} // Default null rakhein
            rules={{
              required: "date wef is required.",
            }}
            render={({ field, fieldState }) => (
              <div>
                <DatePicker
                  {...field}
                  needConfirm
                  value={field.value ? dayjs(field.value, "DD/MM/YYYY") : null}
                  placeholder="dd/mm/yy"
                  format={"DD/MM/YYYY"}
                  autoFocus={false}
                  style={{ fontFamily: "Inter" }}
                  className="custom-date-picker w-full h-7 mt-1 text-sm border-gray-300 rounded-lg focus:ring-0 focus:border-gray-300 hover:border-gray-300"
                  onChange={(date) => field.onChange(date || null)}
                />
                {fieldState.error && (
                  <p className="text-red-500 text-xs mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          /> */}
          <InputField
            label="Start date"
            control={control}
            type={"date"}
            register={"date_wef"}
            rules="start date is required"
            error={errors?.date_wef}
          />
        </div>
        <div>
          <SelectField
            label="General Ledger"
            labelCLass="capitalize"
            name="gl_id"
            control={control}
            type="select"
            endpoint={API_ENDPOINTS.GET_COA}
            queryKey="gl_name"
            valueKey="record_id"
            labelKey="gl_name"
            ContcatenateLabel="gl_code"
            rules={{ required: "gl is required" }}
            error={errors.gl_id}
          />
        </div>
        {/* status  */}
        <div className="  form-check mt-4 ">
          <label className="form-check-label text-color" htmlFor="status">
            Status
          </label>
         
          <input
            type="checkbox"
            className="form-check-input"
            id="status"
            {...register("status")}
          />
        </div>
      </div>
      <div className="d-flex justify-content-center mt-3">
        <CustomButton btntext={"submit"} type="submit" isLoading={isPending} />
      </div>
    </form>
  );
};

export default withPermissionCheck(UpdateTax, "update-tax");
