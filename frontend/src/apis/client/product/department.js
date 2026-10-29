import { API_ENDPOINTS } from "../api-endpoints";
import { HttpClient } from "../http-client";
export const department = {
  AddDepartment: (option) => {
    return HttpClient.post(API_ENDPOINTS.CREATE_DEPARTMENT, option);
  },
  UpdateDepartment: (option) => {
    return HttpClient.post(API_ENDPOINTS.UPDATE_DEPARTMENT, option);
  },
  GetDepartment: (option) => {
    return HttpClient.post(API_ENDPOINTS.GET_DEPARTMENT, option);
  },
  GetCom_Department: (option) => {
    return HttpClient.post(API_ENDPOINTS.COM_TO_DEPARTMENT, option);
  },
};
