# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev      # Start development server (Vite + Refine)
npm run build    # Type check with tsc, then build for production
npm run build:check  # Type-check and build
npm run start    # Start production server
```

## Architecture

The project use Refine framework application using React 19, TypeScript, Vite, and Ant Design.

Refine documentation: https://refine.dev/docs/

### Technology Stack
- **Framework**: Refine v5.0.0 with `@refinedev/antd` v6.0.1 UI integration
- **UI**: Ant Design v5.23.0 with dark/light mode theming
- **Routing**: React Router v7.0.2 via `@refinedev/react-router` v2.0.0
- **Data**: Custom Hydra API Platform data provider connecting to `http://trendlasso/api`
- **Build**: Vite v6.3.5 with React plugin
- **React**: v19.1.0

Always use context7 when I need code generation, setup or configuration steps, or
library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without me having to explicitly ask.

Project is accessible :
Dev: http://localhost:5173/
Prod: http://tradolasso/

### Key Architectural Patterns

#### Data Provider (`src/providers/hydraFetch.ts`)
- Custom Hydra API Platform data provider extending Refine's base data provider
- Handles JWT authentication with automatic token refresh and logout on 401
- Maps Refine's CRUD filters to Hydra's query parameters
- Supports complex filtering for dates, ranges, tags, and guest parameters
- Normalizes Hydra JSON-LD responses to Refine's expected format

#### Hydra Module (`src/providers/hydra/`)
- `httpClient.ts` - HTTP client with authentication handling
- `filterMapping.ts` - Maps Refine filters to Hydra query parameters
- `responseNormalizers.ts` - Normalizes Hydra responses (extracts items, totals)

### Project Structure
- `src/App.tsx` - Main app with Refine configuration, resource definitions, and route setup
- `src/contexts/color-mode/` - Theme context provider for dark/light mode toggle
- `src/components/header/` - Custom header with theme toggle and user info
- `src/pages/` - CRUD pages organized by resource:
  - `src/pages/wallets/` - Wallet management (list, create, edit, show)
  - `src/pages/assets/` - Asset management (list, create, edit, show)

### Refine Patterns
Resources are defined in `App.tsx` with standard CRUD routes:
- `list`, `create`, `edit/:id`, `show/:id`

Each resource page uses Refine's Ant Design hooks (`useTable`, `useForm`, `useShow`) for data management.


## Visual Development

### Design Principles
- Comprehensive design checklist in `context/design-principles.md`
- When making visual (front-end, UI/UX) changes, always refer to these files for guidance

### Quick Visual Check
IMMEDIATELY after implementing any front-end change:
1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - Use `mcp__playwright__browser_navigate` to visit each changed view
3. **Verify design compliance** - Compare against `/context/design-principles.md`
4. **Validate feature implementation** - Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** - Review any provided context files or requirements
6. **Capture evidence** - Take full page screenshot at desktop viewport (1920x1200px) of each changed view
7. **Check for errors** - Run `mcp__playwright__browser_console_messages`

This verification ensures changes meet design standards and user requirements.

### Comprehensive Design Review
Invoke the `@agent-design-review` subagent for thorough design validation when:
- Completing significant UI/UX features
- Before finalizing PRs with visual changes
- Needing comprehensive accessibility and responsiveness testing


## Development Guidelines

Always build the application after having finishing the change requested with `npm run build` to ensure type-checking and build are successful.

### API Integration
- All API calls go through the hydraFetch data provider
- Use Refine hooks (`useTable`, `useShow`, etc.) rather than direct API calls
- Filter parameters must be mapped through the provider's filter mapping system
- For direct API calls (modals, custom actions), use `http()` from `src/providers/hydra`

### Component Development
- Follow Ant Design patterns and use their components
- Use Refine's UI components (`List`, `Show`, etc.) as wrappers
- Implement proper TypeScript interfaces for all data structures

### Date Formatting
All dates must be displayed in French format using `DateField` from `@refinedev/antd`:
- **Date only**: `format="DD/MM/YYYY"` (ex: 30/11/2025)
- **Date with time**: `format="DD/MM/YYYY HH:mm"` (ex: 30/11/2025 14:30)

```tsx
// Date only
<DateField value={record.createdAt} format="DD/MM/YYYY" />

// Date with time
<DateField value={record.lastFetchAt} format="DD/MM/YYYY HH:mm" />
```

## API Endpoints

API base url (local):
http://trendlasso/api/

Always check API documentation when you implement or change a feature that might use it.
```bash
curl http://trendlasso/api/docs.jsonopenapi
```


### Wallets
- **List**: `GET /api/wallets`
- **Get**: `GET /api/wallets/{id}`
- **Create**: `POST /api/wallets`
- **Update**: `PATCH /api/wallets/{id}`
- **Delete**: `DELETE /api/wallets/{id}`
- **Wallet lines**: `GET /api/wallets/{walletId}/lines`
- **Create transaction**: `POST /api/wallets/{walletId}/transactions`

### Wallet Lines
- **List**: `GET /api/wallet_lines`
- **Get**: `GET /api/wallet_lines/{id}`
- **Update**: `PATCH /api/wallet_lines/{id}` (Content-Type: `application/merge-patch+json`)

