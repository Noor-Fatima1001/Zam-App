import React from "react";
import { useForm } from "react-hook-form";
import { FaAngleLeft } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import SelectField from "../../components/form-elements/SelectField";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";


const AddSuppliers = () => {
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.ADD_SUPPLIER);

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
    mutate(
      {
        dataInsert: {
          supplier_code: data?.supplier_code,
          supplier_name: data?.supplier_name,
          supplier_address: data?.supplier_address,
          supplier_phone: data?.supplier_phone,
          supplier_website: data?.supplier_website,
          supplier_order_communication:data?.supplier_order_communication,
          gl_payable: parseInt(data?.gl_id?.value),
          created_by: UserId,
        },
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success(data?.data)
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: data?.data,
            // });
            // navigate(`${rootFolder}/supplier-list`);
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
      }
    );
  };

  const breadcrumbItems = [
    { title: "Supplier", link: "supplier-list" },
    { title: "Add Supplier" },
  ];
  return (
    <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-2">
          <InputField
            label={"Code"}
            placeholder={"Enter Supplier code"}
            register={register("supplier_code", {
              required: "Supplier code is required",
            })}
            error={errors.supplier_code?.message}
          />
          <InputField
            label={"Name"}
            placeholder={"Enter Supplier name"}
            register={register("supplier_name", {
              required: "Supplier name is required",
            })}
            error={errors.supplier_name?.message}
          />
          <InputField
            label={"Address"}
            placeholder={"Enter Supplier address"}
            register={register("supplier_address", {
              required: "Supplier address is required",
            })}
            error={errors.supplier_address?.message}
          />
          <InputField
            type={"number"}
            label={"Phone No"}
            placeholder={"Enter Supplier phone"}
            register={register("supplier_phone", {
              required: "Supplier phone is required",
            })}
            error={errors.supplier_phone?.message}
          />
          <InputField
            label={"Supplier Order Communication"}
            placeholder={"Enter Supplier Order Communication"}
            register={register("supplier_order_communication", {
              required: "Supplier Order Communication is required",
            })}
            error={errors.supplier_order_communication?.message}
          />
          <InputField
            type={"text"}
            label={"Website"}
            placeholder={"Enter Supplier website"}
            register={register("supplier_website", {
              required: false,
              pattern: {
                value: /^www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,6}(\.[a-zA-Z]{2,6})?$/,

                message: "Enter a valid URL like www.test.com",
              },
            })}
            error={errors.supplier_website?.message}
          />

          <div>
            <SelectField
              label="Gl Payable"
              labelCLass="capitalize"
              name="gl_id"
              control={control}
              type="select"
              endpoint={API_ENDPOINTS.GET_COA}
              queryKey="gl_name"
              valueKey="record_id"
              labelKey="gl_name"
              ContcatenateLabel="gl_code"
              rules={{ required: "gl is required" }}
              baseFilters={[
                {
                  key: "cmh.head_name",
                  operator: "equal",

                  value1: "liabilities",

                  logical: "",
                },
              ]}
              error={errors.gl_id}
            />
          </div>
        </div>
        <div className="d-flex justify-content-center mt-3">
          <CustomButton
            btntext={"submit"}
            type="submit"
            isLoading={isPending}
          />
        </div>
    </form>
  );
};

export default withPermissionCheck(AddSuppliers, "create-supplier");
