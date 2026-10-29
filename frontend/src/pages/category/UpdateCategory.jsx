import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import AntdSelectField from "../../AntdSelectField";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import InputField from "../../components/form-elements/InputField";

import {
  getFromLocalStorage,
  getFromSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import { useEffect } from "react";
import Loader from "../../components/Loader";

const UpdateCategory = ({categories,handleFetchdata}) => {
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.UPDATE_CATEGORY_LIST
  );
  const { mutate: specficUpdateList, isPending: isloading } = useGlobelApi(
    API_ENDPOINTS.GET_CATEGORY_LIST
  );
  const naviagte=useNavigate();
  useEffect(() => {
    console.log(categoryData);
  }, []);
  useEffect(()=>{
    getFetchbyId();
  },[naviagte])
  const categoryData = categories;
  const [category, setCategory] = useState(null);

  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
const navigate = useNavigate();
  const UserId = getFromLocalStorage("UserId");
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm();

  const tabs = ["Main Category", "Sub Category"];
  const [currentTab, setCurrentTab] = useState(tabs[0]);
  const handleTabClick = (tab) => {
    setCurrentTab(tab);
  };
  const onSubmit = (data) => {
    console.log(data);
    const body = {
      dataUpdate: {
        record_id: categoryData?.record_id,
        description: data?.description,
        parent_id: currentTab == tabs[1] ? data?.main_category : "",
        changed_by: UserId,
      },
    };
    mutate(body, {
      onSuccess: (data) => {
        if (data.success) {
          handleFetchdata(null, true);
          
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

  // const breadcrumbItems = [
  //   { title: "Product Category", link: "categories" },
  //   { title: "Update Product Category " },
  // ];
  const getFetchbyId = () => {
    if (!categoryData?.record_id) return; // ✅ Prevent API call if record_id is undefined

    specficUpdateList(
      {
        filters: [
          {
            key: "pc.id",
            operator: "equal",
            value1: categoryData.record_id, // ✅ Ensure value exists
            logical: "",
          },
        ],
        limit: 0,
        offset: 0,
      },
      {
        onSuccess: (data) => {
          if (data?.data?.length > 0) {
            const categoryDetails = data.data[0];
            setValue("description", categoryDetails.main_category || "");
            setCategory(
              categoryDetails.parent_id
                ? {
                    label: categoryDetails.category_name,
                    value: categoryDetails.parent_id,
                  }
                : null
            );
          }
        },
        onError: (error) => {
          console.error("Error fetching unit data:", error);
        },
      }
    );
  };

  useEffect(() => {
    if (categoryData?.record_id) {
      setCategory(null);
      getFetchbyId();
    }
  }, [categoryData?.record_id]); 
  useEffect(() => {
    if (category) {
      setValue("main_category", category.value);
    }
  }, [category, setValue]);
  return (
    <div>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
        {/* <CustomBreadcrumb items={breadcrumbItems} /> */}
        <div className="w-full  mx-auto bg-white rounded-radiusRegular mt-4">
          {/* <h2 className="mb-2 text-center text-lg font-semibold text-black">
            Update Product Category
          </h2> */}
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
          {isloading ? (
            <Loader />
          ) : (
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
                  name="main_category"
                  endpoint={API_ENDPOINTS.GET_CATEGORY_LIST}
                  queryKey="pc.id"
                  valueKey="record_id"
                  labelKey="main_category"
                  responseWhich="data"
                  rules={{
                    required:
                      currentTab == tabs[1] ? "category is required" : false,
                  }}
                  error={errors.main_category}
                  defaultValue={category}
                />
              )}
            </div>
          )}
          <div className="d-flex justify-content-center mt-3">
            <CustomButton
              btntext={"submit"}
              type="submit"
              isLoading={isPending}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default withPermissionCheck(UpdateCategory, "update-category");
