// import { Form } from "antd";
// import { useForm } from "react-hook-form";
// import { toast } from "react-toastify";
// import { FaSave } from "react-icons/fa";
// import { IoClose } from "react-icons/io5";
// import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
// import { useGlobelApi } from "../../apis/useProduct/useCommon";
// import CustomButton from "../../components/button/CustomButton";
// import InputField from "../../components/form-elements/InputField";
// import { getFromLocalStorage } from "../../config/crypto-file";
// import withPermissionCheck from "../../config/withPermissionCheck";

// const CreateCompany = ({ setIsModalOpen }) => {
//   const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.CREATE_COMPANY);
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm();
//   const UserId = getFromLocalStorage("UserId");

//   const onSubmit = (data) => {
//     console.log(data);
//     mutate(
//       {
//         dataInsert: {
//           company_name: data?.company_name,
//           company_code: data?.company_code,
//           created_by: UserId,
//         },
//       },
//       {
//         onSuccess: (data) => {
//           if (data.success) {
//             toast.success(data?.result);
//             setIsModalOpen(false);
//           } else {
//             toast.error(data?.result);
//           }
//         },
//         onError: (error) => {
//           setIsModalOpen(false);
//           toast.error("Something went wrong");
//         },
//       }
//     );
//   };

//   return (
//     <>
//       <form autocomplete="off" onSubmit={handleSubmit(onSubmit)}>
//         <InputField
//           label={"Company name"}
//           placeholder={"Enter Company name"}
//           register={register("company_name", {
//             required: "company name is required",
//           })}
//           error={errors.company_name?.message}
//         />
//         <InputField
//           label={"Company Code"}
//           placeholder={"Enter Company Code "}
//           register={register("company_code", {
//             required: " Company code is required",
//           })}
//           error={errors.company_code?.message}
//         />
//         <div className="flex gap-3 mt-2">
//           <CustomButton
//             rounded={"rounded-lg"}
//             icon={"submit"}
//             btntext={<FaSave className="me-1" />}
//             type="submit"
//             isLoading={isPending}
//           />
//           <CustomButton
//             rounded={"rounded-lg"}
//             bg="bg-red-500"
//             icon={"Close"}
//             handleClick={() => setIsModalOpen(false)}
//             btntext={<IoClose className="me-1" />}
//           />
//         </div>
//       </form>
//     </>
//   );
// };
// export default withPermissionCheck(CreateCompany, "addcompany");
import { Form } from "antd";
import { useForm } from "react-hook-form";
import {toast} from "react-toastify";
import { FaSave } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";

const CreateCompany = ({ setIsModalOpen }) => {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.CREATE_COMPANY);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();
  const UserId = getFromLocalStorage("UserId");

  const onSubmit = (data) => {
    mutate(
      {
        dataInsert: {
          company_name: data?.company_name,
          company_code: data?.company_code,
          company_phone: data?.company_phone,
          company_address: data?.company_address,
          created_by: UserId,
        },
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success("Company created successfully!");
            setIsModalOpen(false);
          } else {
            toast.error(data?.result || "Failed to create company.");
          }
        },
        onError: () => {
          toast.error("Something went wrong. Please try again.");
        },
      }
    );
  };

  return (
    <Form
      layout="vertical"
      autoComplete="off"
      className="space-y-1"
      onSubmitCapture={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <InputField
          label=" Name"
          placeholder="Enter name"
          register={register("company_name", {
            required: " name is required",
          })}
          error={errors.company_name?.message}
        />
        <InputField
          label="Company Phone"
          placeholder="Enter Company Phone"
          register={register("company_phone", {
            required: "Company Phone is required",
          })}
          error={errors.company_phone?.message}
        />
        <InputField
          label="Company Adderess"
          placeholder="Enter Company Adderess"
          register={register("company_address", {
            required: "Company Adderess is required",
          })}
          error={errors.company_address?.message}
        />
        <InputField
          label="Code"
          placeholder="Enter  code"
          register={register("company_code", {
            required: " code is required",
          })}
          error={errors.company_code?.message}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <CustomButton
          addclass=""
          icon={<FaSave className="ms-1" />}
          btntext="Save"
          type="submit"
          isLoading={isPending || isSubmitting}
        />
        <CustomButton
          addclass=""
          bg="bg-red-500"
          icon={<IoClose className="ms-1" />}
          btntext="Cancel"
          handleClick={() => setIsModalOpen(false)}
        />
      </div>
    </Form>
  );
};

export default withPermissionCheck(CreateCompany, "addcompany");
