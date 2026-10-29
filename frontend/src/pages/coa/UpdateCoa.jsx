import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaAngleLeft } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import SelectField from "../../components/form-elements/SelectField";
import {
  getFromLocalStorage,
  getFromSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";


const UpdateCoa = () => {
  const location = useLocation();
  const data = getFromSessionStorage("coaDetail") || "";
  console.log("🚀 ~ UpdateCoa ~ data:", data);
  const record_id = data?.record_id;
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.UPDATE_COA);
  const { mutate: moduleMutate } = useGlobelApi(API_ENDPOINTS.GET_SUB_HEAD);
  const UserId = getFromLocalStorage("UserId");
  const [subHeadData, setSubHeadData] = useState([]);
  const navigate = useNavigate();
  const handleFetchdata = () => {
    moduleMutate(
      { filters: null, limit: 0, offset: 1 },
      {
        onSuccess: (data) => {
          setSubHeadData(data?.data);
        },
        onError: (error) => {
          console.error("Error fetching users:", error);
        },
      }
    );
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm();
  const onSubmit = (data) => {
    console.log(data);
    mutate(
      {
        record_id: record_id,
        dataUpdate: {
          gl_code: data?.gl_code,
          gl_name: data?.gl_name,
          gl_type_id: parseInt(data?.gl_type_id?.value),
        },
        changed_by: UserId,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success("update successfully!")
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
  useEffect(() => {
    handleFetchdata();
  }, []);
  useEffect(() => {
    if (data) {
      setValue("gl_name", data?.gl_name || "");
      setValue("gl_code", data?.gl_code || "");
      // setValue("status", data?.status || "");
    }
  }, [data, record_id, navigate]);
  useEffect(() => {
    if (subHeadData.length > 0 && data) {
      const selectedModule = subHeadData.find(
        (m) => m.record_id === data?.gl_type_id
      );
      setValue(
        "gl_type_id",
        selectedModule
          ? {
            value: selectedModule.record_id,
            label: selectedModule.sub_name,
          }
          : null
      );
    }
  }, [subHeadData, data, navigate]);
  const breadcrumbItems = [
    { title: "COA", link: "coa-list" },
    { title: "Update COA" },
  ];
  return (
    <div>
      <CustomBreadcrumb items={breadcrumbItems} />

      <form
        autocomplete="off"
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md mx-auto bg-white shadow-sm  rounded-radiusRegular p-3"
      >
        <h1 className="text-center mb-2 text-size text-color font-headingweight">
          Update COA
        </h1>
        <div className="grid grid-cols-1 gap-2 ">
          <InputField
            label={"General Ledger Code"}
            type={"number"}
            register={register("gl_code")}
          />
          <InputField
            label={"General Ledger Name"}
            register={register("gl_name")}
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
          // rules={{ required: "General Ledger type is required" }}
          // error={errors.gl_type_id}
          />

          {/* status  */}
          {/* <div className="form-check mt-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="status"
                  {...register("status")}
                />
                <label className="form-check-label" htmlFor="status">
                  Status
                </label>
              </div> */}
        </div>
        <div className="d-flex justify-content-center mt-3">
          <CustomButton btntext={"Save"} type="submit" isLoading={isPending} />
        </div>
      </form>
    </div>
  );
};

export default withPermissionCheck(UpdateCoa, "update-coa");
