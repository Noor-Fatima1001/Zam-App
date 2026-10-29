import React, { useState, useTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Department from "./detail/Department";
import UpdateDepartment from "./UpdateDepartment";
import moment from "moment/moment";
import { FaAngleLeft } from "react-icons/fa6";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import { getFromSessionStorage } from "../../config/crypto-file";


const DepartmentDetail = () => {
  const location = useLocation();
  const DepartmentData = getFromSessionStorage("depDetail");
  console.log("🚀 ~ DepartmentDetail ~ DepartmentData:", DepartmentData);
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState("General Data");
  const [isPending, startTransition] = useTransition();
  const handleTabClick = (tab) => {
    startTransition(() => {
      setCurrentTab(tab);
    });
  };
  const tabs = ["General Data", "Company"];
  const renderContent = () => {
    switch (currentTab) {
      case "Company":
        return (
          <div>
            <Department DepartmentData={DepartmentData} />
          </div>
        );
      case "General Data":
        return (
          <div>
            <UpdateDepartment DepartmentData={DepartmentData} />
          </div>
        );

      default:
        return <div className="p-3">Tab content not found!</div>;
    }
  };
  const breadcrumbItems = [
    { title: "Department", link: "department-list" },
    { title: "Update Department" },
  ];
  return (
    <div>
        <CustomBreadcrumb items={breadcrumbItems} />
      <h1 className="mb-1 text-size text-color font-headingweight">
        Department Detail
      </h1>

      <div className="  flex gap-1 items-center">
      <p className="text-color font-regularweight">
        Name:{" "}
      </p>
        <span className="text-color ">
          {DepartmentData?.dept_name}
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
          <h className="capitalize text-size text-color font-headingweight">
            other information
          </h>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex gap-2">
              <dt className="text-color font-regularweight">Created At :</dt>
              <dd className="text-color ">{moment(DepartmentData?.created_at).format("DD-MM-YYYY")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-color font-regularweight">Updated At :</dt>
              <dd className="text-color ">{moment(DepartmentData?.updated_at).format("DD-MM-YYYY")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-color font-regularweight">Created By :</dt>
              <dd className="text-color " >{DepartmentData?.user_name}</dd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDetail;
