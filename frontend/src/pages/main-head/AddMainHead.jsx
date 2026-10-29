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
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";


const AddMainHead = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.Add_MAIN_HEAD);
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const onSubmit = (data) => {
    console.log(data);
    mutate(
      {
        dataInsert: {
          head_name: data?.head_name,
          created_by: UserId,
        },
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success("Added successfully!")
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: "added successfully!",
            // });
            // reset();
            // navigate(`${rootFolder}/main-head-list`);
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
    { title: "Main Head", link: "main-head-list" },
    { title: "Add Main Head" },
  ];
  return (
    <>
        <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-2 ">
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
        </form>
    </>
  );
};

export default withPermissionCheck(AddMainHead, "add-main-head");
