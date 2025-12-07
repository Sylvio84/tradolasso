import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { type BaseRecord, type CrudFilters } from "@refinedev/core";
import { Button, Space, Table } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { AddToWatchlistButton } from "../../components/AddToWatchlistButton";
import { AssetNotesModal } from "../../components/asset-notes";
import { useFilterContext } from "../../contexts/filter-context";
import "flag-icons/css/flag-icons.min.css";

const STORAGE_KEY = "assetFilters";

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

interface ScreenerAsset {
  id: number;
  screener: { id: number; name: string };
  metrics: Record<string, string>;
}

interface Indicators {
  adx?: number | null;
  atrPercent?: number | null;
}

interface Asset extends BaseRecord {
  lastPrice?: string | null;
  currency?: string | null;
  marketcap?: string | null;
  countryCode?: string | null;
  lassoScore?: number | null;
  screenerAssets?: ScreenerAsset[];
  indicators?: Indicators | null;
}

// Helper to get metric value from screenerAssets
const getMetricValue = (screenerAssets: ScreenerAsset[] | undefined, metricKey: string): string | null => {
  if (!screenerAssets) return null;
  for (const sa of screenerAssets) {
    if (sa.metrics && metricKey in sa.metrics) {
      return sa.metrics[metricKey];
    }
  }
  return null;
};

// Score styles
type ScoreStyle = React.CSSProperties;

const SCORE_STYLES = {
  highest: { color: "#52c41a", fontWeight: 600 } as ScoreStyle,
  higher: { color: "#73d13d" } as ScoreStyle,
  lower: { color: "#ff7875" } as ScoreStyle,
  lowest: { color: "#a61d24", fontWeight: 600 } as ScoreStyle,
  neutral: {} as ScoreStyle,
};

// Helper to get score style based on thresholds
type ScoreThresholds = {
  highest: number;
  higher: number;
  lower: number;
  lowest: number;
};

const getScoreStyle = (value: number, thresholds: ScoreThresholds): ScoreStyle => {
  if (value >= thresholds.highest) return SCORE_STYLES.highest;
  if (value >= thresholds.higher) return SCORE_STYLES.higher;
  if (value <= thresholds.lowest) return SCORE_STYLES.lowest;
  if (value <= thresholds.lower) return SCORE_STYLES.lower;
  return SCORE_STYLES.neutral;
};

// Helper for VIS Stars (exact match)
const getVisStarsStyle = (value: number): ScoreStyle => {
  if (value === 5) return SCORE_STYLES.highest;
  if (value === 4) return SCORE_STYLES.higher;
  if (value === 2) return SCORE_STYLES.lower;
  if (value === 1) return SCORE_STYLES.lowest;
  return SCORE_STYLES.neutral;
};

// ADX style (uses absolute value)
const getAdxStyle = (adx: number): ScoreStyle => {
  const absAdx = Math.abs(adx);
  if (absAdx > 30) return adx > 0 ? SCORE_STYLES.highest : SCORE_STYLES.lowest;
  if (absAdx > 15) return adx > 0 ? SCORE_STYLES.higher : SCORE_STYLES.lower;
  return SCORE_STYLES.neutral;
};

// Threshold configurations
const LASSO_THRESHOLDS: ScoreThresholds = { highest: 70, higher: 60, lower: 40, lowest: 30 };
const VIS_SCORE_THRESHOLDS: ScoreThresholds = { highest: 10, higher: 7, lower: 5, lowest: 3 };
const DEFAULT_THRESHOLDS: ScoreThresholds = { highest: 70, higher: 60, lower: 40, lowest: 30 };


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

