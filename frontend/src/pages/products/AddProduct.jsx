import React from "react";
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

const AddProduct = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.ADD_PRODUCT_LIST);

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
        // product_code: data?.product_code,
        product_name: data?.product_name,
        product_category_id: data?.product_category_id,
        base_unit_id: data?.base_unit_id,
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
    { title: "Product List", link: "product-list" },
    { title: "Add Product" },
  ];

  return (
    <div>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
          <div className="mt-2">
            {/* <InputField
              label={"Product Code"}
              register={register("product_code", {
                required: " code is required",
              })}
              error={errors.product_code?.message}
            /> */}
            <InputField
              label={"Product Name"}
              register={register("product_name", {
                required: "name is required",
              })}
              error={errors.product_name?.message}
            />

            {
              <AntdSelectField
                label="Category"
                control={control}
                name="product_category_id"
                endpoint={API_ENDPOINTS.GET_CATEGORY_LIST}
                queryKey="pc.description"
                valueKey="record_id"
                labelKey="category_product"
                responseWhich="data"
                baseFilters={[
                  {
                    key: "pc.parent_id",
                    operator: "greater_than",
                    value1: "0",
                    logical: "",
                  },
                ]}
                rules={{
                  required: "category is required",
                }}
                error={errors.product_category_id}
              />
            }
            <AntdSelectField
              label="Base Unit "
              control={control}
              name="base_unit_id"
              endpoint={API_ENDPOINTS.GET_UNIT_LIST}
              queryKey="ump.description"
              valueKey="record_id"
              labelKey="unit"
              responseWhich="data"
              rules={{
                required: "unit size is required",
              }}
              error={errors.base_unit_id}
            />
            <div className="d-flex gap-2 justify-content-center mt-3">
              <CustomButton
                btntext={"submit"}
                type="submit"
                isLoading={isPending}
              />
              <CustomButton
                btntext={"Add New Category"}
                handleClick={() => navigate(`${rootFolder}/add-category`)}
              />
            </div>
          </div>
      </form>
    </div>
  );
};

export default withPermissionCheck(AddProduct, "add-product");
