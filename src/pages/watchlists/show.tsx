import { DateField, Show } from "@refinedev/antd";
import { useShow, useInvalidate } from "@refinedev/core";
import {
  Typography,
  Table,
  Card,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Badge,
  App,
  Descriptions,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  PushpinOutlined,
  InboxOutlined,
  RobotOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { http } from "../../providers/hydra";
import { AddToWatchlistButton } from "../../components/AddToWatchlistButton";
import "flag-icons/css/flag-icons.min.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Asset type options
const ASSET_TYPE_OPTIONS = [
  { value: "stock", label: "Actions", color: "blue" },
  { value: "fund", label: "Fonds", color: "green" },
  { value: "crypto", label: "Cryptomonnaies", color: "purple" },
  { value: "bond", label: "Obligations", color: "orange" },
  { value: "commodity", label: "Matières premières", color: "gold" },
  { value: "real_estate", label: "Immobilier", color: "cyan" },
  { value: "forex", label: "Devises", color: "magenta" },
  { value: "cash_account", label: "Comptes de trésorerie", color: "default" },
];

// Status options
const STATUS_OPTIONS = [
  { value: "pinned", label: "Épinglée", badge: "gold" },
  { value: "normal", label: "Normale", badge: "default" },
  { value: "archived", label: "Archivée", badge: "default" },
];

interface WatchlistAssetEmbedded {
  watchlistAssetId: number;
  asset: {
    id: number;
    symbol: string;
    name: string;
    isin?: string | null;
    countryCode?: string | null;
    currency?: string | null;
    lastPrice?: string | null;
    type: string;
  };
  note?: string | null;
  position: number;
  addedAt: string;
}

interface Watchlist {
  id: number;
  name: string;
  description?: string | null;
  assetType?: string | null;
  criterias?: {
    filters: Record<string, any>;
    order: Record<string, string>;
    itemsPerPage: number;
  } | null;
  isAutomatic: boolean;
  color?: string | null;
  icon?: string | null;
  position: number;
  status: "pinned" | "normal" | "archived";
  lastRefreshedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assetCount: number;
  assets?: WatchlistAssetEmbedded[];
}

interface Asset {
  id: number;
  symbol: string;
  name: string;
  currency: string | null;
  type: string;
}

export const WatchlistShow = () => {
  const { modal, message } = App.useApp();
  const navigate = useNavigate();
  const { query: { data, isLoading } } = useShow({});
  const invalidate = useInvalidate();

  // Modal states
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<WatchlistAssetEmbedded | null>(null);
  const [addAssetForm] = Form.useForm();
  const [editNoteForm] = Form.useForm();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);

  const record = data?.data as Watchlist | undefined;

  useEffect(() => {
    if (record?.name) {
      document.title = `${record.name} | Watchlist`;
    }
  }, [record?.name]);

  // Search assets for dropdown
  const searchAssets = async () => {
    setAssetsLoading(true);
    try {
      const params = new URLSearchParams({
        itemsPerPage: "100",
        pagination: "false",
      });
      const { data } = await http(`/assets?${params}`);
      setAssets(data.member || []);
    } catch (error) {
      message.error("Erreur lors du chargement des actifs");
    } finally {
      setAssetsLoading(false);
    }
  };

  // Toggle pin/unpin
  const handleTogglePin = async () => {
    const newStatus = record?.status === "pinned" ? "normal" : "pinned";

    try {
      await http(`/watchlists/${record?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({ status: newStatus }),
      });
      message.success(
        newStatus === "pinned" ? "Watchlist épinglée" : "Watchlist désépinglée"
      );
      invalidate({ resource: "watchlists", invalidates: ["all"] });
      invalidate({ resource: "watchlist_assets", invalidates: ["all"] });
    } catch (error) {
      message.error("Erreur lors de la mise à jour");
    }
  };

  // Toggle archive
  const handleToggleArchive = async () => {
    const newStatus = record?.status === "archived" ? "normal" : "archived";

    try {
      await http(`/watchlists/${record?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({ status: newStatus }),
      });
      message.success(
        newStatus === "archived" ? "Watchlist archivée" : "Watchlist désarchivée"
      );
      invalidate({ resource: "watchlists", invalidates: ["all"] });
      invalidate({ resource: "watchlist_assets", invalidates: ["all"] });
    } catch (error) {
      message.error("Erreur lors de la mise à jour");
    }
  };

  // Delete watchlist
  const handleDelete = () => {
    modal.confirm({
      title: "Supprimer la watchlist",
      content:
        "Cette action est irréversible. Tous les actifs associés seront retirés.",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await http(`/watchlists/${record?.id}`, { method: "DELETE" });
          message.success("Watchlist supprimée");
          navigate("/watchlists");
        } catch (error) {
          message.error("Erreur lors de la suppression");
        }
      },
    });
  };

  // Add asset modal
  const handleAddAsset = () => {
    setIsAddAssetModalOpen(true);
    searchAssets();
    addAssetForm.resetFields();
  };

  const handleSaveAsset = async () => {
    try {
      const values = await addAssetForm.validateFields();

      await http(`/watchlist_assets`, {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({
          watchlistId: record?.id,
          assetId: values.assetId,
          note: values.note,
        }),
      });

      message.success("Actif ajouté");
      setIsAddAssetModalOpen(false);
      invalidate({ resource: "watchlists", invalidates: ["all"] });
      invalidate({ resource: "watchlist_assets", invalidates: ["all"] });
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.["hydra:description"] || "Erreur lors de l'ajout";
      message.error(errorMsg);
    }
  };

  // Edit note modal
  const handleEditNote = (asset: WatchlistAssetEmbedded) => {
    setEditingAsset(asset);
    editNoteForm.setFieldsValue({ note: asset.note });
    setIsEditNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    try {
      const values = await editNoteForm.validateFields();

      await http(`/watchlist_assets/${editingAsset?.watchlistAssetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({ note: values.note }),
      });

      message.success("Note mise à jour");
      setIsEditNoteModalOpen(false);
      invalidate({ resource: "watchlists", invalidates: ["all"] });
      invalidate({ resource: "watchlist_assets", invalidates: ["all"] });
    } catch (error) {
      message.error("Erreur lors de la mise à jour");
    }
  };

  // Remove asset
  const handleRemoveAsset = (watchlistAssetId: number, assetSymbol: string) => {
    modal.confirm({
      title: "Retirer l'actif",
      content: `Êtes-vous sûr de vouloir retirer ${assetSymbol} de cette watchlist ?`,
      okText: "Retirer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await http(`/watchlist_assets/${watchlistAssetId}`, {
            method: "DELETE",
          });
          message.success("Actif retiré");
          invalidate({ resource: "watchlists", invalidates: ["all"] });
      invalidate({ resource: "watchlist_assets", invalidates: ["all"] });
        } catch (error) {
          message.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const getAssetTypeOption = (assetType?: string | null) => {
    if (!assetType) return null;
    return ASSET_TYPE_OPTIONS.find((o) => o.value === assetType);
  };

  const getStatusOption = (status: string) => {
    return STATUS_OPTIONS.find((o) => o.value === status);
  };

  return (
    <Show
      isLoading={isLoading}
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <Button
            icon={<PushpinOutlined />}
            onClick={handleTogglePin}
          >
            {record?.status === "pinned" ? "Désépingler" : "Épingler"}
          </Button>
          <Button
            icon={<InboxOutlined />}
            onClick={handleToggleArchive}
          >
            {record?.status === "archived" ? "Désarchiver" : "Archiver"}
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            Supprimer
          </Button>
        </>
      )}
    >
      {/* Watchlist details */}
      <Card title="Informations" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3, lg: 4 }} bordered size="small">
          <Descriptions.Item label="Nom">
            <Space>
              {record?.color && (
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: record.color,
                  }}
                />
              )}
              <Text strong>{record?.name}</Text>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Type">
            <Tag color={record?.isAutomatic ? "green" : "blue"}>
              {record?.isAutomatic ? (
                <>
                  <RobotOutlined /> Automatique
                </>
              ) : (
                <>
                  <UserOutlined /> Manuelle
                </>
              )}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Statut">
            <Badge
              status={getStatusOption(record?.status || "normal")?.badge as any}
              text={getStatusOption(record?.status || "normal")?.label}
            />
          </Descriptions.Item>

          <Descriptions.Item label="Nombre d'actifs">
            <Text strong>{record?.assetCount || 0}</Text>
          </Descriptions.Item>

          {record?.assetType && (
            <Descriptions.Item label="Type d'actifs">
              <Tag color={getAssetTypeOption(record.assetType)?.color}>
                {getAssetTypeOption(record.assetType)?.label}
              </Tag>
            </Descriptions.Item>
          )}

          <Descriptions.Item label="Créée le">
            <DateField value={record?.createdAt} format="DD/MM/YYYY HH:mm" />
          </Descriptions.Item>

          <Descriptions.Item label="Mise à jour le">
            <DateField value={record?.updatedAt} format="DD/MM/YYYY HH:mm" />
          </Descriptions.Item>

          {record?.lastRefreshedAt && (
            <Descriptions.Item label="Dernière actualisation">
              <DateField
                value={record.lastRefreshedAt}
                format="DD/MM/YYYY HH:mm"
              />
            </Descriptions.Item>
          )}

          {record?.description && (
            <Descriptions.Item label="Description" span={{ xs: 1, sm: 2, md: 3, lg: 4 }}>
              <Text>{record.description}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Assets section (Manual watchlists only) */}
      {!record?.isAutomatic && (
        <Card
          title={`Actifs de la watchlist (${record?.assetCount || 0})`}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddAsset}
            >
              Ajouter un actif
            </Button>
          }
        >
          <Table
            dataSource={record?.assets || []}
            rowKey="watchlistAssetId"
            pagination={false}
          >
            <Table.Column
              title="Symbole"
              render={(_, asset: WatchlistAssetEmbedded) => (
                <Space>
                  {asset.asset.countryCode && (
                    <span
                      className={`fi fi-${asset.asset.countryCode.toLowerCase()}`}
                    />
                  )}
                  <strong>{asset.asset.symbol}</strong>
                </Space>
              )}
            />

            <Table.Column title="Nom" dataIndex={["asset", "name"]} />

            <Table.Column
              title="Prix"
              render={(_, asset: WatchlistAssetEmbedded) =>
                asset.asset.lastPrice ? (
                  `${asset.asset.lastPrice} ${asset.asset.currency}`
                ) : (
                  <Text type="secondary">N/A</Text>
                )
              }
            />

            <Table.Column
              title="Note"
              dataIndex="note"
              render={(value) => value || <Text type="secondary">-</Text>}
            />

            <Table.Column
              title="Ajouté le"
              dataIndex="addedAt"
              render={(value) => (
                <DateField value={value} format="DD/MM/YYYY" />
              )}
            />

            <Table.Column
              title="Actions"
              render={(_, asset: WatchlistAssetEmbedded) => (
                <Space>
                  <Link to={`/assets/show/${asset.asset.id}?from=watchlist:${record?.id}`}>
                    <Button size="small" icon={<EyeOutlined />}>
                      Voir
                    </Button>
                  </Link>
                  <AddToWatchlistButton
                    assetId={asset.asset.id}
                    assetSymbol={asset.asset.symbol}
                    size="small"
                  />
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditNote(asset)}
                  >
                    Note
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      handleRemoveAsset(
                        asset.watchlistAssetId,
                        asset.asset.symbol
                      )
                    }
                  >
                    Retirer
                  </Button>
                </Space>
              )}
            />
          </Table>
        </Card>
      )}

      {/* Criterias section (Automatic watchlists only) */}
      {record?.isAutomatic && record?.criterias && (
        <Card title="Critères de filtrage">
          <pre
            style={{
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 4,
              overflow: "auto",
            }}
          >
            {JSON.stringify(record.criterias, null, 2)}
          </pre>
        </Card>
      )}

      {/* Add Asset Modal */}
      <Modal
        title="Ajouter un actif"
        open={isAddAssetModalOpen}
        onOk={handleSaveAsset}
        onCancel={() => setIsAddAssetModalOpen(false)}
        okText="Ajouter"
        cancelText="Annuler"
      >
        <Form form={addAssetForm} layout="vertical">
          <Form.Item
            label="Actif"
            name="assetId"
            rules={[{ required: true, message: "Veuillez sélectionner un actif" }]}
          >
            <Select
              showSearch
              placeholder="Rechercher un actif par symbole"
              optionFilterProp="label"
              loading={assetsLoading}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={assets.map((a) => ({
                value: a.id,
                label: `${a.symbol} - ${a.name}`,
              }))}
            />
          </Form.Item>

          <Form.Item label="Note" name="note">
            <TextArea rows={3} placeholder="Note personnelle (optionnelle)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Note Modal */}
      <Modal
        title="Modifier la note"
        open={isEditNoteModalOpen}
        onOk={handleSaveNote}
        onCancel={() => setIsEditNoteModalOpen(false)}
        okText="Enregistrer"
        cancelText="Annuler"
      >
        <Form form={editNoteForm} layout="vertical">
          <Form.Item label="Note" name="note">
            <TextArea rows={3} placeholder="Note personnelle" />
          </Form.Item>
        </Form>
      </Modal>
    </Show>
  );
};
