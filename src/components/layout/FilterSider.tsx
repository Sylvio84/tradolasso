import { useState } from "react";
import { Layout, theme } from "antd";
import { useLocation } from "react-router";
import { useFilterContext } from "../../contexts/filter-context";
import { AssetsFilter } from "../filters/AssetsFilter";
import { FundsFilter } from "../filters/FundsFilter";
import { CryptoFilter } from "../filters/CryptoFilter";
import { ForexFilter } from "../filters/ForexFilter";
import { IndexesFilter } from "../filters/IndexesFilter";
import { WatchlistsFilter } from "../filters/WatchlistsFilter";
import type { FormProps } from "antd";

const { Sider } = Layout;

export interface FilterComponentProps {
  searchFormProps: FormProps;
  onReset: () => void;
}

interface FilterSiderProps {
  // No props needed for now
}

// Registry of filter components by route
const filterComponents: Record<
  string,
  React.ComponentType<FilterComponentProps>
> = {
  "/assets": AssetsFilter,
  "/funds": FundsFilter,
  "/crypto": CryptoFilter,
  "/forex": ForexFilter,
  "/indexes": IndexesFilter,
  "/watchlists": WatchlistsFilter,
  // Phase 5: New filters will be added
  // '/asset-notes': AssetNotesFilter,
  // '/transactions': TransactionsFilter,
  // '/wallets': WalletsFilter,
};

export const FilterSider: React.FC<FilterSiderProps> = () => {
  const location = useLocation();
  const { getFilterProps, siderVisible } = useFilterContext();
  const { token } = theme.useToken();

  // Manage collapsed state with localStorage persistence
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("filterSiderCollapsed");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    try {
      localStorage.setItem("filterSiderCollapsed", JSON.stringify(value));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Extract base path (without /show/:id, /edit/:id, /create)
  const pathname = location.pathname;
  const basePath = pathname.split("/").slice(0, 2).join("/");

  // Get the filter component for this route
  const FilterComponent = filterComponents[basePath];

  // Get filter props from context
  const filterProps = getFilterProps(pathname);

  // Don't render if sider is hidden
  if (!siderVisible) {
    return null;
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={handleCollapse}
      width={400}
      collapsedWidth={48}
      style={{
        overflow: "auto",
        height: "calc(100vh - 64px)", // Subtract header height
        background: token.colorBgContainer,
      }}
      className="filter-sider-scrollbar"
    >
      {/* Filter Content */}
      <div style={{ padding: collapsed ? 0 : 16, paddingBottom: collapsed ? 0 : 24 }}>
        {FilterComponent && filterProps.formProps ? (
          <FilterComponent
            searchFormProps={filterProps.formProps}
            onReset={filterProps.onReset || (() => {})}
          />
        ) : (
          <div
            style={{
              padding: 16,
              textAlign: "center",
              color: "#999",
            }}
          >
            {collapsed ? "" : "Aucun filtre"}
          </div>
        )}
      </div>

      {/* Scrollbar styles */}
      <style>{`
        .filter-sider-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .filter-sider-scrollbar::-webkit-scrollbar-track {
          background: ${token.colorBgContainer};
        }

        .filter-sider-scrollbar::-webkit-scrollbar-thumb {
          background: ${token.colorBorder};
          border-radius: 4px;
        }

        .filter-sider-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${token.colorBorderSecondary};
        }

        /* Firefox */
        .filter-sider-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${token.colorBorder} ${token.colorBgContainer};
        }
      `}</style>
    </Sider>
  );
};
