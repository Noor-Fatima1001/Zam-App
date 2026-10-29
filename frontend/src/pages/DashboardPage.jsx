import moment from "moment";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaFilter, FaInfoCircle, FaUsers } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { LuBadgeDollarSign } from "react-icons/lu";
import { TiChartBar } from "react-icons/ti";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../apis/client/api-endpoints";
import { useGlobelApi } from "../apis/useProduct/useCommon";
import CustomButton from "../components/button/CustomButton";
import DashboardLineChart from "../components/charts/DashboardLineChart";
import InputField from "../components/form-elements/InputField";
import Loader from "../components/Loader";
import { getFromLocalStorage } from "../config/crypto-file";
import withPermissionCheck from "../config/withPermissionCheck";
import DashboardPieChart from "../components/charts/DashboardPieChart";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { Typography } from "antd";
import { GridExpandMoreIcon } from "@mui/x-data-grid";
import DashboardBarChart from "../components/charts/DashboardBarChart";
import AntdSelectField from "../AntdSelectField";
// Reusable table filter component
const TableFilter = ({ data, setFilteredData, tableType }) => {
  const [filterValue, setFilterValue] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [availableColumns, setAvailableColumns] = useState([]);

  useEffect(() => {
    if (data && data.length > 0) {
      // Get column names based on table type
      const columnNames = Object.keys(data[0]);
      setAvailableColumns(columnNames);

      // Set default filter column
      if (columnNames.length > 0 && !filterColumn) {
        if (tableType === "daily_sales") {
          setFilterColumn("date");
        } else if (tableType === "menu_category") {
          setFilterColumn("category_name");
        } else if (tableType === "revenue_category") {
          setFilterColumn("revenue_centre_name");
        } else if (tableType === "sales_by_day_avg") {
          setFilterColumn("sales_day");
        } else if (tableType === "sales_by_items_lunch_food")
          setFilterColumn("item_name");
        else if (tableType === "sales_by_items_dinner_food")
          setFilterColumn("item_name");
        else if (tableType === "sales_by_items_lunch_beverage")
          setFilterColumn("item_name");
        else if (tableType === "sales_by_items_dinner_beverage")
          setFilterColumn("item_name");
      }
    }
  }, [data, filterColumn, tableType]);

  const handleFilter = () => {
    if (!filterColumn || !filterValue || !data) return;

    const filtered = data.filter((item) => {
      if (!item[filterColumn]) return false;

      // Skip filtering the total row
      if (item[filterColumn] === "Total") return true;

      return String(item[filterColumn])
        .toLowerCase()
        .includes(filterValue.toLowerCase());
    });

    setFilteredData(filtered);
  };

  const clearFilter = () => {
    setFilterValue("");
    setFilteredData(data);
  };

  // Apply filter when filter value changes
  useEffect(() => {
    if (filterValue === "") {
      setFilteredData(data);
    } else {
      handleFilter();
    }
  }, [filterValue, filterColumn, data]);

  return (
    <div className="flex gap-2 items-center mb-2">
      <div className="flex flex-1 gap-2">
        <div className="flex-1 relative">
          <select
            className="border border-gray-300 p-1 rounded-md text-sm w-full focus:outline-none"
            value={filterColumn}
            onChange={(e) => setFilterColumn(e.target.value)}
          >
            {availableColumns.map((column) => (
              <option key={column} value={column}>
                {column
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            className="border border-gray-300 p-1 rounded-md text-sm w-full focus:outline-none pl-8"
            placeholder="Filter..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          />
          {filterValue && (
            <button
              className="text-gray-400 -translate-y-1/2 absolute hover:text-gray-600 right-2 top-1/2 transform"
              onClick={clearFilter}
            >
              <IoMdClose />
            </button>
          )}
        </div>
      </div>
      <div className="flex text-customBlue text-xs gap-1 items-center">
        <FaFilter className="text-customBlue" />
        <span className="">{data ? data.length : 0} records</span>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const {
    mutate,
    isPending,
    data: saleData,
    error,
  } = useGlobelApi(API_ENDPOINTS.DAILY_SALES);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
    getValues,
    setValue,
  } = useForm();

  const navigate = useNavigate();
  // const Brand = import.meta.env.VITE_ROOT_USER || "";
  const UserId = getFromLocalStorage("UserId");

  // States for filtered data
  const [filteredDailySales, setFilteredDailySales] = useState([]);
  const [filteredMenuCategory, setFilteredMenuCategory] = useState([]);
  const [filteredRevenueCategory, setFilteredRevenueCategory] = useState([]);
  const [filteredSalesByDayAvg, setFilteredSalesByDayAvg] = useState([]);

  const [filteredSalesByItemLunchFood, setFilteredSalesByItemLunchFood] =
    useState([]);
  const [filteredSalesByItemDinnerFood, setFilteredSalesByItemDinnerFood] =
    useState([]);
  const [
    filteredSalesByItemLunchBeverage,
    setFilteredSalesByItemLunchBeverage,
  ] = useState([]);
  const [
    filteredSalesByItemDinnerBeverage,
    setFilteredSalesByItemDinnerBeverage,
  ] = useState([]);
  const [company,setCompany]=useState();
  const {mutate:fetchCompany,pending}=useGlobelApi(API_ENDPOINTS.USER_TO_COMPANY)


  const handleFetchCompany=()=>{
    fetchCompany({
      filter:[
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
      ],
      offset:0,
      limit:0,
      orderBy:""
    },{
      onSuccess:(response)=>{
        const data=response?.result?.[0]
        setValue("company_name",data?.company_id)
        setCompany({value:data?.company_id,label:data?.company_name})
      }
    })
  }

  useEffect(()=>{
    handleFetchCompany();
  },[])
  const dateFrom = watch("dateFrom");
  const dateTo = watch("dateTo");

  const onSubmit = (data) => {
    const company_id=getValues("company_name")
    if(!company_id) return
    const body = {
      headerData: {
        company_id: company_id,
        start_date: moment(dateFrom).format("YYYY-MM-DD"),
        end_date: moment(dateTo).format("YYYY-MM-DD"),
      },
      filters: [],
      limit: 0,
      offset: 0,
      orderby: "",
    };
    mutate(body);
  };

  useEffect(() => {
    const formattedDate = moment().endOf("day").format("DD-MM-YYYY");
    const formattedDateTo = moment()
      .subtract(1, "days")
      .startOf("day")
      .format("DD-MM-YYYY");
    setValue("dateFrom", moment(formattedDateTo, "DD-MM-YYYY").toDate());
    setValue("dateTo", moment(formattedDateTo, "DD-MM-YYYY").toDate());
  }, []);

  useEffect(() => {
    onSubmit();
  }, [dateFrom, dateTo,watch("company_name")]);

  // Update filtered data when raw data changes
  useEffect(() => {
    if (saleData?.data?.[0]?.sub_data) {
      const {
        daily_sales,
        menu_category,
        revenue_category,
        sales_by_day_avg,
        sales_by_items_lunch_food,
        sales_by_items_dinner_food,
        sales_by_items_lunch_beverage,
        sales_by_items_dinner_beverage,
      } = saleData.data[0].sub_data;

      setFilteredDailySales(daily_sales || []);
      setFilteredMenuCategory(menu_category || []);
      setFilteredRevenueCategory(revenue_category || []);
      setFilteredSalesByDayAvg(sales_by_day_avg || []);
      setFilteredSalesByItemLunchFood(sales_by_items_lunch_food || []);
      setFilteredSalesByItemDinnerFood(sales_by_items_dinner_food || []);
      setFilteredSalesByItemLunchBeverage(sales_by_items_lunch_beverage || []);
      setFilteredSalesByItemDinnerBeverage(
        sales_by_items_dinner_beverage || []
      );
    }
  }, [saleData]);
  const parseNumberString = (str) => {
    if (!str || typeof str !== "string") return 0;
    return parseFloat(str.replace(/,/g, ""));
  };
  const chartData = saleData?.data[0]?.sub_data?.daily_sales?.map((item) => ({
    date: item.date,
    day: item.day,
    net_sales: parseNumberString(item.net_sales),
    total_covers: parseNumberString(item.total_covers),
    lunch_sales: parseNumberString(item.lunch_sales),
    dinner_sales: parseNumberString(item.dinner_sales),
  }));

  const areas = [
    { dataKey: "net_sales", color: "#c65929" },
    { dataKey: "total_covers", color: "green" },
    { dataKey: "lunch_sales", color: "blue" },
    { dataKey: "dinner_sales", color: "purple" },
  ];

  // average  sale day
  const chartDataAverageDay =
    saleData?.data[0]?.sub_data?.sales_by_day_avg?.map((item) => ({
      date: item.sales_day,
      avg_lunch: parseNumberString(item.avg_lunch),
      avg_dinner: parseNumberString(item.avg_dinner),
      avg_daily: parseNumberString(item.avg_daily),
      net_sales: parseNumberString(item.net_sales),
    }));

  const areasAverageDay = [
    { dataKey: "avg_lunch", color: "#c65929" },
    { dataKey: "avg_dinner", color: "green" },
    { dataKey: "avg_daily", color: "blue" },
    { dataKey: "net_sales", color: "#657672" },
  ];

  // ==================================  Sales by Item Lunch Food ============================
  const chartDataLunchFood =
    saleData?.data[0]?.sub_data?.sales_by_items_lunch_food?.map((item) => {
      if (item.item_name === "Total") return;
      return {
        name: item.item_name,
        contribution_percentage: parseNumberString(
          item.contribution_percentage
        ),
        sales: parseNumberString(item.net_sales),
        qty: item.sold_qty,
      };
    });
  const pieColorsLunchFood = [
    "#c65929",
    "#ff8042",
    "#ffc658",
    "#00C49F",
    "#0088FE",
  ];
  const lucnhNetSalesData =
    saleData?.data[0]?.sub_data?.sales_by_items_lunch_food?.map((item) => ({
      date: item.item_name,
      net_sales: parseNumberString(item.net_sales),
    }));

  const lucnhNetSalesAreas = [{ dataKey: "net_sales", color: "#c65929" }];
  const lunchFoodTooltipDescription = [
    {
      key: "name",
      name: "Name",
    },
    {
      key: "contribution_percentage",
      name: "Contribution",
    },
    {
      key: "sales",
      name: "Sales",
    },
    {
      key: "qty",
      name: "Quantity",
    },
  ];
  // ==================================  Sales by Item Dinner Food ============================
  const chartDataDinnerFood =
    saleData?.data[0]?.sub_data?.sales_by_items_dinner_food?.map(
      (item, index) => {
        if (item.item_name === "Total") return;
        return {
          name: item.item_name,
          contribution_percentage: parseNumberString(
            item.contribution_percentage
          ),
          sales: parseNumberString(item.net_sales),
          qty: item.sold_qty,
        };
      }
    );
  const pieColorsDinnerFood = [
    "#c65929",
    "#ff8042",
    "#ffc658",
    "#00C49F",
    "#0088FE",
  ];
  const dinnerNetSalesData =
    saleData?.data[0]?.sub_data?.sales_by_items_dinner_food?.map((item) => ({
      date: item.item_name,
      net_sales: parseNumberString(item.net_sales),
    }));

  const dinnerNetSalesAreas = [{ dataKey: "net_sales", color: "#c65929" }];
  const dinnerFoodTooltipDescription = [
    {
      key: "name",
      name: "Name",
    },
    {
      key: "contribution_percentage",
      name: "Contribution",
    },
    {
      key: "sales",
      name: "Sales",
    },
    {
      key: "qty",
      name: "Quantity",
    },
  ];
  // ==================================  Sales by Item Lunch Bevrage ============================
  const chartDataLunchBeverage =
    saleData?.data[0]?.sub_data?.sales_by_items_lunch_beverage?.map(
      (item, index) => {
        if (item.item_name === "Total") return;
        return {
          name: item.item_name,
          contribution_percentage: parseNumberString(
            item.contribution_percentage
          ),
          sales: parseNumberString(item.net_sales),
          qty: item.sold_qty,
        };
      }
    );
  const pieColorsLunchBeverage = [
    "#c65929",
    "#ff8042",
    "#ffc658",
    "#00C49F",
    "#0088FE",
  ];
  const lunchBeverageNetSalesData =
    saleData?.data[0]?.sub_data?.sales_by_items_lunch_beverage?.map((item) => ({
      date: item.item_name,

      net_sales: parseNumberString(item.net_sales),
    }));

  const lunchBeverageNetSalesAreas = [
    { dataKey: "net_sales", color: "#c65929" },
  ];
  const lunchBeverageTooltipDescription = [
    {
      key: "name",
      name: "Name",
    },
    {
      key: "contribution_percentage",
      name: "Contribution",
    },
    {
      key: "sales",
      name: "Sales",
    },
    {
      key: "qty",
      name: "Quantity",
    },
  ];
  // ==================================  Sales by Item Dinner Bevrage ============================
  const chartDataDinnerBeverage =
    saleData?.data[0]?.sub_data?.sales_by_items_dinner_beverage?.map(
      (item, index) => {
        if (item.item_name === "Total") return;
        return {
          name: item.item_name,
          contribution_percentage: parseNumberString(
            item.contribution_percentage
          ),
          sales: parseNumberString(item.net_sales),
          qty: item.sold_qty,
        };
      }
    );
  const pieColorsDinnerBeverage = [
    "#c65929",
    "#ff8042",
    "#ffc658",
    "#00C49F",
    "#0088FE",
  ];
  const dinnerBeverageNetSalesData =
    saleData?.data[0]?.sub_data?.sales_by_items_dinner_beverage?.map(
      (item) => ({
        date: item.item_name,
        net_sales: parseNumberString(item.net_sales),
      })
    );

  const dinnerBeverageNetSalesAreas = [
    { dataKey: "net_sales", color: "#c65929" },
  ];
  const dinnerBeverageTooltipDescription = [
    {
      key: "name",
      name: "Name",
    },
    {
      key: "contribution_percentage",
      name: "Contribution",
    },
    {
      key: "sales",
      name: "Sales",
    },
    {
      key: "qty",
      name: "Quantity",
    },
  ];

  return (
    <div>
      <h1 className="text-size text-color font-headingweight text-center my-2">
        Daily Sales Dashboard
      </h1>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        {/* <div className="grid grid-cols-2 gap-3"> */}
        
        {/* </div> */}
        <div className="grid grid-cols-3 gap-3">
            <AntdSelectField
            control={control}
            label="Company"
            name={`company_name`}
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
            defaultValue={company}
          />
          <InputField
            label="From date"
            control={control}
            type={"date"}
            register={"dateFrom"}
            rules="date is required"
            error={errors?.dateFrom}
          />
          <InputField
            label="To date"
            control={control}
            type={"date"}
            register={"dateTo"}
            rules="date is required"
            error={errors?.dateTo}
          />
        </div>
        <CustomButton
          btntext={"Submit"}
          type="submit"
          isLoading={isPending}
          addclass="mt-3 mb-2 !w-20 h-7"
        />
      </form>
      <Accordion className="shadow-lg rounded-radiusRegular mb-2">
        <AccordionSummary
          className="custom-accordion-border"
          expandIcon={<GridExpandMoreIcon />}
        >
          <Typography>
            {" "}
            <div
              className="text-size text-color font-headingweight"

            >
              Daily Sales Chart
            </div>
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <DashboardLineChart data={chartData} areas={areas} />
          {/* <DashboardLineChart data={chartDataAverageDay} areas={areasAverageDay} /> */}
        </AccordionDetails>
      </Accordion>

      {/* <DashboardAreaChart data={chartData} areas={areas} /> */}
      {isPending ? (
        <Loader />
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-radiusRegular text-center text-red-500 font-regularweight  mt-4">
          Error: {error}
        </div>
      ) : (
        <div className="text-sm space-y-6 whitespace-nowrap">
          {/* Daily Sales Table */}
          <div>
            <h2 className="text-size text-color font-headingweight mb-2">
              Daily Sales
            </h2>
            {saleData?.data?.[0]?.sub_data?.daily_sales?.length > 0 && (
              <TableFilter
                data={saleData.data[0].sub_data.daily_sales}
                setFilteredData={setFilteredDailySales}
                tableType="daily_sales"
              />
            )}
            <div className="rounded-radiusRegular shadow-lg overflow-hidden">
              <div className="max-h-[500px] overflow-x-auto relative">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-customBlue text-white">
                      <th className="font-bold border-b-2 border-white-400  px-4 py-2">
                        <div className="flex justify-center">Date</div>
                      </th>
                      <th className="font-bold border-b-2 border-white-400  px-4 py-2">
                        <div className="flex justify-center">Day</div>
                      </th>
                      <th
                        colSpan="3"
                        className="border-b-2 border-white-400 text-center font-bold px-4 py-2"
                      >
                        <div className="flex justify-center gap-2 items-center">
                          <LuBadgeDollarSign size={20} />
                          Sales Amount
                        </div>
                      </th>
                      <th
                        colSpan="3"
                        className="border-b-2 border-white-400 text-center font-bold px-4 py-2"
                      >
                        <div className="flex justify-center gap-2 items-center">
                          <FaUsers size={20} />
                          Covers
                        </div>
                      </th>
                      <th
                        colSpan="3"
                        className="border-b-2 border-white-400 text-center font-bold px-4 py-2"
                      >
                        <div className="flex justify-center gap-2 items-center">
                          <TiChartBar size={20} />
                          Spent
                        </div>
                      </th>
                    </tr>
                    <tr className="bg-customBlue  text-white">
                      <th className="px-4 py-1"></th>
                      <th className="px-4 py-1"></th>
                      <th className="text-center px-4 py-1">Lunch</th>
                      <th className="text-center px-4 py-1">Dinner</th>
                      <th className="text-center px-4 py-1">Net</th>
                      <th className="text-center px-4 py-1">Lunch</th>
                      <th className="text-center px-4 py-1">Dinner</th>
                      <th className="text-center px-4 py-1">Total</th>
                      <th className="text-center px-4 py-1">Lunch Spent</th>
                      <th className="text-center px-4 py-1">Dinner Spent</th>
                      <th className="text-center px-4 py-1">Net Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* saleData?.data?.[0]?.sub_data?.daily_sales?.length > 0 ? */}
                    {filteredDailySales.length > 0 ? (
                      filteredDailySales.map((row, index) => (
                        <tr
                          key={index}
                          className={
                            row.date === "Total"
                              ? "border-t !border-[#000] font-bold sticky bottom-0 bg-white"
                              : index % 2 === 0
                                ? "bg-indigo-50"
                                : "bg-white"
                          }
                        >
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.date === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.date}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.date === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.day}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.date === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.lunch_sales}
                          </td>

                          <td
                            align="center"
                            className={`px-4 py-2 ${row.date === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.dinner_sales}
                          </td>

                          <td
                            align="center"
                            className={`px-4 py-2 text-[#000] font-semibold`}
                          >
                            {row.net_sales}
                          </td>

                          <td
                            align="center"
                            className={`px-4 py-2 ${row.date === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.lunch_covers}
                          </td>
                          <td
                            className={`px-4 py-2 text-center ${row.date === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.dinner_covers}
                          </td>
                          <td
                            className={`px-4 py-2 text-center ${row.date === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.total_covers}
                          </td>

                          {/* ==== average   */}
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.date === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.lunch_spent}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.date === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.dinner_spent}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 text-[#000] font-semibold`}
                          >
                            {row.net_spent}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={12}
                          className="bg-indigo-50 p-6 text-center"
                        >
                          <div className="text-gray-500 font-semibold">
                            <FaInfoCircle
                              className="text-indigo-500 inline mr-2"
                              size={20}
                            />
                            No Daily Sales Data Available
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Menu Category Table */}
          <div>
            <h2 className="text-size text-color font-headingweight mb-2">
              Menu Category
            </h2>
            {saleData?.data?.[0]?.sub_data?.menu_category?.length > 0 && (
              <TableFilter
                data={saleData.data[0].sub_data.menu_category}
                setFilteredData={setFilteredMenuCategory}
                tableType="menu_category"
              />
            )}
            <div className="rounded-radiusRegular shadow-lg overflow-hidden">
              <div className="max-h-[500px] overflow-x-auto relative">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-customBlue text-white">
                      <th className="font-bold px-4 py-2">
                        <div className="flex justify-center">Category</div>
                      </th>
                      <th className="font-bold px-4 py-2">
                        <div className="flex justify-center">Class</div>
                      </th>
                      <th className="font-bold px-4 py-2">
                        <div className="flex justify-center">Lunch Sales</div>
                      </th>
                      <th className="font-bold px-4 py-2">
                        <div className="flex justify-center">Dinner Sales</div>
                      </th>
                      <th className="font-bold px-4 py-2">
                        <div className="flex justify-center">Net Sales</div>
                      </th>
                      <th className="font-bold px-4 py-2">
                        <div className="flex justify-center">Lunch %</div>
                      </th>
                      <th className="font-bold px-4 py-2">
                        <div className="flex justify-center">Dinner %</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMenuCategory.length > 0 ? (
                      filteredMenuCategory.map((row, index) => (
                        <tr
                          key={index}
                          className={
                            row.category_name === "Total"
                              ? "border-t border-[#000] font-bold sticky bottom-0 bg-white"
                              : index % 2 === 0
                                ? "bg-indigo-50"
                                : "bg-white"
                          }
                        >
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.category_name === "Total"
                                ? "font-semibold"
                                : ""
                              } text-[#000]`}
                          >
                            {row.category_name}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.category_name === "Total"
                                ? "font-semibold"
                                : ""
                              } text-[#000]`}
                          >
                            {row.class_name}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.category_name === "Total"
                                ? "font-semibold"
                                : ""
                              } text-[#000]`}
                          >
                            {row.lunch}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.category_name === "Total"
                                ? "font-semibold"
                                : ""
                              } text-[#000]`}
                          >
                            {row.dinner}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.category_name === "Total"
                                ? "font-semibold"
                                : ""
                              } text-[#000]`}
                          >
                            {row.net_sales}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 text-center ${row.category_name === "Total"
                                ? "font-semibold"
                                : ""
                              } text-[#000]`}
                          >
                            {row.lunch_contribution}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 text-center ${row.category_name === "Total"
                                ? "font-semibold"
                                : ""
                              } text-[#000]`}
                          >
                            {row.dinner_contribution}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="bg-indigo-50 p-6 text-center"
                        >
                          <div className="text-gray-500 font-semibold">
                            <FaInfoCircle
                              className="text-indigo-500 inline mr-2"
                              size={20}
                            />
                            No Menu Category Data Available
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Revenue Category Table */}
          <div>
            <h2 className="text-size text-color font-headingweight mb-2">
              Revenue Category
            </h2>
            {saleData?.data?.[0]?.sub_data?.revenue_category?.length > 0 && (
              <TableFilter
                data={saleData.data[0].sub_data.revenue_category}
                setFilteredData={setFilteredRevenueCategory}
                tableType="revenue_category"
              />
            )}
            <div className="rounded-radiusRegular shadow-lg overflow-hidden">
              <div className="max-h-[500px] overflow-x-auto relative">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-customBlue text-white">
                      <th className="text-left font-bold px-4 py-2">
                        <div className="flex justify-center">
                          Revenue Center
                        </div>
                      </th>
                      <th className="text-center font-bold px-4 py-2">
                        <div className="flex justify-center">Lunch Sales</div>
                      </th>
                      <th className="text-center font-bold px-4 py-2">
                        <div className="flex justify-center">Dinner Sales</div>
                      </th>
                      <th className="text-center font-bold px-4 py-2">
                        <div className="flex justify-center">Total Sales</div>
                      </th>
                      <th className="text-center font-bold px-4 py-2">
                        <div className="flex justify-center">Lunch %</div>
                      </th>
                      <th className="text-center font-bold px-4 py-2">
                        <div className="flex justify-center">Dinner %</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRevenueCategory.length > 0 ? (
                      filteredRevenueCategory.map((row, index) => (
                        <tr
                          key={index}
                          className={
                            row.revenue_centre_name === "Total"
                              ? "border-t !border-[#000] font-bold sticky bottom-0 bg-white"
                              : index % 2 === 0
                                ? "bg-indigo-50"
                                : "bg-white"
                          }
                        >
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.revenue_centre_name === "Total"
                                ? "font-semibold"
                                : ""
                              } text-[#000]`}
                          >
                            {row.revenue_centre_name}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.revenue_centre_name === "Total"
                                ? "font-semibold"
                                : ""
                              } text-[#000]`}
                          >
                            {row.lunch}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.revenue_centre_name === "Total"
                                ? "font-semibold"
                                : ""
                              } text-[#000]`}
                          >
                            {row.dinner}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.revenue_centre_name === "Total"
                                ? "font-semibold"
                                : ""
                              } text-[#000]`}
                          >
                            {row.total_sales}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.revenue_centre_name === "Total"
                                ? "font-semibold"
                                : ""
                              } text-[#000]`}
                          >
                            {row.lunch_contribution}
                          </td>
                          <td
                            className={`px-4 py-2 text-center ${row.revenue_centre_name === "Total"
                                ? "font-semibold"
                                : ""
                              } text-[#000]`}
                          >
                            {row.dinner_contribution}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="bg-indigo-50 p-6 text-center"
                        >
                          <div className="text-gray-500 font-semibold">
                            <FaInfoCircle
                              className="text-indigo-500 inline mr-2"
                              size={20}
                            />
                            No Revenue Category Data Available
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sales by Day Average Table */}
          <div>
            <Accordion
              className="shadow-lg rounded-radiusRegular mb-2  text-color "

            >
              <AccordionSummary expandIcon={<GridExpandMoreIcon />}>
                <Typography>
                  {" "}
                  <div
                    className="capitalize text-size text-color font-headingweight"

                  >
                    Sales by Day Average Chart
                  </div>
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <DashboardLineChart
                  data={chartDataAverageDay}
                  areas={areasAverageDay}
                />
                {/* <DashboardLineChart data={chartDataAverageDay} areas={areasAverageDay} /> */}
              </AccordionDetails>
            </Accordion>
            <h2 className="text-size text-color font-headingweight capitalize  mb-2">
              Sales by Day Average
            </h2>
            {saleData?.data?.[0]?.sub_data?.sales_by_day_avg?.length > 0 && (
              <TableFilter
                data={saleData.data[0].sub_data.sales_by_day_avg}
                setFilteredData={setFilteredSalesByDayAvg}
                tableType="sales_by_day_avg"
              />
            )}
            <div className="rounded-radiusRegular shadow-lg overflow-hidden">
              <div className="max-h-[500px] overflow-x-auto relative">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-customBlue text-white">
                      <th className="text-center font-bold px-4 py-2">
                        <div className="flex justify-center">Day</div>
                      </th>
                      <th className="text-left font-bold px-4 py-2">
                        <div className="flex justify-center">Occurrences</div>
                      </th>
                      <th className="text-center font-bold px-4 py-2">
                        <div className="flex justify-center">Lunch</div>
                      </th>
                      <th className="text-center font-bold px-4 py-2">
                        <div className="flex justify-center">Dinner</div>
                      </th>
                      <th className="text-center font-bold px-4 py-2">
                        <div className="flex justify-center">Net Sales</div>
                      </th>
                      <th className="text-center font-bold px-4 py-2">
                        <div className="flex justify-center">Avg Lunch</div>
                      </th>
                      <th className="text-center font-bold px-4 py-2">
                        <div className="flex justify-center">Avg Dinner</div>
                      </th>
                      <th className="text-center font-bold px-4 py-2">
                        <div className="flex justify-center">Avg Daily</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalesByDayAvg.length > 0 ? (
                      filteredSalesByDayAvg.map((row, index) => (
                        <tr
                          key={index}
                          className={
                            row.sales_day === "Total"
                              ? "border-t !border-[#000] font-bold sticky bottom-0 bg-white"
                              : index % 2 === 0
                                ? "bg-indigo-50"
                                : "bg-white"
                          }
                        >
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.sales_day === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.sales_day}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.sales_day === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.no_of_occ}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.sales_day === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.lunch}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.sales_day === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.dinner}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.sales_day === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.net_sales}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 ${row.sales_day === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.avg_lunch}
                          </td>
                          <td
                            align="center"
                            className={`px-4 py-2 text-center ${row.sales_day === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.avg_dinner}
                          </td>

                          <td
                            align="center"
                            className={`px-4 py-2 ${row.sales_day === "Total" ? "font-semibold" : ""
                              } text-[#000]`}
                          >
                            {row.avg_daily}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={12}
                          className="bg-indigo-50 p-6 text-center"
                        >
                          <div className="text-color  font-semibold">
                            <FaInfoCircle
                              className="text-indigo-500 inline mr-2"
                              size={20}
                            />
                            No Sales by Day Average Data Available
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 my-3">
              <div>
                <Accordion className="shadow-lg rounded-radiusRegular mb-2">
                  <AccordionSummary expandIcon={<GridExpandMoreIcon />}>
                    <Typography>
                      {" "}
                      <div
                        className=" capitalize text-size text-color font-headingweight"

                      >
                        Contributions by Item Lunch Food Chart
                      </div>
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <DashboardPieChart
                      data={chartDataLunchFood}
                      colors={pieColorsLunchFood}
                      height={300}
                      innerRadius={60}
                      outerRadius={90}
                      customDescription={lunchFoodTooltipDescription}
                      width={"100%"}
                      nameKey="name"
                      dataKey="contribution_percentage"
                      legendPosition="bottom"
                    />
                  </AccordionDetails>
                </Accordion>
              </div>
              <div>
                <Accordion className="shadow-lg rounded-radiusRegular mb-2">
                  <AccordionSummary expandIcon={<GridExpandMoreIcon />}>
                    <Typography>
                      {" "}
                      <div
                        className=" capitalize text-size text-color font-headingweight"

                      >
                        Net Sales by Item Lunch Food Chart
                      </div>
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <DashboardBarChart data={lucnhNetSalesData} areas={lucnhNetSalesAreas} />
                  </AccordionDetails>
                </Accordion>
              </div>
            </div>
            {/* sales_by_items_lunch_food */}
            <div>
              <h2 className="text-size text-color font-headingweight capitalize mb-2">
                Sales by Item Lunch Food
              </h2>
              {saleData?.data?.[0]?.sub_data?.sales_by_items_lunch_food
                ?.length > 0 && (
                  <TableFilter
                    data={saleData.data[0].sub_data.sales_by_items_lunch_food}
                    setFilteredData={setFilteredSalesByItemLunchFood}
                    tableType="sales_by_items_lunch_food"
                  />
                )}
              <div className="rounded-radiusRegular shadow-lg overflow-hidden">
                <div className="max-h-[500px] overflow-x-auto relative">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-customBlue text-white">
                        <th className="text-left font-bold px-4 py-2">
                          <div className="flex justify-center">Item name</div>
                        </th>
                        <th className="text-center font-bold px-4 py-2">
                          <div className="flex justify-center">QTY</div>
                        </th>
                        <th className="text-center font-bold px-4 py-2">
                          <div className="flex justify-center">Net Sales</div>
                        </th>
                        <th className="text-center font-bold px-4 py-2">
                          <div className="flex justify-center">
                            Contribution %
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSalesByItemLunchFood.length > 0 ? (
                        filteredSalesByItemLunchFood.map((row, index) => (
                          <tr
                            key={index}
                            className={
                              row.item_name === "Total"
                                ? "border-t !border-[#000] font-bold sticky bottom-0 bg-white"
                                : index % 2 === 0
                                  ? "bg-indigo-50"
                                  : "bg-white"
                            }
                          >
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.item_name}
                            </td>
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.sold_qty}
                            </td>
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.net_sales}
                            </td>
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.contribution_percentage}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={12}
                            className="bg-indigo-50 p-6 text-center"
                          >
                            <div className="font-regularweight text-color">
                              <FaInfoCircle
                                className="text-indigo-500 inline mr-2"
                                size={20}
                              />
                              No Sales by Day Average Data Available
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* sales_by_items_dinner_food */}

            <div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 my-3">
                <div>
                  <Accordion className="shadow-lg rounded-radiusRegular mb-2">
                    <AccordionSummary expandIcon={<GridExpandMoreIcon />}>
                      <Typography>
                        {" "}
                        <div
                          className="text-size text-color font-headingweight capitalize"

                        >
                          Contributions by Item dinner Food Chart
                        </div>
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <DashboardPieChart
                        data={chartDataDinnerFood}
                        colors={pieColorsDinnerFood}
                        height={300}
                        innerRadius={60}
                        outerRadius={90}
                        customDescription={dinnerFoodTooltipDescription}
                        width={"100%"}
                        nameKey="name"
                        dataKey="contribution_percentage"
                        legendPosition="bottom"
                      />
                    </AccordionDetails>
                  </Accordion>
                </div>
                <div>
                  <Accordion className="shadow-lg rounded-radiusRegular mb-2">
                    <AccordionSummary expandIcon={<GridExpandMoreIcon />}>
                      <Typography>
                        {" "}
                        <div
                          className="text-size text-color font-headingweight capitalize "

                        >
                          Net Sales by Item dinner Food Chart
                        </div>
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <DashboardBarChart data={dinnerNetSalesData} areas={dinnerNetSalesAreas} />
                    </AccordionDetails>
                  </Accordion>
                </div>
                <h2 className="text-size text-color font-headingweight capitalize  mb-2">
                  Sales by Item dinner Food
                </h2>
                {saleData?.data?.[0]?.sub_data?.sales_by_items_dinner_food
                  ?.length > 0 && (
                    <TableFilter
                      data={saleData.data[0].sub_data.sales_by_items_dinner_food}
                      setFilteredData={setFilteredSalesByItemDinnerFood}
                      tableType="sales_by_items_dinner_food"
                    />
                  )}
              </div>
              <div className="rounded-radiusRegular shadow-lg overflow-hidden">
                <div className="max-h-[500px] overflow-x-auto relative">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-customBlue text-white">
                        <th className="text-left font-bold px-4 py-2">
                          <div className="flex justify-center">Item name</div>
                        </th>
                        <th className="text-center font-bold px-4 py-2">
                          <div className="flex justify-center">QTY</div>
                        </th>
                        <th className="text-center font-bold px-4 py-2">
                          <div className="flex justify-center">Net Sales</div>
                        </th>
                        <th className="text-center font-bold px-4 py-2">
                          <div className="flex justify-center">
                            Contribution %
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSalesByItemDinnerFood.length > 0 ? (
                        filteredSalesByItemDinnerFood.map((row, index) => (
                          <tr
                            key={index}
                            className={
                              row.item_name === "Total"
                                ? "border-t !border-[#000] font-bold sticky bottom-0 bg-white"
                                : index % 2 === 0
                                  ? "bg-indigo-50"
                                  : "bg-white"
                            }
                          >
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.item_name}
                            </td>
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.sold_qty}
                            </td>
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.net_sales}
                            </td>
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.contribution_percentage}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={12}
                            className="bg-indigo-50 p-6 text-center"
                          >
                            <div className="text-color font-regularweight ">
                              <FaInfoCircle
                                className="text-indigo-500 inline mr-2"
                                size={20}
                              />
                              No Sales by Item dinner Food Data Available
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* sales_by_items_lunch_beverage */}
            <div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 my-3 my-3">
                <div>
                  <Accordion className="shadow-lg rounded-radiusRegular mb-2">
                    <AccordionSummary expandIcon={<GridExpandMoreIcon />}>
                      <Typography>
                        {" "}
                        <div
                          className=" capitalize text-size text-color font-headingweight"

                        >
                          Contributions by Item Lunch beverage Chart
                        </div>
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <DashboardPieChart
                        data={chartDataLunchBeverage}
                        colors={pieColorsLunchBeverage}
                        height={300}
                        innerRadius={60}
                        outerRadius={90}
                        customDescription={lunchBeverageTooltipDescription}
                        width={"100%"}
                        nameKey="name"
                        dataKey="contribution_percentage"
                        legendPosition="bottom"
                      />
                    </AccordionDetails>
                  </Accordion>
                </div>
                <div>
                  <Accordion className="shadow-lg rounded-radiusRegular mb-2">
                    <AccordionSummary expandIcon={<GridExpandMoreIcon />}>
                      <Typography>
                        {" "}
                        <div
                          className="text-size text-color font-headingweight capitalize "

                        >
                          Net Sales by Item Lunch beverage Chart
                        </div>
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <DashboardBarChart data={lunchBeverageNetSalesData} areas={lunchBeverageNetSalesAreas} />
                    </AccordionDetails>
                  </Accordion>
                </div>
              </div>
              <h2 className="text-size text-color font-headingweight capitalize  mb-2">
                Sales by Item Lunch beverage
              </h2>
              {saleData?.data?.[0]?.sub_data?.sales_by_items_lunch_beverage
                ?.length > 0 && (
                  <TableFilter
                    data={saleData.data[0].sub_data.sales_by_items_lunch_beverage}
                    setFilteredData={setFilteredSalesByItemLunchBeverage}
                    tableType="sales_by_items_lunch_beverage"
                  />
                )}
              <div className="rounded-radiusRegular shadow-lg overflow-hidden">
                <div className="max-h-[500px] overflow-x-auto relative">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-customBlue text-white">
                        <th className="text-left font-bold px-4 py-2">
                          <div className="flex justify-center">Item name</div>
                        </th>
                        <th className="text-center font-bold px-4 py-2">
                          <div className="flex justify-center">QTY</div>
                        </th>
                        <th className="text-center font-bold px-4 py-2">
                          <div className="flex justify-center">Net Sales</div>
                        </th>
                        <th className="text-center font-bold px-4 py-2">
                          <div className="flex justify-center">
                            Contribution %
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSalesByItemLunchBeverage.length > 0 ? (
                        filteredSalesByItemLunchBeverage.map((row, index) => (
                          <tr
                            key={index}
                            className={
                              row.item_name === "Total"
                                ? "border-t !border-[#000] font-bold sticky bottom-0 bg-white"
                                : index % 2 === 0
                                  ? "bg-indigo-50"
                                  : "bg-white"
                            }
                          >
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.item_name}
                            </td>
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.sold_qty}
                            </td>
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.net_sales}
                            </td>
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.contribution_percentage}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={12}
                            className="bg-indigo-50 p-6 text-center"
                          >
                            <div className="text-color font-regularweight">
                              <FaInfoCircle
                                className="text-indigo-500 inline mr-2"
                                size={20}
                              />
                              No Sales by Lunch beverage Data Available
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* sales_by_items_dinner_beverage */}
            <div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 my-3 my-3">
                <div>
                  <Accordion className="shadow-lg rounded-radiusRegular mb-2">
                    <AccordionSummary expandIcon={<GridExpandMoreIcon />}>
                      <Typography>
                        {" "}
                        <div
                          className=" capitalize text-size text-color font-headingweight"

                        >
                          Contributions by Item dinner beverage Chart
                        </div>
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <DashboardPieChart
                        data={chartDataDinnerBeverage}
                        colors={pieColorsDinnerBeverage}
                        height={300}
                        innerRadius={60}
                        outerRadius={90}
                        customDescription={dinnerBeverageTooltipDescription}
                        width={"100%"}
                        nameKey="name"
                        dataKey="contribution_percentage"
                        legendPosition="bottom"
                      />
                    </AccordionDetails>
                  </Accordion>
                </div>
                <div>
                  <Accordion className="shadow-lg rounded-radiusRegular mb-2">
                    <AccordionSummary expandIcon={<GridExpandMoreIcon />}>
                      <Typography>
                        {" "}
                        <div
                          className=" capitalize text-size text-color font-headingweight"

                        >
                          Net Sales by Item dinner beverage Chart
                        </div>
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <DashboardBarChart data={dinnerBeverageNetSalesData} areas={dinnerBeverageNetSalesAreas} />
                    </AccordionDetails>
                  </Accordion>
                </div>
              </div>
              <h2 className=" capitalize text-size text-color font-headingweight mb-2">
                Sales by Item dinner beverage
              </h2>
              {saleData?.data?.[0]?.sub_data?.sales_by_items_dinner_beverage
                ?.length > 0 && (
                  <TableFilter
                    data={
                      saleData.data[0].sub_data.sales_by_items_dinner_beverage
                    }
                    setFilteredData={setFilteredSalesByItemDinnerBeverage}
                    tableType="sales_by_items_dinner_beverage"
                  />
                )}
              <div className="rounded-radiusRegular shadow-lg overflow-hidden">
                <div className="max-h-[500px] overflow-x-auto relative">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-customBlue text-white">
                        <th className="text-left font-bold px-4 py-2">
                          <div className="flex justify-center">Item name</div>
                        </th>
                        <th className="text-center font-bold px-4 py-2">
                          <div className="flex justify-center">QTY</div>
                        </th>
                        <th className="text-center font-bold px-4 py-2">
                          <div className="flex justify-center">Net Sales</div>
                        </th>
                        <th className="text-center font-bold px-4 py-2">
                          <div className="flex justify-center">
                            Contribution %
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSalesByItemDinnerBeverage.length > 0 ? (
                        filteredSalesByItemDinnerBeverage.map((row, index) => (
                          <tr
                            key={index}
                            className={
                              row.item_name === "Total"
                                ? "border-t !border-[#000] font-bold sticky bottom-0 bg-white shadow-md"
                                : index % 2 === 0
                                  ? "bg-indigo-50"
                                  : "bg-white"
                            }
                          >
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.item_name}
                            </td>
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.sold_qty}
                            </td>
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.net_sales}
                            </td>
                            <td
                              align="center"
                              className={`px-4 py-2 ${row.item_name === "Total" ? "font-semibold" : ""
                                } text-[#000]`}
                            >
                              {row.contribution_percentage}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={12}
                            className="bg-indigo-50 p-6 text-center"
                          >
                            <div className="text-color font-regularweight">
                              <FaInfoCircle
                                className="text-indigo-500 inline mr-2"
                                size={20}
                              />
                              No Sales by dinner beverage Data Available
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default withPermissionCheck(DashboardPage, "dashboard");
