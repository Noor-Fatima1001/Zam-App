import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import InputField from "../../components/form-elements/InputField";
import SelectField from "../../components/form-elements/SelectField";

import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import AntdSelectField from "../../AntdSelectField";

const AddUnitMaster = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.ADD_UNIT_MASTER);

  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    const body = {
      dataInsert: {
        description: data?.description,
        type: currentTab,
        parent_id: currentTab === tabs[0] ? data?.parent_id : "",
        created_by: UserId,
      },
    };
    mutate(body, {
      onSuccess: (data) => {
        if (data.success) {
          toast.success(data?.data)
          // Swal.fire({
          //   icon: "success",
          //   title: "Success",
          //   text: data?.data,
          // });
        } else {
          toast.error(data?.data)
          // Swal.fire({
          //   icon: "error",
          //   title: "Error",
          //   text: data?.data,
          // });
        }
        reset();
      },
      onError: (error) => {
        toast.error("Something went wrong")
        // Swal.fire({
        //   title: "Error",
        //   text: "Something went wrong",
        //   icon: "error",
        // });
      },
    });
  };

  const breadcrumbItems = [
    { title: "Unit Master", link: "unit-master" },
    { title: "Add Unit Master" },
  ];
  const tabs = ["unit", "family", "packaging"];
  const [currentTab, setCurrentTab] = useState("unit");
  const handleTabClick = (tab) => {
    setCurrentTab(tab);
    reset();
  };

  return (
    <div>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>

          <ul className="user_profile-tabs border-b gap-8 ">
            {tabs.map((tab) => (
              <li className="" key={tab}>
                <button
                  type="button"
                  className={`relative text-base capitalize  ${
                    currentTab === tab ? "active font-bold" : " "
                  } `}
                  onClick={() => handleTabClick(tab)}
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <InputField
              label={"Description"}
              register={register("description", {
                required: "Description is required",
              })}
              error={errors.description?.message}
            />

            {currentTab === tabs[0] && (
              <AntdSelectField
                label="Parent Unit"
                control={control}
                name="parent_id"
                endpoint={API_ENDPOINTS.GET_UNIT_MASTER}
                queryKey="um.description"
                valueKey="record_id"
                labelKey="unit_description"
                responseWhich="data"
                baseFilters={[
                  {
                    key: "um.type",
                    operator: "equal",
                    value1: "family",
                    logical: "",
                  },
                ]}
                rules={{
                  required:
                    currentTab === tabs[0] ? "Parent Unit is required" : false,
                }}
                error={errors.parent_id}
              />
            )}
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

export default withPermissionCheck(AddUnitMaster, "add-unit-master");
