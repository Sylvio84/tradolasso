import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { type BaseRecord, type CrudFilters } from "@refinedev/core";
import { Space, Table } from "antd";
import { useEffect } from "react";
import { useLocation } from "react-router";
import { useFilterContext } from "../../contexts/filter-context";
import "flag-icons/css/flag-icons.min.css";

const STORAGE_KEY = "cryptoFilters";

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

interface Indicators {
  adx?: number | null;
  atrPercent?: number | null;
}

interface Crypto extends BaseRecord {
  lastPrice?: string | null;
  currency?: string | null;
  marketcap?: string | null;
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
      // For marketcap, convert from millions to actual value
      const multiplier = name === "marketcap" ? 1000000 : 1;
      const minVal = min != null ? min * multiplier : "";
      const maxVal = max != null ? max * multiplier : "";
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

  // Watchlist filter
  const watchlist = values.watchlist as number[] | undefined;
  if (watchlist && watchlist.length > 0) {
    filters.push({
      field: "watchlist",
      operator: "in",
      value: watchlist,
    });
  }

  return filters;
};

export const CryptoList = () => {
  const location = useLocation();
  const { registerFilter, unregisterFilter } = useFilterContext();
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
      permanent: [{ field: "type", operator: "eq", value: "crypto" }],
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

  // Callback for filter reset
  const handleReset = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    searchFormProps.form?.resetFields();
    searchFormProps.form?.submit();
  };

  // Register filter with context
  useEffect(() => {
    registerFilter(location.pathname, searchFormProps, handleReset);
    return () => unregisterFilter(location.pathname);
  }, [location.pathname, searchFormProps, registerFilter, unregisterFilter, handleReset]);

  return (
    <List>
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
              title="Crypto"
              render={(_: unknown, record: Crypto) => (
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
              dataIndex="marketcap"
              title="Market Cap"
              sorter
              render={(value: string | null) => {
                if (!value) return "-";
                const numValue = parseFloat(value);
                if (numValue >= 1e12) {
                  return `${(numValue / 1e12).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} T`;
                }
                if (numValue >= 1e9) {
                  return `${(numValue / 1e9).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mds`;
                }
                if (numValue >= 1e6) {
                  return `${(numValue / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
                }
                return numValue.toLocaleString("fr-FR");
              }}
            />
            <Table.Column
              dataIndex="adx"
              title="ADX"
              sorter
              render={(_: unknown, record: Crypto) => {
                const adx = record.indicators?.adx;
                if (adx == null) return "-";
                return <span style={getAdxStyle(adx)}>{adx.toFixed(2)}%</span>;
              }}
            />
            <Table.Column
              dataIndex="atrPercent"
              title="Volatility"
              sorter
              render={(_: unknown, record: Crypto) => {
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
    </List>
  );
};
