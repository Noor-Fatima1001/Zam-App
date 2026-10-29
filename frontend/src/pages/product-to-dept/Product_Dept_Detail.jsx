import { useState, useTransition } from "react";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import { getFromSessionStorage } from "../../config/crypto-file";
import AddStock from "../stocks overview/AddStock";
import StocksList from "../stocks overview/StocksList";
import ItemPurchaseHistroy from "./ItemPurchaseHistroy";
import ProductInBatchRecipe from "./ProductInBatchRecipe";
import DeptItemCostMovemnt from "../report/DeptItemCostMovemnt";
import VarianceReportByProduct from "../report/VarianceReportByProduct";

const Product_Dept_Detail = () => {
  const departmentData = getFromSessionStorage("productToDeptData");

  const tabs = ["Stock Overview", "Add Stock Overview","Purchase History","Item Cost Movement","Usage","Item Report"];
  const [currentTab, setCurrentTab] = useState(tabs[0]);
  const [isPending, startTransition] = useTransition();
  const renderContent = () => {
    switch (currentTab) {
      case tabs[0]:
        return (
          <div>
            {" "}
            <StocksList departmentData={departmentData} />
          </div>
        );
      case tabs[1]:
        return (
          <div>
            <AddStock departmentData={departmentData} />
          </div>
        );
      case tabs[2]:
        return (
          <div>
            <ItemPurchaseHistroy departmentData={departmentData} />
          </div>
        );
      case tabs[3]:
        return (
          <div>
            <DeptItemCostMovemnt departmentData={departmentData} />
          </div>
        );
      case tabs[4]:
        return (
          <div>
            <ProductInBatchRecipe departmentData={departmentData} />
          </div>
        );
      case tabs[5]:
        return (
          <div>
            <VarianceReportByProduct departmentData={departmentData} />
          </div>
        );

      default:
        return <div className="p-3 text-color ">Tab content not found!</div>;
    }
  };

  const handleTabClick = (tab) => {
    startTransition(() => {
      setCurrentTab(tab);
    });
  };
  // useEffect(() => {
  //   handleFetchExcelData();
  // }, []);

  const breadcrumbItems = [
    { title: "Product To Dept", link: "product-to-dept-list" },
    { title: "Stock Overview" },
  ];
  return (
    <>
      <div className="">
        <CustomBreadcrumb items={breadcrumbItems} />
        <div className="flex gap-1 mt-2">
          <p className="text-color font-regularweight">Department:</p>
          <span className="text-color ">{departmentData?.company_to_dept}</span>
        </div>
        <div className="flex gap-1 mt-2">
          <p className="text-color font-regularweight">Product:</p>
          <span className="text-color">{departmentData?.product_name} - {departmentData?.base_unit} </span>
        </div>
        <ul className="user_profile-tabs ps-2">
          {tabs.map((tab) => (
            <li className="" key={tab}>
              <button
                className={`relative text-base  ${
                  currentTab === tab ? "active font-bold" : " "
                } `}
                onClick={() => handleTabClick(tab)}
                disabled={isPending} // Disable button during transition
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
        <div className="tab-content border p-3 bg-light">
          {isPending ? (
            <div className="text-customBlue">Loading...</div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </>
  );
};

export default Product_Dept_Detail;
