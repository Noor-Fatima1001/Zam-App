import React from "react";
import { Route, Routes } from "react-router-dom";
import PrivateRoute from "../components/privateroutes/PrivateRoutes.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import PublicRoute from "./PublicRoute.jsx";
// Layout

import { LoginPage } from "../pages/authentication/LoginPage";
import { routeComponentMapping } from "../utils/routeComponentMapping.jsx";
import NotFound from "../pages/NotFound.jsx";

const AppRoutes = () => {
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path={rootFolder + "/"} element={<LoginPage />} />
        <Route path={"*"} element={<NotFound />} />
      </Route>
      <Route exact path="/" element={<ProtectedRoute />}>
        {Object.keys(routeComponentMapping).map((path) => {
          const { component, name } = routeComponentMapping[path];
          return (
            <Route
              key={path}
              path={path}
              element={
                <PrivateRoute>{React.createElement(component)}</PrivateRoute>
              }
            />
          );
        })}
      </Route>
    </Routes>
  );
};
export default AppRoutes;
