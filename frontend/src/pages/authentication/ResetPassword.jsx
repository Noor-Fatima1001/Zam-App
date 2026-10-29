import moment from "moment/moment";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
const ResetPassword = ({ setIsReset, loginData }) => {
  const isHttps = window.location.protocol === "https:";

  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  console.log("🚀 ~ ResetPassword ~ loginData:", loginData);
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.UPDTE_USER,
    loginData?.token
  );

  const [isPassword, setIsPassword] = useState(false);
  const [isC_Password, setIsC_Password] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();
  const onSubmit = (data) => {
    mutate(
      {
        record_id: loginData?.userId,
        dataUpdate: {
          first_name: loginData?.userFirstName,
          last_name: loginData?.userLastName,
          user_name: loginData?.userUserName,
          gender: loginData?.userGender,
          email: loginData?.userEmail,
          status: loginData?.userStatus,
          password: data?.password,
          first_login: 1,
        },
        changed_by: loginData?.userId,
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            toast.success(res?.result)
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: res?.result,
            // });
            reset();
            setIsReset(false);
          } else {
            toast.error(res?.result)
            // Swal.fire({
            //   icon: "error",
            //   title: "Error",
            //   text: res?.result,
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

  return (
    <>
      <div className="grid lg:grid-cols-2 grid-cols-1 bg-white">
        <div className="	min-h-screen flex justify-center ">
          <div className="flex justify-center items-center h-full w-4/6">
            <form autocomplete="off" onSubmit={handleSubmit(onSubmit)} className="w-full">
              <h1 className="font-semibold text-center text-xl mb-2 text-customBlue">
                Reset Password
              </h1>

              <InputField
                label={"Password"}
                inputDiv={"border flex items-center pe-2 rounded-3"}
                inputClass={"border-0 rounded-3"}
                type={isPassword ? "text" : "password"}
                register={register("password", {
                  required: "password is required",
                })}
                icon={
                  <span
                    role="button"
                    onClick={() => setIsPassword(!isPassword)}
                  >
                    {isPassword ? <FaEye /> : <FaEyeSlash />}
                  </span>
                }
                error={errors.password?.message}
              />

              <div className="mt-2">
                <InputField
                  label={"Confirm Password"}
                  inputDiv={"border flex items-center pe-2 rounded-3"}
                  inputClass={"border-0 rounded-3"}
                  type={isC_Password ? "text" : "password"}
                  register={register("con_password", {
                    required: "Confirm password is required",
                    validate: (value) =>
                      value === watch("password") || "Passwords do not match",
                  })}
                  icon={
                    <span
                      role="button"
                      onClick={() => setIsC_Password(!isC_Password)}
                    >
                      {isC_Password ? <FaEye /> : <FaEyeSlash />}
                    </span>
                  }
                  error={errors.con_password?.message}
                />
              </div>
              <div className="d-flex justify-content-center mt-3">
                <CustomButton
                  btntext={"submit"}
                  addclass="w-full"
                  rounded="rounded-lg"
                  padding="p-2"
                  type="submit"
                  isLoading={isPending}
                />
              </div>
            </form>
          </div>
        </div>
        <div className="h-screen lg:flex hidden justify-center items-center ">
          <img
            // src="/assets/img/illustrations/reset-password-img.svg"
            src={`${
              isHttps ? rootFolder : ""
            }/assets/img/illustrations/reset-img.jpg`}
            className="max-w-full  max-h-screen"
            alt="image not found"
          />
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
