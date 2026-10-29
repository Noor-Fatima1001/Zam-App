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

const AddProductToDept = ({productData}) => {
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.ADD_PRODUCT_TO_DEPT_LIST
  );

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
    console.log("🚀 ~ onSubmit ~ data:", data);
    console.log(data);
    const body = {
      dataInsert: {
        product_id: productData?.record_id,
        comp_dept_id: data?.comp_dept_id,
        gl_id: data?.gl_id,
        gl_cost: data?.gl_cost,
        gl_sales: data?.gl_sales,
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
    { title: "Product To Dept List", link: "product-to-dept-list" },
    { title: "Assign Product To Dept List" },
  ];
  console.log(watch("comp_dept_id"), "comp_dept_id");
  // console.log(watch("product_id"), "product_id");
  return (
    <div>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
        <CustomBreadcrumb items={breadcrumbItems} />
        <div className="w-full max-w-md mx-auto bg-white shadow-sm  rounded-radiusRegular p-3 mt-3">
          <h1 className="mb-2 text-center text-size text-color font-headingweight">
            Assign Product To Deptpartment List
          </h1>

          <div className="mt-2">
            {/* <AntdSelectField
              label="Product"
              control={control}
              name="product_id"
              endpoint={API_ENDPOINTS.GET_PRODUCT_LIST}
              queryKey="pm.product_name"
              valueKey="record_id"
              labelKey="product_name"
              responseWhich="data"
              rules={{
                required: "Product is required",
              }}
              error={errors.product_id}
            /> */}

            <AntdSelectField
              label=" Company & Department"
              control={control}
              name="comp_dept_id"
              endpoint={API_ENDPOINTS.COM_TO_DEPARTMENT}
              queryKey="dept_name"
              valueKey="record_id"
              labelKey="company_name"
              ContcatenateLabel="dept_name"
              responseWhich="result"
              rules={{
                required: "Department is required",
              }}
              error={errors.comp_dept_id}
            />
            <AntdSelectField
              label="COA"
              control={control}
              name="gl_id"
              endpoint={API_ENDPOINTS.GET_COA}
              queryKey="coa.gl_name"
              valueKey="record_id"
              labelKey="gl_name"
              ContcatenateLabel="gl_code"
              responseWhich="data"
              rules={productData?.product_type==="raw"?{
                required: "COA is required",
              }:{}}
              error={errors.gl_id}
            />
            <AntdSelectField
              label="Sales"
              control={control}
              name="gl_sales"
              endpoint={API_ENDPOINTS.GET_COA}
              queryKey="coa.gl_name"
              valueKey="record_id"
              labelKey="gl_name"
              ContcatenateLabel="gl_code"
              responseWhich="data"
              rules={productData?.product_type==="recipe"?{
                required: "COA is required",
              }:{}}
              error={errors.gl_sales}
            />
            <AntdSelectField
              label="Cost"
              control={control}
              name="gl_cost"
              endpoint={API_ENDPOINTS.GET_COA}
              queryKey="coa.gl_name"
              valueKey="record_id"
              ContcatenateLabel="gl_code"
              labelKey="gl_name"
              responseWhich="data"
              rules={ productData?.product_type==="raw"? {
                required: "COA is required",
              }:{}}
              error={errors.gl_cost}
            />
          </div>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <CustomButton
              btntext={"submit"}
              type="submit"
              isLoading={isPending}
            />
            <CustomButton
              btntext={"Add New Product"}
              handleClick={() => navigate(`${rootFolder}/add-product`)}
            />
            <CustomButton
              btntext={"Add New COA"}
              handleClick={() => navigate(`${rootFolder}/add-coa`)}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default withPermissionCheck(AddProductToDept, "add-product-to-dept");
