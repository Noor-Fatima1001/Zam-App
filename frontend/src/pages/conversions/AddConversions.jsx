import React, { useEffect, useState } from "react";
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
import AntSSelectField from "../../AntSSelectField";

const AddConversions = () => {
  const { mutate, isPending } = useGlobelApi(
    API_ENDPOINTS.ADD_CONVERSIONS_LIST
  );
  const { mutate: umMutate, isPending: umisPending } = useGlobelApi(
    API_ENDPOINTS.GET_UNIT_MASTER
  );

  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const [unitFromType, setUnitFromType] = useState();
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
  const uitMaster = watch("unit_from");
  console.log("🚀 ~ AddConversions ~ uitMaster:", uitMaster);
  const onSubmit = (data) => {
    console.log(data);
    const body = {
      dataInsert: {
        unit_from: data?.unit_from,
        unit_to: data?.unit_to,
        type_factor: data?.type_factor,
        conversion_value: data?.conversion_value,
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
  useEffect(() => {
    if (uitMaster) {
      umMutate(
        {
          filters: [
            { key: "um.id", operator: "equal", value1: uitMaster, logical: "" },
          ],
          limit: 0,
          offset: 0,
        },
        {
          onSuccess: (res) => {
            setUnitFromType(res?.data?.[0]?.type);
          },
          onError: () => {},
        }
      );
    }
  }, [uitMaster]);

  const breadcrumbItems = [
    { title: "Conversion List", link: "conversions" },
    { title: "Add Conversion List" },
  ];
  const options = [
    { value: "divide", label: "divide" },
    { value: "multiply", label: "multiply" },
  ];
  return (
    <div>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
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
              // baseFilters={[
              //   {
              //     key: "um.type",
              //     operator: "equal",
              //     value1: "unit",
              //     logical: "",
              //   },
              // ]}
              rules={{
                required: "Unit is required",
              }}
              error={errors.unit_from}
            />
            <AntdSelectField
              label="Unit To"
              disable={!uitMaster || umisPending}
              control={control}
              name="unit_to"
              endpoint={API_ENDPOINTS.GET_UNIT_MASTER}
              queryKey="um.description"
              valueKey="record_id"
              labelKey="unit_description"
              responseWhich="data"
              baseFilters={[
                {
                  key: "um.type",
                  operator: "equal",
                  value1: unitFromType,
                  logical: "",
                },
              ]}
              rules={{
                required: "Unit is required",
              }}
              error={errors.unit_to}
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
              label="type"
              control={control}
              name="type_factor"
              options={options}
              rules={{ required: "type is required" }}
              error={errors.type_factor}
            />
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

export default withPermissionCheck(AddConversions, "add-conversions");
