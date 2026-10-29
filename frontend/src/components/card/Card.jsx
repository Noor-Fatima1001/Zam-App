import React from "react";

const Card = ({ title, description, classMain, list, handleAction }) => {
  return (
    <div
      className={`bg-white shadow-lg rounded-radiusRegular p-3 border border-gray-200 max-w-sm ${classMain}`}
    >
      <h1 className="text-sm font-semibold text-gray-800 mb-2">{title}</h1>
      {description && <p className="text-gray-600 text-sm">{description}</p>}
      <ul>
        {list.map((item, index) => (
          <li
            key={index}
            className="cursor-pointer my-2 text-customBlue hover:underline"
            onClick={() => handleAction(item)}
          >
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Card;
