import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import usePost from "../../hooks/usePost";
import {
  useGlobelApiFormDara,
} from "../../apis/useProduct/useCommon";
import PropTypes from "prop-types";

const UpdateUser = ({ UserData }) => {
  console.log("🚀 ~ UpdateUser ~ UserData:", UserData);
  const UserId = getFromLocalStorage("UserId");
  const { mutate } = useGlobelApiFormDara(API_ENDPOINTS.SINGLE_USER);
  const {
    post: update_User,
    response: userResponse,
    loading: userLoading,
    error: userError,
  } = usePost();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();
  const handlefetchData = () => {
    const formData = new URLSearchParams();
    formData.append("id", UserData?.record_id);
    mutate(formData, {
      onSuccess: (data) => {
        const responseData = data?.result?.[0];
        setValue("first_name", responseData?.first_name);
        setValue("last_name", responseData?.last_name);
        setValue("user_name", responseData?.user_name);
        setValue("comments", responseData?.comments);
        setValue("password", responseData?.password);
        setValue("email", responseData?.email);
        setValue("gender", responseData?.gender);
        setValue("first_login", responseData?.first_login);
        setValue("status", responseData?.status == "Active" ? 1 : 0);
      },
      onError: (error) => {
        console.log("error", error);
      },
    });
  };
  const onSubmit = (dataValue) => {
    const body = {
      record_id: UserData?.record_id,
      dataUpdate: {
        ...(dataValue?.first_name && { first_name: dataValue?.first_name }),
        ...(dataValue?.last_name && { last_name: dataValue?.last_name }),
        ...(dataValue?.user_name && { user_name: dataValue?.user_name }),
        ...(dataValue?.gender && { gender: dataValue?.gender }),
        ...(dataValue?.email && { email: dataValue?.email }),
        ...(dataValue?.comments && { comments: dataValue?.comments }),
        ...(dataValue?.status && {
          status: dataValue?.status ? "Active" : "InActive",
        }),
        password: dataValue?.password,
        first_login: dataValue?.first_login ? 1 : 0,
      },
      changed_by: UserId,
    };
    update_User(API_ENDPOINTS.UPDTE_USER, body);
  };

  useEffect(() => {
    if (UserData) {
      handlefetchData();
    }
  }, [UserData, navigate]);
  useEffect(() => {
    if (userResponse) {
      if (userResponse.success) {
       toast.success("Update Successfully!")
        handlefetchData();
      } else {
        toast.error(userResponse?.result || "Something went wrong")
      }
    }
  }, [userResponse]);

  useEffect(() => {
    if (userError) {
      toast.error("Something went wrong")
    }
  }, [userError]);
  return (
    <>
      <div>
        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <InputField
              label={"First name"}
              register={register("first_name")}
              error={errors.first_name?.message}
            />
            <InputField
              label={"Last name"}
              register={register("last_name")}
              error={errors.last_name?.message}
            />
            <InputField
              label={"User name"}
              register={register("user_name")}
              error={errors.user_name?.message}
            />
            <InputField
              type={"email"}
              label={"Email"}
              register={register("email")}
              error={errors.email?.message}
            />
            <InputField
              type={"password"}
              label={"Password"}
              register={register("password")}
              error={errors.password?.message}
            />
            <InputField
              label={"Comments"}
              register={register("comments")}
              error={errors.comments?.message}
            />
            <div className="d-flex items-center gap-3">
              <div className="form-check">
                <input
                  type="radio"
                  className="form-check-input"
                  id="male"
                  value="Male"
                  {...register("gender")}
                />
                <label className="form-check-label text-color " htmlFor="male">
                  Male
                </label>
              </div>

              <div className="form-check">
                <input
                  type="radio"
                  className="form-check-input"
                  id="female"
                  value="Female"
                  {...register("gender")}
                />
                <label className="form-check-label text-color " htmlFor="female">
                  Female
                </label>
              </div>
            </div>
            <div className="form-check mt-2">
              <input
                type="checkbox"
                className="form-check-input"
                id="status"
                {...register("status")}
              />
              <label className="form-check-label text-color t" htmlFor="status">
                Status
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <div className="form-check mt-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="first_login"
                  {...register("first_login")}
                />
                <label className="form-check-label text-color " htmlFor="first_login">
                  first login
                </label>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-center">
            <CustomButton
              btntext={"Save"}
              type="submit"
              isLoading={userLoading}
            />
          </div>
        </form>
      </div>
    </>
  );
};

UpdateUser.propTypes ={
  UserData:{
    record_id:PropTypes.number
  }
}
export default withPermissionCheck(UpdateUser, "updateUser");
