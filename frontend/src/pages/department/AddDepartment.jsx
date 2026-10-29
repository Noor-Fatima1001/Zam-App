import React from "react";
import { useForm } from "react-hook-form";
import { FaAngleLeft } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useAddDepartment } from "../../apis/useProduct/useDepartment";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";


const AddDepartment = () => {
  const { mutate, isPending } = useAddDepartment();
  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
  } = useForm();
  const onSubmit = (data) => {
    console.log(data);
    mutate(
      {
        dataInsert: {
          dept_code: data?.dept_code,
          dept_name: data?.dept_name,
          created_by: UserId,
        },
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success("Department added successfully!")
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: "Department added successfully!",
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
  const breadcrumbItems = [
    { title: "Department", link: "department-list" },
    { title: "Add Department" },
  ];
  return (
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
          <div className="gap-x-3 gap-y-2 grid grid-cols-2">
            <InputField
              label={"Code"}
              register={register("dept_code", {
                required: "code is required",
              })}
              error={errors.dept_code?.message}
            />

            <InputField
              label={"Name"}
              register={register("dept_name", {
                required: "name is required",
              })}
              error={errors.dept_name?.message}
            />
          </div>

          <div className="d-flex justify-content-center mt-3">
            <CustomButton addclass=""
              btntext={"submit"}
              type="submit"
              isLoading={isPending}
            />
          </div>
      </form>
  );
};

export default withPermissionCheck(AddDepartment, "add-department");
