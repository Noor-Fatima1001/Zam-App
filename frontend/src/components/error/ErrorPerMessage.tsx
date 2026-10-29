import React from "react";

const ErrorPerMessage = ({ msg }) => {
  return (
    <div className="text-red-500 text-lg font-medium text-center">
      {msg ? msg : " Error: You do not have permission to access this module."}
    </div>
  );
};

export default ErrorPerMessage;
