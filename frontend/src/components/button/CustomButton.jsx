import React, { memo } from "react";

const CustomButton = ({
  type = "button",
  // rounded = "rounded-2",
  border = "border-0",
  textColor = "text-white",
  padding = "p-1 px-2",
  textTransform = "text-capitalize",
  addclass = "",
  handleClick,
  icon,
  disable,
  btntext,
  isLoading = false,
  bg = isLoading ? "bg-gray-300" : "!bg-customBlue",
}) => {
  return (
    <button
      type={type}
      className={`flex justify-center text-btnsize font-regularweight items-center rounded-radiusRegular min-w-16  ${border} ${bg} ${textColor} ${padding} ${textTransform} ${addclass}`}
      onClick={handleClick}
      disabled={isLoading || disable}
    >
      {isLoading ? (
        <div className="spinner-border text-white w-4 h-4" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      ) : (
        <>
          {btntext}
          {icon}
        </>
      )}
    </button>
  );
};

export default memo(CustomButton);
