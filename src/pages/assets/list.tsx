import {
  DateField,
  DeleteButton,
  EditButton,
  FilterDropdown,
  List,
  NumberField,
  ShowButton,
  useSelect,
  useTable,
} from "@refinedev/antd";
import { type BaseRecord } from "@refinedev/core";
import { Select, Space, Table, Tag } from "antd";

interface ScreenerAsset {
  id: number;
  screener: { id: number; name: string };
  metrics: Record<string, string>;
}

interface Asset extends BaseRecord {
  lastPrice?: string | null;
  currency?: string | null;
  lassoScore?: number | null;
  screenerAssets?: ScreenerAsset[];
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

const ASSET_TYPE_COLORS: Record<string, string> = {
  stock: "blue",
  fund: "green",
  bond: "orange",
  crypto: "purple",
  commodity: "gold",
  real_estate: "cyan",
  forex: "magenta",
  cash_account: "default",
};

interface AssetType {
  value: string;
  label: string;
}

export const AssetList = () => {
  const { tableProps } = useTable({
    syncWithLocation: true,
  });

  const { selectProps: typeSelectProps } = useSelect<AssetType>({
    resource: "asset_types",
    optionLabel: "label",
    optionValue: "value",
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" width={80} />
        <Table.Column dataIndex="symbol" title="Symbol" />
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column dataIndex="isin" title="ISIN" />
        <Table.Column
          dataIndex="type"
          title="Type"
          render={(value: string) =>
            value ? (
              <Tag color={ASSET_TYPE_COLORS[value] || "default"}>{value}</Tag>
            ) : (
              "-"
            )
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                {...typeSelectProps}
                allowClear
                placeholder="Filtrer par type"
                style={{ minWidth: 200 }}
              />
            </FilterDropdown>
          )}
          defaultFilteredValue={[]}
        />
        <Table.Column dataIndex="currency" title="Currency" />
        <Table.Column
          dataIndex="lastPrice"
          title="Last Price"
          render={(value: string | null, record: Asset) => {
            if (!value) return "-";
            return (
              <span>
                <NumberField value={parseFloat(value)} options={{ minimumFractionDigits: 2, maximumFractionDigits: 4 }} />
                {record.currency && <span> {record.currency}</span>}
              </span>
            );
          }}
        />
        <Table.Column
          dataIndex="lassoScore"
          title="Lasso Score"
          render={(value: number | null) =>
            value !== null && value !== undefined ? <NumberField value={value} /> : "-"
          }
        />
        <Table.Column
          title="VIS Score"
          render={(_: unknown, record: Asset) => {
            const value = getMetricValue(record.screenerAssets, "VIS Score");
            return value !== null ? <NumberField value={parseFloat(value)} /> : "-";
          }}
        />
        <Table.Column
          title="VIS Stars"
          render={(_: unknown, record: Asset) => {
            const value = getMetricValue(record.screenerAssets, "Global Stars");
            return value !== null ? <NumberField value={parseFloat(value)} /> : "-";
          }}
        />
        <Table.Column
          title="ZB Invest."
          render={(_: unknown, record: Asset) => {
            const value = getMetricValue(record.screenerAssets, "surperf_ratings.investisseur");
            return value !== null ? <NumberField value={parseFloat(value)} /> : "-";
          }}
        />
        <Table.Column
          title="Fintel comp"
          render={(_: unknown, record: Asset) => {
            const value = getMetricValue(record.screenerAssets, "metascreener.fintel-score");
            return value !== null ? <NumberField value={parseFloat(value)} /> : "-";
          }}
        />
        <Table.Column
          title="ZB comp"
          render={(_: unknown, record: Asset) => {
            const value = getMetricValue(record.screenerAssets, "metascreener.zonebourse-score");
            return value !== null ? <NumberField value={parseFloat(value)} /> : "-";
          }}
        />
        <Table.Column
          title="VIS comp"
          render={(_: unknown, record: Asset) => {
            const value = getMetricValue(record.screenerAssets, "metascreener.vis-score");
            return value !== null ? <NumberField value={parseFloat(value)} /> : "-";
          }}
        />
        <Table.Column
          title="VIS PBS"
          render={(_: unknown, record: Asset) => {
            const value = getMetricValue(record.screenerAssets, "metascreener.piotroski-beneish-sloan-score");
            return value !== null ? <NumberField value={parseFloat(value)} /> : "-";
          }}
        />
        <Table.Column dataIndex="countryCode" title="Country" />
        <Table.Column
          dataIndex="createdAt"
          title="Created"
          render={(value: string) => <DateField value={value} format="DD/MM/YYYY" />}
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
