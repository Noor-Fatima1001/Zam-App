import { useEffect, useState } from "react";
import { useGlobelApi } from "../apis/useProduct/useCommon";
import { API_ENDPOINTS } from "../apis/client/api-endpoints";

// Custom hook to check permissions
const useCheckPermission = (subModuleLink, userId) => {
  const { mutate: AccessUser } = useGlobelApi(API_ENDPOINTS.ACCESS_USER_MODULE);
  const [permission, setPermission] = useState(null);
  const [error, setError] = useState(null);
  const check = async () => {
    try {
      const body = {
        userId,
        filters: [
          { key: "p.permission", operator: "equal", value1: "1", logical: "" },
          {
            key: "sm.sub_module_link",
            operator: "equal",
            value1: subModuleLink,
            logical: "",
          },
        ],
        limit: 1,
        offset: 0,
      };

      return new Promise((resolve, reject) => {
        AccessUser(body, {
          onSuccess: (data) => {
            const hasPermission = data?.result?.[0] ? true :false;
            setPermission(hasPermission);
            setError(null);
            resolve(hasPermission);
          },
          onError: (err) => {
            console.error("Error checking permission:", err);
            setPermission(false);
            setError(err);
            reject(err);
          },
        });
      });
    } catch (err) {
      setPermission(false);
      setError(err);
      throw err;
    }
  };

  useEffect(() => {
    if (userId && subModuleLink) {
      check();
    }
  }, [userId, subModuleLink]);

  return { check, permission, error };
};

export default useCheckPermission;