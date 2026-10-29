import React, { useEffect, useState } from "react";
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

const UpdateProduct = ({ productData }) => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.UPDATE_PRODUCT_LIST);
  const { mutate: specficProductList } = useGlobelApi(
    API_ENDPOINTS.GET_PRODUCT_LIST
  );
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const [productCategory, setProductCategory] = useState("");
  const [productBaseUnit, setProductBaseUnit] = useState("");
  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();
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
    const body = {
      dataUpdate: {
        record_id: productData?.record_id,
        // product_code: data?.product_code,
        product_name: data?.product_name,
        product_category_id: data?.product_category_id,
        base_unit_id: data?.base_unit_id,
        changed_by: UserId,
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

  const getFetchbyId = () => {
    if (!productData?.record_id) return; // ✅ Prevent API call if record_id is undefined
    specficProductList(
      {
        filters: [
          {
            key: "pm.id",
            operator: "equal",
            value1: productData.record_id, // ✅ Ensure value exists
            logical: "",
          },
        ],
        limit: 0,
        offset: 0,
      },
      {
        onSuccess: (data) => {
          if (data?.data?.length > 0) {
            const unitDetails = data.data[0];
            // setValue("product_code", unitDetails.product_code);
            setValue("product_name", unitDetails.product_name);
            setProductCategory({
              label: unitDetails.product_category,
              value: unitDetails.product_category_id,
            });
            setProductBaseUnit({
              value: unitDetails.base_unit_id,
              label: unitDetails.base_unit,
            });
          }
        },
        onError: (error) => {
          console.error("Error fetching unit data:", error);
        },
      }
    );
  };

  useEffect(() => {
    if (productData) {
      getFetchbyId();
    }
  }, [productData, navigate]);
  useEffect(() => {
    if (productCategory) {
      setValue("product_category_id", productCategory.value);
    }
    if (productBaseUnit) {
      setValue("base_unit_id", productBaseUnit.value);
    }
  }, [productCategory, productBaseUnit, setValue]);

  return (
    <div>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
        <div className="w-full max-w-md mx-auto bg-white shadow-sm  rounded-radiusRegular p-3">
          <h1 className="mb-2 text-center text-size text-color font-headingweight">
            Update Product
          </h1>
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
                  required: "Product Category is required",
                }}
                error={errors.product_category_id}
                defaultValue={productCategory}
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
              defaultValue={productBaseUnit}
            />
          </div>
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

export default withPermissionCheck(UpdateProduct, "update-product");
