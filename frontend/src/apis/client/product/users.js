import { API_ENDPOINTS } from "../api-endpoints";
import { HttpClient } from "../http-client";
export const users = {
  GetAllUsers: (option) => {
    return HttpClient.post(API_ENDPOINTS.USERS, option);
  },
  GetUserCompany: (option) => {
    return HttpClient.post(API_ENDPOINTS.USER_TO_COMPANY, option);
  },
};
