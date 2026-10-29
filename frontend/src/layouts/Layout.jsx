
import { Component, useEffect, useState } from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar open by default

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1199) {
        setSidebarOpen(false); // Close sidebar on small screens
      } else if (width > 1199) {
        setSidebarOpen(true); // Open sidebar on screens larger than 1199.98px
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="layout-wrapper layout-content-navbar">
      <div className="layout-container">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          toggleSidebar={toggleSidebar}
        />

        <div
          className={`layout-page layout-page--responsive my-custom-class ${sidebarOpen ? 'padding-left-open' : 'padding-left-closed'}`}
        >
          <Navbar toggleSidebar={toggleSidebar} />
          <div className="content-wrapper">

            <div className=" flex-grow-1 ">
              {children}
            </div>
            <Footer />
          </div>
        </div>
        <div className="layout-overlay layout-menu-toggle"></div>
      </div>
    </div>
  );
};

Layout.propTypes ={
  children:Component
}

export default Layout;
