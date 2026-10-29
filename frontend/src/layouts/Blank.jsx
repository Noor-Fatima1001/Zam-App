import React from "react";
import { Link } from "react-router-dom";

export const Blank = ({ children }) => {
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  return (
    <>
      <Link aria-label="Go to Home Page" to={rootFolder + "/"}>
        {children}
      </Link>
    </>
  );
};
