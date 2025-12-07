import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Form,
  InputNumber,
  Select,
  Space,
  Modal,
  Input,
  App,
  Divider,
  Typography,
  Alert,
  theme,
} from "antd";
import {
  ClearOutlined,
  SearchOutlined,
  PlusOutlined,
  SaveOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import { useList, useInvalidate } from "@refinedev/core";
import { FilterContainer } from "./FilterContainer";
import { ModeIndicator, type ScreenerMode } from "./ModeIndicator";
import type { FilterComponentProps } from "../layout/FilterSider";
import { http } from "../../providers/hydra";
import isEqual from "lodash/isEqual";

const { Text } = Typography;

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

interface WatchlistCriterias {
  filters?: Record<string, any>;
  order?: Record<string, string>;
  itemsPerPage?: number;
}

interface Watchlist {
  id: number;
  name: string;
  isAutomatic: boolean;
  criterias?: WatchlistCriterias;
}

type FilterValues = Record<string, unknown>;

// Parse criteria to form values
const criteriasToFormValues = (criterias: WatchlistCriterias | undefined): FilterValues => {
  if (!criterias || !criterias.filters) return {};

  const values: FilterValues = {};
  const filters = criterias.filters;

  // Parse range filters
  RANGE_FILTERS.forEach(({ name }) => {
    if (filters[name]) {
      const multiplier = name === "marketcap" ? 1000000 : 1;
      if (filters[name].gte != null) {
        values[`${name}Min`] = filters[name].gte / multiplier;
      }
      if (filters[name].lte != null) {
        values[`${name}Max`] = filters[name].lte / multiplier;
      }
    }
  });

  // Parse country filter
  if (filters.countryCode && Array.isArray(filters.countryCode)) {
    values.countryCode = filters.countryCode;
  }

  return values;
};

// Convert form values to criterias
const formValuesToCriterias = (values: FilterValues): WatchlistCriterias => {
  const filters: Record<string, any> = {};

  // Range filters
  RANGE_FILTERS.forEach(({ name }) => {
    const min = values[`${name}Min`] as number | undefined;
    const max = values[`${name}Max`] as number | undefined;
    if (min != null || max != null) {
      const multiplier = name === "marketcap" ? 1000000 : 1;
      filters[name] = {};
      if (min != null) filters[name].gte = min * multiplier;
      if (max != null) filters[name].lte = max * multiplier;
    }
  });

  // Country filter
  const countryCode = values.countryCode as string[] | undefined;
  if (countryCode && countryCode.length > 0) {
    filters.countryCode = countryCode;
  }

  return {
    filters,
    order: { lassoScore: "desc" },
    itemsPerPage: 50,
  };
};

export const AssetsFilter: React.FC<FilterComponentProps> = ({
  searchFormProps,
  onReset,
}) => {
  const { modal, message } = App.useApp();
  const invalidate = useInvalidate();
  const { token } = theme.useToken();

  // State for mode and watchlist
  const [mode, setMode] = useState<ScreenerMode>("filters");
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  const [originalFilters, setOriginalFilters] = useState<FilterValues | null>(null);

  // Modal states
  const [createAutoModalOpen, setCreateAutoModalOpen] = useState(false);
  const [createManualModalOpen, setCreateManualModalOpen] = useState(false);
  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false);
  const [watchlistName, setWatchlistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load watchlists for stocks
  const { query: watchlistsQuery } = useList<Watchlist>({
    resource: "watchlists",
    filters: [{ field: "assetType", operator: "eq", value: "stock" }],
    pagination: { mode: "off" },
  });

  const watchlists = watchlistsQuery.data?.data || [];
  const refetchWatchlists = watchlistsQuery.refetch;

  // Group watchlists by type
  const { autoWatchlists, manualWatchlists } = useMemo(() => {
    const auto = watchlists.filter((w) => w.isAutomatic);
    const manual = watchlists.filter((w) => !w.isAutomatic);
    return { autoWatchlists: auto, manualWatchlists: manual };
  }, [watchlists]);

  // Get current form values
  const currentFilters = searchFormProps.form?.getFieldsValue() || {};

  // Detect if filters are modified (only in auto mode)
  const filtersModified = useMemo(() => {
    if (mode !== "auto" || !originalFilters) return false;
    return !isEqual(currentFilters, originalFilters);
  }, [mode, originalFilters, currentFilters]);

  // Handle watchlist selection
  const handleWatchlistChange = async (value: number | null) => {
    if (value === null) {
      // Switch to filters mode, keep current filters
      setMode("filters");
      setSelectedWatchlist(null);
      setOriginalFilters(null);
      return;
    }

    const watchlist = watchlists.find((w) => w.id === value);
    if (!watchlist) return;

    setSelectedWatchlist(watchlist);

    if (watchlist.isAutomatic) {
      // Load criteria and apply to filters
      const formValues = criteriasToFormValues(watchlist.criterias);
      searchFormProps.form?.setFieldsValue(formValues);
      setOriginalFilters(formValues);
      setMode("auto");

      // Submit form to apply filters
      searchFormProps.form?.submit();
    } else {
      // Manual watchlist - disable filters
      setMode("manual");
      setOriginalFilters(null);

      // Apply watchlist filter
      searchFormProps.form?.setFieldsValue({ watchlist: [value] });
      searchFormProps.form?.submit();
    }
  };

  // Handle reset
  const handleReset = () => {
    setMode("filters");
    setSelectedWatchlist(null);
    setOriginalFilters(null);
    onReset();
  };

  // Create automatic watchlist
  const handleCreateAutoWatchlist = async () => {
    if (!watchlistName.trim()) {
      message.error("Veuillez saisir un nom pour la watchlist");
      return;
    }

    const criterias = formValuesToCriterias(currentFilters);

    setIsCreating(true);
    try {
      await http("/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: watchlistName.trim(),
          assetType: "stock",
          criterias,
          isAutomatic: true,
          status: "normal",
        }),
      });

      message.success("Watchlist automatique créée");
      setCreateAutoModalOpen(false);
      setWatchlistName("");
      refetchWatchlists();
    } catch (error) {
      console.error("Error creating watchlist:", error);
      message.error("Erreur lors de la création de la watchlist");
    } finally {
      setIsCreating(false);
    }
  };

  // Create manual watchlist (saves current displayed assets)
  const handleCreateManualWatchlist = async () => {
    if (!watchlistName.trim()) {
      message.error("Veuillez saisir un nom pour la watchlist");
      return;
    }

    setIsCreating(true);
    try {
      await http("/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: watchlistName.trim(),
          assetType: "stock",
          criterias: [],
          isAutomatic: false,
          status: "normal",
        }),
      });

      message.success("Watchlist manuelle créée (vide). Ajoutez des assets depuis la liste.");
      setCreateManualModalOpen(false);
      setWatchlistName("");
      refetchWatchlists();
    } catch (error) {
      console.error("Error creating watchlist:", error);
      message.error("Erreur lors de la création de la watchlist");
    } finally {
      setIsCreating(false);
    }
  };

  // Save as new automatic watchlist
  const handleSaveAsNew = async () => {
    if (!watchlistName.trim()) {
      message.error("Veuillez saisir un nom pour la watchlist");
      return;
    }

    const criterias = formValuesToCriterias(currentFilters);

    setIsCreating(true);
    try {
      await http("/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: watchlistName.trim(),
          assetType: "stock",
          criterias,
          isAutomatic: true,
          status: "normal",
        }),
      });

      message.success("Nouvelle watchlist créée");
      setSaveAsModalOpen(false);
      setWatchlistName("");
      refetchWatchlists();
    } catch (error) {
      console.error("Error creating watchlist:", error);
      message.error("Erreur lors de la création de la watchlist");
    } finally {
      setIsCreating(false);
    }
  };

  // Update existing automatic watchlist
  const handleUpdateWatchlist = async () => {
    if (!selectedWatchlist) return;

    const criterias = formValuesToCriterias(currentFilters);

    modal.confirm({
      title: "Mettre à jour la watchlist",
      content: `Voulez-vous mettre à jour "${selectedWatchlist.name}" avec les filtres actuels ?`,
      okText: "Mettre à jour",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await http(`/watchlists/${selectedWatchlist.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/merge-patch+json" },
            body: JSON.stringify({ criterias }),
          });

          message.success("Watchlist mise à jour");
          setOriginalFilters(currentFilters);
          refetchWatchlists();
          invalidate({ resource: "watchlists", invalidates: ["detail"] });
        } catch (error) {
          console.error("Error updating watchlist:", error);
          message.error("Erreur lors de la mise à jour");
        }
      },
    });
  };

  // Delete watchlist
  const handleDeleteWatchlist = async () => {
    if (!selectedWatchlist) return;

    modal.confirm({
      title: "Supprimer la watchlist",
      content: `Voulez-vous vraiment supprimer "${selectedWatchlist.name}" ?`,
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await http(`/watchlists/${selectedWatchlist.id}`, {
            method: "DELETE",
          });

          message.success("Watchlist supprimée");
          handleReset();
          refetchWatchlists();
          invalidate({ resource: "watchlists", invalidates: ["list"] });
        } catch (error) {
          console.error("Error deleting watchlist:", error);
          message.error("Erreur lors de la suppression");
        }
      },
    });
  };

  // Filters are disabled in manual mode
  const filtersDisabled = mode === "manual";

  return (
    <FilterContainer
      extra={
        <Button size="small" icon={<ClearOutlined />} onClick={handleReset}>
          Reset
        </Button>
      }
    >
      {/* Mode Indicator */}
      <ModeIndicator
        mode={mode}
        watchlistName={selectedWatchlist?.name}
        isModified={filtersModified}
      />

      {/* Watchlist Selector */}
      <Form.Item label="Watchlist">
        <Select
          value={selectedWatchlist?.id ?? "__none__"}
          onChange={(value) => handleWatchlistChange(value === "__none__" ? null : value as number)}
          placeholder="Sélectionner une watchlist"
          allowClear={false}
          style={{ width: "100%" }}
        >
          <Select.Option value="__none__">
            <Space>
              <ClearOutlined />
              Aucune (filtres libres)
            </Space>
          </Select.Option>

          {autoWatchlists.length > 0 && (
            <Select.OptGroup label="AUTOMATIQUES">
              {autoWatchlists.map((w) => (
                <Select.Option key={w.id} value={w.id}>
                  <Space>
                    <ThunderboltOutlined />
                    {w.name}
                  </Space>
                </Select.Option>
              ))}
            </Select.OptGroup>
          )}

          {manualWatchlists.length > 0 && (
            <Select.OptGroup label="MANUELLES">
              {manualWatchlists.map((w) => (
                <Select.Option key={w.id} value={w.id}>
                  <Space>
                    <PushpinOutlined />
                    {w.name}
                  </Space>
                </Select.Option>
              ))}
            </Select.OptGroup>
          )}
        </Select>
      </Form.Item>

      <Divider style={{ margin: "12px 0" }} />

      {/* Filters disabled message in manual mode */}
      {filtersDisabled && (
        <Alert
          message="Filtres désactivés en mode watchlist manuelle"
          type="warning"
          showIcon={false}
          style={{ marginBottom: 16, fontSize: "12px" }}
        />
      )}

      {/* Filter Form */}
      <Form {...searchFormProps} layout="vertical" size="small">
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
              disabled={filtersDisabled}
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
                  disabled={filtersDisabled}
                />
              </Form.Item>
              <Form.Item name={`${name}Max`} noStyle>
                <InputNumber
                  placeholder="Max"
                  min={min}
                  max={max}
                  style={{ width: "50%" }}
                  disabled={filtersDisabled}
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        ))}

        {!filtersDisabled && (
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
        )}
      </Form>

      <Divider style={{ margin: "16px 0" }} />

      {/* Contextual Actions */}
      <Space direction="vertical" style={{ width: "100%" }}>
        {mode === "filters" && (
          <>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setCreateAutoModalOpen(true)}
              block
            >
              Créer watchlist automatique
            </Button>
            <Button
              icon={<SaveOutlined />}
              onClick={() => setCreateManualModalOpen(true)}
              block
            >
              Créer watchlist manuelle
            </Button>
          </>
        )}

        {mode === "auto" && (
          <>
            {filtersModified && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleUpdateWatchlist}
                block
              >
                Mettre à jour {selectedWatchlist?.name}
              </Button>
            )}
            <Button
              icon={<PlusOutlined />}
              onClick={() => setSaveAsModalOpen(true)}
              block
            >
              Sauver comme nouvelle...
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteWatchlist}
              block
            >
              Supprimer watchlist
            </Button>
          </>
        )}

        {mode === "manual" && (
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteWatchlist}
            block
          >
            Supprimer watchlist
          </Button>
        )}
      </Space>

      {/* Modals */}
      <Modal
        title="Créer une watchlist automatique"
        open={createAutoModalOpen}
        onOk={handleCreateAutoWatchlist}
        onCancel={() => {
          setCreateAutoModalOpen(false);
          setWatchlistName("");
        }}
        confirmLoading={isCreating}
        okText="Créer"
        cancelText="Annuler"
      >
        <p style={{ marginBottom: 16 }}>
          Cette watchlist sera créée avec les filtres actuellement sélectionnés.
        </p>
        <Input
          placeholder="Nom de la watchlist"
          value={watchlistName}
          onChange={(e) => setWatchlistName(e.target.value)}
          onPressEnter={handleCreateAutoWatchlist}
          autoFocus
        />
      </Modal>

      <Modal
        title="Créer une watchlist manuelle"
        open={createManualModalOpen}
        onOk={handleCreateManualWatchlist}
        onCancel={() => {
          setCreateManualModalOpen(false);
          setWatchlistName("");
        }}
        confirmLoading={isCreating}
        okText="Créer"
        cancelText="Annuler"
      >
        <p style={{ marginBottom: 16 }}>
          Une watchlist manuelle vide sera créée. Vous pourrez y ajouter des assets manuellement depuis la liste.
        </p>
        <Input
          placeholder="Nom de la watchlist"
          value={watchlistName}
          onChange={(e) => setWatchlistName(e.target.value)}
          onPressEnter={handleCreateManualWatchlist}
          autoFocus
        />
      </Modal>

      <Modal
        title="Sauver comme nouvelle watchlist"
        open={saveAsModalOpen}
        onOk={handleSaveAsNew}
        onCancel={() => {
          setSaveAsModalOpen(false);
          setWatchlistName("");
        }}
        confirmLoading={isCreating}
        okText="Créer"
        cancelText="Annuler"
      >
        <p style={{ marginBottom: 16 }}>
          Créer une nouvelle watchlist automatique avec les filtres actuels.
        </p>
        <Input
          placeholder="Nom de la watchlist"
          value={watchlistName}
          onChange={(e) => setWatchlistName(e.target.value)}
          onPressEnter={handleSaveAsNew}
          autoFocus
        />
      </Modal>
    </FilterContainer>
  );
};
