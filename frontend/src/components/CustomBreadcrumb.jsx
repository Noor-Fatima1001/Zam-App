import React from 'react';
import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';

const CustomBreadcrumb = ({ items }) => {
    const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  return (
    <Breadcrumb>
      {items.map((item, index) => (
        <Breadcrumb.Item key={index}>
          {item?.link ? (
            <Link to={`${rootFolder}/${item?.link}`}>{item?.title}</Link>
          ) : (
            item?.title
          )}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

export default CustomBreadcrumb;
