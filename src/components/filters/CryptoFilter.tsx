import { Button, Form, InputNumber, Select, Space } from "antd";
import { ClearOutlined, SearchOutlined } from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { FilterContainer } from "./FilterContainer";
import type { FilterComponentProps } from "../layout/FilterSider";

// Range filter field configuration
interface RangeFilterConfig {
  name: string;
  label: string;
  min?: number;
  max?: number;
}

const RANGE_FILTERS: RangeFilterConfig[] = [
  { name: "marketcap", label: "Market Cap (M€)" },
  { name: "adx", label: "ADX" },
  { name: "atrPercent", label: "Volatility" },
];

export const CryptoFilter: React.FC<FilterComponentProps> = ({
  searchFormProps,
  onReset,
}) => {
  // Load watchlists for crypto
  const { result: watchlistsData } = useList({
    resource: "watchlists",
    filters: [{ field: "assetType", operator: "eq", value: "crypto" }],
    pagination: { mode: "off" },
  });

  const watchlistOptions =
    watchlistsData?.data?.map((w) => ({
      value: w.id,
      label: w.name,
    })) || [];

  return (
    <FilterContainer
      extra={
        <Button size="small" icon={<ClearOutlined />} onClick={onReset}>
          Reset
        </Button>
      }
    >
      <Form {...searchFormProps} layout="vertical" size="small">
        <Form.Item label="Watchlist">
          <Form.Item name="watchlist" noStyle>
            <Select
              mode="multiple"
              allowClear
              placeholder="Toutes les watchlists"
              options={watchlistOptions}
              optionFilterProp="label"
              style={{ width: "100%" }}
              maxTagCount={1}
            />
          </Form.Item>
        </Form.Item>

        {RANGE_FILTERS.map(({ name, label, min, max }) => (
          <Form.Item key={name} label={label}>
            <Space.Compact style={{ width: "100%" }}>
              <Form.Item name={`${name}Min`} noStyle>
                <InputNumber
                  placeholder="Min"
                  min={min}
                  max={max}
                  style={{ width: "50%" }}
                />
              </Form.Item>
              <Form.Item name={`${name}Max`} noStyle>
                <InputNumber
                  placeholder="Max"
                  min={min}
                  max={max}
                  style={{ width: "50%" }}
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        ))}

        <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SearchOutlined />}
            block
          >
            Appliquer
          </Button>
        </Form.Item>
      </Form>
    </FilterContainer>
  );
};
