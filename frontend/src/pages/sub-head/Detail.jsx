import moment from "moment/moment";
import React, { useState, useTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UpdateSubHead from "./UpdateSubHead";
import SubMainHead from "./detail/SubMainHead";
import { FaAngleLeft } from "react-icons/fa6";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import { getFromSessionStorage } from "../../config/crypto-file";


const Detail = () => {
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const location = useLocation();
  const SubHeadData = getFromSessionStorage("sub-headData") || "";
  console.log("🚀 ~ DepartmentDetail ~ SubHeadData:", SubHeadData);
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState("General Data");
  const [isPending, startTransition] = useTransition();
  const handleTabClick = (tab) => {
    startTransition(() => {
      setCurrentTab(tab);
    });
  };
  const tabs = ["General Data", "Main Head"];
  const renderContent = () => {
    switch (currentTab) {
      case "General Data":
        return (
          <div>
            <UpdateSubHead SubHeadData={SubHeadData} />
          </div>
        );
      case "Main Head":
        return (
          <div>
            <SubMainHead SubHeadData={SubHeadData} />
          </div>
        );
      default:
        return <div className="p-3">Tab content not found!</div>;
    }
  };
  const breadcrumbItems = [
    { title: "COA", link: "coa-list" },
    { title: "Sub Head", link: "sub-head-list" },
    { title: "Sub Head Detail" },
  ];
  return (
    <div>
          <CustomBreadcrumb items={breadcrumbItems} />
      <h1 className="mb-1 text-size text-color font-headingweight">Sub Head Detail</h1>

      <div className=" flex gap-1 items-center">
        <p className="text-color font-regularweight">
        Name:{" "}
        </p>
        <span className="text-color ">
          {SubHeadData?.sub_name}
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
              <dd className="text-color ">{moment(SubHeadData?.created_at).format("DD-MM-YYYY")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-color font-regularweight">Updated At :</dt>
              <dd className="text-color ">{moment(SubHeadData?.updated_at).format("DD-MM-YYYY")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-color font-regularweight">Created By :</dt>
              <dd className="text-color ">{SubHeadData?.user_name}</dd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Detail;
