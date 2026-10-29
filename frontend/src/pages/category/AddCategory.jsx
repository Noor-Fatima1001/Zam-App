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

import AntdSelectField from "../../AntdSelectField";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";

const AddCategory = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.ADD_CATERGORY_LIST);

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

  const tabs = ["Main Category", "Sub Category"];
  const [currentTab, setCurrentTab] = useState(tabs[0]);
  const handleTabClick = (tab) => {
    setCurrentTab(tab);
    reset();
  };
  const onSubmit = (data) => {
    console.log("🚀 ~ onSubmit ~ data:", data);
    console.log(data);
    const body = {
      dataInsert: {
        description: data?.description,
        parent_id: currentTab == tabs[1] ? data?.category : "",
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
    { title: "Product Category ", link: "categories" },
    { title: "Add Product Category " },
  ];

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
                required: "description is required",
              })}
              error={errors.description?.message}
            />
            {currentTab == tabs[1] && (
              <AntdSelectField
                label="Category"
                control={control}
                name="category"
                endpoint={API_ENDPOINTS.GET_CATEGORY_LIST}
                queryKey="pc.description"
                valueKey="record_id"
                labelKey="main_category"
                responseWhich="data"
                rules={{
                  required:
                    currentTab == tabs[1] ? "category is required" : false,
                }}
                baseFilters={[
                  {
                    key: "pc.parent_id",
                    operator: "is_null",
                    value1: "",
                    logical: "",
                  },
                ]}
                error={errors.category}
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

export default withPermissionCheck(AddCategory, "add-category");
