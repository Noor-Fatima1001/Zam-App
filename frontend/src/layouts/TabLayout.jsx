import { useEffect, useRef } from 'react';
import { MdCancel } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import { addTab, removeTab, setActiveTab } from '../store/tabSlice';
import { routeComponentMapping } from '../utils/routeComponentMapping';
import ErrorBoundary from '../utils/ErrorBoundary';

const TabLayout = () => {
  const { tabs, activeTabId } = useSelector((state) => state.tabs);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || '';
  const tabsRef = useRef({});

  useEffect(() => {
    dispatch(
      addTab({
        id: `${rootFolder}/dashboard`,
        title: 'Dashboard',
      })
    );
  }, [dispatch, rootFolder]);

  useEffect(() => {
    const currentPath = location.pathname;
    const matchedRoute = Object.keys(routeComponentMapping).find(
      (path) => path === currentPath
    );
    if (matchedRoute) {
      dispatch(
        addTab({
          id: currentPath,
          title: routeComponentMapping[matchedRoute].name,
          initialState: { someKey: 'somevalue' },
        })
      );
    }
  }, [location, dispatch]);

  const handleTabClick = (id) => {
    dispatch(setActiveTab(id));
    navigate(id);
  };

  const handleRemoveTab = (e, id) => {
    e.stopPropagation();
    dispatch(removeTab(id));
    if (id === activeTabId) {
      const tabIndex = tabs.findIndex((tab) => tab.id === id);
      if (tabs.length > 0) {
        const newActiveTab = tabs[Math.max(0, tabIndex - 1)];
        if (newActiveTab) {
          navigate(newActiveTab.id);
        }
      }
    }
  };

  useEffect(() => {
    if (activeTabId && tabsRef.current[activeTabId]) {
      tabsRef.current[activeTabId].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTabId]);

  return (
    <div className="px-3">
      <div className="bg-white shadow">
        <div className="border-b flex overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              ref={(el) => (tabsRef.current[tab.id] = el)}
              onClick={() => handleTabClick(tab.id)}
              style={{
                cursor: 'pointer',
                backgroundColor: activeTabId === tab.id ? '#F5F5F9' : '',
              }}
              className={`flex items-center px-2 py-1 text-color cursor-pointer transition duration-300 ease-in-out ${
                activeTabId === tab.id ? '' : 'hover:bg-gray-50 text-color font-regularweight'
              }`}
            >
              <span className="truncate" style={{ fontSize: '14px' }}>
                {activeTabId === tab.id ? tab.title : tab?.title?.slice(0, 10) + '...'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTab(e, tab.id);
                }}
                className={`ml-2 flex items-center justify-center w-5 h-5 rounded-sm ${
                  activeTabId === tab.id ? 'text-customBlue' : 'text-color'
                } hover:text-gray-600 focus:outline-none`}
              >
                <MdCancel className="w-4 h-4" size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div
        className="p-3 bg-menu-theme mt-2 shadow"
        style={{ height: '90%', overflowY: 'auto' }}
      >
        {tabs.map((tab) => {
          const Component = routeComponentMapping[tab?.id]?.component || DashboardPage;
          return (
            <div
              key={tab.id}
              style={{ display: activeTabId === tab.id ? 'block' : 'none' }}
            >
              <ErrorBoundary>
                <Component />
              </ErrorBoundary>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TabLayout;