import React, { useState } from "react";
import DebouncedInput from "../form-elements/DebouncedInput";

const UserFilters = ({ onFilterUpdate, onReset }) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    user_name: "",
    email: "",
    status: "",
    first_name_filter: "equal",
    last_name_filter: "equal",
    user_name_filter: "equal",
    email_filter: "equal",
    status_filter: "equal",
    logical: "and", // Logical operator for all filters (can be 'and' or 'or')
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const filters = [];

    // Add filter conditions to the filters array only if there's a value in the field
    if (formData.first_name) {
      filters.push({
        key: "first_name",
        operator: formData.first_name_filter,
        value1: formData.first_name,
        logical: formData.logical,
      });
    }

    if (formData.last_name) {
      filters.push({
        key: "last_name",
        operator: formData.last_name_filter,
        value1: formData.last_name,
        logical: formData.logical,
      });
    }

    if (formData.user_name) {
      filters.push({
        key: "user_name",
        operator: formData.user_name_filter,
        value1: formData.user_name,
        logical: formData.logical,
      });
    }

    if (formData.email) {
      filters.push({
        key: "email",
        operator: formData.email_filter,
        value1: formData.email,
        logical: formData.logical,
      });
    }

    if (formData.status) {
      filters.push({
        key: "status",
        operator: formData.status_filter,
        value1: formData.status,
        logical: formData.logical,
      });
    }

    // Output the filters in the specified format
    console.log(JSON.stringify(filters, null, 2));
    // Pass filters to parent component
    onFilterUpdate(filters);
  };

  const handleReset = () => {
    setFormData({
      first_name: "",
      last_name: "",
      user_name: "",
      email: "",
      status: "",
      first_name_filter: "equal",
      last_name_filter: "equal",
      user_name_filter: "equal",
      email_filter: "equal",
      status_filter: "equal",
      logical: "and",
    });
    if (onReset) {
      onReset(); // Notify parent
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <a
          className="btn btn-primary mb-2"
          data-bs-toggle="collapse"
          href="#collapseExample"
          role="button"
          aria-expanded="false"
          aria-controls="collapseExample"
        >
          Filters
        </a>

        <div className="collapse" id="collapseExample">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* First Name */}
              <div className="col-md-6 mb-3">
                <label htmlFor="first_name" className="form-label">
                  First Name
                </label>
                <div className="input-group">
                  <div className="col-md-2">
                    <select
                      className="form-select custom-select"
                      id="first_name_filter"
                      name="first_name_filter"
                      value={formData.first_name_filter}
                      onChange={handleChange}
                    >
                      <option value="equal">Equal</option>
                      <option value="contains">Contains</option>
                      <option value="start_with">Start with</option>
                      <option value="end_with">End with</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <DebouncedInput
                      fieldName="first_name"
                      apiEndpoint={`${apiUrl}/getUserFilters`}
                      resultColumn="first_name"
                      delay={500}
                      value={formData.first_name} // Pass current value
                      onValueChange={
                        (newValue) =>
                          setFormData((prevData) => ({
                            ...prevData,
                            first_name: newValue,
                          })) // Update formData
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Last Name */}
              <div className="col-md-6 mb-3">
                <label htmlFor="last_name" className="form-label">
                  Last Name
                </label>
                <div className="input-group">
                  <div className="col-md-2">
                    <select
                      className="form-select custom-select"
                      id="last_name_filter"
                      name="last_name_filter"
                      value={formData.last_name_filter}
                      onChange={handleChange}
                    >
                      <option value="equal">Equal</option>
                      <option value="contains">Contains</option>
                      <option value="start_with">Start with</option>
                      <option value="end_with">End with</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              {/* User Name */}
              <div className="col-md-6 mb-3">
                <label htmlFor="user_name" className="form-label">
                  User Name
                </label>
                <div className="input-group">
                  <div className="col-md-2">
                    <select
                      className="form-select custom-select"
                      id="user_name_filter"
                      name="user_name_filter"
                      value={formData.user_name_filter}
                      onChange={handleChange}
                    >
                      <option value="equal">Equal</option>
                      <option value="contains">Contains</option>
                      <option value="start_with">Start with</option>
                      <option value="end_with">End with</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <DebouncedInput
                      fieldName="user_name"
                      apiEndpoint={`${apiUrl}/getUserFilters`}
                      resultColumn="user_name"
                      delay={500}
                      value={formData.user_name} // Pass current value
                      onValueChange={
                        (newValue) =>
                          setFormData((prevData) => ({
                            ...prevData,
                            user_name: newValue,
                          })) // Update formData
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="col-md-6 mb-3">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <div className="input-group">
                  <div className="col-md-2">
                    <select
                      className="form-select custom-select"
                      id="email_filter"
                      name="email_filter"
                      value={formData.email_filter}
                      onChange={handleChange}
                    >
                      <option value="equal">Equal</option>
                      <option value="contains">Contains</option>
                      <option value="start_with">Start with</option>
                      <option value="end_with">End with</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              {/* Status */}
              <div className="col-md-6 mb-3">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <div className="input-group">
                  <div className="col-md-2">
                    <select
                      className="form-select custom-select"
                      id="status_filter"
                      name="status_filter"
                      value={formData.status_filter}
                      onChange={handleChange}
                    >
                      <option value="equal">Equal</option>
                      <option value="contains">Contains</option>
                      <option value="start_with">Start with</option>
                      <option value="end_with">End with</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      placeholder="Enter status"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary me-2">
              Apply Filters
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReset}
            >
              Reset Filters
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;
