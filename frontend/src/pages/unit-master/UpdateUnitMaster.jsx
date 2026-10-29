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
import { u } from "@table-library/react-table-library/HeaderCell-1d879c3c";

const UpdateUnitMaster = ({unitmaster,handleFetchdata}) => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.UPDATE_UNIT_MASTET);
  const { mutate: specficUnitMaster } = useGlobelApi(
    API_ENDPOINTS.GET_UNIT_MASTER
  );
  // const Unidata = getFromSessionStorage("unitMasterData");
  const Unidata = unitmaster;


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
        record_id: Unidata?.record_id,
        description: data?.description,
        type: currentTab,
        parent_id: currentTab === tabs[0] ? data?.parent_id : "",
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
  //   { title: "Unit Master", link: "unit-master" },
  //   { title: "Update Unit Master" },
  // ];
  const tabs = ["unit", "family", "packaging"];
  const [currentTab, setCurrentTab] = useState("unit");
  const [unit, setUnit] = useState(null);
  const handleTabClick = (tab) => {
    setCurrentTab(tab);
  };
  const getFetchbyId = () => {
    if (!Unidata?.record_id) return; // ✅ Prevent API call if record_id is undefined

    specficUnitMaster(
      {
        filters: [
          {
            key: "um.id",
            operator: "equal",
            value1: Unidata.record_id, // ✅ Ensure value exists
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
            setValue("description", unitDetails.unit_description || "");
            setCurrentTab(unitDetails?.type);
            setUnit(
              unitDetails.parent_id
                ? {
                    value: unitDetails.parent_id || "",
                    label: unitDetails?.parent_description,
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
    if (Unidata?.record_id) {
      getFetchbyId();
    } else {
      reset();
      setCurrentTab("unit");
      setUnit(null);
    }
  }, [Unidata]);
  useEffect(() => {
    if (unit) {
      setValue("parent_id", unit.value);
    }
  }, [unit, setValue]);

  return (
    <div>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
        {/* <CustomBreadcrumb items={breadcrumbItems} /> */}
        <div className="w-full  mx-auto bg-white  rounded-radiusRegular">
          {/* <h2 className="mb-2 text-center text-lg font-semibold text-black">
            Update Unit Master
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
          <div className="mt-2">
            <InputField
              label={"Description"}
              register={register("description", {
                required: "Description is required",
              })}
              error={errors.description?.message}
            />

            {currentTab === tabs[0] && (
              <AntdSelectField
                label="Parent Unit"
                control={control}
                name="parent_id"
                endpoint={API_ENDPOINTS.GET_UNIT_MASTER}
                queryKey="um.description"
                valueKey="record_id"
                labelKey="unit_description"
                responseWhich="data"
                baseFilters={[
                  {
                    key: "um.type",
                    operator: "equal",
                    value1: "family",
                    logical: "",
                  },
                ]}
                rules={{
                  required:
                    currentTab === tabs[0] ? "Parent Unit is required" : false,
                }}
                error={errors.parent_id}
                defaultValue={unit}
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
        </div>
      </form>
    </div>
  );
};

export default withPermissionCheck(UpdateUnitMaster, "update-unit-master");
