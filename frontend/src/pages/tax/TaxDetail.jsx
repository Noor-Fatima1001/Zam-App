import moment from "moment/moment";
import React, { useState, useTransition } from "react";
import { FaAngleLeft } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import UpdateTax from "./UpdateTax";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import { getFromSessionStorage } from "../../config/crypto-file";


const TaxDetail = () => {
  const location = useLocation();
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const routeData = getFromSessionStorage("tax-Detail") || "";
  console.log("🚀~ routeData:", routeData);
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState("General Data");
  const [isPending, startTransition] = useTransition();
  const handleTabClick = (tab) => {
    startTransition(() => {
      setCurrentTab(tab);
    });
  };
  const tabs = ["General Data"];
  const renderContent = () => {
    switch (currentTab) {
      case "General Data":
        return (
          <div>
            <UpdateTax routeData={routeData} />
          </div>
        );

      default:
        return <div className="p-3">Tab content not found!</div>;
    }
  };
  const breadcrumbItems = [
    { title: "Tax", link: "tax-list" },
    { title: "Tax Detail" },
  ];
  return (
    <div>
          <CustomBreadcrumb items={breadcrumbItems} />
      <h1 className="mb-2 text-size text-color font-headingweight">Tax Detail</h1>

      <div className=" flex gap-1 items-center">
        <p className="text-color font-regularweight">
        Name:{" "}
        </p>
        <span className="text-color ">{routeData?.tax_name}</span>
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
      {currentTab === "General Data" && (
        <div className="mt-3">
          <h2 className="capitalize text-size text-color font-headingweight">
            other information
          </h2>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-color font-regularweight">Created At :</dt>
              <dd className="text-color">{moment(routeData?.created_at).format("DD-MM-YYYY")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-color font-regularweight">Updated At :</dt>
              <dd className="text-color ">{moment(routeData?.updated_at).format("DD-MM-YYYY")}</dd>
            </div>
            {/* <div className="flex gap-2">
              <p className="!text-black">Created By :</p>
              <p>{routeData?.user_name}</p>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxDetail;
