import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

export const WalletCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  const { selectProps: typeSelectProps } = useSelect({
    resource: "wallet_types",
    optionLabel: "name",
    optionValue: "value",
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
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
          label={"Type"}
          name={["type"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select {...typeSelectProps} />
        </Form.Item>
        <Form.Item
          label={"Broker Name"}
          name={["brokerName"]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
