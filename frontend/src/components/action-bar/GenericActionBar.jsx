import React, { memo } from "react";
import CustomButton from "../button/CustomButton";

const GenericActionBar = ({ selectedIds, onActionClick, action, text, field_disable }) => {
  const isSingleSelected = selectedIds?.length === 1; // Single selection
  const isAnySelected = selectedIds?.length > 0; // Any selection (single or multiple)

  return (
    <>
      <div className="d-flex justify-content-end align-items-center ">
        <div className="dropdown ">
          <div
            aria-label="Click me"
            role="button"
            className="dropdown-toggle hide-arrow"
            data-bs-toggle="dropdown"
          >
            <CustomButton disable={field_disable} btntext={text ? text : "Action"} />{" "}
          </div>
          <div className="dropdown-menu min-w-fit ">
            {action?.map((value, idx) => {
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!isAnySelected}
                  aria-label="dropdown action option "
                  className="dropdown-item capitalize text-color px-3 py-1"
                  onClick={() => onActionClick(value)}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
export default memo(GenericActionBar);
