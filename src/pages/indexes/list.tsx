import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { type BaseRecord, type CrudFilters } from "@refinedev/core";
import { Button, Card, Form, InputNumber, Select, Space, Table } from "antd";
import { ClearOutlined, SearchOutlined } from "@ant-design/icons";
import { useEffect } from "react";
import "flag-icons/css/flag-icons.min.css";

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

const STORAGE_KEY = "indexFilters";

// Range filter field configuration
interface RangeFilterConfig {
  name: string;
  label: string;
  min?: number;
  max?: number;
}

const RANGE_FILTERS: RangeFilterConfig[] = [
  { name: "adx", label: "ADX" },
  { name: "atrPercent", label: "Volatility" },
];

interface Indicators {
  adx?: number | null;
  atrPercent?: number | null;
}

interface Index extends BaseRecord {
  lastPrice?: string | null;
  currency?: string | null;
  countryCode?: string | null;
  indicators?: Indicators | null;
}

// Score styles
type ScoreStyle = React.CSSProperties;

const SCORE_STYLES = {
  highest: { color: "#52c41a", fontWeight: 600 } as ScoreStyle,
  higher: { color: "#73d13d" } as ScoreStyle,
  lower: { color: "#ff7875" } as ScoreStyle,
  lowest: { color: "#a61d24", fontWeight: 600 } as ScoreStyle,
  neutral: {} as ScoreStyle,
};

// ADX style (uses absolute value)
const getAdxStyle = (adx: number): ScoreStyle => {
  const absAdx = Math.abs(adx);
  if (absAdx > 30) return adx > 0 ? SCORE_STYLES.highest : SCORE_STYLES.lowest;
  if (absAdx > 15) return adx > 0 ? SCORE_STYLES.higher : SCORE_STYLES.lower;
  return SCORE_STYLES.neutral;
};

// Helper to get initial form values from sessionStorage
const getInitialFormValues = (): Record<string, unknown> => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
};

// Helper to convert form values to CrudFilters
const formValuesToFilters = (values: Record<string, unknown>): CrudFilters => {
  const filters: CrudFilters = [];

  // Range filters
  RANGE_FILTERS.forEach(({ name }) => {
    const min = values[`${name}Min`] as number | undefined;
    const max = values[`${name}Max`] as number | undefined;
    if (min != null || max != null) {
      const minVal = min != null ? min : "";
      const maxVal = max != null ? max : "";
      filters.push({
        field: name,
        operator: "eq",
        value: `${minVal},${maxVal}`,
      });
    }
  });

  // Country filter
  const countryCode = values.countryCode as string[] | undefined;
  if (countryCode && countryCode.length > 0) {
    filters.push({
      field: "countryCode",
      operator: "in",
      value: countryCode,
    });
  }

  return filters;
};

export const IndexList = () => {
  const initialFormValues = getInitialFormValues();
  const initialFilters = formValuesToFilters(initialFormValues);

  const { tableProps, searchFormProps } = useTable({
    syncWithLocation: true,
    pagination: {
      pageSize: 20,
    },
    sorters: {
      initial: [{ field: "name", order: "asc" }],
    },
    filters: {
      permanent: [{ field: "type", operator: "eq", value: "index" }],
      initial: initialFilters.length > 0 ? initialFilters : undefined,
      defaultBehavior: "replace",
    },
    onSearch: (values: Record<string, unknown>) => {
      // Save to sessionStorage
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      return formValuesToFilters(values);
    },
  });

  // Set initial form values from sessionStorage on mount
  useEffect(() => {
    const saved = getInitialFormValues();
    if (Object.keys(saved).length > 0) {
      searchFormProps.form?.setFieldsValue(saved);
    }
  }, [searchFormProps.form]);

  return (
    <List>
      <div style={{ display: "flex", gap: 16 }}>
        {/* Sidebar Filters */}
        <Card
          title="Filtres"
          size="small"
          style={{ width: 260, flexShrink: 0, height: "fit-content" }}
          extra={
            <Button
              size="small"
              icon={<ClearOutlined />}
              onClick={() => {
                sessionStorage.removeItem(STORAGE_KEY);
                searchFormProps.form?.resetFields();
                searchFormProps.form?.submit();
              }}
            >
              Reset
            </Button>
          }
        >
          <Form
            {...searchFormProps}
            layout="vertical"
            size="small"
          >
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
        </Card>

        {/* Table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Table
            {...tableProps}
            rowKey="id"
            scroll={{ x: "max-content" }}
            pagination={{
              ...tableProps.pagination,
              showTotal: (total) => `${total} résultat${total > 1 ? "s" : ""}`,
            }}
          >
            <Table.Column
              title="Index"
              render={(_: unknown, record: Index) => (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {record.countryCode && (
                      <span
                        className={`fi fi-${record.countryCode.toLowerCase()}`}
                        style={{ fontSize: "14px" }}
                        title={record.countryCode}
                      />
                    )}
                    <strong>{record.symbol}</strong>
                  </div>
                  <div style={{ fontSize: "12px" }}>{record.name}</div>
                </div>
              )}
            />
            <Table.Column
              dataIndex="adx"
              title="ADX"
              sorter
              render={(_: unknown, record: Index) => {
                const adx = record.indicators?.adx;
                if (adx == null) return "-";
                return <span style={getAdxStyle(adx)}>{adx.toFixed(2)}%</span>;
              }}
            />
            <Table.Column
              dataIndex="atrPercent"
              title="Volatility"
              sorter
              render={(_: unknown, record: Index) => {
                const atrPercent = record.indicators?.atrPercent;
                if (atrPercent == null) return "-";
                return <span>{atrPercent.toFixed(2)}%</span>;
              }}
            />
            <Table.Column
              title="Actions"
              dataIndex="actions"
              render={(_, record: BaseRecord) => (
                <Space>
                  <ShowButton hideText size="small" recordItemId={record.id} />
                  <EditButton hideText size="small" recordItemId={record.id} />
                  <DeleteButton hideText size="small" recordItemId={record.id} />
                </Space>
              )}
            />
          </Table>
        </div>
      </div>
    </List>
  );
};
