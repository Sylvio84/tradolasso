import { useEffect, useState } from "react";
import { DateField, TextField } from "@refinedev/antd";
import { useOne, useInvalidate, useList } from "@refinedev/core";
import { Typography, Tag, Descriptions, Table, Card, Space, Tooltip, Dropdown, Button, Modal, Form, Input, App, Spin } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, LinkOutlined, StarOutlined, PlusOutlined, DownOutlined, FileTextOutlined } from "@ant-design/icons";
import { OhlcvChart } from "../charts/OhlcvChart";
import { useNavigate } from "react-router";
import { http } from "../../providers/hydra";
import { PinnedNotesWidget, AssetNotesList, AssetNoteForm } from "../asset-notes";

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

interface AssetDetailsPanelProps {
  assetId: number;
  contextFrom?: string;
}

export const AssetDetailsPanel: React.FC<AssetDetailsPanelProps> = ({ assetId }) => {
  const { modal, message } = App.useApp();
  const navigate = useNavigate();
  const invalidate = useInvalidate();

  const {
    query: { data, isLoading },
  } = useOne({
    resource: "assets",
    id: assetId,
    queryOptions: {
      enabled: !!assetId,
    }
  });

  const record = data?.data;

  // Watchlist states
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [watchlistsLoading, setWatchlistsLoading] = useState(false);
  const [isCreateWatchlistModalOpen, setIsCreateWatchlistModalOpen] = useState(false);
  const [createWatchlistForm] = Form.useForm();

  // Asset Notes states
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [createNoteForm] = Form.useForm();
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [editNoteForm] = Form.useForm();
  const [editingNote, setEditingNote] = useState<any>(null);

  // Load asset notes
  const { query: notesQuery } = useList({
    resource: `assets/${assetId}/notes`,
    queryOptions: {
      enabled: !!assetId,
      queryKey: ["asset_notes", assetId],
    },
    filters: [
      {
        field: "status",
        operator: "nin",
        value: ["archived"],
      },
    ],
    sorters: [
      {
        field: "status",
        order: "desc", // Pinned first
      },
      {
        field: "createdAt",
        order: "desc",
      },
    ],
  });

  const notesData = notesQuery.data;
  const notesLoading = notesQuery.isLoading;
  const refetchNotes = notesQuery.refetch;

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

      loadWatchlists();

      invalidate({
        resource: "watchlists",
        invalidates: ["all"],
      });

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

      loadWatchlists();

      invalidate({
        resource: "watchlists",
        invalidates: ["all"],
      });

      invalidate({
        resource: "watchlist_assets",
        invalidates: ["all"],
      });

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

  // Create new note
  const handleCreateNote = async () => {
    try {
      const values = await createNoteForm.validateFields();

      await http(`/assets/${record?.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({
          title: values.title,
          content: values.content,
          type: values.type || null,
          sentiment: values.sentiment || null,
          icon: values.icon || null,
          color: values.color || null,
          status: values.status || "normal",
        }),
      });

      message.success("Note créée");
      setIsCreateNoteModalOpen(false);
      createNoteForm.resetFields();
      refetchNotes();

      invalidate({
        resource: "asset_notes",
        invalidates: ["all"],
      });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.["hydra:description"] || "Erreur lors de la création";
      message.error(errorMsg);
    }
  };

  // Edit note
  const handleEditNote = (note: any) => {
    setEditingNote(note);
    editNoteForm.setFieldsValue({
      title: note.title,
      content: note.content,
      type: note.type,
      sentiment: note.sentiment,
      icon: note.icon,
      color: note.color,
      status: note.status,
    });
    setIsEditNoteModalOpen(true);
  };

  const handleEditNoteSubmit = async () => {
    try {
      const values = await editNoteForm.validateFields();

      await http(`/asset_notes/${editingNote?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(values),
      });

      message.success("Note modifiée");
      setIsEditNoteModalOpen(false);
      editNoteForm.resetFields();
      setEditingNote(null);
      refetchNotes();

      invalidate({
        resource: "asset_notes",
        invalidates: ["all"],
      });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.["hydra:description"] || "Erreur lors de la modification";
      message.error(errorMsg);
    }
  };

  // Dropdown menu items
  const getWatchlistMenuItems = () => {
    const items: any[] = [];

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
        loadWatchlists();
        setIsCreateWatchlistModalOpen(true);
      },
    });

    return items;
  };

  if (isLoading) {
    return (
      <div style={{ padding: "100px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ padding: "100px", textAlign: "center" }}>
        <p>Asset non trouvé</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 24px" }}>
      {/* Header with watchlist dropdown */}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
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
      </div>

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

      {/* Asset Notes Section */}
      {record?.id && <PinnedNotesWidget assetId={Number(record.id)} />}

      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Notes</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              createNoteForm.setFieldsValue({ status: "normal" });
              setIsCreateNoteModalOpen(true);
            }}
          >
            Créer une note
          </Button>
        }
        style={{ marginTop: 24 }}
        size="small"
        loading={notesLoading}
      >
        {notesData?.data && notesData.data.length > 0 ? (
          <AssetNotesList
            notes={notesData.data as any}
            onEdit={handleEditNote}
            onDeleted={() => {
              refetchNotes();
              invalidate({
                resource: "asset_notes",
                invalidates: ["all"],
              });
            }}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "24px", color: "#999" }}>
            Aucune note pour cet actif. Créez-en une pour commencer votre analyse.
          </div>
        )}
      </Card>

      {/* Create Note Modal */}
      <Modal
        title="Créer une note"
        open={isCreateNoteModalOpen}
        onOk={handleCreateNote}
        onCancel={() => {
          setIsCreateNoteModalOpen(false);
          createNoteForm.resetFields();
        }}
        okText="Créer"
        cancelText="Annuler"
        width={700}
      >
        <AssetNoteForm form={createNoteForm} />
      </Modal>

      {/* Edit Note Modal */}
      <Modal
        title="Modifier la note"
        open={isEditNoteModalOpen}
        onOk={handleEditNoteSubmit}
        onCancel={() => {
          setIsEditNoteModalOpen(false);
          editNoteForm.resetFields();
          setEditingNote(null);
        }}
        okText="Enregistrer"
        cancelText="Annuler"
        width={700}
      >
        <AssetNoteForm form={editNoteForm} />
      </Modal>

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
    </div>
  );
};
