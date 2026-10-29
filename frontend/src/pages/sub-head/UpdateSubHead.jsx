import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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

const UpdateSubHead = ({ SubHeadData }) => {
  const data = SubHeadData || "";
  const record_id = data?.record_id;

  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.UPDATE_SUB_HEAD);
  const { mutate: moduleMutate } = useGlobelApi(API_ENDPOINTS.GET_MAIN_HEAD);
  const UserId = getFromLocalStorage("UserId");
  const [moduleData, setModuleData] = useState([]);
  const navigate = useNavigate();
  const handleFetchdata = () => {
    moduleMutate(
      { filters: null, limit: 0, offset: 1 },
      {
        onSuccess: (data) => {
          setModuleData(data?.data);
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
          sub_name: data?.sub_name,
          main_head_name: parseInt(data?.main_head_name?.value),
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
      setValue("sub_name", data?.sub_name || "");
      // setValue("main_head_name", data?.main_head_id || "");
    }
  }, [data, record_id,navigate]);
  useEffect(() => {
    if (moduleData.length > 0 && data) {
      const selectedModule = moduleData.find(
        (m) => m.record_id === data?.main_head_id
      );
      setValue(
        "main_head_name",
        selectedModule
          ? {
              value: selectedModule.record_id,
              label: selectedModule.head_name,
            }
          : null
      );
    }
  }, [moduleData, data,navigate]);

 
  return (
    <div>
     
        <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-2">
            <div>

                <InputField
                  label={"Name"}
                  register={register("sub_name", {
                    required: "name is required",
                  })}
                  error={errors.sub_name?.message}
                />

            </div>

            <div>
                <SelectField
                  label="Module"
                  control={control}
                  name="main_head_name"
                  endpoint={API_ENDPOINTS.GET_MAIN_HEAD}
                  queryKey="main_head_name"
                  valueKey="record_id"
                  labelKey="main_head_name"
                  responseWhich="data"
                  rules={{ required: "head name is required" }}
                  error={errors.main_head_name}
                />
            </div>
          </div>
          <div className="d-flex justify-content-center mt-3">
            <CustomButton
              btntext={"Save"}
              type="submit"
              isLoading={isPending}
            />
          </div>
        </form>
     
    </div>
  );
};

export default withPermissionCheck(UpdateSubHead, "update-sub-head");;
