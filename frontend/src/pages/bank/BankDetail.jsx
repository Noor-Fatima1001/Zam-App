import moment from "moment";
import React, { useEffect, useState, useTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomBreadcrumb from "../../components/CustomBreadcrumb";
import { getFromSessionStorage } from "../../config/crypto-file";
import UpdateBankList from "./UpdateBankList";
import AssignBankList from "../assign-bank/AssignBankList"
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";

const BankDetail = () => {

  const { mutate } = useGlobelApi(API_ENDPOINTS.GET_BANK_LIST);
  const [apiData, setApiData] = useState();
  const bankData = getFromSessionStorage("BankList");
  const [currentTab, setCurrentTab] = useState("General Data");
  const [isPending, startTransition] = useTransition();
  const handleTabClick = (tab) => {
    startTransition(() => {
      setCurrentTab(tab);
    });
  };

  const handleFetchdata = () => {
    mutate({
      filters: [
        {
          key: "bl.id",
          value1: bankData?.record_id,
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
  }, [])

  const tabs = ["General Data", "Companies"];
  const renderContent = () => {
    switch (currentTab) {
      case tabs[0]:
        return (
          <div>
            <UpdateBankList handleFetchdata={handleFetchdata} bankData={bankData} />
          </div>
        );
      case tabs[1]:
        return (
          <div>
            <AssignBankList />
          </div>
        );

      default:
        return <div className="p-3 text-color">Tab content not found!</div>;
    }
  };
  const breadcrumbItems = [
    { title: "Bank", link: "bank-list" },
    { title: "Detail" },
  ];
  return (
    <div>
      <CustomBreadcrumb items={breadcrumbItems} />
      <h1 className="mb-2 text-size text-color font-headingweight">Bank Detail</h1>
      <div class=" flex gap-1 items-center">
        <p class="text-color font-regularweight"> Name:{" "}</p>
        <span class="text-color">
          {
            apiData?.bank_name
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
          <h1 className="capitalize text-size text-color font-headingweight">
            other information
          </h1>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-color font-regularweight">Created At :</dt>
              <dd className="text-color">{moment(apiData?.created_at).format("DD-MM-YYYY")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-color font-regularweight">Updated At :</dt>
              <dd className="text-color">{moment(apiData?.updated_at).format("DD-MM-YYYY")}</dd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDetail;
