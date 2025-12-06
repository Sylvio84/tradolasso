import { Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  ErrorComponent,
  ThemedLayout,
  ThemedSider,
  ThemedTitle,
  useNotificationProvider,
} from "@refinedev/antd";
import { WalletOutlined, FundOutlined, SwapOutlined, PieChartOutlined, DollarOutlined, ThunderboltOutlined, LineChartOutlined, StarOutlined } from "@ant-design/icons";
import "@refinedev/antd/dist/reset.css";

import routerProvider, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
//import dataProvider from "@refinedev/simple-rest";
import {hydraFetchDataProvider} from "./providers/hydraFetch";
import { App as AntdApp } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";
import {
  WalletCreate,
  WalletEdit,
  WalletList,
  WalletShow,
} from "./pages/wallets";
import {
  AssetCreate,
  AssetEdit,
  AssetList,
  AssetShow,
} from "./pages/assets";
import {
  FundCreate,
  FundEdit,
  FundList,
  FundShow,
} from "./pages/funds";
import {
  ForexCreate,
  ForexEdit,
  ForexList,
  ForexShow,
} from "./pages/forex";
import {
  CryptoCreate,
  CryptoEdit,
  CryptoList,
  CryptoShow,
} from "./pages/crypto";
import {
  IndexCreate,
  IndexEdit,
  IndexList,
  IndexShow,
} from "./pages/indexes";
import {
  TransactionCreate,
  TransactionEdit,
  TransactionList,
  TransactionShow,
} from "./pages/transactions";
import {
  WatchlistCreate,
  WatchlistEdit,
  WatchlistList,
  WatchlistShow,
} from "./pages/watchlists";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                // @ts-ignore
                dataProvider={hydraFetchDataProvider}
                notificationProvider={useNotificationProvider}
                routerProvider={routerProvider}
                resources={[
                  {
                    name: "wallets",
                    list: "/wallets",
                    create: "/wallets/create",
                    edit: "/wallets/edit/:id",
                    show: "/wallets/show/:id",
                    meta: {
                      icon: <WalletOutlined />,
                      canDelete: true,
                    },
                  },
                  {
                    name: "assets",
                    list: "/assets",
                    create: "/assets/create",
                    edit: "/assets/edit/:id",
                    show: "/assets/show/:id",
                    meta: {
                      icon: <FundOutlined />,
                      label: "Stocks",
                      canDelete: true,
                    },
                  },
                  {
                    name: "funds",
                    list: "/funds",
                    create: "/funds/create",
                    edit: "/funds/edit/:id",
                    show: "/funds/show/:id",
                    meta: {
                      icon: <PieChartOutlined />,
                      label: "Funds",
                      canDelete: true,
                    },
                  },
                  {
                    name: "forex",
                    list: "/forex",
                    create: "/forex/create",
                    edit: "/forex/edit/:id",
                    show: "/forex/show/:id",
                    meta: {
                      icon: <DollarOutlined />,
                      label: "Forex",
                      canDelete: true,
                    },
                  },
                  {
                    name: "crypto",
                    list: "/crypto",
                    create: "/crypto/create",
                    edit: "/crypto/edit/:id",
                    show: "/crypto/show/:id",
                    meta: {
                      icon: <ThunderboltOutlined />,
                      label: "Crypto",
                      canDelete: true,
                    },
                  },
                  {
                    name: "indexes",
                    list: "/indexes",
                    create: "/indexes/create",
                    edit: "/indexes/edit/:id",
                    show: "/indexes/show/:id",
                    meta: {
                      icon: <LineChartOutlined />,
                      label: "Indexes",
                      canDelete: true,
                    },
                  },
                  {
                    name: "wallet_transactions",
                    list: "/transactions",
                    create: "/transactions/create",
                    edit: "/transactions/edit/:id",
                    show: "/transactions/show/:id",
                    meta: {
                      icon: <SwapOutlined />,
                      label: "Transactions",
                      canDelete: true,
                    },
                  },
                  {
                    name: "watchlists",
                    list: "/watchlists",
                    create: "/watchlists/create",
                    edit: "/watchlists/edit/:id",
                    show: "/watchlists/show/:id",
                    meta: {
                      icon: <StarOutlined />,
                      label: "Watchlists",
                      canDelete: true,
                    },
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "40T6b3-a8UQJO-fVBzO6",
                }}
              >
                <Routes>
                  <Route
                    element={
                      <ThemedLayout
                        Header={() => <Header sticky />}
                        Sider={(props) => (
                          <ThemedSider
                            {...props}
                            fixed
                            Title={({ collapsed }) => (
                              <ThemedTitle
                                collapsed={collapsed}
                                text="TradoLasso"
                              />
                            )}
                          />
                        )}
                      >
                        <Outlet />
                      </ThemedLayout>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="wallets" />}
                    />
                    <Route path="/wallets">
                      <Route index element={<WalletList />} />
                      <Route path="create" element={<WalletCreate />} />
                      <Route path="edit/:id" element={<WalletEdit />} />
                      <Route path="show/:id" element={<WalletShow />} />
                    </Route>
                    <Route path="/assets">
                      <Route index element={<AssetList />} />
                      <Route path="create" element={<AssetCreate />} />
                      <Route path="edit/:id" element={<AssetEdit />} />
                      <Route path="show/:id" element={<AssetShow />} />
                    </Route>
                    <Route path="/funds">
                      <Route index element={<FundList />} />
                      <Route path="create" element={<FundCreate />} />
                      <Route path="edit/:id" element={<FundEdit />} />
                      <Route path="show/:id" element={<FundShow />} />
                    </Route>
                    <Route path="/forex">
                      <Route index element={<ForexList />} />
                      <Route path="create" element={<ForexCreate />} />
                      <Route path="edit/:id" element={<ForexEdit />} />
                      <Route path="show/:id" element={<ForexShow />} />
                    </Route>
                    <Route path="/crypto">
                      <Route index element={<CryptoList />} />
                      <Route path="create" element={<CryptoCreate />} />
                      <Route path="edit/:id" element={<CryptoEdit />} />
                      <Route path="show/:id" element={<CryptoShow />} />
                    </Route>
                    <Route path="/indexes">
                      <Route index element={<IndexList />} />
                      <Route path="create" element={<IndexCreate />} />
                      <Route path="edit/:id" element={<IndexEdit />} />
                      <Route path="show/:id" element={<IndexShow />} />
                    </Route>
                    <Route path="/transactions">
                      <Route index element={<TransactionList />} />
                      <Route path="create" element={<TransactionCreate />} />
                      <Route path="edit/:id" element={<TransactionEdit />} />
                      <Route path="show/:id" element={<TransactionShow />} />
                    </Route>
                    <Route path="/watchlists">
                      <Route index element={<WatchlistList />} />
                      <Route path="create" element={<WatchlistCreate />} />
                      <Route path="edit/:id" element={<WatchlistEdit />} />
                      <Route path="show/:id" element={<WatchlistShow />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
