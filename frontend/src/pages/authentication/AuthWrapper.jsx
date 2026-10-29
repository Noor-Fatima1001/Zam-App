import React from "react";
import { Link } from "react-router-dom";
import "./page-auth.css";
export const AuthWrapper = ({ children }) => {
  const isHttps = window.location.protocol === "https:";

  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner">
          <div className="card">
            <div className="card-body p-3">
              <div className="app-brand justify-content-center">
                <Link
                  aria-label="Go to Home Page"
                  to={rootFolder + "/"}
                  className="app-brand-link gap-2"
                >
                  <span className="app-brand-logo demo">
                    <img
                      src={`${isHttps ? rootFolder : ""}/assets/img/sneat.svg`}
                      alt="sneat-logo"
                    />
                  </span>
                  <span className="app-brand-text demo text-body fw-bold">
                    ZAM
                  </span>
                </Link>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
