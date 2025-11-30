# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev      # Start development server (Vite + Refine)
npm run build    # Type check with tsc, then build for production
npm run build:check  # Type-check and build
npm run start    # Start production server
```

## API Documentation Access

Always map the module to the API documentation which is served at:
curl http://trendlasso/api/docs.jsonopenapi

## Architecture

This is a Refine framework application using React 19, TypeScript, Vite, and Ant Design.

### Technology Stack
- **Framework**: Refine v5 with `@refinedev/antd` UI integration
- **UI**: Ant Design v5 with dark/light mode theming
- **Routing**: React Router v7 via `@refinedev/react-router`
- **Data**: Simple REST data provider connecting to `http://trendlasso/api`
- **Build**: Vite with React plugin

### Key Architectural Patterns

#### Data Provider (`src/providers/hydraFetch.ts`)
- Custom Hydra API Platform data provider extending Refine's base data provider
- Handles JWT authentication with automatic token refresh and logout on 401
- Maps Refine's CRUD filters to Hydra's query parameters
- Supports complex filtering for dates, ranges, tags, and guest parameters
- Normalizes Hydra JSON-LD responses to Refine's expected format

### Project Structure
- `src/App.tsx` - Main app with Refine configuration, resource definitions, and route setup
- `src/contexts/color-mode/` - Theme context provider for dark/light mode toggle
- `src/components/header/` - Custom header with theme toggle and user info
- `src/pages/` - CRUD pages organized by resource (blog-posts, categories)

### Refine Patterns
Resources are defined in `App.tsx` with standard CRUD routes:
- `list`, `create`, `edit/:id`, `show/:id`

Each resource page uses Refine's Ant Design hooks (`useTable`, `useForm`, `useShow`) for data management.

## Development Guidelines

### API Integration
- All API calls go through the hydraFetch data provider
- Use Refine hooks (`useTable`, `useShow`, etc.) rather than direct API calls
- Filter parameters must be mapped through the provider's filter mapping system

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

## Design Patterns & Solutions

### Handling NULL Values in API Filters
**📖 See [docs/FILTER_NULL_VALUES.md](docs/FILTER_NULL_VALUES.md)** for detailed implementation guide.

**Problem solved:**
How to properly handle filters with "All" options that need to send `null` explicitly to the API whilst displaying user-friendly labels in Ant Design Select components, whilst surviving URL changes and page refreshes.

**When to consult this documentation:**
- Before implementing any filter with an "All"/"None" option that must send `null` to the API
- When debugging Select components displaying "null" as text instead of the label
- When filter values disappear after page refresh or URL modification
- When working with Refine `syncWithLocation` and null filter values
