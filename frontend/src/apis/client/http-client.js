import Axios from "axios";
import queryString from "query-string";
import { isEmpty } from "lodash";
import { getFromLocalStorage } from "../../config/crypto-file";

const apiUrl = import.meta.env.VITE_API_URL;

const API_URL = apiUrl;
const subdomain = window.location.hostname.split('.')[0];
export const axios = Axios.create({
  baseURL: API_URL,
  // timeout: 5000000,
  headers: {
    "Content-Type": "application/json",

    "X-Tenant-Subdomain": subdomain,

    Accept: "application/json",

  },
});

axios.interceptors.request.use(
  async (config) => {
    // const token = sessionStorage.getItem("access-token");

    const token = getFromLocalStorage("authToken");

    if (!isEmpty(token)) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    // console.log("===config==", config);
    return config;
  },
  (error) => Promise.reject(error)
);

// Axios.interceptors.request.use((config) => {

//   let storedUserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDIsImlhdCI6MTY4NDg1NDM5MH0.ftI47r3MDWfmsvl_ggH3wLoFIgtHDuHDx6A4aLhzZKI'

//   config.headers = {
//     ...config.headers,
//     Authorization: `Bearer ${storedUserToken}`,
//   };
//   return config;
// });

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    // if (
    //   response?.status == 401
    // ) {
    //   // refreshToken()
    //   console.warn('Token expire Condition')
    // }
    return Promise.reject(error);
  }
);
export class HttpClient {
  static async get(url, params) {
    const query = queryString.stringify(params);
    const urlWithQuerryString = isEmpty(query) ? url : `${url}?${query}`;
    const response = await axios.get(urlWithQuerryString);
    return response.data;
  }

  static async post(url, data, options) {
    const response = await axios.post(url, data, options);
    return response.data;
  }

  static async put(url, data, options) {
    const response = await axios.put(url, data, options);
    return response.data;
  }
  static async patch(url, data) {
    const response = await axios.patch(url, data);
    return response.data;
  }

  static async delete(url) {
    const response = await axios.delete(url);
    return response.data;
  }

  static formatSearchParams(params) {
    return Object.entries(params)
      .filter(([, value]) => value)
      .map(([k, v]) =>
        ["type", "categories", "tags", "author", "manufacturer"].includes(k)
          ? `${k}.slug:${v}`
          : ["is_approved"].includes(k)
          ? formatBooleanSearchParam(k, v)
          : `${k}:${v}`
      )
      .join(";");
  }
}

function formatBooleanSearchParam(key, value) {
  return value ? `${key}:1` : `${key}:`;
}

// interface SearchParamOptions {
//   categories: string;
//   code: string;
//   type: string;
//   name: string;
//   shop_id: string;
//   is_approved: boolean;
//   tracking_number: string;
// }

export function getFormErrors(error) {
  if (Axios.isAxiosError(error)) {
    return error.response?.data.message;
  }
  return null;
}

export function getFieldErrors(error) {
  if (Axios.isAxiosError(error)) {
    return error.response?.data.errors;
  }
  return null;
}
