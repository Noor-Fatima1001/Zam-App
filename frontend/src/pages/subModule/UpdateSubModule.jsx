import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaAngleLeft } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGetModule } from "../../apis/useProduct/useModule";
import { useUpdateSubModule } from "../../apis/useProduct/useSubModule";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import SelectField from "../../components/form-elements/SelectField";
import {
  getFromLocalStorage,
  getFromSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";

const UpdateSubModule = ({ subedit,refreshParentData }) => {
  const location = useLocation();
  const [data, setData] = useState(subedit);
  const [subModuleId, setSubModuleId] = useState(data?.record_id);

  const { mutate, isPending } = useUpdateSubModule();
  const {
    mutate: moduleMutate,
    isPending: modulePending,
    data: moduleResponse,
  } = useGetModule();
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

  useEffect(() => {
    if (subedit) {
      setData(subedit);
      setSubModuleId(subedit.record_id);
      reset({
        module_name: subedit.sub_module_name || "",
        module_id: subedit.module_id || "",
        sub_module_link: subedit.sub_module_link || "",
        side_bar: subedit.side_bar || "",
      });
    }
  }, [subedit, reset]);

  useEffect(() => {
    handleFetchdata();
  }, []);

  useEffect(() => {
    if (moduleData.length > 0 && data) {
      const selectedModule = moduleData.find(
        (m) => m.record_id === data?.module_id
      );
      setValue(
        "module_id",
        selectedModule
          ? {
              value: selectedModule.record_id,
              label: selectedModule.module_name,
            }
          : null
      );
    }
  }, [moduleData, data, setValue]);

  const onSubmit = (data) => {
    mutate(
      {
        record_id: subModuleId,
        dataUpdate: {
          sub_module_name: data?.module_name,
          module_id: parseInt(data?.module_id?.value),
          sub_module_link: data?.sub_module_link,
          side_bar: data?.side_bar ? 1 : 0,
        },
        changed_by: UserId,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            refreshParentData(null,true)
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

  // const breadcrumbItems = [
  //   { title: "Sub Module", link: "sub-module-list" },
  //   { title: "Update Sub Module" },
  // ];

  return (
    <div>
      <div className="">
        {/* <CustomBreadcrumb items={breadcrumbItems} /> */}
        <form
          autoComplete="off"
          onSubmit={handleSubmit(onSubmit)}
          className="w-full  mx-auto bg-white  rounded-radiusRegular "
        >
          {/* <h2 className="mb-2 text-center text-lg font-semibold text-black">
            Update Sub Module
          </h2> */}
          <div className="grid grid-cols-1 gap-2">
            <InputField
              label={"Name"}
              register={register("module_name", {
                required: "name is required",
              })}
              error={errors.module_name?.message}
            />

            <InputField
              label={"Link"}
              register={register("sub_module_link", {
                required: "link is required",
              })}
              error={errors.sub_module_link?.message}
            />
            <SelectField
              label="Module"
              control={control}
              name="module_id"
              endpoint={API_ENDPOINTS.GET_MODULE}
              queryKey="module_name"
              valueKey="record_id"
              labelKey="module_name"
              responseWhich="data"
              rules={{ required: "module is required" }}
              error={errors.module_id}
            />

            <div className="flex items-center">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="side_bar"
                  {...register("side_bar")}
                />
                <label className="form-check-label" htmlFor="side_bar">
                  This submodule shows in the sidebar
                </label>
              </div>
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
    </div>
  );
};

export default withPermissionCheck(UpdateSubModule, "update-sub-module");