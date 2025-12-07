import { Button, Form, Select, Space, Switch } from "antd";
import { ClearOutlined, SearchOutlined } from "@ant-design/icons";
import { FilterContainer } from "./FilterContainer";
import type { FilterComponentProps } from "../layout/FilterSider";

// Asset type options
const ASSET_TYPE_OPTIONS = [
  { value: "stock", label: "Actions" },
  { value: "fund", label: "Fonds" },
  { value: "crypto", label: "Cryptomonnaies" },
  { value: "bond", label: "Obligations" },
  { value: "commodity", label: "Matières premières" },
  { value: "real_estate", label: "Immobilier" },
  { value: "forex", label: "Devises" },
  { value: "cash_account", label: "Comptes de trésorerie" },
];

// Status options
const STATUS_OPTIONS = [
  { value: "pinned", label: "Épinglée" },
  { value: "normal", label: "Normale" },
  { value: "archived", label: "Archivée" },
];

export const WatchlistsFilter: React.FC<FilterComponentProps> = ({
  searchFormProps,
  onReset,
}) => {
  return (
    <FilterContainer
      extra={
        <Button size="small" icon={<ClearOutlined />} onClick={onReset}>
          Reset
        </Button>
      }
    >
      <Form {...searchFormProps} layout="vertical" size="small">
        <Form.Item name="status" label="Statut">
          <Select
            allowClear
            placeholder="Tous les statuts"
            options={STATUS_OPTIONS}
          />
        </Form.Item>

        <Form.Item name="assetType" label="Type d'actifs">
          <Select
            allowClear
            placeholder="Tous les types"
            options={ASSET_TYPE_OPTIONS}
          />
        </Form.Item>

        <Form.Item
          name="isAutomatic"
          label="Type de watchlist"
          valuePropName="checked"
        >
          <Switch
            checkedChildren="Automatique"
            unCheckedChildren="Manuelle"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
          <Space style={{ width: "100%" }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SearchOutlined />}
              block
            >
              Filtrer
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </FilterContainer>
  );
};
