import { Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  ErrorComponent,
  ThemedLayout,
  ThemedSider,
  useNotificationProvider,
} from "@refinedev/antd";
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
  TransactionCreate,
  TransactionEdit,
  TransactionList,
  TransactionShow,
} from "./pages/transactions";

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
                      label: "Transactions",
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
                        Sider={(props) => <ThemedSider {...props} fixed />}
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
                    <Route path="/transactions">
                      <Route index element={<TransactionList />} />
                      <Route path="create" element={<TransactionCreate />} />
                      <Route path="edit/:id" element={<TransactionEdit />} />
                      <Route path="show/:id" element={<TransactionShow />} />
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
