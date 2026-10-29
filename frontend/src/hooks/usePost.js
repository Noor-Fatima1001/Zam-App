import axios from "axios";
import { useState } from "react";
import { getFromLocalStorage } from "../config/crypto-file";

const usePost = () => {
  const baseUrl = import.meta.env.VITE_API_URL;
  const token = getFromLocalStorage("authToken");
  const subdomain = window.location.hostname.split('.')[0];
  const defaultHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-Tenant-Subdomain": subdomain,
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const request = async ({ endpoint, method = "POST", data = null }) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const url = `${baseUrl}/${endpoint}`;
      const headers = defaultHeaders;

      const res = await axios({
        method,
        url,
        headers,
        ...(data && { data }),
      });
      setResponse(res.data);
    } catch (err) {
      setError(err.response ? err.response.data : err.message);
    } finally {
      setLoading(false);
    }
  };

  const post = async (endpoint, data) => {
    return request({ endpoint, method: "POST", data });
  };

  const get = async (endpoint) => {
    return request({ endpoint, method: "GET" });
  };

  return { post, get, loading, error, response, setError };
};

export default usePost;
