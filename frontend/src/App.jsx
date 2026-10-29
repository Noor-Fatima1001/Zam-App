import { useLocation, useNavigate } from "react-router-dom";
import "./App.scss";
import Layout from "./layouts/Layout";
import TabLayout from "./layouts/TabLayout";
import { LoginPage } from "./pages/authentication/LoginPage";
import { getFromLocalStorage } from "./config/crypto-file";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import { ToastContainer } from "react-toastify";

function App() {
  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";
  const navigate = useNavigate();
  console.log(location.pathname);
  const token = getFromLocalStorage("authToken");
  const [tokenExpired, setTokenExpired] = useState(false);
  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token);
      console.log("Decoded:", decoded);
      const expiryTime = decoded.exp * 1000;
      // :white_tick: Manual override for testing (5.5 seconds)
      // const expiryTime = Date.now() + 6500;
      const timeLeft = expiryTime - Date.now();
      if (timeLeft > 0) {
        const minutesLeft = Math.floor(timeLeft / (1000 * 60));
        console.log(
          `:hourglass_flowing_sand: Token expires in ${minutesLeft} minute(s).`
        );
        let popupShown = false;
        const interval = setInterval(() => {
          const remaining = expiryTime - Date.now();
          console.log("remaining", 5 * 60 * 1000);
          // :warning: Show popup only once when <= 5 minutes
          if (remaining <= 5 * 60 * 1000 && !popupShown) {
            popupShown = true;
            Swal.fire({
              icon: "warning",
              text: "Your session is about to expire. Please re-login else you will be rerouted to login screen in 5 minutes. Thanks!",
              confirmButtonText: "Login",
              cancelButtonText: "Cancel",
              showCancelButton: true,
            }).then((response) => {
              if (response.isConfirmed) {
                setTokenExpired(true);
                localStorage.clear();
                navigate(`${rootFolder}/login`);
              }
            });
          }
          // :x: Token expired
          if (remaining <= 0) {
            clearInterval(interval);
            console.log(":x: Token has expired.");
            localStorage.clear();
            navigate(`${rootFolder}/login`);
            setTokenExpired(true);
          }
        }, 3000);
        return () => clearInterval(interval); // Cleanup on unmount
      } else {
        console.log(":x: Token has expired.");
        navigate(`${rootFolder}/login`);
        localStorage.clear();
        setTokenExpired(true);
      }
    }
  }, [token]);

  return token ? (
    <>
      <Layout>
        <TabLayout />
        <ToastContainer
          className="toast-text"
        />
      </Layout>
    </>
  ) : (
    <LoginPage />
  );
}

export default App;
