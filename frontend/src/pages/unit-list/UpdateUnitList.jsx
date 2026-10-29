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

const UpdateUnitList = ({listedit,handleFetchdata}) => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.UPDATE_UNIT_LIS);
  const { mutate: specficUnitList, isPending: isloading } = useGlobelApi(
    API_ENDPOINTS.GET_UNIT_LIST
  );

  const unitData = listedit;
  const [packaging, setPackaging] = useState(null);
  const [unit, setUnit] = useState(null);
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
    console.log(data);
    const body = {
      dataUpdate: {
        record_id: unitData?.record_id,
        packaging_id: data?.packaging_id,
        size: data?.size,
        unit_id: data?.unit_id,
        changed_by: UserId,
      },
    };
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
  //   { title: "Unit List", link: "unit-list" },
  //   { title: "Update Unit List" },
  // ];
  const getFetchbyId = () => {
    if (!unitData?.record_id) return; // ✅ Prevent API call if record_id is undefined

    specficUnitList(
      {
        filters: [
          {
            key: "ul.id",
            operator: "equal",
            value1: unitData.record_id, // ✅ Ensure value exists
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
            setValue("size", unitDetails.size || "");
            setPackaging(
              unitDetails.packaging_id
                ? {
                    value: unitDetails.packaging_id,
                    label: unitDetails.pack_name,
                  }
                : null
            );
            setUnit(
              unitDetails.unit_id
                ? { value: unitDetails.unit_id, label: unitDetails.unit_name }
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
    if (unitData?.record_id) {
      getFetchbyId();
    } else {
      // Reset the form and state when unitData is null or undefined
      reset();
      setPackaging(null);
      setUnit(null);
    }
  }, [unitData]); // Add unitData as a dependency
  useEffect(() => {
    if (packaging) {
      console.log("Setting packaging_id:", packaging.value);
      setValue("packaging_id", packaging.value);
    }
    if (unit) {
      setValue("unit_id", unit.value);
    }
  }, [packaging, setValue, unit]);
  return (
    <div>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
        {/* <CustomBreadcrumb items={breadcrumbItems} /> */}
        <div className="w-full mx-auto bg-white   rounded-radiusRegular ">
      
          {isloading ? (
            <Loader />
          ) : (
            <div className="mt-2">
              <AntdSelectField
                label="packaging"
                control={control}
                name="packaging_id"
                endpoint={API_ENDPOINTS.GET_UNIT_MASTER}
                queryKey="um.description"
                valueKey="record_id"
                labelKey="unit_description"
                responseWhich="data"
                baseFilters={[
                  {
                    key: "um.type",
                    operator: "equal",
                    value1: "packaging",
                    logical: "",
                  },
                ]}
                rules={{
                  required: "packaging is required",
                }}
                error={errors.packaging_id}
                defaultValue={packaging}
              />
              <InputField
                label={"size"}
                register={register("size", {
                  required: "size is required",
                  validate: (value) =>
                    value > 0 || "Please enter a positive number",
                })}
                error={errors.size?.message}
              />

              <AntdSelectField
                label="Unit"
                control={control}
                name="unit_id"
                endpoint={API_ENDPOINTS.GET_UNIT_MASTER}
                queryKey="um.description"
                valueKey="record_id"
                labelKey="unit_description"
                responseWhich="data"
                baseFilters={[
                  {
                    key: "um.type",
                    operator: "equal",
                    value1: "unit",
                    logical: "",
                  },
                ]}
                rules={{
                  required: "Unit is required",
                }}
                error={errors.unit_id}
                defaultValue={unit}
              />
            </div>
          )}
          <div className="d-flex gap-2 justify-content-center mt-3">
            <CustomButton
              btntext={"submit"}
              type="submit"
              isLoading={isPending}
            />
            <CustomButton
              btntext={"Add New Unit Master"}
              handleClick={() => navigate(`${rootFolder}/add-unit-master`)}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default withPermissionCheck(UpdateUnitList, "update-unit-list");
