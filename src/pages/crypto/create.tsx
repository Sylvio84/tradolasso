import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

const ASSET_TYPES = [
  { value: "stock", label: "Stock" },
  { value: "fund", label: "Fund" },
  { value: "bond", label: "Bond" },
  { value: "crypto", label: "Crypto" },
  { value: "commodity", label: "Commodity" },
  { value: "real_estate", label: "Real Estate" },
  { value: "forex", label: "Forex" },
  { value: "cash_account", label: "Cash Account" },
  { value: "index", label: "Index" },
];

export const CryptoCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" initialValues={{ type: "crypto" }}>
        <Form.Item
          label="Symbol"
          name="symbol"
          rules={[{ required: true, message: "Symbol is required" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Name" name="name">
          <Input />
        </Form.Item>
        <Form.Item label="ISIN" name="isin">
          <Input />
        </Form.Item>
        <Form.Item label="Type" name="type">
          <Select options={ASSET_TYPES} allowClear placeholder="Select type" />
        </Form.Item>
        <Form.Item label="Currency" name="currency">
          <Input />
        </Form.Item>
        <Form.Item label="Country Code" name="countryCode">
          <Input maxLength={2} placeholder="e.g. FR, US" />
        </Form.Item>
        <Form.Item label="Market Cap" name="marketcap">
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
