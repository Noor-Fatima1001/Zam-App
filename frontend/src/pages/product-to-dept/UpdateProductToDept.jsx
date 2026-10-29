import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import AntdSelectField from "../../AntdSelectField";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";

import { useEffect } from "react";
import Loader from "../../components/Loader";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";

const UpdateProductToDept = ({ productData, prodId }) => {
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.UPDATE_PRODUCT_TO_DEPT_LIST
  );
  const { mutate: specficcompDeptIdList, isPending: isloading } = useGlobelApi(
    API_ENDPOINTS.GET_PRODUCT_TO_DEPT_LIST

  );
  // ss 
  const [productId, setProductId] = useState(null);
  const [compDeptId, setCompDeptId] = useState(null);
  const [gl, setGl] = useState(null);
  const [gl_cost, setGlCost] = useState(null);
  const [gl_sales, setGlSales] = useState(null);
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
    setValue,
  } = useForm();

  const onSubmit = (data) => {
    const body = {
      dataUpdate: {
        record_id: productData?.record_id,
        product_id: productData?.product_id,
        comp_dept_id: data?.comp_dept_id,
        gl_id: data?.gl_id,
        gl_cost: data?.gl_cost,
        gl_sales: data?.gl_sales,
        status: productData?.status,
        changed_by: UserId,
      },
    };
    console.log(body);
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
    specficcompDeptIdList(
      {
        filters: [
          {
            key: "aptd.id",
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
            const compDeptDetails = data.data[0];
            // setProductId(
            //   compDeptDetails.product_id
            //     ? {
            //         value: compDeptDetails.product_id,
            //         label: compDeptDetails.product_name,
            //       }
            //     : null
            // );
            setCompDeptId(
              compDeptDetails.comp_dept_id
                ? {
                  value: compDeptDetails.comp_dept_id,
                  label: compDeptDetails.company_to_dept,
                }
                : null
            );
            setGl(
              compDeptDetails.gl_id
                ? {
                  value: compDeptDetails.gl_id,
                  label: compDeptDetails.gl_name,
                }
                : null
            );
            setGlSales({
              value: compDeptDetails?.gl_id_sales,
              label: compDeptDetails?.gl_name_sales,
            })
            setGlCost({
              value: compDeptDetails?.gl_id_cost,
              label: compDeptDetails?.gl_name_cost,
            })
          }
        },
        onError: (error) => {
          console.error("Error fetching compDeptId data:", error);
        },
      }
    );
  };

  useEffect(() => {
    if (productData) {
      getFetchbyId();
    }
  }, [navigate, productData]);
  useEffect(() => {
    // if (productId) {
    //   setValue("productData", productId?.value);
    // }
    if (compDeptId) {
      setValue("comp_dept_id", compDeptId.value);
    }
    if (gl) {
      setValue("gl_id", gl?.value);
    }
    if (gl_cost) {
      setValue("gl_cost", gl_cost.value);
    }
    if (gl_sales) {
      setValue("gl_sales", gl_sales.value);
    }
  }, [setValue, compDeptId, gl]);

  return (
    <div>
      <form
        autoComplete="off"
        onSubmit={handleSubmit(onSubmit)}
        className="mt-3"
      >
        <div className="w-full ">
          <h1 className="mb-2 text-center text-size text-color font-headingweight">
            Update Product To Department List
          </h1>

          {isloading ? (
            <Loader />
          ) : (
            <div className="mt-2 grid lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-2">

              <AntdSelectField
                label="Department"
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
                defaultValue={compDeptId}
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
                rules={{
                  required: "COA is required",
                }}
                error={errors.gl_id}
                defaultValue={gl}
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
                rules={{
                  required: "COA is required",
                }}
                error={errors.gl_sales}
                defaultValue={gl_sales}
              />
              <AntdSelectField
                label="Cost"
                control={control}
                name="gl_cost"
                endpoint={API_ENDPOINTS.GET_COA}
                queryKey="coa.gl_name"
                valueKey="record_id"
                labelKey="gl_name"
                ContcatenateLabel="gl_code"
                responseWhich="data"
                rules={{
                  required: "COA is required",
                }}
                error={errors.gl_cost}
                defaultValue={gl_cost}
              />
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

export default withPermissionCheck(
  UpdateProductToDept,
  "update-product-to-dept"
);
