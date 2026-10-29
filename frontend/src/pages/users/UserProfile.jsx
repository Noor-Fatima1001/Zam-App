import { useState, useTransition } from "react";
import UpdateUser from "./UpdateUser";
import UserPermission from "./user-profile/UserPermission";
import UserToCompanyListing from "./user-profile/UserToCompanyListing";
import UserToDepListing from "./user-profile/UserToDepListing";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import { getFromSessionStorage } from "../../config/crypto-file";
const UserProfile = () => {
  const UserData = getFromSessionStorage("detailData");
  const [currentTab, setCurrentTab] = useState("Profile");
  const [isPending, startTransition] = useTransition();
  const tabs = ["Profile", "Permissions", "Companies", "Departments"];

  const renderContent = () => {
    switch (currentTab) {
      case "Profile":
        return (
          <div>
            {" "}
            <UpdateUser UserData={UserData} />
          </div>
        );
      case "Permissions":
        return (
          <div>
            {" "}
            <UserPermission UserData={UserData} />
          </div>
        );
      case "Companies":
        return (
          <div>
            <UserToCompanyListing UserData={UserData} />
          </div>
        );

      case "Departments":
        return (
          <div>
            <UserToDepListing UserData={UserData} />
          </div>
        );
      default:
        return <div className="p-3">Tab content not found!</div>;
    }
  };

  const handleTabClick = (tab) => {
    startTransition(() => {
      setCurrentTab(tab);
    });
  };
  const breadcrumbItems = [
    { title: "User", link: "user-list" },
    { title: "User-detail" },
  ];
  return (
    <div className="">
        <CustomBreadcrumb items={breadcrumbItems} />
      <h1 className="mb- text-size text-color font-headingweight">User Detail</h1>
      <div className="flex gap-1 align-items-center">
        <p className=" text-color font-regularweight">Name:</p>
        <span className="   text-color">{UserData?.user_name}</span>
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
    </div>
  );
};

export default UserProfile;
