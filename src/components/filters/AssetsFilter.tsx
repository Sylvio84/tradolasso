import { useState, useEffect } from "react";
import {
  Button,
  Form,
  Select,
  Slider,
  Space,
  Modal,
  Input,
  App,
  Divider,
  Alert,
} from "antd";
import {
  FilterOutlined,
  ReloadOutlined,
  DownOutlined,
  UpOutlined,
  ClearOutlined,
  PlusOutlined,
  SaveOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import { useList, useInvalidate } from "@refinedev/core";
import type { FilterComponentProps } from "../layout/FilterSider";
import { http } from "../../providers/hydra";
import isEqual from "lodash/isEqual";

type ScreenerMode = "filters" | "auto" | "manual";

// Helper to get flag emoji from country code
const getFlagEmoji = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Range filter configuration
interface RangeFilterConfig {
  name: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

const MAIN_FILTERS: RangeFilterConfig[] = [
  { name: "marketcap", label: "Market Cap", min: 0, max: 500, unit: "M€" },
  { name: "adx", label: "ADX", min: 0, max: 100 },
  { name: "atrPercent", label: "Volatility", min: 0, max: 100, unit: "%" },
  { name: "lassoScore", label: "Lasso Score", min: 0, max: 100 },
];

const EXTRA_FILTERS: RangeFilterConfig[] = [
  { name: "visScore", label: "VIS Score", min: 0, max: 100 },
  { name: "globalStars", label: "VIS Stars", min: 0, max: 5, step: 0.5 },
  { name: "zonebourseInvestisseur", label: "ZB Invest", min: 0, max: 100, unit: "%" },
  { name: "fintelScore", label: "Fintel Comp", min: 0, max: 100 },
  { name: "zonebourseScore", label: "ZB Comp", min: 0, max: 100 },
  { name: "piotrosBeneishSloanScore", label: "VIS PBS", min: 0, max: 100 },
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
  [...MAIN_FILTERS, ...EXTRA_FILTERS].forEach(({ name }) => {
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
  [...MAIN_FILTERS, ...EXTRA_FILTERS].forEach(({ name }) => {
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

interface RangeFilterProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  value?: [number, number];
  onChange?: (value: [number, number]) => void;
  disabled?: boolean;
}

const RangeFilter: React.FC<RangeFilterProps> = ({
  label,
  min,
  max,
  step = 1,
  unit = "",
  value = [min, max],
  onChange,
  disabled = false,
}) => {
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        {label}
        {unit && value && ` (${value[0]}${unit} - ${value[1]}${unit})`}
      </div>
      <Slider
        range
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};

export const AssetsFilter: React.FC<FilterComponentProps> = ({
  searchFormProps,
  onReset,
}) => {
  const [showMore, setShowMore] = useState(false);
  const { modal, message } = App.useApp();
  const invalidate = useInvalidate();

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

  // State for countries
  const [countryOptions, setCountryOptions] = useState<Array<{ value: string; label: string }>>([]);

  // Load watchlists for stocks
  const { query: watchlistsQuery } = useList<Watchlist>({
    resource: "watchlists",
    filters: [{ field: "assetType", operator: "eq", value: "stock" }],
    pagination: { mode: "off" },
  });

  const watchlists = watchlistsQuery.data?.data || [];
  const refetchWatchlists = watchlistsQuery.refetch;

  // Fetch countries from API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await http("/countries?assetType=stock", {
          method: "GET",
        });

        // Transform {"US": "United States", "FR": "France"} to [{value: "US", label: "🇺🇸 United States"}, ...]
        const countries = Object.entries(response.data as Record<string, string>).map(
          ([code, name]) => ({
            value: code,
            label: `${getFlagEmoji(code)} ${name}`,
          })
        );

        // Sort by label
        countries.sort((a, b) => a.label.localeCompare(b.label));

        setCountryOptions(countries);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

    fetchCountries();
  }, []);

  // Get current form values
  const currentFilters = searchFormProps.form?.getFieldsValue() || {};

  // Detect if filters are modified (only in auto mode)
  const filtersModified = mode === "auto" && originalFilters ? !isEqual(currentFilters, originalFilters) : false;

  // Watch form values to count active filters
  const formValues = Form.useWatch([], searchFormProps.form) || {};

  const countActiveFilters = () => {
    let count = 0;

    // Count country filter
    if (formValues.countryCode && formValues.countryCode.length > 0) count++;

    // Count range filters
    [...MAIN_FILTERS, ...EXTRA_FILTERS].forEach(({ name, min, max }) => {
      const minVal = formValues[`${name}Min`];
      const maxVal = formValues[`${name}Max`];
      if (minVal !== undefined || maxVal !== undefined) {
        if (minVal !== min || maxVal !== max) count++;
      }
    });

    return count;
  };

  const activeCount = countActiveFilters();

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

      message.success("Filtrage créé avec succès");
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

      message.success("Nouveau filtrage créé");
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
      title: "Mettre à jour le filtrage",
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

          message.success("Filtrage mis à jour");
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

    const isAuto = selectedWatchlist.isAutomatic;
    const itemType = isAuto ? "filtrage" : "watchlist";
    const itemTypeCapitalized = isAuto ? "Filtrage" : "Watchlist";

    modal.confirm({
      title: `Supprimer ${isAuto ? "le" : "la"} ${itemType}`,
      content: `Voulez-vous vraiment supprimer "${selectedWatchlist.name}" ?`,
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await http(`/watchlists/${selectedWatchlist.id}`, {
            method: "DELETE",
          });

          message.success(`${itemTypeCapitalized} ${isAuto ? "supprimé" : "supprimée"}`);
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

  // Group watchlists by type
  const autoWatchlists = watchlists.filter((w) => w.isAutomatic);
  const manualWatchlists = watchlists.filter((w) => !w.isAutomatic);

  return (
    <div>
      {/* Header */}
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
        <Space>
          <FilterOutlined />
          <span>
            Filtres
            {activeCount > 0 && ` (${activeCount})`}
          </span>
        </Space>
        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={handleReset}
          size="small"
        >
          Reset
        </Button>
      </Space>

      {/* Watchlist Selector */}
      <Form.Item style={{ marginBottom: 16 }}>
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
              Filtres libres
            </Space>
          </Select.Option>

          {autoWatchlists.length > 0 && (
            <Select.OptGroup label="MES FILTRAGES">
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
            <Select.OptGroup label="MES WATCHLISTS">
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

      <Form {...searchFormProps} layout="vertical">
        {/* Pays */}
        <Form.Item label="Pays" name="countryCode">
          <Select
            mode="multiple"
            placeholder="🌍 Tous les pays"
            options={countryOptions}
            optionFilterProp="label"
            allowClear
            maxTagCount={2}
            disabled={filtersDisabled}
            loading={countryOptions.length === 0}
          />
        </Form.Item>

        {/* Filtres principaux */}
        {MAIN_FILTERS.map((config) => (
          <Form.Item
            key={config.name}
            noStyle
            shouldUpdate={(prev, curr) =>
              prev[`${config.name}Min`] !== curr[`${config.name}Min`] ||
              prev[`${config.name}Max`] !== curr[`${config.name}Max`]
            }
          >
            {({ getFieldValue, setFieldsValue }) => {
              const minVal = getFieldValue(`${config.name}Min`) ?? config.min;
              const maxVal = getFieldValue(`${config.name}Max`) ?? config.max;
              return (
                <RangeFilter
                  {...config}
                  value={[minVal, maxVal]}
                  onChange={(value) => {
                    setFieldsValue({
                      [`${config.name}Min`]: value[0],
                      [`${config.name}Max`]: value[1],
                    });
                  }}
                  disabled={filtersDisabled}
                />
              );
            }}
          </Form.Item>
        ))}

        {/* Plus de filtres - Collapsible */}
        <Button
          type="link"
          onClick={() => setShowMore(!showMore)}
          icon={showMore ? <UpOutlined /> : <DownOutlined />}
          style={{ marginBottom: 16, padding: 0 }}
        >
          Plus de filtres ({EXTRA_FILTERS.length})
        </Button>

        {showMore && (
          <div>
            {EXTRA_FILTERS.map((config) => (
              <Form.Item
                key={config.name}
                noStyle
                shouldUpdate={(prev, curr) =>
                  prev[`${config.name}Min`] !== curr[`${config.name}Min`] ||
                  prev[`${config.name}Max`] !== curr[`${config.name}Max`]
                }
              >
                {({ getFieldValue, setFieldsValue }) => {
                  const minVal = getFieldValue(`${config.name}Min`) ?? config.min;
                  const maxVal = getFieldValue(`${config.name}Max`) ?? config.max;
                  return (
                    <RangeFilter
                      {...config}
                      value={[minVal, maxVal]}
                      onChange={(value) => {
                        setFieldsValue({
                          [`${config.name}Min`]: value[0],
                          [`${config.name}Max`]: value[1],
                        });
                      }}
                      disabled={filtersDisabled}
                    />
                  );
                }}
              </Form.Item>
            ))}
          </div>
        )}

        {/* Bouton Appliquer */}
        {!filtersDisabled && (
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<FilterOutlined />}
              block
            >
              Appliquer les filtres
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
              Créer un nouveau filtrage
            </Button>
            <Button
              icon={<SaveOutlined />}
              onClick={() => setCreateManualModalOpen(true)}
              block
            >
              Créer une nouvelle watchlist
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
                Mettre à jour ce filtrage
              </Button>
            )}
            <Button
              icon={<PlusOutlined />}
              onClick={() => setSaveAsModalOpen(true)}
              block
            >
              Sauver comme nouveau filtrage
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteWatchlist}
              block
            >
              Supprimer ce filtrage
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
            Supprimer cette watchlist
          </Button>
        )}
      </Space>

      {/* Modals */}
      <Modal
        title="Sauver comme nouveau filtrage"
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
          Ce filtrage sera créé avec les critères actuellement sélectionnés.
        </p>
        <Input
          placeholder="Nom du filtrage"
          value={watchlistName}
          onChange={(e) => setWatchlistName(e.target.value)}
          onPressEnter={handleCreateAutoWatchlist}
          autoFocus
        />
      </Modal>

      <Modal
        title="Créer une nouvelle watchlist"
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
          Une watchlist vide sera créée. Vous pourrez y ajouter des assets manuellement depuis la liste.
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
        title="Sauver comme nouveau filtrage"
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
          Créer un nouveau filtrage avec les critères actuels.
        </p>
        <Input
          placeholder="Nom du filtrage"
          value={watchlistName}
          onChange={(e) => setWatchlistName(e.target.value)}
          onPressEnter={handleSaveAsNew}
          autoFocus
        />
      </Modal>
    </div>
  );
};
