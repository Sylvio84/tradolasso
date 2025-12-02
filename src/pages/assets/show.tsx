import { useEffect } from "react";
import { DateField, Show, TextField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Tag, Descriptions, Table, Card, Space, Tooltip } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, LinkOutlined } from "@ant-design/icons";

const { Title } = Typography;

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

interface ScreenerAsset {
  id: number;
  screener?: { id: number; name: string } | null;
  active: boolean;
  url?: string | null;
  lastFetchAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  metrics?: Record<string, string>;
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

interface Listing {
  id: number;
  exchange?: { id: number; name: string; code?: string } | null;
  ticker: string;
  peaEligible: boolean;
  peapmeEligible: boolean;
  lastDataAt?: string | null;
  lastPrice?: string | null;
  lastVolume?: number | string | null;
  currency?: string | null;
  createdAt?: string | null;
}

export const AssetShow = () => {
  const {
    query: { data, isLoading },
  } = useShow({});

  const record = data?.data;

  useEffect(() => {
    if (record?.symbol) {
      document.title = `${record.symbol} - ${record.name || ""} | Refine`;
    }
  }, [record]);

  return (
    <Show isLoading={isLoading}>
      <Title level={5}>Asset Details</Title>
      <Descriptions bordered column={2}>
        <Descriptions.Item label="ID">
          <TextField value={record?.id} />
        </Descriptions.Item>
        <Descriptions.Item label="Symbol">
          <TextField value={record?.symbol} />
        </Descriptions.Item>
        <Descriptions.Item label="Name">
          <TextField value={record?.name || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="ISIN">
          <TextField value={record?.isin || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="Type">
          {record?.type ? (
            <Tag color={ASSET_TYPE_COLORS[record.type] || "default"}>
              {record.type}
            </Tag>
          ) : (
            "-"
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Currency">
          <TextField value={record?.currency || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="Country">
          <TextField value={record?.countryCode || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="Market Cap">
          <TextField value={record?.marketcap || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {record?.createdAt ? <DateField value={record.createdAt} format="DD/MM/YYYY" /> : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Updated At">
          {record?.updatedAt ? <DateField value={record.updatedAt} format="DD/MM/YYYY" /> : "-"}
        </Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginTop: 24 }}>Metrics</Title>
      <Descriptions bordered column={4}>
        <Descriptions.Item label="Lasso Score">
          <TextField value={record?.lassoScore ?? "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="VIS Score">
          {getMetricValue(record?.screenerAssets, "VIS Score") ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label="VIS Stars">
          {getMetricValue(record?.screenerAssets, "Global Stars") ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label="ZB Invest.">
          {getMetricValue(record?.screenerAssets, "surperf_ratings.investisseur") ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Fintel comp">
          {getMetricValue(record?.screenerAssets, "metascreener.fintel-score") ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label="ZB comp">
          {getMetricValue(record?.screenerAssets, "metascreener.zonebourse-score") ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label="VIS comp">
          {getMetricValue(record?.screenerAssets, "metascreener.vis-score") ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label="VIS PBS">
          {getMetricValue(record?.screenerAssets, "metascreener.piotroski-beneish-sloan-score") ?? "-"}
        </Descriptions.Item>
      </Descriptions>

      <Card
        title="Screener Assets"
        style={{ marginTop: 24 }}
        size="small"
      >
        <Table<ScreenerAsset>
          dataSource={record?.screenerAssets ?? []}
          loading={isLoading}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            {
              title: "ID",
              dataIndex: "id",
              width: 60,
            },
            {
              title: "Screener",
              dataIndex: "screener",
              render: (screener) => screener?.name || "-",
            },
            {
              title: "Active",
              dataIndex: "active",
              width: 80,
              align: "center",
              render: (active: boolean) =>
                active ? (
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                ) : (
                  <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                ),
            },
            {
              title: "URL",
              dataIndex: "url",
              ellipsis: true,
              render: (url: string | null) =>
                url ? (
                  <Tooltip title={url}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Space>
                        <LinkOutlined />
                        {url.length > 40 ? `${url.substring(0, 40)}...` : url}
                      </Space>
                    </a>
                  </Tooltip>
                ) : "-",
            },
            {
              title: "Last Fetch",
              dataIndex: "lastFetchAt",
              width: 160,
              render: (date: string | null) =>
                date ? <DateField value={date} format="DD/MM/YYYY HH:mm" /> : "-",
            },
          ]}
        />
      </Card>

      <Card
        title="Listings"
        style={{ marginTop: 24 }}
        size="small"
      >
        <Table<Listing>
          dataSource={record?.listings ?? []}
          loading={isLoading}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            {
              title: "ID",
              dataIndex: "id",
              width: 60,
            },
            {
              title: "Exchange",
              dataIndex: "exchange",
              render: (exchange) => exchange?.name || exchange?.code || "-",
            },
            {
              title: "Ticker",
              dataIndex: "ticker",
            },
            {
              title: "Currency",
              dataIndex: "currency",
              width: 80,
              render: (currency: string | null) => currency || "-",
            },
            {
              title: "Last Price",
              dataIndex: "lastPrice",
              width: 100,
              align: "right",
              render: (price: string | null) => price || "-",
            },
            {
              title: "Last Volume",
              dataIndex: "lastVolume",
              width: 100,
              align: "right",
              render: (volume: number | string | null) =>
                volume != null ? Number(volume).toLocaleString() : "-",
            },
            {
              title: "PEA",
              dataIndex: "peaEligible",
              width: 60,
              align: "center",
              render: (eligible: boolean) =>
                eligible ? (
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                ) : (
                  <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                ),
            },
            {
              title: "PEA-PME",
              dataIndex: "peapmeEligible",
              width: 80,
              align: "center",
              render: (eligible: boolean) =>
                eligible ? (
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                ) : (
                  <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                ),
            },
            {
              title: "Last Data",
              dataIndex: "lastDataAt",
              width: 160,
              render: (date: string | null) =>
                date ? <DateField value={date} format="DD/MM/YYYY HH:mm" /> : "-",
            },
          ]}
        />
      </Card>
    </Show>
  );
};
