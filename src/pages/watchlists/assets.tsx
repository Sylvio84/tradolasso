import { useState, useEffect, useCallback, useRef } from "react";
import { useShow, useInvalidate } from "@refinedev/core";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { List, Typography, Space, Tooltip, Button, Spin, Empty, Result, theme, Grid, Dropdown, App, Modal, Form, Input } from "antd";
import type { MenuProps } from "antd";
import {
  DownOutlined,
  EditOutlined,
  AppstoreOutlined,
  CopyOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  DragOutlined,
} from "@ant-design/icons";
import { AssetDetailsPanel } from "../../components/asset-details";
import { useFilterContext } from "../../contexts/filter-context";
import { http } from "../../providers/hydra";
import "flag-icons/css/flag-icons.min.css";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface WatchlistAssetColor {
  value: string;
  label: string;
  hexCode: string;
  marketLabel: string;
}

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
  color?: string | null;
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
  const { modal, message } = App.useApp();
  const invalidate = useInvalidate();

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [localAssets, setLocalAssets] = useState<WatchlistAssetEmbedded[]>([]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    assetId: number | null;
  }>({ visible: false, x: 0, y: 0, assetId: null });

  // Duplicate modal state
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateForm] = Form.useForm();

  const {
    query: { data, isLoading },
  } = useShow({
    resource: "watchlists",
    id: id,
  });

  // Load watchlist asset colors from API
  const [flagColors, setFlagColors] = useState<WatchlistAssetColor[]>([]);
  const [colorsLoading, setColorsLoading] = useState(true);

  useEffect(() => {
    const loadColors = async () => {
      try {
        const response = await http('/watchlist_asset_colors?pagination=false');
        const data = response.data;
        // Extract from Hydra response
        const colors = data.member || data['hydra:member'] || [];
        setFlagColors(colors);
      } catch (error) {
        console.error('Failed to load colors:', error);
      } finally {
        setColorsLoading(false);
      }
    };
    loadColors();
  }, []);

  const watchlist = data?.data as Watchlist | undefined;
  const assets = watchlist?.assets || [];

  // Sync local assets with fetched data
  useEffect(() => {
    if (assets.length > 0) {
      setLocalAssets(assets);
    }
  }, [assets]);

  // Hide FilterSider on this page using context
  useEffect(() => {
    setSiderVisible(false);
    return () => {
      setSiderVisible(true);
    };
  }, [setSiderVisible]);

  // --- Color Mapping Helpers ---
  const getColorValueFromHex = (hexCode: string): string | undefined => {
    return flagColors.find(c => c.hexCode === hexCode)?.value;
  };

  const getColorHexFromValue = (value: string): string | undefined => {
    return flagColors.find(c => c.value === value)?.hexCode;
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Save previous order for rollback on error
    const previousAssets = [...localAssets];

    // Reorder local assets
    const newAssets = [...localAssets];
    const [draggedItem] = newAssets.splice(draggedIndex, 1);
    newAssets.splice(dropIndex, 0, draggedItem);

    // Update positions
    const updatedAssets = newAssets.map((asset, index) => ({
      ...asset,
      position: index,
    }));

    // Update UI optimistically
    setLocalAssets(updatedAssets);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Persist to backend
    try {
      const positions = updatedAssets.map(asset => ({
        id: asset.watchlistAssetId,
        position: asset.position,
      }));

      await http(`/watchlists/${id}/assets/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify({ positions }),
      });

      message.success("Ordre sauvegardé");
      invalidate({ resource: "watchlists", id, invalidates: ["detail"] });
    } catch (error: any) {
      // Rollback on error
      setLocalAssets(previousAssets);
      const errorMsg =
        error?.response?.data?.["hydra:description"] ||
        "Erreur lors de la sauvegarde de l'ordre";
      message.error(errorMsg);
      console.error(error);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // --- Context Menu Handlers ---
  const handleContextMenu = (e: React.MouseEvent, assetId: number) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      assetId,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, assetId: null });
  };

  const handleSetFlag = async (hexCode: string) => {
    if (!contextMenu.assetId) return;

    const asset = localAssets.find((a) => a.asset.id === contextMenu.assetId);
    if (!asset) return;

    const colorValue = getColorValueFromHex(hexCode);
    if (!colorValue) {
      message.error("Couleur invalide");
      return;
    }

    try {
      await http(`/watchlist_assets/${asset.watchlistAssetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify({ color: colorValue }),
      });

      invalidate({ resource: "watchlists", id, invalidates: ["detail"] });
      invalidate({ resource: "watchlist_assets", invalidates: ["all"] });
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.["hydra:description"] ||
        "Erreur lors de la mise à jour de la couleur";
      message.error(errorMsg);
      console.error(error);
    }

    closeContextMenu();
  };

  const handleRemoveFlag = async () => {
    if (!contextMenu.assetId) return;

    const asset = localAssets.find((a) => a.asset.id === contextMenu.assetId);
    if (!asset) return;

    try {
      await http(`/watchlist_assets/${asset.watchlistAssetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify({ color: null }),
      });

      invalidate({ resource: "watchlists", id, invalidates: ["detail"] });
      invalidate({ resource: "watchlist_assets", invalidates: ["all"] });
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.["hydra:description"] ||
        "Erreur lors de la suppression de la couleur";
      message.error(errorMsg);
      console.error(error);
    }

    closeContextMenu();
  };

  // --- Duplicate Watchlist Handler ---
  const handleDuplicate = async (values: { newName: string }) => {
    try {
      const response = await http(`/watchlists/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({ newName: values.newName }),
      });

      const newWatchlistId = response.data?.id;
      message.success("Watchlist dupliquée");

      invalidate({ resource: "watchlists", invalidates: ["all"] });
      invalidate({ resource: "watchlist_assets", invalidates: ["all"] });

      setIsDuplicateModalOpen(false);
      duplicateForm.resetFields();

      // Navigate to new watchlist
      navigate(`/watchlists/assets/${newWatchlistId}`);
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.["hydra:description"] ||
        "Erreur lors de la duplication de la watchlist";
      message.error(errorMsg);
      console.error(error);
    }
  };

  // --- Delete Asset Handler ---
  const handleDeleteAsset = (watchlistAssetId: number, assetName: string) => {
    modal.confirm({
      title: "Supprimer l'actif",
      content: `Êtes-vous sûr de vouloir retirer "${assetName}" de cette watchlist ?`,
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await http(`/watchlist_assets/${watchlistAssetId}`, {
            method: "DELETE",
          });
          message.success("Actif retiré de la watchlist");
          invalidate({ resource: "watchlists", id, invalidates: ["detail"] });
        } catch (error) {
          message.error("Erreur lors de la suppression");
          console.error(error);
        }
      },
    });
  };

  // --- Watchlist Dropdown Menu ---
  const watchlistMenuItems: MenuProps["items"] = [
    {
      key: "rename",
      label: "Renommer",
      icon: <EditOutlined />,
      onClick: () => navigate(`/watchlists/edit/${id}`),
    },
    {
      key: "manage",
      label: "Gérer les actifs",
      icon: <AppstoreOutlined />,
      onClick: () => navigate(`/watchlists/show/${id}`),
    },
    {
      key: "duplicate",
      label: "Dupliquer",
      icon: <CopyOutlined />,
      onClick: () => {
        duplicateForm.setFieldsValue({ newName: `Copie de ${watchlist?.name}` });
        setIsDuplicateModalOpen(true);
      },
    },
    {
      key: "share",
      label: "Partager",
      icon: <ShareAltOutlined />,
      onClick: () => message.info("Fonctionnalité à venir"),
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      label: "Supprimer",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        modal.confirm({
          title: "Supprimer la watchlist",
          content: `Êtes-vous sûr de vouloir supprimer "${watchlist?.name}" ?`,
          okText: "Supprimer",
          okType: "danger",
          cancelText: "Annuler",
          onOk: async () => {
            try {
              await http(`/watchlists/${id}`, { method: "DELETE" });
              message.success("Watchlist supprimée");
              navigate("/watchlists");
            } catch (error) {
              message.error("Erreur lors de la suppression");
              console.error(error);
            }
          },
        });
      },
    },
  ];

  // Simplified URL sync logic
  useEffect(() => {
    if (localAssets.length === 0) return;

    const assetIdFromUrl = searchParams.get("assetId");
    const urlAssetId = assetIdFromUrl ? Number(assetIdFromUrl) : null;

    // Check if URL asset exists in watchlist
    const assetExists = urlAssetId && localAssets.some(a => a.asset.id === urlAssetId);

    if (assetExists) {
      setSelectedAssetId(urlAssetId);
    } else {
      // Default to first asset
      const firstId = localAssets[0].asset.id;
      setSelectedAssetId(firstId);
      setSearchParams({ assetId: String(firstId) }, { replace: true });
    }
  }, [localAssets, searchParams, setSearchParams]);

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
      if (!selectedAssetId || localAssets.length === 0) return;

      const currentIndex = localAssets.findIndex(a => a.asset.id === selectedAssetId);
      let newIndex = currentIndex;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, localAssets.length - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
      }

      if (newIndex !== currentIndex) {
        handleAssetClick(localAssets[newIndex].asset.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAssetId, localAssets, handleAssetClick]);

  // Close context menu on click outside
  useEffect(() => {
    if (contextMenu.visible) {
      const handleClick = () => closeContextMenu();
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu.visible]);

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
  if (localAssets.length === 0 && !isLoading) {
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
          <div
            style={{
              marginBottom: token.marginMD,
              paddingBottom: token.paddingSM,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Dropdown menu={{ items: watchlistMenuItems }} trigger={["click"]}>
              <Button
                type="text"
                style={{
                  padding: `${token.paddingXS}px ${token.paddingSM}px`,
                  height: "auto",
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Space size={4}>
                  <Text strong style={{ fontSize: token.fontSizeLG }}>
                    {watchlist.name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                    ({localAssets.length})
                  </Text>
                </Space>
                <DownOutlined style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary }} />
              </Button>
            </Dropdown>
          </div>

          <div role="listbox" aria-label="Liste des actifs">
            <List
              dataSource={localAssets}
              renderItem={(item: WatchlistAssetEmbedded, index: number) => {
                const isSelected = selectedAssetId === item.asset.id;
                const flagColor = item.color ? getColorHexFromValue(item.color) : undefined;
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <div
                    key={item.watchlistAssetId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onContextMenu={(e) => handleContextMenu(e, item.asset.id)}
                    style={{
                      opacity: isDragging ? 0.5 : 1,
                      borderTop: isDragOver ? `2px solid ${token.colorPrimary}` : "2px solid transparent",
                      transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <List.Item
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
                        cursor: "grab",
                        backgroundColor: isSelected ? token.colorPrimaryBg : "transparent",
                        borderLeft: isSelected
                          ? `3px solid ${token.colorPrimary}`
                          : `3px solid transparent`,
                        padding: token.paddingXS,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        borderRadius: token.borderRadiusSM,
                        marginBottom: token.marginXS,
                        position: "relative",
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
                          .asset-list-item:active {
                            cursor: grabbing;
                          }
                          .drag-handle {
                            opacity: 0;
                            transition: opacity 0.15s;
                          }
                          .asset-list-item:hover .drag-handle {
                            opacity: 0.6;
                          }
                        `}
                      </style>
                      <Tooltip title={item.asset.name} mouseEnterDelay={0.1}>
                        <div style={{ display: "flex", alignItems: "center", gap: token.marginXS, width: "100%" }}>
                          <Space size={4} align="center">
                            <DragOutlined
                              className="drag-handle"
                              style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary }}
                            />
                            {item.asset.countryCode && (
                              <span
                                className={`fi fi-${item.asset.countryCode.toLowerCase()}`}
                                style={{ fontSize: "16px", lineHeight: 1 }}
                                aria-label={`Pays: ${item.asset.countryCode}`}
                              />
                            )}
                          </Space>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text strong style={{ color: token.colorText, lineHeight: 1.2, fontSize: token.fontSize }}>
                              {item.asset.symbol}
                            </Text>
                          </div>
                          {flagColor && (
                            <Tooltip title={flagColors.find(c => c.hexCode === flagColor)?.marketLabel || ""} mouseEnterDelay={0.1}>
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: "50%",
                                  backgroundColor: flagColor,
                                  flexShrink: 0,
                                }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </Tooltip>
                    </List.Item>
                  </div>
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

      {/* Context Menu for Color Flags */}
      {contextMenu.visible && (
        <>
          {/* Backdrop to close menu */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999,
            }}
            onClick={(e) => {
              e.stopPropagation();
              closeContextMenu();
            }}
          />
          {/* Menu */}
          <div
            style={{
              position: "fixed",
              zIndex: 1000,
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: token.colorBgElevated,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: token.borderRadiusLG,
              boxShadow: token.boxShadowSecondary,
              padding: token.paddingSM,
              minWidth: 200,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Color Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: token.marginXS,
                padding: token.paddingXS,
              }}
            >
              {flagColors.map((color) => (
                <Tooltip key={color.value} title={color.marketLabel} placement="top" mouseEnterDelay={0.1}>
                  <button
                    onClick={() => handleSetFlag(color.hexCode)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      padding: token.paddingXXS,
                      background: "transparent",
                      border: "none",
                      borderRadius: token.borderRadiusSM,
                      cursor: "pointer",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = token.colorBgTextHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: color.hexCode,
                        border:
                          contextMenu.assetId &&
                          localAssets.find(a => a.asset.id === contextMenu.assetId)?.color === color.value
                            ? `2px solid ${token.colorBgContainer}`
                            : "2px solid transparent",
                        boxShadow:
                          contextMenu.assetId &&
                          localAssets.find(a => a.asset.id === contextMenu.assetId)?.color === color.value
                            ? `0 0 0 2px ${token.colorPrimary}`
                            : "none",
                      }}
                    />
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 10,
                        textAlign: "center",
                        lineHeight: 1.2,
                        maxWidth: 70,
                      }}
                    >
                      {color.marketLabel}
                    </Text>
                  </button>
                </Tooltip>
              ))}
            </div>

            {/* Remove flag option */}
            {contextMenu.assetId && localAssets.find(a => a.asset.id === contextMenu.assetId)?.color && (
              <>
                <div style={{ borderTop: `1px solid ${token.colorBorder}`, margin: `${token.marginXS}px 0` }} />
                <Button
                  type="text"
                  block
                  size="small"
                  onClick={handleRemoveFlag}
                  style={{ justifyContent: "flex-start" }}
                >
                  Retirer le flag
                </Button>
              </>
            )}

            {/* Additional context menu actions */}
            <div style={{ borderTop: `1px solid ${token.colorBorder}`, margin: `${token.marginXS}px 0` }} />
            <Button
              type="text"
              block
              size="small"
              onClick={() => {
                // Navigate to asset details or open in new tab
                closeContextMenu();
                message.info("Fonctionnalité à venir");
              }}
              style={{ justifyContent: "flex-start" }}
            >
              Ouvrir dans V.I.S.
            </Button>
            <Button
              type="text"
              danger
              block
              size="small"
              onClick={() => {
                if (contextMenu.assetId) {
                  const asset = localAssets.find((a) => a.asset.id === contextMenu.assetId);
                  if (asset) {
                    handleDeleteAsset(asset.watchlistAssetId, asset.asset.symbol);
                  }
                }
                closeContextMenu();
              }}
              style={{ justifyContent: "flex-start" }}
            >
              Supprimer de la liste
            </Button>
          </div>
        </>
      )}

      {/* Duplicate Watchlist Modal */}
      <Modal
        title="Dupliquer la watchlist"
        open={isDuplicateModalOpen}
        onCancel={() => {
          setIsDuplicateModalOpen(false);
          duplicateForm.resetFields();
        }}
        onOk={() => duplicateForm.submit()}
        okText="Dupliquer"
        cancelText="Annuler"
      >
        <Form
          form={duplicateForm}
          layout="vertical"
          onFinish={handleDuplicate}
        >
          <Form.Item
            name="newName"
            label="Nom de la nouvelle watchlist"
            rules={[
              { required: true, message: "Le nom est requis" },
              { max: 100, message: "Le nom ne peut pas dépasser 100 caractères" },
            ]}
          >
            <Input placeholder="Entrez le nom de la watchlist" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
