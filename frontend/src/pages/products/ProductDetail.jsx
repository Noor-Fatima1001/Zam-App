import moment from "moment";
import React, { useState, useTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import { getFromSessionStorage } from "../../config/crypto-file";
import AddProductToDept from "../product-to-dept/AddProductToDept";
import ProductToDeptList from "../product-to-dept/ProductToDeptList";
import UpdateProduct from "./UpdateProduct";

const ProductDetail = () => {
  const location = useLocation();
  const productData = getFromSessionStorage("productData");
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("General Data");
  const [isPending, startTransition] = useTransition();
  const handleTabClick = (tab) => {
    startTransition(() => {
      setCurrentTab(tab);
    });
  };
  const tabs = ["General Data", "Department List", "Add Department"];
  const renderContent = () => {
    switch (currentTab) {
      case tabs[0]:
        return (
          <div>
            <UpdateProduct productData={productData} />
          </div>
        );
      case tabs[1]:
        return (
          <div>
            <ProductToDeptList productData={productData} />
          </div>
        );
      case tabs[2]:
        return (
          <div>
            <AddProductToDept productData={productData} />
          </div>
        );

      default:
        return <div className="p-3">Tab content not found!</div>;
    }
  };
  const breadcrumbItems = [
    { title: "Products", link: "product-list" },
    { title: "Detail" },
  ];
  return (
    <div>
      <CustomBreadcrumb items={breadcrumbItems} />
      <h1 className="mb-1 text-size text-color font-headingweight">Products Detail</h1>

      <div className=" flex gap-1 items-center">
        <p className="text-color font-regularweight">
        Name:{" "}
        </p>
        <span className="text-color">
          {productData?.product_name}
        </span>
      </div>
      <ul className="user_profile-tabs ps-2">
        {tabs.map((tab) => (
          <li className="" key={tab}>
            <button
              className={`relative text-base  ${
                currentTab === tab ? "active font-bold" : " "
              } `}
              onClick={() => handleTabClick(tab)}
              disabled={isPending}
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
      {currentTab === "General Data" && (
        <div className="mt-3">
          <h2 className="capitalize text-size text-color font-headingweight">
            other information
          </h2>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-color font-regularweight">Created At :</dt>
              <dd className="text-color">{moment(productData?.created_at).format("DD-MM-YYYY")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-color font-regularweight">Updated At :</dt>
              <dd className="text-color">{moment(productData?.updated_at).format("DD-MM-YYYY")}</dd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
