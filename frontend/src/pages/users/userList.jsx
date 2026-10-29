import React, { useEffect, useRef, useState } from "react";
import UserFilters from "../../components/filters/UserFilters";
import { getFromLocalStorage } from "../../config/crypto-file";

export const UserList = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [users, setUsers] = useState([]); // State to store user data
  const [limit, setLimit] = useState(10); // Number of records per fetch
  const [offset, setOffset] = useState(0); // Offset for pagination
  const [totalRecords, setTotalRecords] = useState(0); // Total records available
  const [isLoading, setIsLoading] = useState(false); // Prevent redundant calls
  const searchParamsRef = useRef([]); // Store filters persistently

  const token = getFromLocalStorage("authToken");

  const fetchUserFilters = async ({
    filters = [],
    newLimit = limit,
    newOffset = offset,
    isScroll = false,
  }) => {
    if (isLoading || (isScroll && users.length >= totalRecords)) return; // Prevent multiple calls or over-fetching
    setIsLoading(true);

    const payload = {
      filters: filters.length > 0 ? filters : null, // Send `null` for unfiltered requests
      limit: newLimit,
      offset: newOffset,
      orderby: "record_id DESC",
    };

    console.log("Fetching with payload:", payload);

    try {
      const res = await fetch(`${apiUrl}/getUserFilters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        if (isScroll) {
          setUsers((prev) => [...prev, ...data.result]); // Append on scroll
        } else {
          setUsers(data.result); // Replace on new filters or reset
        }

        setTotalRecords(data.result[0]?.totalRecords || 0); // Update total records
      } else {
        alert(`Error: ${data.result}`);
      }
    } catch (error) {
      console.error("Error fetching users:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle infinite scroll
  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;

    // Check if user scrolled to the bottom
    if (
      scrollHeight - scrollTop <= clientHeight + 1 &&
      users.length < totalRecords
    ) {
      console.log("Reached bottom. Loading more...");
      const newOffset = offset + limit;
      setOffset(newOffset);
      fetchUserFilters({
        filters: searchParamsRef.current,
        newLimit: limit,
        newOffset,
        isScroll: true,
      });
    }
  };

  // Handle filter updates
  const handleFilterUpdate = (filters) => {
    console.log("Updated filters:", filters);
    searchParamsRef.current = filters; // Update persistent filters
    setOffset(0); // Reset offset for new data
    setUsers([]); // Clear the existing user list
    fetchUserFilters({
      filters,
      newLimit: limit,
      newOffset: 0,
    });
  };

  const handleFilterReset = () => {
    console.log("Reset filters triggered"); // Debugging log
    searchParamsRef.current = [];
    setOffset(0);
    setUsers([]);
    fetchUserFilters({
      filters: [],
      newLimit: limit,
      newOffset: 0,
    });
  };

  // Fetch initial data on mount
  useEffect(() => {
    fetchUserFilters({ filters: searchParamsRef.current });
  }, []);

  return (
    <>
      <h5>User List</h5>
      <UserFilters
        onFilterUpdate={handleFilterUpdate}
        onReset={handleFilterReset} // Connect reset handler
      />
      <div
        className="table-responsive text-nowrap"
        style={{ height: "300px", overflowY: "scroll" }}
        onScroll={handleScroll}
      >
        <table className="table table-striped table-sm">
          <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
            <tr>
              <th style={{ backgroundColor: "#696cff", color: "#fff" }}>ID</th>
              <th style={{ backgroundColor: "#696cff", color: "#fff" }}>
                First Name
              </th>
              <th style={{ backgroundColor: "#696cff", color: "#fff" }}>
                Last Name
              </th>
              <th style={{ backgroundColor: "#696cff", color: "#fff" }}>
                Email
              </th>
              <th style={{ backgroundColor: "#696cff", color: "#fff" }}>
                Status
              </th>
              <th style={{ backgroundColor: "#696cff", color: "#fff" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="table-border-bottom-0">
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.first_name}</td>
                <td>{user.last_name}</td>
                <td>{user.email}</td>
                <td>
                  <span className="badge bg-label-primary me-1">
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="dropdown">
                    <button
                      aria-label="Click me"
                      type="button"
                      className="btn p-0 dropdown-toggle hide-arrow"
                      data-bs-toggle="dropdown"
                    >
                      <i className="bx bx-dots-vertical-rounded"></i>
                    </button>
                    <div className="dropdown-menu">
                      <a
                        aria-label="dropdown action option"
                        className="dropdown-item"
                        href="#"
                      >
                        <i className="bx bx-edit-alt me-1"></i> Edit
                      </a>
                      <a
                        aria-label="dropdown action option"
                        className="dropdown-item"
                        href="#"
                      >
                        <i className="bx bx-trash me-1"></i> Delete
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
