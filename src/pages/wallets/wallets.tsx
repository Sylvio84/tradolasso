import { useState, useEffect, useCallback } from "react";
import { useList, useShow } from "@refinedev/core";
import { useNavigate, useSearchParams } from "react-router";
import { List, Typography, Spin, Empty, Result, theme, Grid, Button, Space, Dropdown, App as AntdApp } from "antd";
import type { MenuProps } from "antd";
import {
  DownOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { WalletDetailsPanel } from "../../components/wallet-details";
import { useFilterContext } from "../../contexts/filter-context";
import { http } from "../../providers/hydra";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface Wallet {
  id: number;
  name: string;
  brokerName?: string | null;
  walletLines?: any[];
  createdAt: string;
  totalPurchaseValue?: number;
  totalCurrentValue?: number;
}

export const Wallets = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const { setSiderVisible } = useFilterContext();
  const { modal, message } = AntdApp.useApp();

  const {
    query: { data: walletsData, isLoading: walletsLoading },
  } = useList({
    resource: "wallets",
    pagination: {
      pageSize: 100,
    },
  });

  const wallets = (walletsData?.data || []) as Wallet[];

  // Hide FilterSider on this page using context
  useEffect(() => {
    setSiderVisible(false);
    return () => {
      setSiderVisible(true);
    };
  }, [setSiderVisible]);

  // Simplified URL sync logic
  useEffect(() => {
    if (wallets.length === 0) return;

    const walletIdFromUrl = searchParams.get("walletId");
    const urlWalletId = walletIdFromUrl ? Number(walletIdFromUrl) : null;

    // Check if URL wallet exists
    const walletExists = urlWalletId && wallets.some(w => w.id === urlWalletId);

    if (walletExists) {
      setSelectedWalletId(urlWalletId);
    } else {
      // Default to first wallet
      const firstId = wallets[0].id;
      setSelectedWalletId(firstId);
      setSearchParams({ walletId: String(firstId) }, { replace: true });
    }
  }, [wallets, searchParams, setSearchParams]);

  const handleWalletClick = useCallback((walletId: number) => {
    setWalletLoading(true);
    setSelectedWalletId(walletId);
    setSearchParams({ walletId: String(walletId) });
    // Simulate loading for smooth transition
    setTimeout(() => setWalletLoading(false), 150);
  }, [setSearchParams]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedWalletId || wallets.length === 0) return;

      const currentIndex = wallets.findIndex(w => w.id === selectedWalletId);
      let newIndex = currentIndex;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, wallets.length - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
      }

      if (newIndex !== currentIndex) {
        handleWalletClick(wallets[newIndex].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedWalletId, wallets, handleWalletClick]);

  const handleDeleteWallet = (walletId: number, walletName: string) => {
    modal.confirm({
      title: "Supprimer le wallet",
      content: `Êtes-vous sûr de vouloir supprimer "${walletName}" ?`,
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await http(`/wallets/${walletId}`, {
            method: "DELETE",
          });
          message.success("Wallet supprimé");
          // Refresh will happen automatically via useList
        } catch (error) {
          message.error("Erreur lors de la suppression");
          console.error(error);
        }
      },
    });
  };

  // Loading state
  if (walletsLoading) {
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Spin size="large" />
      </div>
    );
  }

  // Empty wallets
  if (wallets.length === 0 && !walletsLoading) {
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
        <Empty description="Aucun wallet">
          <Button type="primary" onClick={() => navigate("/wallets/create")}>
            Créer un wallet
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
      {/* Left column: Wallet list */}
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
        <div style={{ padding: token.paddingSM }}>
          <div
            style={{
              marginBottom: token.marginMD,
              paddingBottom: token.paddingSM,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Space size={4}>
              <Text strong style={{ fontSize: token.fontSizeLG }}>
                Wallets
              </Text>
              <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                ({wallets.length})
              </Text>
            </Space>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => navigate("/wallets/create")}
            >
              Nouveau
            </Button>
          </div>

          <div role="listbox" aria-label="Liste des wallets">
            <List
              dataSource={wallets}
              renderItem={(wallet: Wallet) => {
                const isSelected = selectedWalletId === wallet.id;

                // Get values from API
                const totalPurchaseValue = wallet.totalPurchaseValue || 0;
                const totalCurrentValue = wallet.totalCurrentValue || 0;

                // Calculate P&L %
                const pnlPercent = totalPurchaseValue > 0
                  ? ((totalCurrentValue - totalPurchaseValue) / totalPurchaseValue) * 100
                  : 0;
                const isPositive = pnlPercent >= 0;

                const menuItems: MenuProps["items"] = [
                  {
                    key: "edit",
                    label: "Modifier",
                    icon: <EditOutlined />,
                    onClick: () => navigate(`/wallets/edit/${wallet.id}`),
                  },
                  {
                    key: "show",
                    label: "Vue détaillée",
                    icon: <FolderOpenOutlined />,
                    onClick: () => navigate(`/wallets/show/${wallet.id}`),
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "delete",
                    label: "Supprimer",
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => handleDeleteWallet(wallet.id, wallet.name),
                  },
                ];

                return (
                  <List.Item
                    key={wallet.id}
                    onClick={() => handleWalletClick(wallet.id)}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleWalletClick(wallet.id);
                      }
                    }}
                    style={{
                      cursor: "pointer",
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
                    className="wallet-list-item"
                  >
                    <style>
                      {`
                        .wallet-list-item:hover {
                          background-color: ${isSelected ? token.colorPrimaryBg : token.colorBgTextHover} !important;
                        }
                        .wallet-list-item:focus {
                          outline: 2px solid ${token.colorPrimary};
                          outline-offset: 2px;
                        }
                        .wallet-menu {
                          opacity: 0;
                          transition: opacity 0.15s;
                        }
                        .wallet-list-item:hover .wallet-menu {
                          opacity: 1;
                        }
                      `}
                    </style>
                    <div style={{ display: "flex", alignItems: "center", gap: token.marginXS, width: "100%", justifyContent: "space-between" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div>
                          <Text strong style={{ color: token.colorText, lineHeight: 1.2, fontSize: token.fontSize }}>
                            {wallet.name}
                          </Text>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                            {totalCurrentValue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                          </Text>
                          <Text
                            type={isPositive ? "success" : "danger"}
                            style={{ fontSize: token.fontSizeSM }}
                          >
                            {isPositive ? "+" : ""}{pnlPercent.toFixed(2)}%
                          </Text>
                        </div>
                      </div>
                      <Dropdown
                        menu={{ items: menuItems }}
                        trigger={["click"]}
                        placement="bottomRight"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<DownOutlined />}
                          className="wallet-menu"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
        </div>
      </div>

      {/* Right column: Wallet details */}
      <div
        style={{
          flex: 1,
          height: "100%",
          overflow: "auto",
          backgroundColor: token.colorBgContainer,
          position: "relative",
        }}
      >
        {walletLoading && (
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
        {selectedWalletId ? (
          <WalletDetailsPanel walletId={selectedWalletId} />
        ) : (
          <Empty
            description="Sélectionnez un wallet pour voir les détails"
            style={{ marginTop: "100px" }}
          />
        )}
      </div>
    </div>
  );
};
