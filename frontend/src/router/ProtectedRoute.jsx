import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getFromLocalStorage } from "../config/crypto-file";

const ProtectedRoute = () => {
  const token = getFromLocalStorage("authToken");
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const location = useLocation();
  const pathname = location.pathname;

  return token ? (
    <>
      {pathname === "/" ? <Navigate to={rootFolder} /> : null}
      <Outlet />
    </>
  ) : (
    <Navigate to={rootFolder + "/"} />
  );
};

export default ProtectedRoute;
