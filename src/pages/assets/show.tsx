import { useEffect, useState } from "react";
import { DateField, Show, TextField, ShowButton } from "@refinedev/antd";
import { useShow, useInvalidate } from "@refinedev/core";
import { Typography, Tag, Descriptions, Table, Card, Space, Tooltip, Dropdown, Button, Modal, Form, Input, App } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, LinkOutlined, ArrowLeftOutlined, StarOutlined, PlusOutlined, DownOutlined } from "@ant-design/icons";
import { OhlcvChart } from "../../components/charts/OhlcvChart";
import { useSearchParams, useNavigate } from "react-router";
import { http } from "../../providers/hydra";

const { TextArea } = Input;

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

interface Watchlist {
  id: number;
  name: string;
  isAutomatic: boolean;
  color?: string | null;
}

export const AssetShow = () => {
  const { modal, message } = App.useApp();
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const {
    query: { data, isLoading },
  } = useShow({});

  const record = data?.data;
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from");
  const walletId = fromParam?.startsWith("wallet:")
    ? fromParam.split(":")[1]
    : null;
  const watchlistId = fromParam?.startsWith("watchlist:")
    ? fromParam.split(":")[1]
    : null;

  // Watchlist states
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [watchlistsLoading, setWatchlistsLoading] = useState(false);
  const [isCreateWatchlistModalOpen, setIsCreateWatchlistModalOpen] = useState(false);
  const [createWatchlistForm] = Form.useForm();

  useEffect(() => {
    if (record?.symbol) {
      document.title = `${record.symbol} - ${record.name || ""} | Refine`;
    }
  }, [record]);

  // Load watchlists (manual only)
  const loadWatchlists = async () => {
    setWatchlistsLoading(true);
    try {
      const params = new URLSearchParams({
        isAutomatic: "false",
        pagination: "false",
      });
      const { data } = await http(`/watchlists?${params}`);
      setWatchlists(data.member || []);
    } catch (error) {
      console.error("Error loading watchlists:", error);
    } finally {
      setWatchlistsLoading(false);
    }
  };

  // Add asset to watchlist
  const handleAddToWatchlist = async (watchlistId: number) => {
    try {
      await http(`/watchlist_assets`, {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({
          watchlistId,
          assetId: record?.id,
        }),
      });
      message.success("Actif ajouté à la watchlist");

      // Reload watchlists to update the dropdown
      loadWatchlists();

      // Invalidate watchlist caches - use "all" to refresh everything
      invalidate({
        resource: "watchlists",
        invalidates: ["all"],
      });

      // Also invalidate watchlist_assets resource
      invalidate({
        resource: "watchlist_assets",
        invalidates: ["all"],
      });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.["hydra:description"] || "Erreur lors de l'ajout";
      message.error(errorMsg);
    }
  };

  // Create new watchlist with asset
  const handleCreateWatchlist = async () => {
    try {
      const values = await createWatchlistForm.validateFields();

      // Create watchlist
      const { data: newWatchlist } = await http(`/watchlists`, {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description || null,
          isAutomatic: false,
          status: "normal",
        }),
      });

      // Add asset to the new watchlist
      await http(`/watchlist_assets`, {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({
          watchlistId: newWatchlist.id,
          assetId: record?.id,
        }),
      });

      message.success("Watchlist créée et actif ajouté");
      setIsCreateWatchlistModalOpen(false);
      createWatchlistForm.resetFields();

      // Reload watchlists to update the dropdown
      loadWatchlists();

      // Invalidate watchlist caches - use "all" to refresh everything
      invalidate({
        resource: "watchlists",
        invalidates: ["all"],
      });

      // Also invalidate watchlist_assets resource
      invalidate({
        resource: "watchlist_assets",
        invalidates: ["all"],
      });

      // Optionally navigate to the new watchlist
      modal.confirm({
        title: "Watchlist créée",
        content: "Voulez-vous voir la watchlist ?",
        okText: "Voir",
        cancelText: "Rester ici",
        onOk: () => navigate(`/watchlists/show/${newWatchlist.id}`),
      });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.["hydra:description"] || "Erreur lors de la création";
      message.error(errorMsg);
    }
  };

  // Dropdown menu items
  const getWatchlistMenuItems = () => {
    const items: any[] = [];

    // Add existing watchlists
    watchlists.forEach((wl) => {
      items.push({
        key: `watchlist-${wl.id}`,
        label: (
          <Space>
            {wl.color && (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: wl.color,
                }}
              />
            )}
            {wl.name}
          </Space>
        ),
        onClick: () => handleAddToWatchlist(wl.id),
      });
    });

    // Add separator and "Create new" option
    if (items.length > 0) {
      items.push({ type: "divider" });
    }

    items.push({
      key: "create-new",
      label: (
        <Space>
          <PlusOutlined />
          Créer une nouvelle liste
        </Space>
      ),
      onClick: () => {
        loadWatchlists(); // Refresh list
        setIsCreateWatchlistModalOpen(true);
      },
    });

    return items;
  };

  return (
    <Show
      isLoading={isLoading}
      headerButtons={({ defaultButtons }) => (
        <>
          {walletId && (
            <ShowButton
              resource="wallets"
              recordItemId={walletId}
              icon={<ArrowLeftOutlined />}
            >
              Retour au wallet
            </ShowButton>
          )}
          {watchlistId && (
            <ShowButton
              resource="watchlists"
              recordItemId={watchlistId}
              icon={<ArrowLeftOutlined />}
            >
              Retour à la watchlist
            </ShowButton>
          )}
          <Dropdown
            menu={{ items: getWatchlistMenuItems() }}
            onOpenChange={(open) => {
              if (open) loadWatchlists();
            }}
            trigger={["click"]}
          >
            <Button icon={<StarOutlined />} loading={watchlistsLoading}>
              Ajouter à watchlist <DownOutlined />
            </Button>
          </Dropdown>
          {defaultButtons}
        </>
      )}
    >
      {record?.id && <OhlcvChart assetId={record.id} />}

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
          {getMetricValue(record?.screenerAssets, "lasso.score") ?? "-"}
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

      {/* Create Watchlist Modal */}
      <Modal
        title="Créer une nouvelle watchlist"
        open={isCreateWatchlistModalOpen}
        onOk={handleCreateWatchlist}
        onCancel={() => {
          setIsCreateWatchlistModalOpen(false);
          createWatchlistForm.resetFields();
        }}
        okText="Créer et ajouter"
        cancelText="Annuler"
      >
        <Form form={createWatchlistForm} layout="vertical">
          <Form.Item
            name="name"
            label="Nom"
            rules={[
              { required: true, message: "Le nom est requis" },
              { max: 100, message: "Le nom ne peut pas dépasser 100 caractères" },
            ]}
          >
            <Input placeholder="Ma nouvelle watchlist" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Description (optionnelle)" />
          </Form.Item>
        </Form>
      </Modal>
    </Show>
  );
};
