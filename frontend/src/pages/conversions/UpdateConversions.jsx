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
import AntSSelectField from "../../AntSSelectField";

const UpdateConversions = ({listconversion,handleFetchdata}) => {
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.UPDATE_CONVERSIONS_LIST
  );
  const {
    mutate: specficcompDeptIdList,
    isPending: isloading,
    data: compDeptData,
  } = useGlobelApi(API_ENDPOINTS.GET_CONVERSIONS_LIST);
  const {
    mutate: umMutate,
    isPending: umisPending,
    data,
  } = useGlobelApi(API_ENDPOINTS.GET_UNIT_MASTER);

  const conversionData = listconversion;
  console.log("🚀 ~ UpdateConversions ~ conversionData:", conversionData);
  const [unitFrom, setUnitFrom] = useState(null);
  const [unitTo, setUnitTo] = useState(null);
  const options = [
    { value: "divide", label: "divide" },
    { value: "multiply", label: "multiply" },
  ];
  const navigate = useNavigate();
  useEffect(() => {
    getFetchbyId();
  }, [navigate]);
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

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
  const uitMaster = watch("unit_from");
  const onSubmit = (data) => {
    const body = {
      dataUpdate: {
        record_id: conversionData.record_id,
        unit_from: data?.unit_from,
        unit_to: data?.unit_to,
        type_factor: data?.type_factor,
        conversion_value: data?.conversion_value,
        changed_by: UserId,
      },
    };
    console.log(body);
    mutate(body, {
      onSuccess: (data) => {
        if (data.success) {
          handleFetchdata(null, true);
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

  // const breadcrumbItems = [
  //   { title: "Conversion List", link: "conversions" },
  //   { title: "Update Conversion List" },
  // ];
  const getFetchbyId = () => {
    if (!conversionData?.record_id) return; // ✅ Prevent API call if record_id is undefined
    specficcompDeptIdList(
      {
        filters: [
          {
            key: "cl.id",
            operator: "equal",
            value1: conversionData.record_id, // ✅ Ensure value exists
            logical: "",
          },
        ],
        limit: 0,
        offset: 0,
      },
      {
        onSuccess: (data) => {
          console.log("🚀 ~ getFetchbyId ~ data:", data);
          if (data?.data?.length > 0) {
            const compDeptDetails = data.data[0];
            setValue("type_factor", compDeptDetails?.type_factor);
            setValue("conversion_value", compDeptDetails?.conversion_value);
            setUnitFrom(
              compDeptDetails.unit_from
                ? {
                    value: compDeptDetails.unit_from,
                    label: compDeptDetails.unit_from_description,
                  }
                : null
            );
            setUnitTo(
              compDeptDetails.unit_to
                ? {
                    value: compDeptDetails.unit_to,
                    label: compDeptDetails.unit_to_description,
                  }
                : null
            );
          }
        },
        onError: (error) => {
          console.error("Error fetching compDeptId data:", error);
        },
      }
    );
  };
  useEffect(() => {
    if (uitMaster) {
      umMutate({
        filters: [
          { key: "um.id", operator: "equal", value1: uitMaster, logical: "" },
        ],
        limit: 0,
        offset: 0,
      });
    }
  }, [uitMaster]);
  useEffect(() => {
    if (!conversionData) return;
    
    reset(); 
    getFetchbyId(); 
  }, [conversionData]); 
  useEffect(() => {
    if (unitFrom) {
      setValue("unit_from", unitFrom.value, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
    if (unitTo) {
      setValue("unit_to", unitTo.value, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [unitFrom, unitTo, setValue]);

  return (
    <div>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        {/* <CustomBreadcrumb items={breadcrumbItems} /> */}
        <div className="w-full  mx-auto bg-white  rounded-radiusRegular ">
          {/* <h2 className="mb-2 text-center text-lg font-semibold text-black">
            Update Conversion List
          </h2> */}

          {isloading ? (
            <Loader />
          ) : (
            <div className="mt-2">
              <AntdSelectField
                label="Unit From"
                control={control}
                name="unit_from"
                endpoint={API_ENDPOINTS.GET_UNIT_MASTER}
                queryKey="um.description"
                valueKey="record_id"
                labelKey="unit_description"
                responseWhich="data"
                rules={{
                  required: "Unit is required",
                }}
                error={errors.unit_from}
                defaultValue={
                  unitFrom || {
                    value: compDeptData?.data?.[0]?.unit_from,
                    label: compDeptData?.data?.[0]?.unit_from_description,
                  }
                }
              />
              <AntdSelectField
                label="Unit To"
                control={control}
                disable={!uitMaster || umisPending}
                name="unit_to"
                endpoint={API_ENDPOINTS.GET_UNIT_MASTER}
                queryKey="um.description"
                valueKey="record_id"
                labelKey="unit_description"
                responseWhich="data"
                rules={{
                  required: "Unit is required",
                }}
                // baseFilters={[
                //   {
                //     key: "um.type",
                //     operator: "equal",
                //     value1: data?.data[0]?.type,
                //     logical: "",
                //   },
                // ]}
                error={errors.unit_to}
                defaultValue={
                  unitTo || {
                    value: compDeptData?.data?.[0]?.unit_to,
                    label: compDeptData?.data?.[0]?.unit_to_description,
                  }
                }
              />
              <InputField
                label={"Conversion Value"}
                register={register("conversion_value", {
                  required: "Conversion Value is required",
                  pattern: {
                    value: /^[0-9]+$/,
                    message: "Only numbers are allowed",
                  },
                })}
                error={errors.conversion_value?.message}
              />

              <AntSSelectField
                label="Choose an Option"
                control={control}
                name="type_factor"
                options={options}
                rules={{ required: "This field is required" }}
                error={errors.type_factor}
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

export default withPermissionCheck(UpdateConversions, "update-conversions");
