import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import InputField from "../../components/form-elements/InputField";
import {
  getFromLocalStorage,
  getFromSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";


const UpdateMainHead = ({mainhead ,handleFetchdata}) => {
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const location = useLocation();
  const data = mainhead || "";
  const record_id = data?.record_id;
  console.log("🚀 ~ UpdateSubModule ~ data:", data);
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.UPDATE_MAIN_HEAD);
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
        record_id: record_id,
        dataUpdate: {
          head_name: data?.head_name,
        },
        changed_by: UserId,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            handleFetchdata(null, true);
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
  useEffect(() => {
    setValue("head_name", data?.head_name || "");
  }, [record_id]);
  // const breadcrumbItems = [
  //   { title: "COA", link: "coa-list" },
  //   { title: "Main Head", link: "main-head-list" },
  //   { title: "Update Main Head" },
  // ];
  return (
    <>
      <div>
        <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
            {/* <CustomBreadcrumb items={breadcrumbItems} /> */}
          <div className="w-full  mx-auto bg-white   rounded-radiusRegular ">
            {/* <h2 className="mb-2 text-lg text-center font-semibold text-black">
              Update Main Head
            </h2> */}
            <div className="grid grid-cols-1 gap-3">
              <InputField
                label={"Name"}
                register={register("head_name", {
                  required: "name is required",
                })}
                error={errors.head_name?.message}
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
    </>
  );
};

export default withPermissionCheck(UpdateMainHead, "update-main-head");
