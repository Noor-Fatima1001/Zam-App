import { API_ENDPOINTS } from "../api-endpoints";
import { HttpClient } from "../http-client";
export const subModule = {
  AddSubModule: (option) => {
    return HttpClient.post(API_ENDPOINTS.CREATE_SUBMODULE, option);
  },
  UpdateSubModule: (option) => {
    return HttpClient.post(API_ENDPOINTS.SUB_SUBMODULE, option);
  },
  GetSubModule: (option) => {
    return HttpClient.post(API_ENDPOINTS.GET_SUBMODULE, option);
  },
};
