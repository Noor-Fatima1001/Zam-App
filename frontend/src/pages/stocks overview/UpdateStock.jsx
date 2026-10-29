import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
// import AntdSelectField from "../../AntdSelectField";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import CustomButton from "../../components/button/CustomButton";
import InputField from "../../components/form-elements/InputField";

import { useEffect } from "react";
import Loader from "../../components/Loader";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import moment from "moment";

const UpdateStock = ({ departmentData, depId }) => {
  console.log("🚀 ~ UpdateStock ~ departmentData:", departmentData);
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.UPDATE_STOCK);
  const { mutate: specficStockList, isPending: isloading } = useGlobelApi(
    API_ENDPOINTS.GET_STOCK
  );

  // const departmentData = getFromSessionStorage("departmentData");
  // const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  // const [productToDeptData,setProductToDeptData] = useState(getFromSessionStorage("productToDeptData"));
  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    // reset,
    setValue,
  } = useForm();

  const onSubmit = (data) => {
    console.log("Update Stock Data", data);
    // const formattedDate = new Date(data?.starting_date)
    //   .toISOString()
    //   .split("T")[0];
    const body = {
      dataUpdate: {
        record_id: departmentData.record_id,
        assign_product_dept_id: depId,
        opening_qty: data?.opening_qty,
        live_qty: data?.live_qty,
        opening_price: data?.opening_price,
        average_price: data?.opening_price,
        starting_date: moment(data?.starting_date).format("YYYY-MM-DD"),
        changed_by: UserId,
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
        console.log(error);
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
    { title: "Stock List", link: "Stock-list" },
    { title: "Update Stock List" },
  ];
  const getFetchbyId = () => {
    if (!departmentData?.record_id) return; // ✅ Prevent API call if record_id is undefined

    specficStockList(
      {
        filters: [
          {
            key: "so.id",
            operator: "equal",
            value1: departmentData.record_id, // ✅ Ensure value exists
            logical: "",
          },
        ],
        limit: 0,
        offset: 0,
      },
      {
        onSuccess: (data) => {
          if (data?.data?.length > 0) {
            const StockDetails = data.data[0];
            setValue("live_qty", StockDetails.live_qty || "");
            setValue("opening_qty", StockDetails.opening_qty || "");
            setValue("opening_price", StockDetails.opening_price || "");
            // setValue("average_price", StockDetails.average_price || "");
            const formattedDate = moment(StockDetails.starting_date).format(
              "DD-MM-YYYY"
            );
            setValue(
              "starting_date",
              moment(formattedDate, "DD-MM-YYYY").toDate()
            );
          }
        },
        onError: (error) => {
          console.error("Error fetching Stock data:", error);
        },
      }
    );
  };

  useEffect(() => {
    if (departmentData) {
      getFetchbyId();
    }
  }, [navigate, departmentData]);

  return (
    <div>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <div className="w-full ">
          <h2 className="mb-2 text-center text-lg font-semibold text-black">
            Update Stock List
          </h2>

          {isloading ? (
            <Loader />
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              <InputField
                label={"Opening quantity"}
                register={register("opening_qty", {
                  required: "Opening quantity is required",
                  validate: (value) =>
                    value >= 0 || "Please enter a positive number",
                })}
                error={errors.opening_qty?.message}
              />
              <InputField
                label={"Opening Price"}
                register={register("opening_price", {
                  required: "Opening Price is required",
                  validate: (value) =>
                    value >= 0 || "Please enter a positive number",
                })}
                error={errors.opening_price?.message}
              />
              <InputField
                label={"live Quanitity"}
                register={register("live_qty", {
                  required: "live Quanitity is required",
                  validate: (value) =>
                    value >= 0 || "Please enter a positive number",
                })}
                error={errors.opening_price?.message}
              />
              <div>
                <p className="mb-1">Average price</p>
                <div className="h-7 border rounded-lg bg-gray-100 px-2 flex items-center">
                  {watch("opening_price")}
                </div>
              </div>
              {/* <InputField
                label={"Average Price"}
                register={register("average_price", {
                  required: "Average Price is required",
                  validate: (value) =>
                    value >= 0 || "Please enter a positive number",
                })}
                error={errors.average_price?.message}
              /> */}
              <InputField
                label="Starting Date"
                control={control}
                type={"date"}
                register={"starting_date"} // ✅ Correct
                rules="Starting Date is required"
                error={errors?.starting_date}
              />
            </div>
          )}
          <div className="d-flex gap-2 justify-content-center mt-3">
            <CustomButton
              btntext={"submit"}
              type="submit"
              isLoading={isPending}
            />
            {/* <CustomButton
              btntext={"Update New Stock Master"}
              handleClick={() => navigate(`${rootFolder}/Update-Stock-master`)}
            /> */}
          </div>
        </div>
      </form>
    </div>
  );
};

export default withPermissionCheck(UpdateStock, "update-stock");