export const AssetList = () => {
  const location = useLocation();
  const { registerFilter, unregisterFilter } = useFilterContext();
  const initialFormValues = getInitialFormValues();
  const initialFilters = formValuesToFilters(initialFormValues);
  const [notesModalState, setNotesModalState] = useState<{
    open: boolean;
    assetId: number | null;
    assetSymbol?: string;
    assetName?: string;
  }>({
    open: false,
    assetId: null,
  });

  const { tableProps, searchFormProps } = useTable({
    syncWithLocation: true,
    pagination: {
      pageSize: 20,
    },
    sorters: {
      initial: [{ field: "lassoScore", order: "desc" }],
    },
    filters: {
      permanent: [{ field: "type", operator: "eq", value: "stock" }],
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
          title="Asset"
          render={(_: unknown, record: Asset) => (
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
                {record.isin && <span style={{ color: "#888" }}> ({record.isin})</span>}
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
              render={(_: unknown, record: Asset) => {
                const adx = record.indicators?.adx;
                if (adx == null) return "-";
                return <span style={getAdxStyle(adx)}>{adx.toFixed(2)}%</span>;
              }}
            />
            <Table.Column
              dataIndex="atrPercent"
              title="Volatility"
              sorter
              render={(_: unknown, record: Asset) => {
                const atrPercent = record.indicators?.atrPercent;
                if (atrPercent == null) return "-";
                return <span>{atrPercent.toFixed(2)}%</span>;
              }}
            />
            <Table.Column
              dataIndex="lassoScore"
              title="Lasso Score"
              sorter
              defaultSortOrder="descend"
              render={(_: unknown, record: Asset) => {
                const value = getMetricValue(record.screenerAssets, "lasso.score");
                if (value === null) return "-";
                const numValue = parseFloat(value);
                return <span style={getScoreStyle(numValue, LASSO_THRESHOLDS)}>{numValue.toFixed(2)}</span>;
              }}
            />
            <Table.Column
              dataIndex="visScore"
              title="VIS Score"
              sorter
              render={(_: unknown, record: Asset) => {
                const value = getMetricValue(record.screenerAssets, "VIS Score");
                if (value === null) return "-";
                const numValue = parseFloat(value);
                return <span style={getScoreStyle(numValue, VIS_SCORE_THRESHOLDS)}>{numValue.toFixed(2)}</span>;
              }}
            />
            <Table.Column
              dataIndex="globalStars"
              title="VIS Stars"
              sorter
              render={(_: unknown, record: Asset) => {
                const value = getMetricValue(record.screenerAssets, "Global Stars");
                if (value === null) return "-";
                const numValue = parseFloat(value);
                return <span style={getVisStarsStyle(numValue)}>{numValue}</span>;
              }}
            />
            <Table.Column
              dataIndex="zonebourseInvestisseur"
              title="ZB Invest."
              sorter
              render={(_: unknown, record: Asset) => {
                const value = getMetricValue(record.screenerAssets, "surperf_ratings.investisseur");
                if (value === null) return "-";
                const numValue = parseFloat(value);
                return <span style={getScoreStyle(numValue, DEFAULT_THRESHOLDS)}>{numValue.toFixed(2)}</span>;
              }}
            />
            <Table.Column
              dataIndex="fintelScore"
              title="Fintel comp"
              sorter
              render={(_: unknown, record: Asset) => {
                const value = getMetricValue(record.screenerAssets, "metascreener.fintel-score");
                if (value === null) return "-";
                const numValue = parseFloat(value);
                return <span style={getScoreStyle(numValue, DEFAULT_THRESHOLDS)}>{numValue.toFixed(2)}</span>;
              }}
            />
            <Table.Column
              dataIndex="zonebourseScore"
              title="ZB comp"
              sorter
              render={(_: unknown, record: Asset) => {
                const value = getMetricValue(record.screenerAssets, "metascreener.zonebourse-score");
                if (value === null) return "-";
                const numValue = parseFloat(value);
                return <span style={getScoreStyle(numValue, DEFAULT_THRESHOLDS)}>{numValue.toFixed(2)}</span>;
              }}
            />
            <Table.Column
              title="VIS comp"
              render={(_: unknown, record: Asset) => {
                const value = getMetricValue(record.screenerAssets, "metascreener.vis-score");
                if (value === null) return "-";
                const numValue = parseFloat(value);
                return <span style={getScoreStyle(numValue, DEFAULT_THRESHOLDS)}>{numValue.toFixed(2)}</span>;
              }}
            />
            <Table.Column
              dataIndex="piotrosBeneishSloanScore"
              title="VIS PBS"
              sorter
              render={(_: unknown, record: Asset) => {
                const value = getMetricValue(record.screenerAssets, "metascreener.piotroski-beneish-sloan-score");
                if (value === null) return "-";
                const numValue = parseFloat(value);
                return <span style={getScoreStyle(numValue, DEFAULT_THRESHOLDS)}>{numValue.toFixed(2)}</span>;
              }}
            />
            <Table.Column
              title="Actions"
              dataIndex="actions"
              render={(_, record: BaseRecord) => (
                <Space>
                  <ShowButton hideText size="small" recordItemId={record.id} />
                  <Button
                    size="small"
                    icon={<FileTextOutlined />}
                    onClick={() => setNotesModalState({
                      open: true,
                      assetId: Number(record.id),
                      assetSymbol: (record as any).symbol,
                      assetName: (record as any).name,
                    })}
                    title="Notes"
                  />
                  <AddToWatchlistButton
                    assetId={Number(record.id)}
                    assetSymbol={(record as any).symbol}
                    size="small"
                    type="text"
                  />
                  <EditButton hideText size="small" recordItemId={record.id} />
                  <DeleteButton hideText size="small" recordItemId={record.id} />
                </Space>
              )}
            />
          </Table>

      {/* Asset Notes Modal */}
      {notesModalState.assetId && (
        <AssetNotesModal
          assetId={notesModalState.assetId}
          assetSymbol={notesModalState.assetSymbol}
          assetName={notesModalState.assetName}
          open={notesModalState.open}
          onClose={() => setNotesModalState({ open: false, assetId: null })}
        />
      )}
    </List>
  );
};
