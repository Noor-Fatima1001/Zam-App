import { useState, useEffect } from "react";
import { getFromLocalStorage } from "./crypto-file";
import { useGlobelApi } from "../apis/useProduct/useCommon";
import { API_ENDPOINTS } from "../apis/client/api-endpoints";
import Loader from "../components/Loader";
import ErrorPerMessage from "../components/error/ErrorPerMessage";


const withPermissionCheck = (WrappedComponent, subModuleLink) => {
  return (props) => {
    const [isPermission, setIsPermission] = useState(false);
    const UserId = getFromLocalStorage("UserId");

    const {
      mutate: AccessUser,
      isPending,
      error: isErr,
    } = useGlobelApi(API_ENDPOINTS.ACCESS_USER_MODULE);

    useEffect(() => {
      if (!subModuleLink) return;

      const body = {
        userId: UserId,
        filters: [
          { key: "p.permission", operator: "equal", value1: "1", logical: "" },
          {
            key: "sm.sub_module_link",
            operator: "equal",
            value1: subModuleLink,
            logical: "",
          },
        ],
        limit: 0,
        offset: 10,
      };

      AccessUser(body, {
        onSuccess: (data) => {
          setIsPermission(data?.result?.[0]?.permission || false);
        },
        onError: (error) => {
          console.error(error);
        },
      });
    }, [subModuleLink, AccessUser]);

    if (isPending) {
      return <Loader />;
    }

    if (isErr || !isPermission) {
      return <ErrorPerMessage />;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withPermissionCheck;
