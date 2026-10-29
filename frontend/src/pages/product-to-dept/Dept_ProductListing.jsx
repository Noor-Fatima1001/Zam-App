import React, { useEffect } from "react";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import Card from "../../components/card/Card";
import {
  getFromLocalStorage,
  saveToSessionStorage,
} from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import { useNavigate } from "react-router-dom";

const Dept_ProductListing = () => {
  const navigate = useNavigate();
  const { mutate, isPending, data } = useGlobelApi(
    API_ENDPOINTS.GET_USERS_TO_DEPT
  );
  const UserId = getFromLocalStorage("UserId");

  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const fetchUserDept = () => {
    mutate(
      {
        filters: [
          {
            key: "adu.user_id",
            operator: "equal",
            value1: UserId,
            logical: "",
          },
          {
            key: "adu.status",
            operator: "equal",
            value1: "1",
            logical: "",
          },
        ],
        limit: 0, //should start from 1
        offset: 0,
      },
      {
        onSuccess: (res) => {},
        onError: () => {},
      }
    );
  };
  useEffect(() => {
    fetchUserDept();
  }, []);

  const handleAction = (item, sessionKey, pathItem) => {
    console.log("🚀 ~ handleAction ~ item:", item);
    if (pathItem.name === "Create Order") {
      sessionStorage.removeItem("purchase-order-module-data");
    }
    if (pathItem.name === "Create Stock Overview") {
      sessionStorage.removeItem("productToDeptData");
    }
    if (pathItem.name === "Create Purchase Order Without Product") {
      item.withoutOrder = true;
    }
    if (pathItem.name === "Create Purchase Order") {
      sessionStorage.removeItem("purchase-order-module-data");
      item.withoutOrder = false;
    }
    if (pathItem.name === "Create Item Ledger") {
      sessionStorage.removeItem("item-ledger-data");
      saveToSessionStorage("ledger-source", "manual");
    }
    saveToSessionStorage(sessionKey, item);
    navigate(`${rootFolder}/${pathItem?.path}`);
  };
  return (
    <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3">
      {data?.result?.map((value, idx) => {
        return (
          <div key={idx} >
            <Card
              title={value?.dept_code + " > " + value?.company_code}
              list={[
                {
                  name: "Product List",
                  sessionKey: "productToDeptData_card",
                  path: "main-product-to-dept-list",
                },
                {
                  name: "Create Purchase Order",
                  sessionKey: "createOrderData",
                  path: "create-purchase-order",
                },
                {
                  name: "Purchase Order List",
                  sessionKey: "createOrderData",
                  path: "purchase-order-list",
                },
                {
                  name: "Item Ledger List",
                  sessionKey: "createOrderData",
                  path: "item-ledger-list",
                },
                {
                  name: "Create Item Ledger",
                  sessionKey: "createOrderData",
                  path: "itemledger",
                },
                {
                  name: "Recipe List",
                  sessionKey: "recipeCTD",
                  path: "dept-recipe",
                },
                {
                  name: "Purchase Report",
                  sessionKey: "purchase-report",
                  path: "purchase-report-dept",
                },
                {
                  name: "Varince Report",
                  sessionKey: "variance-report",
                  path: "variance-report-dept",
                },
                {
                  name: "Cost summary",
                  sessionKey: "cost-summary",
                  path: "cost-summary-dept",
                },
                {
                  name: "Inventory Adjustment List",
                  sessionKey: "inventoryData",
                  path: "inventory-adjustment-list",
                },
                {
                  name: "Inventory Adjustment",
                  sessionKey: "inventoryData",
                  path: "inventory-adjustment",
                },
                {
                  name: "Manual Sales List",
                  sessionKey: "ManualSalesData",
                  path: "manual-sales-list",
                },
                {
                  name: "Create Manual Sales",
                  sessionKey: "ManualSalesData",
                  path: "create-manual-sales",
                },
                {
                  name: "Closing Stock List",
                  sessionKey: "deptClosingStock",
                  path: "dept-closing-stock-list",
                },
              ]}
              handleAction={(item) =>
                handleAction(value, item.sessionKey, item)
              }
            />
          </div>
        );
      })}
    </div>
  );
};

export default withPermissionCheck(Dept_ProductListing, "dep-product-listing");
