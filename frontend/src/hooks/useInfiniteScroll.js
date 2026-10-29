import { useEffect } from "react";

const useInfiniteScroll = ({
  selector,
  isLoading,
  hasMore,
  handleFetchData,
}) => {
  useEffect(() => {
    const tableBody = document.querySelector(selector);

    const handleScroll = () => {
      if (!tableBody || isLoading || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = tableBody;

      // Check if the user has scrolled to the bottom
      if (scrollTop + clientHeight >= scrollHeight) {
        handleFetchData();
      }
    };

    if (tableBody) {
      tableBody.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (tableBody) {
        tableBody.removeEventListener("scroll", handleScroll);
      }
    };
  }, [selector, isLoading, hasMore, handleFetchData]);
};

export default useInfiniteScroll;
