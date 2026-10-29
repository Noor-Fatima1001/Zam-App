import { Form, Input, Radio } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFromLocalStorage } from "../../config/crypto-file";
import withPermissionCheck from "../../config/withPermissionCheck";
import CustomButton from "../../components/button/CustomButton";
import { API_ENDPOINTS } from "../../apis/client/api-endpoints";
import { useGlobelApi } from "../../apis/useProduct/useCommon";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const AddUser = ({ setIsModalOpen }) => {
  const [form] = Form.useForm();

  const { mutate, isPending } = useGlobelApi(API_ENDPOINTS.CREATE_USER);
  const UserId = getFromLocalStorage("UserId");
  const navigate = useNavigate();


  const handleSubmit = (values) => {
    console.log("Form submitted:", values);

    const payload = {
      dataInsert: {
        first_name: values.first_name,
        last_name: values.last_name,
        user_name: values.user_name,
        password: values.password,
        email: values.email,
        gender: values.gender,
        comments: values.comments,
        created_by: UserId,
      },
    };

    mutate(payload, {
      onSuccess: (data) => {
        if (data.success) {
          toast.success(data?.result)
          setIsModalOpen(false);
          form.resetFields();
        } else {
          toast.error(data.result)
        }
      },
      onError: (error) => {
        console.error("Error:", error);
        toast.error("An error occurred while creating the user. Please try again.")
      },
    });
  };
  useEffect(() => {
  }, [navigate]);

  return (
    <>
      <div className="">
        <div className=" mx-auto">
          <div className="">
            <div className="">
              <Form
                className=""
                autocomplete="off"
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                  first_name: "",
                  last_name: "",
                  user_name: "",
                  password: "",
                  email: "",
                  comments: "",
                }}
              >
                <div className="">
                  <Form.Item
                    name="first_name"
                    label="First Name"
                    rules={[
                      { required: true, message: "First name is required" },
                    ]}
                  >
                    <Input placeholder="John Doe" />
                  </Form.Item>
                </div>

                <Form.Item
                  name="last_name"
                  label="Last Name"
                  rules={[{ required: true, message: "Last name is required" }]}
                >
                  <Input placeholder="John Doe" />
                </Form.Item>

                <Form.Item
                  name="user_name"
                  label="User Name"
                  rules={[{ required: true, message: "User name is required" }]}
                >
                  <Input placeholder="John Doe" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[{ required: true, message: "Password is required" }]}
                >
                  <Input.Password placeholder="Password" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Email is required" },
                    { type: "email", message: "Enter a valid email" },
                  ]}
                >
                  <Input placeholder="john.doe@example.com" />
                </Form.Item>

                <Form.Item
                  name="gender"
                  label="Gender"
                  rules={[{ required: true, message: "Gender is required" }]}
                >
                  <Radio.Group>
                    <Radio value="Male">Male</Radio>
                    <Radio value="Female">Female</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  name="comments"
                  label="Comments"
                  rules={[{ required: false }]}
                >
                  <Input.TextArea placeholder="Hi, Do you have a moment to talk Joe?" />
                </Form.Item>

                <div className="flex justify-content-end">
                  <CustomButton
                    btntext={"Save"}
                    type="submit"
                    isLoading={isPending}
                  />
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};


AddUser.propTypes ={
  setIsModalOpen:PropTypes.bool
}

export default withPermissionCheck(AddUser, "adduser");