### Wallet Transactions
- **List**: `GET /api/wallet_transactions`
- **Get**: `GET /api/wallet_transactions/{id}`
- **Transaction types**: `GET /api/transaction_types` (buy, sell, dividend, fees, interest, stock_split, value_update)
  - Note: `cash_deposit` and `cash_withdrawal` exist but are excluded from wallet line transactions

**Payload for creating a transaction:**
```json
{
  "walletLineId": 123,        // For existing position (optional)
  "assetId": 456,             // For new position (optional, used if no walletLineId)
  "transactionType": "buy",
  "transactionDate": "2025-11-30T10:00:00Z",
  "quantity": "10",
  "unitPrice": "150.50",
  "fees": "5.00",
  "currency": "EUR",
  "conversionRate": "1",
  "notes": "Optional note"
}
```

### Assets
- **List**: `GET /api/assets`
- **Get**: `GET /api/assets/{id}`
- **Create**: `POST /api/assets`
- **Update**: `PATCH /api/assets/{id}`
- **Delete**: `DELETE /api/assets/{id}`

### Screeners
- **List**: `GET /api/screeners`
- **Get**: `GET /api/screeners/{id}`
- **Screener metrics**: `GET /api/screener/metrics`
- **Screener assets**: `GET /api/screener_assets`
- **Assets to fetch**: `GET /api/screeners/{screenerId}/assets-to-fetch`

### Listings
- **List**: `GET /api/listings`
- **Get**: `GET /api/listings/{id}`

### Reference Data
- **Currencies**: `GET /api/currencies?page=1&itemsPerPage=100`
- **Assets (all)**: `GET /api/assets?pagination=false` (loads all ~600+ assets)
- **Transaction types**: `GET /api/transaction_types`
- **Wallet types**: `GET /api/wallet_types`

## TypeScript Interfaces

### Asset Types
```typescript
const ASSET_TYPE_COLORS: Record<string, string> = {
  stock: "blue",
  fund: "green",
  bond: "orange",
  crypto: "purple",
  commodity: "gold",
  real_estate: "cyan",
  forex: "magenta",
  cash_account: "default",
};
```

### WalletLine Interface
```typescript
interface WalletLine {
  id: number;
  quantity: string | null;
  buyPrice: string | null;
  buyConversionRate: string | null;
  currency: string | null;
  fees: string | null;
  notes: string | null;
  asset?: {
    id: number;
    name: string;
    symbol: string;
    lastPrice: string | null;
  };
}
```

### ScreenerAsset Interface
```typescript
interface ScreenerAsset {
  id: number;
  screener?: { id: number; name: string } | null;
  active: boolean;
  url?: string | null;
  lastFetchAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  metrics?: Record<string, string>;
}
```

### Listing Interface
```typescript
interface Listing {
  id: number;
  exchange?: { id: number; name: string; code?: string } | null;
  ticker: string;
  peaEligible: boolean;
  peapmeEligible: boolean;
  lastDataAt?: string | null;
  lastPrice?: string | null;
  lastVolume?: number | string | null;
  currency?: string | null;
  createdAt?: string | null;
}
```

### Screener Metrics
Common metric keys used in screenerAssets:
- `VIS Score` - Value Investors Screener score
- `Global Stars` - VIS star rating
- `surperf_ratings.investisseur` - ZoneBourse investor rating
- `metascreener.fintel-score` - Fintel composite score
- `metascreener.zonebourse-score` - ZoneBourse composite score
- `metascreener.vis-score` - VIS composite score
- `metascreener.piotroski-beneish-sloan-score` - PBS score

## Design Patterns & Solutions

### Handling NULL Values in API Filters
**See [docs/FILTER_NULL_VALUES.md](docs/FILTER_NULL_VALUES.md)** for detailed implementation guide.

**Problem solved:**
How to properly handle filters with "All" options that need to send `null` explicitly to the API whilst displaying user-friendly labels in Ant Design Select components, whilst surviving URL changes and page refreshes.

**When to consult this documentation:**
- Before implementing any filter with an "All"/"None" option that must send `null` to the API
- When debugging Select components displaying "null" as text instead of the label
- When filter values disappear after page refresh or URL modification
- When working with Refine `syncWithLocation` and null filter values

### Direct API Calls for Modals
When creating transactions or editing wallet lines via modals:
```typescript
import { http } from "../providers/hydra";
import { useInvalidate } from "@refinedev/core";

// In component
const invalidate = useInvalidate();

// POST request
await http(`/wallets/${walletId}/transactions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

// PATCH request
await http(`/wallet_lines/${lineId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/merge-patch+json" },
  body: JSON.stringify(payload),
});

// DELETE request
await http(`/wallet_lines/${lineId}`, {
  method: "DELETE",
});

// Invalidate cache after mutation
invalidate({ resource: "wallets", invalidates: ["detail"] });
```

### Ant Design 5 Modal and Message
With Ant Design v5, static methods like `Modal.confirm()` and `message.success()` don't work properly when using the `<App>` component wrapper. Use `App.useApp()` hook instead:

```typescript
import { App } from "antd";

export const MyComponent = () => {
  const { modal, message } = App.useApp();

  const handleDelete = () => {
    modal.confirm({
      title: "Supprimer",
      content: "Êtes-vous sûr ?",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        await http(`/resource/${id}`, { method: "DELETE" });
        message.success("Supprimé");
      },
    });
  };
};
```
