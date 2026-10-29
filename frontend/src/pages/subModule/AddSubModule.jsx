import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { FaAngleLeft } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGetModule } from "../../apis/useProduct/useModule";
import { useAddSubModule } from "../../apis/useProduct/useSubModule";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import SelectField from "../../components/form-elements/SelectField";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";


const SubAddModule = () => {
  const { mutate, isPending } = useAddSubModule();
  const { mutate: moduleMutate, isPending: modulePending } = useGetModule();
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const [moduleData, setModuleData] = useState([]);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm();
  // const inputValue = watch("module_id");
  // const debouncedSearch = useDebounce(inputValue, 500);

  console.log(watch("module_id"));
  const handleFetchdata = useCallback((searchTerm) => {
    moduleMutate(
      {
        filters: searchTerm,
        limit: 0,
        offset: 1,
      },
      {
        onSuccess: (data) => {
          setModuleData(data?.data);
        },
        onError: (error) => {
          console.error("Error fetching users:", error);
        },
      }
    );
  }, []);
  const onSubmit = (data) => {
    console.log(data);
    mutate(
      {
        dataInsert: {
          sub_module_name: data?.module_name,
          sub_module_link: data?.sub_module_link,
          module_id: parseInt(data?.module_id?.value),
          side_bar: data?.side_bar ? 1 : 0,
          created_by: UserId,
        },
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success("Module added successfully!")
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: "Module added successfully!",
            // });
            // reset();
            // navigate(`${rootFolder}/sub-module-list`);
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
    { title: "Sub Module", link: "sub-module-list" },
    { title: "Add Sub Module" },
  ];

  return (
    <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
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

        <div>
          <div className="  flex items-center">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="side_bar"
                {...register("side_bar")}
              />
              <label className="form-check-label text-color" htmlFor="side_bar">
                This submodule shows in the sidebar
              </label>
            </div>
          </div>
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
  );
};

export default withPermissionCheck(SubAddModule, "add-sub-module");
