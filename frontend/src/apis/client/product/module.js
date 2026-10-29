import { API_ENDPOINTS } from "../api-endpoints";
import { HttpClient } from "../http-client";
export const module = {
  AddModule: (option) => {
    return HttpClient.post(API_ENDPOINTS.CREATE_MODULE, option);
  },
  UpdateModule: (option) => {
    return HttpClient.post(API_ENDPOINTS.UPDATE_MODULE, option);
  },
  GetModule: (option) => {
    return HttpClient.post(API_ENDPOINTS.GET_MODULE, option);
  },
};
