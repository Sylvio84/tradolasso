import { Button, Form, InputNumber, Select, Space } from "antd";
import { ClearOutlined, SearchOutlined } from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { FilterContainer } from "./FilterContainer";
import type { FilterComponentProps } from "../layout/FilterSider";

// Country codes available in the API
const COUNTRY_OPTIONS = [
  { value: "AE", label: "Émirats arabes unis" },
  { value: "AT", label: "Autriche" },
  { value: "AU", label: "Australie" },
  { value: "BE", label: "Belgique" },
  { value: "BR", label: "Brésil" },
  { value: "CA", label: "Canada" },
  { value: "CH", label: "Suisse" },
  { value: "CN", label: "Chine" },
  { value: "DE", label: "Allemagne" },
  { value: "DK", label: "Danemark" },
  { value: "ES", label: "Espagne" },
  { value: "FI", label: "Finlande" },
  { value: "FR", label: "France" },
  { value: "GB", label: "Royaume-Uni" },
  { value: "GR", label: "Grèce" },
  { value: "HK", label: "Hong Kong" },
  { value: "HU", label: "Hongrie" },
  { value: "ID", label: "Indonésie" },
  { value: "IE", label: "Irlande" },
  { value: "IL", label: "Israël" },
  { value: "IN", label: "Inde" },
  { value: "IT", label: "Italie" },
  { value: "JP", label: "Japon" },
  { value: "KR", label: "Corée du Sud" },
  { value: "LU", label: "Luxembourg" },
  { value: "MX", label: "Mexique" },
  { value: "MY", label: "Malaisie" },
  { value: "NL", label: "Pays-Bas" },
  { value: "NO", label: "Norvège" },
  { value: "PL", label: "Pologne" },
  { value: "PT", label: "Portugal" },
  { value: "SE", label: "Suède" },
  { value: "SG", label: "Singapour" },
  { value: "TH", label: "Thaïlande" },
  { value: "TR", label: "Turquie" },
  { value: "TW", label: "Taïwan" },
  { value: "US", label: "États-Unis" },
  { value: "VN", label: "Vietnam" },
  { value: "ZA", label: "Afrique du Sud" },
];

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
  { name: "lassoScore", label: "Lasso Score" },
  { name: "visScore", label: "VIS Score" },
  { name: "globalStars", label: "VIS Stars", min: 1, max: 5 },
  { name: "zonebourseInvestisseur", label: "ZB Invest." },
  { name: "fintelScore", label: "Fintel comp" },
  { name: "zonebourseScore", label: "ZB comp" },
  { name: "piotrosBeneishSloanScore", label: "VIS PBS" },
];

export const AssetsFilter: React.FC<FilterComponentProps> = ({
  searchFormProps,
  onReset,
}) => {
  // Load watchlists for stocks
  const { result: watchlistsData } = useList({
    resource: "watchlists",
    filters: [{ field: "assetType", operator: "eq", value: "stock" }],
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

        <Form.Item label="Pays">
          <Form.Item name="countryCode" noStyle>
            <Select
              mode="multiple"
              allowClear
              placeholder="Tous les pays"
              options={COUNTRY_OPTIONS}
              optionFilterProp="label"
              style={{ width: "100%" }}
              maxTagCount={2}
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
