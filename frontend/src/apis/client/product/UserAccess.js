import { API_ENDPOINTS } from "../api-endpoints";
import { HttpClient } from "../http-client";

export const userAcces = {
  GetAccessUser: (option) => {
    return HttpClient.post(API_ENDPOINTS.ACCESS_USER_MODULE, option);
  },
};
