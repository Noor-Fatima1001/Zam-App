import { API_ENDPOINTS } from "../api-endpoints";
import { HttpClient } from "../http-client";
export const company = {
  GetCompany: (option) => {
    return HttpClient.post(API_ENDPOINTS.GET_COMPANY, option);
  },
  UpdateCompany: (option) => {
    return HttpClient.post(API_ENDPOINTS.UPDATE_COMPANY, option);
  },
};
