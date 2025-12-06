import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { type BaseRecord, type CrudFilters } from "@refinedev/core";
import { Button, Card, Form, Select, Space, Table, Tag, Badge, Typography, Switch } from "antd";
import { ClearOutlined, SearchOutlined, RobotOutlined, UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

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

const STORAGE_KEY = "watchlistFilters";

interface Watchlist extends BaseRecord {
  id: number;
  name: string;
  description?: string | null;
  assetType?: string | null;
  isAutomatic: boolean;
  color?: string | null;
  icon?: string | null;
  position: number;
  status: "pinned" | "normal" | "archived";
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

const formValuesToFilters = (values: Record<string, unknown>): CrudFilters => {
  const filters: CrudFilters = [];

  if (values.status) {
    filters.push({ field: "status", operator: "eq", value: values.status });
  }

  if (values.assetType) {
    filters.push({ field: "assetType", operator: "eq", value: values.assetType });
  }

  if (values.isAutomatic !== undefined && values.isAutomatic !== null) {
    filters.push({ field: "isAutomatic", operator: "eq", value: values.isAutomatic });
  }

  return filters;
};

const getInitialFormValues = (): Record<string, unknown> => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore errors
  }
  return {};
};

export const WatchlistList = () => {
  const { tableProps, searchFormProps } = useTable({
    syncWithLocation: true,
    sorters: {
      initial: [{ field: "position", order: "asc" }],
    },
    onSearch: (values: Record<string, unknown>) => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      return formValuesToFilters(values);
    },
  });

  return (
    <List>
      <div style={{ display: "flex", gap: 16 }}>
        {/* Sidebar filters */}
        <Card
          title="Filtres"
          style={{ width: 300, flexShrink: 0 }}
          size="small"
        >
          <Form
            {...searchFormProps}
            layout="vertical"
            initialValues={getInitialFormValues()}
          >
            <Form.Item name="status" label="Statut">
              <Select
                allowClear
                placeholder="Tous les statuts"
                options={STATUS_OPTIONS.map(opt => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </Form.Item>

            <Form.Item name="assetType" label="Type d'actifs">
              <Select
                allowClear
                placeholder="Tous les types"
                options={ASSET_TYPE_OPTIONS.map(opt => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </Form.Item>

            <Form.Item name="isAutomatic" label="Type de watchlist" valuePropName="checked">
              <Switch
                checkedChildren="Automatique"
                unCheckedChildren="Manuelle"
              />
            </Form.Item>

            <Space>
              <Button
                htmlType="submit"
                type="primary"
                icon={<SearchOutlined />}
              >
                Filtrer
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={() => {
                  searchFormProps.form?.resetFields();
                  sessionStorage.removeItem(STORAGE_KEY);
                  searchFormProps.form?.submit();
                }}
              >
                Réinitialiser
              </Button>
            </Space>
          </Form>
        </Card>

        {/* Main table */}
        <div style={{ flex: 1 }}>
          <Table {...tableProps} rowKey="id">
            <Table.Column
              title="Nom"
              dataIndex="name"
              render={(_, record: Watchlist) => (
                <Space>
                  {record.color && (
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: record.color,
                      }}
                    />
                  )}
                  <strong>{record.name}</strong>
                </Space>
              )}
            />

            <Table.Column
              title="Type"
              render={(_, record: Watchlist) => (
                <Tag color={record.isAutomatic ? "green" : "blue"}>
                  {record.isAutomatic ? (
                    <>
                      <RobotOutlined /> Automatique
                    </>
                  ) : (
                    <>
                      <UserOutlined /> Manuelle
                    </>
                  )}
                </Tag>
              )}
            />

            <Table.Column
              title="Type d'actifs"
              dataIndex="assetType"
              render={(value) => {
                if (!value) return <Text type="secondary">Tous</Text>;
                const option = ASSET_TYPE_OPTIONS.find((o) => o.value === value);
                return <Tag color={option?.color}>{option?.label}</Tag>;
              }}
            />

            <Table.Column
              title="Nombre d'actifs"
              dataIndex="assetCount"
              align="right"
            />

            <Table.Column
              title="Statut"
              dataIndex="status"
              render={(value) => {
                const option = STATUS_OPTIONS.find((o) => o.value === value);
                return <Badge status={option?.badge as any} text={option?.label} />;
              }}
            />

            <Table.Column
              title="Actions"
              dataIndex="actions"
              render={(_, record: Watchlist) => (
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
