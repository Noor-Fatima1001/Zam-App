import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getFromLocalStorage } from "../../config/crypto-file";

function PrivateRoute({ children }) {
  const token = getFromLocalStorage("authToken");

  // Function to check if the token is expired
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000; // Get current time in seconds
      return decoded.exp < currentTime; // If the expiration time is less than the current time, it's expired
    } catch (error) {
      return true; // In case of an error (invalid token format)
    }
  };

  if (token && !isTokenExpired(token)) {
    console.log("Token is valid");
  } else {
    console.log("Token is invalid or expired");
    // localStorage.removeItem('authToken');
    // localStorage.removeItem('UserId');
    // localStorage.removeItem('userName');
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;
