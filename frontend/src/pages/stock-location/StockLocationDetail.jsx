import moment from "moment";
import React, { useEffect, useState, useTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import { getFromSessionStorage } from "../../config/crypto-file";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import withPermissionCheck from "../../config/withPermissionCheck";
import UpdateStockLocation from "./UpdateStockLocation";
import AssignLocation from "../assign-location/AssignLocation";

const StockLocationDetail = () => {

  const { mutate } = useGlobelApi(API_ENDPOINTS.GET_LOCATION_LIST);
  const [apiData, setApiData] = useState();
  const locationData = getFromSessionStorage("StockLocation");
  const [currentTab, setCurrentTab] = useState("General Data");
  const [isPending, startTransition] = useTransition();
  const navigate=useNavigate();
  const handleTabClick = (tab) => {
    startTransition(() => {
      setCurrentTab(tab);
    });
  };

  const handleFetchdata = () => {
    mutate({
      filters: [
        {
          key: "sl.id",
          value1: locationData?.record_id,
          logical: "",
          operator: "equal"
        },

      ],
      offset: 0,
      limit: 0
    }, {
      onSuccess: (response) => {
        const data = response?.data?.[0]
        setApiData(data);
      }
    })
  }

  useEffect(() => {
    handleFetchdata();
  }, [navigate])

  const tabs = ["General Data", "Assign Location"];
  const renderContent = () => {
    switch (currentTab) {
      case tabs[0]:
        return (
          <div>
            <UpdateStockLocation handleFetchdata={handleFetchdata} />
          </div>
        );
      case tabs[1]:
        return (
          <div>
            <AssignLocation/>
          </div>
        );

      default:
        return <div className="p-3 text-color">Tab content not found!</div>;
    }
  };
  const breadcrumbItems = [
    { title: "Stcok Location", link: "stock-location-list" },
    { title: "Detail" },
  ];
  return (
    <div>
      <CustomBreadcrumb items={breadcrumbItems} />
      <h1 className="mb-2 text-size text-color font-headingweight">Stock Detail</h1>
      <div class=" flex gap-1 items-center">
        <p class="text-color font-regularweight"> Name:{" "}</p>
        <span class="text-color">
          {
            apiData?.location_name
          }
        </span>
      </div>
      <ul className="user_profile-tabs ps-2">
        {tabs.map((tab) => (
          <li className="" key={tab}>
            <button
              className={`relative text-base  ${currentTab === tab ? "active font-bold" : " "
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
        </div>
      )}
    </div>
  );
};

export default withPermissionCheck(StockLocationDetail,"stock-location-detail");
