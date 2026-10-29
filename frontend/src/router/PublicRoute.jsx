import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getFromLocalStorage } from "../config/crypto-file";

const PublicRoute = () => {
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const location = useLocation();
  const pathname = location.pathname;
  const token = getFromLocalStorage("authToken");
  return token ? <Navigate to={rootFolder + "/dashboard"} /> : <Outlet />;
};

export default PublicRoute;
