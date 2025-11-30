import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const WalletEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={"Name"}
          name={["name"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={"Broker Name"}
          name={["brokerName"]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
};
