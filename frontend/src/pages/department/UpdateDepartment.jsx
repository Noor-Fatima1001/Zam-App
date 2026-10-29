import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  useUpdateDepartment
} from "../../apis/useProduct/useDepartment";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";

const UpdateDepartment = ({ DepartmentData }) => {
  const data = DepartmentData || "";
  const depart_id = data?.record_id;

  console.log(data);
  const { mutate, isPending } = useUpdateDepartment();
  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm();
  const onSubmit = (data) => {
    console.log(data);
    mutate(
      {
        record_id: depart_id,
        dataUpdate: {
          dept_code: data?.dept_code,
          dept_name: data?.dept_name,
        },
        changed_by: UserId,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success("Update successfully!")
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: "update successfully!",
            // });
            // reset();
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
    setValue("dept_code", data?.dept_code || "");
    setValue("dept_name", data?.dept_name || "");
  }, [depart_id,navigate]);

  return (
    <div>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <div>
              <InputField
                label={"Code"}
                register={register("dept_code", {
                  required: "code is required",
                })}
                error={errors.dept_code?.message}
              />
          </div>
          <div>
              <InputField
                label={"Name"}
                register={register("dept_name", {
                  required: "name is required",
                })}
                error={errors.dept_name?.message}
              />
          </div>
        </div>
        <div className="d-flex justify-content-center mt-3">
          <CustomButton
            btntext={"submit"}
            type="submit"
            isLoading={isPending}
          />
        </div>
      </form>
    </div>
  );
};

export default withPermissionCheck(UpdateDepartment, "update-department");;
