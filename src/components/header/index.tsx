import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { useGetIdentity, useList } from "@refinedev/core";
import {
  Layout as AntdLayout,
  Avatar,
  Space,
  Switch,
  theme,
  Typography,
  Menu,
} from "antd";
import type { MenuProps } from "antd";
import React, { useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { ColorModeContext } from "../../contexts/color-mode";

const { Text } = Typography;
const { useToken } = theme;

type IUser = {
  id: number;
  name: string;
  avatar: string;
};

interface Watchlist {
  id: number;
  name: string;
  color?: string | null;
  status: "pinned" | "normal" | "archived";
  position: number;
}

export const Header: React.FC<RefineThemedLayoutHeaderProps> = () => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser>();
  const { mode, setMode } = useContext(ColorModeContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch watchlists
  const { query: watchlistsQuery } = useList<Watchlist>({
    resource: "watchlists",
    pagination: {
      mode: "off",
    },
    sorters: [
      { field: "position", order: "asc" },
    ],
  });

  const watchlists = watchlistsQuery?.data?.data || [];

  const menuItems: MenuProps["items"] = useMemo(() => [
    {
      key: "finance",
      label: "My Finance",
      children: [
        {
          key: "/wallets",
          label: "Wallets",
        },
        {
          key: "/transactions",
          label: "Transactions",
        },
        {
          key: "trades",
          label: "Trades",
          disabled: true,
        },
      ],
    },
    {
      key: "watchlists-menu",
      label: "Watchlists",
      children: watchlists.length > 0 ? watchlists.map((watchlist) => ({
        key: `/watchlists/${watchlist.id}/assets`,
        label: (
          <Space>
            {watchlist.color && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: watchlist.color,
                }}
              />
            )}
            {watchlist.name}
          </Space>
        ),
      })) : [
        {
          key: "no-watchlists",
          label: "Aucune watchlist",
          disabled: true,
        },
      ],
    },
    {
      key: "screener",
      label: "Screener",
      children: [
        {
          key: "/assets",
          label: "Stocks",
        },
        {
          key: "/funds",
          label: "Funds",
        },
        {
          key: "/indexes",
          label: "Indexes",
        },
        {
          key: "/forex",
          label: "Forex",
        },
        {
          key: "/crypto",
          label: "Crypto",
        },
      ],
    },
    {
      key: "admin",
      label: "Admin",
      children: [
        {
          key: "/watchlists",
          label: "Gérer les watchlists",
        },
        {
          key: "/asset-notes",
          label: "Notes",
        },
      ],
    },
  ], [watchlists]);

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key && e.key.startsWith("/")) {
      navigate(e.key);
    }
  };

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  };

  return (
    <AntdLayout.Header style={headerStyles}>
      {/* Logo/Title */}
      <div style={{
        display: "flex",
        alignItems: "center",
        marginRight: 24,
        gap: 12,
      }}>
        <img src="/bull.svg" alt="TradoLasso" style={{ width: 32, height: 32 }} />
        <Text strong style={{ fontSize: 18, margin: 0 }}>TradoLasso</Text>
      </div>

      {/* Menu */}
      <Menu
        mode="horizontal"
        items={menuItems}
        onClick={handleMenuClick}
        selectedKeys={[location.pathname]}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          backgroundColor: "transparent",
        }}
      />

      {/* Controls */}
      <Space>
        <Switch
          checkedChildren="🌛"
          unCheckedChildren="🔆"
          onChange={() => setMode(mode === "light" ? "dark" : "light")}
          defaultChecked={mode === "dark"}
        />
        <Space style={{ marginLeft: "8px" }} size="middle">
          {user?.name && <Text strong>{user.name}</Text>}
          {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
        </Space>
      </Space>
    </AntdLayout.Header>
  );
};
