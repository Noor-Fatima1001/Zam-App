import { Menu, MenuButton, MenuItem, SubMenu } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/zoom.css";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../apis/client/api-endpoints";
import { useGlobelApi } from "../apis/useProduct/useCommon";
import { GrEmptyCircle } from "react-icons/gr";
import { getFromLocalStorage } from "../config/crypto-file";
import Skelton from "../components/Skelton";
import useDebounce from "../hooks/useDebounce";

export default function Sidebar({ isOpen, onClose, toggleSidebar }) {
  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.SIDEBAR);
  const location = useLocation();
  const pathname = location.pathname;
  const UserId = getFromLocalStorage("UserId");
  const isHttps = window.location.protocol === "https:";
  const navigate = useNavigate();
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const [menuData, setMenuData] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedInputValue = useDebounce(search, 500);

  const handleFetch = (filter) => {
    const body = {
      userId: UserId,
      filters: [
        { key: "sm.side_bar", operator: "equal", value1: "1", logical: "" },
        { key: "p.permission", operator: "equal", value1: "1", logical: "" },
        ...(filter
          ? [
            {
              key: "m.module_text",
              operator: "contains",
              value1: filter,
              logical: "",
            },
          ]
          : []),
      ],
      limit: 0,
      offset: 10,
    };
    mutate(body, {
      onSuccess: (res) => {
        const withFilterAllData = res.result.filter(
          (value) =>
            value.header !== "Main Head" &&
            value.header !== "Sub Head" &&
            value.header !== "Journal Voucher Data" &&
            value.header !== "Fiscal Year"
        );

        const withFilterData = res.result.filter(
          (value) =>
            value.header === "Main Head" ||
            value.header === "Sub Head" ||
            value.header === "Journal Voucher Data" ||
            value.header === "Fiscal Year"
        );

        setMenuData(withFilterAllData || []);
        setFilterData(withFilterData || []);
      },
      onError: (err) => {
        console.log(err);
      },
    });
  };

  useEffect(() => {
    if (debouncedInputValue) {
      handleFetch(debouncedInputValue);
    } else {
      handleFetch();
    }
  }, [debouncedInputValue]);

  const ActiveClass = () =>
    "p- text-start px-2 text-customBlue color-custom  font-semibold transition duration-500 ease-in-out custom-active ";
  const UnActiveClass = () =>
    "p- text-start px-2 transition duration-500 ease-in-out text-black hover:!text-customBlue font-normal";

  const isMenuActive = (menuLink, submenuLinks = []) => {
    const fullMenuLink = rootFolder + menuLink;
    if (pathname === fullMenuLink) {
      return true;
    }
    return submenuLinks.some((sub) => pathname === rootFolder + sub.link);
  };

  const handleNavigation = (link) => {
    if (link === "/journal-ledger") {
      localStorage.removeItem("trilaBalanceData");
    }
    if (link === "/recipe-list") {
      sessionStorage.removeItem("recipeCTD");
    }
    if (link === "/purchase-report") {
      sessionStorage.removeItem("purchase-report");
    }
    navigate(rootFolder + link);
    // Close sidebar on small screens (width < 768px)
    if (window.innerWidth < 1199) {
      onClose();
    }
  };

  return (
    <>
      <aside
        id="layout-menu"
        className={`layout-menu  menu-vertical menu ${isOpen ? "open menu-open" : "menu-closed"}`}
      >
        <div className="app-brand demo relative">
          {isOpen && (
            <Link
              aria-label="Navigate to sneat homepage"
              to={rootFolder + "/"}
              className="app-brand-link"
            >
              <span className="app-brand-logo demo">
                <img
                  src={`${isHttps ? rootFolder : ""}/assets/img/sneat.svg`}
                  alt="sneat-logo"
                  aria-label="Sneat logo image"
                />
              </span>
              <span className=" demo menu-text fw-bold ms-2"  >
                App
              </span>
            </Link>
          )}

          <span
            className="absolute top-4 -right-0 bg-customBlue text-white rounded-full"
            onClick={(e) => {
              e.preventDefault();
              toggleSidebar();
            }}
          >
            <i
              className={`bx ${isOpen ? "bx-chevron-left" : "bx-chevron-right"} bx-sm align-middle`}
            ></i>
          </span>
        </div>
        <div className="menu-inner-shadow"></div>
        <ul
          className="menu-inner py-1 space-y-2 pe-0 overflow-y-auto custom"
        >
          {isPending
            ? Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="w-10/12 mx-auto">
                <Skelton type="text" istextRounded="rounded-md" height="h-5" />
              </div>
            ))
            : menuData.map((section, sectionIdx) => (
              <div key={sectionIdx} className="w-full mt-1">
                {section.items.map((item, itemIdx) => {
                  const isActive = isMenuActive(item.link, item.submenu);

                  return item.submenu ? (
                    <li key={itemIdx} className="" title={item?.text}>
                      <Menu
                        menuButton={
                          <MenuButton
                            // style={{ backgroundColor: isActive ? "rgba(0, 0, 0, 0.5)" : "" }}
                            className={`flex gap-2 mx-auto text-sm text-color rounded-radiusRegular py-1  ${isActive ? ActiveClass() : UnActiveClass()
                              }`}
                          >
                            {item?.icon && (
                              <span  >
                                <i className={item?.icon}></i>
                              </span>
                            )}
                            {isOpen && (
                              <span  className="truncate text-ellipsis overflow-hidden whitespace-nowrap w-[105px]">
                                {item?.text}
                              </span>
                            )}
                          </MenuButton>
                        }
                        menuClassName={"z-[99999999]"}
                        transition
                        direction="right"
                        align="end"
                        position="anchor"
                        arrow
                        gap={10}
                        shift={10}
                        portal
                      >
                        {item?.submenu.map((subItem, subIdx) => (
                          <MenuItem key={subIdx} className="p-0">
                            <div
                              onClick={() => handleNavigation(subItem?.link)}
                              className={`flex gap-1 p-2 ps-3 text-xs w-full items-center ${pathname === subItem?.link
                                ? "text-customBlue"
                                : "text-color "
                                }`}
                            >
                              <GrEmptyCircle size={9} />
                              {subItem?.text}
                            </div>
                          </MenuItem>
                        ))}
                        {item.text === "Accounting" &&
                          filterData?.map((subItem, subIdx) => (
                            <SubMenu
                              className={"text-gray-500 text-xs"}
                              label={subItem?.items?.[0]?.text}
                              key={subIdx}
                            >
                              {subItem?.items?.[0]?.submenu?.map(
                                (subItem, subIdx) => (
                                  <MenuItem key={subIdx} className="p-0">
                                    <div
                                      className={`flex gap-1 p-2 ps-3 text-xs w-full items-center ${pathname === subItem?.link
                                        ? "text-customBlue100"
                                        : "text-gray-500"
                                        }`}
                                      onClick={() => handleNavigation(subItem?.link)}
                                    >
                                      <GrEmptyCircle size={9} />
                                      {subItem?.text}
                                    </div>
                                  </MenuItem>
                                )
                              )}
                            </SubMenu>
                          ))}
                      </Menu>
                    </li>
                  ) : (
                    <li key={itemIdx} className="text-center">
                      <Link
                        to={rootFolder + item?.link}
                        className={`${isActive ? ActiveClass() : UnActiveClass()}`}
                        onClick={() => {
                          if (window.innerWidth < 1199) onClose();
                        }}
                      >
                        {item?.text}
                      </Link>
                    </li>
                  );
                })}
              </div>
            ))}
        </ul>
        <div className="p-2" style={{ display: isOpen ? "block" : "none" }}>
          <input
            type="text"
            placeholder="Search module"
            className="focus:outline-none border rounded-md w-full p-2 h-7 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </aside>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose}></div>}
    </>
  );
}