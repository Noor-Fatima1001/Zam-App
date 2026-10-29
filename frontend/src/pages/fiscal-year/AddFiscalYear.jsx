import { DatePicker } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import SelectField from "../../components/form-elements/SelectField";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";

const AddFiscalYear = () => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.Add_FISCAL_YEAR);

  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm();
  const onSubmit = (data) => {
    mutate(
      {
        dataInsert: {
          year_value: data?.fiscal_year?.$y,
          company_id: data?.company_name?.value,
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
    { title: "COA", link: "coa-list" },
    { title: "Fiscal Year", link: "fiscal-year" },
    { title: "Add Fiscal Year" },
  ];
  return (
    <>
      <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-2 ">
          <Controller
            name="fiscal_year"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                picker="year"
                className="!focus:shadow-none !focus:border-gray-300 hover:shadow-none hover:border-gray-300 text-sm"
              />
            )}
          />
          <SelectField
            label="Company"
            control={control}
            name="company_name"
            endpoint={API_ENDPOINTS.USER_TO_COMPANY}
            queryKey="company_name"
            valueKey="company_id"
            labelKey="company_name"
            responseWhich="result"
            rules={{ required: "Company is required." }}
            error={errors.company_name}
            baseFilters={[
              {
                key: "auc.user_id",
                operator: "equal",
                value1: UserId,
                logical: "",
              },
              {
                key: "auc.status",
                operator: "equal",
                value1: "1",
                logical: "",
              },
            ]}
          />
        </div>
        <div className="d-flex justify-content-center mt-3">
          <CustomButton
            btntext={"submit"} addclass="!bg-[#696cff] !rounded-md"
            type="submit"
            isLoading={isPending}
          />
        </div>
      </form>
    </>
  );
};

export default withPermissionCheck(AddFiscalYear, "add-fiscal-year");
