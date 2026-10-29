import { HttpClient } from "../http-client";
export const globelApi = {
  dataPost: (option, endpoint, token) => {
    const header = { Authorization: `Bearer ${token}` };
    return HttpClient.post(endpoint, option, { headers: header });
  },
  dataPostFormData: (option, endpoint) => {
    const fileHeader = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    return HttpClient.post(endpoint, option, { headers: fileHeader });
  },
};
