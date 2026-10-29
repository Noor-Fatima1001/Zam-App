import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./page-auth.css";
import { AuthWrapper } from "./AuthWrapper";
import axios from "axios";

import { Form, Input, Button, Radio } from "antd";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import ResetPassword from "./ResetPassword";
import {
  
  saveToLocalStorage,
} from "../../config/crypto-file";
import CustomButton from "../../components/button/CustomButton";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";


export const LoginPage = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

    const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.LOGIN);

  const rootFolder = import.meta.env.VITE_ROOT_FOLDER || "";

  const [form] = Form.useForm();
  const [isReset, setIsReset] = useState(false);
  const [loginData, setLoginData] = useState();

  const [formData, setFormData] = useState({
    password: "",
    username: "",
    rememberMe: false,
  });

  console.log({ apiUrl });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // const handleSubmit = (values) => {
  //   // Handle form submission logic here
  //   console.log("Form submitted:", values);

  //   fetch(`${apiUrl}/login`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",

  //       "X-Tenant-Subdomain": subdomain,

  //     },
  //     body: JSON.stringify({
  //       username: values.user_name,
  //       password: values.password,
  //     }),
  //   })
  //     .then((response) => response.json())
  //     .then((data) => {
  //       console.log(data);
  //       if (data.success) {
  //         if (data?.userFirstLogin || !data?.userFirstLogin == null) {
  //           Swal.fire({
  //             icon: "success",
  //             title: "success",
  //             text: data.result,
  //           });
  //           saveToLocalStorage("authToken", data.token);
  //           saveToLocalStorage("UserId", data.userId);
  //           saveToLocalStorage(
  //             "userName",
  //             data.userFirstName + " " + data.userLastName
  //           );

  //           navigate(`${rootFolder}/dashboard`, { replace: true });
  //         } else {
  //           setLoginData(data);
  //           setIsReset(true);
  //           setFormData({
  //             password: "",
  //             username: "",
  //             rememberMe: false,
  //           });
  //         }
  //       } else {
  //         console.log("err", data);
  //         Swal.fire({
  //           icon: "error",
  //           title: "Error",
  //           text: data.result,
  //         });
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error);
  //     });
  // };


const handleSubmit = (values) => {
  console.log("Form submitted:", values);

  mutate(
    {
      username: values.user_name,
      password: values.password,
    },
    {
      onSuccess: (data) => {
        console.log(data);
        if (data.success) {
          if (data?.userFirstLogin || data?.userFirstLogin == null) {
            toast.success(data.result)
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: data.result,
            // });
            saveToLocalStorage("authToken", data.token);
            saveToLocalStorage("UserId", data.userId);
            saveToLocalStorage(
              "userName",
              data.userFirstName + " " + data.userLastName
            );

            navigate(`${rootFolder}/dashboard`, { replace: true });
          } else {
            setLoginData(data);
            setIsReset(true);
            setFormData({
              password: "",
              username: "",
              rememberMe: false,
            });
          }
        } else {
          toast.error(data.result)
          // Swal.fire({
          //   icon: "error",
          //   title: "Error",
          //   text: data.result,
          // });
        }
      },
      onError: (error) => {
        console.error("Error:", error);
        toast.error("An error occurred during login. Please try again.")
        // Swal.fire({
        //   icon: "error",
        //   title: "Error",
        //   text: "An error occurred during login. Please try again.",
        // });
      },
    }
  );
};
  return (
    <>
      {!isReset ? (
        <AuthWrapper>
          <h1 className="mb-2 text-color  text-center font-headingweight">Welcome to the application 👋</h1>
          <p className="mb-2 font-regularweight text-color">
            Please sign-in to your account and start the adventure
          </p >
          <p className="text-color font-regularweight">
            {apiUrl}

          </p>
          <Form
            autocomplete="off"
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              user_name: "",
              password: "",
            }}
          >
            <Form.Item
              name="user_name"
              label="User Name"
              rules={[{ required: true, message: "User name is required" }]}
            >
              <Input placeholder="Enter User Name" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Password is required" }]}
            >
              <Input placeholder="******" type="password" />
            </Form.Item>
            {/* <Button
              type="primary"
              htmlType="submit"
              className="btn btn-primary d-grid w-100"
            >
              Sign In
            </Button> */}
            <CustomButton
              addclass="w-full"
              btntext={"Sign In"}
              type="submit"
              isLoading={isPending}
            />
          </Form>
        </AuthWrapper>
      ) : (
        <ResetPassword setIsReset={setIsReset} loginData={loginData} />
      )}
    </>
  );
};
