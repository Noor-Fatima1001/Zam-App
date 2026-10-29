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

const UpdateStockLocation = ({ handleFetchdata }) => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.UPDATE_STOCK_LOCATION);
  const { mutate: getLocationdata, isPending: isloading } = useGlobelApi(
    API_ENDPOINTS.GET_LOCATION_LIST
  );
  const bankData = getFromSessionStorage("StockLocation");
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
        record_id: bankData?.record_id,
        location_name: data?.location_name,
        status:data?.status,
        changed_by: UserId,
      },
    };
    mutate(body, {
      onSuccess: (data) => {
        if (data.success) {
          handleFetchdata()
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

    if (!bankData?.record_id) return; // ✅ Prevent API call if record_id is undefined

    getLocationdata(
      {
        filters: [
          {
            key: "sl.id",
            operator: "equal",
            value1: bankData.record_id, // ✅ Ensure value exists
            logical: "",
          },
        ],
        limit: 0,
        offset: 0,
      },
      {
        onSuccess: (data) => {
          if (data?.data?.length > 0) {
            const bankDetails = data.data[0];
            setValue("location_name", bankDetails.location_name || "");

          }
        },
        onError: (error) => {
          console.error("Error fetching bank data:", error);
        },
      }
    );
  };

  useEffect(() => {
    if (bankData?.record_id) {
      getFetchbyId()
    } else {
      // Reset the form and state when bankData is null or undefined
      reset();
    }
  }, [navigate]);
  return (
    <div>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
        {/* <CustomBreadcrumb items={breadcrumbItems} /> */}
        <div className="w-full max-w-md mx-auto bg-white shadow-sm  rounded-radiusRegular p-3 ">

          {isloading ? (
            <Loader />
          ) : (

            <div className="mt-2">
              <InputField
                label="Location Name"
                placeholder="Enter name"
                register={register("location_name", {
                  required: " name is required",
                })}
                error={errors.location_name?.message}
              />

            </div>
          )}
          <div className="d-flex gap-2 justify-content-center mt-3">
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

export default withPermissionCheck(UpdateStockLocation, "update-stock-location");
