import React from "react";

const Skelton = ({
  type = "text",
  width = "w-full",
  height = "h-2.5",
  animation = "animate-pulse",
  istextRounded = "rounded-lg",
}) => {
  const isType = type;

  return (
    <div role="status" className={`space-y-2.5 ${animation} max-w-lg w-full`}>
      <div className="flex items-center w-full">
        {/* Conditionally render circle or text skeletons based on the type prop */}
        {isType === "circle" ? (
          <div
            className={`rounded-full bg-slate-300 dark:bg-gray-700 ${width} ${height}`}
          />
        ) : (
          <>
            <div
              className={`bg-slate-300 dark:bg-gray-700 ${istextRounded} ${width} ${height}`}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(Skelton);
