import { useState, useEffect, useCallback, useRef } from "react";
import { useShow } from "@refinedev/core";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { List, Typography, Space, Tooltip, Button, Spin, Empty, Result, theme, Grid } from "antd";
import { AssetDetailsPanel } from "../../components/asset-details";
import { useFilterContext } from "../../contexts/filter-context";
import "flag-icons/css/flag-icons.min.css";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

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

export const WatchlistAssets = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [assetLoading, setAssetLoading] = useState(false);
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const { setSiderVisible } = useFilterContext();
  const listRef = useRef<HTMLDivElement>(null);

  const {
    query: { data, isLoading },
  } = useShow({
    resource: "watchlists",
    id: id,
  });

  const watchlist = data?.data as Watchlist | undefined;
  const assets = watchlist?.assets || [];

  // Hide FilterSider on this page using context
  useEffect(() => {
    setSiderVisible(false);
    return () => {
      setSiderVisible(true);
    };
  }, [setSiderVisible]);

  // Simplified URL sync logic
  useEffect(() => {
    if (assets.length === 0) return;

    const assetIdFromUrl = searchParams.get("assetId");
    const urlAssetId = assetIdFromUrl ? Number(assetIdFromUrl) : null;

    // Check if URL asset exists in watchlist
    const assetExists = urlAssetId && assets.some(a => a.asset.id === urlAssetId);

    if (assetExists) {
      setSelectedAssetId(urlAssetId);
    } else {
      // Default to first asset
      const firstId = assets[0].asset.id;
      setSelectedAssetId(firstId);
      setSearchParams({ assetId: String(firstId) }, { replace: true });
    }
  }, [assets, searchParams, setSearchParams]);

  const handleAssetClick = useCallback((assetId: number) => {
    setAssetLoading(true);
    setSelectedAssetId(assetId);
    setSearchParams({ assetId: String(assetId) });
    // Simulate loading for smooth transition
    setTimeout(() => setAssetLoading(false), 150);
  }, [setSearchParams]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedAssetId || assets.length === 0) return;

      const currentIndex = assets.findIndex(a => a.asset.id === selectedAssetId);
      let newIndex = currentIndex;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, assets.length - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
      }

      if (newIndex !== currentIndex) {
        handleAssetClick(assets[newIndex].asset.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAssetId, assets, handleAssetClick]);

  // Loading state
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Spin size="large" />
      </div>
    );
  }

  // Watchlist not found
  if (!watchlist) {
    return (
      <Result
        status="404"
        title="Watchlist introuvable"
        subTitle="Cette watchlist n'existe pas ou a été supprimée."
        extra={
          <Button type="primary" onClick={() => navigate("/watchlists")}>
            Retour aux watchlists
          </Button>
        }
      />
    );
  }

  // Automatic watchlist restriction
  if (watchlist.isAutomatic) {
    return (
      <Result
        status="warning"
        title="Watchlist automatique"
        subTitle="La vue détaillée n'est disponible que pour les watchlists manuelles."
        extra={
          <Button type="primary" onClick={() => navigate(`/watchlists/show/${id}`)}>
            Retour à la watchlist
          </Button>
        }
      />
    );
  }

  // Empty watchlist
  if (assets.length === 0) {
    return (
      <div
        style={{
          height: "100%",
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Empty description="Aucun actif dans cette watchlist">
          <Button type="primary" onClick={() => navigate(`/watchlists/show/${id}`)}>
            Ajouter des actifs
          </Button>
        </Empty>
      </div>
    );
  }

  // Responsive layout: stack on mobile, side-by-side on desktop
  const isMobile = !screens.md;
  const siderWidth = screens.xl ? 350 : screens.lg ? 320 : 300;

  // Main two-column layout
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        minHeight: "calc(100vh - 64px)",
        overflow: "hidden",
        backgroundColor: token.colorBgContainer,
        margin: screens.sm ? "-24px" : "-12px",
      }}
    >
      {/* Left column: Asset list */}
      <div
        style={{
          width: isMobile ? 0 : siderWidth,
          display: isMobile ? "none" : "block",
          height: "100%",
          overflow: "auto",
          backgroundColor: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          flexShrink: 0,
        }}
      >
        <div style={{ padding: token.paddingSM }} ref={listRef}>
          <Space direction="vertical" style={{ width: "100%", marginBottom: token.marginMD }}>
            <Title level={5} style={{ margin: 0, color: token.colorText }}>
              {watchlist.name}
            </Title>
            <Text type="secondary">{assets.length} actifs</Text>
          </Space>

          <div role="listbox" aria-label="Liste des actifs">
            <List
              dataSource={assets}
              renderItem={(item: WatchlistAssetEmbedded) => {
              const isSelected = selectedAssetId === item.asset.id;
              return (
                <List.Item
                  key={item.watchlistAssetId}
                  onClick={() => handleAssetClick(item.asset.id)}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleAssetClick(item.asset.id);
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    backgroundColor: isSelected
                      ? token.colorPrimaryBg
                      : "transparent",
                    borderLeft: isSelected
                      ? `3px solid ${token.colorPrimary}`
                      : `3px solid transparent`,
                    padding: token.paddingSM,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    borderRadius: token.borderRadiusSM,
                    marginBottom: token.marginXS,
                  }}
                  className="asset-list-item"
                >
                  <style>
                    {`
                      .asset-list-item:hover {
                        background-color: ${isSelected ? token.colorPrimaryBg : token.colorBgTextHover} !important;
                      }
                      .asset-list-item:focus {
                        outline: 2px solid ${token.colorPrimary};
                        outline-offset: 2px;
                      }
                    `}
                  </style>
                  <List.Item.Meta
                    avatar={
                      item.asset.countryCode && (
                        <span
                          className={`fi fi-${item.asset.countryCode.toLowerCase()}`}
                          style={{ fontSize: "20px" }}
                          aria-label={`Pays: ${item.asset.countryCode}`}
                        />
                      )
                    }
                    title={
                      <Space direction="vertical" size={0} style={{ width: "100%" }}>
                        <Text strong style={{ color: token.colorText }}>
                          {item.asset.symbol}
                        </Text>
                        <Tooltip title={item.asset.name}>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: token.fontSizeSM,
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: siderWidth - 100,
                            }}
                          >
                            {item.asset.name}
                          </Text>
                        </Tooltip>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
            />
          </div>
        </div>
      </div>

      {/* Right column: Asset details */}
      <div
        style={{
          flex: 1,
          height: "100%",
          overflow: "auto",
          backgroundColor: token.colorBgContainer,
          position: "relative",
        }}
      >
        {assetLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${token.colorBgContainer}cc`,
              zIndex: 10,
            }}
          >
            <Spin size="large" />
          </div>
        )}
        {selectedAssetId ? (
          <AssetDetailsPanel
            assetId={selectedAssetId}
            contextFrom={`watchlist:${id}`}
          />
        ) : (
          <Empty
            description="Sélectionnez un actif pour voir les détails"
            style={{ marginTop: "100px" }}
          />
        )}
      </div>
    </div>
  );
};
