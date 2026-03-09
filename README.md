# minimaxi Predictive Maintenance Platform

A full-featured, AI-powered predictive maintenance web application built with React 19, Vite, Material-UI v7, and TypeScript. The platform enables industrial organizations to monitor machine health in real-time, predict equipment failures before they occur, manage maintenance workflows, and generate actionable analytics reports.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Pages & Features](#pages--features)
  - [Public Pages](#public-pages)
  - [Setup Wizard](#setup-wizard)
  - [App Pages (Protected)](#app-pages-protected)
- [Authentication & Authorization](#authentication--authorization)
- [Key Features](#key-features)
- [API Layer](#api-layer)
- [Mock API & MSW](#mock-api--msw)
- [Real-Time Updates](#real-time-updates)
- [Theming & Internationalization](#theming--internationalization)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Known Limitations](#known-limitations)

---

## Project Overview

The minimaxi Predictive Maintenance Platform is a role-based enterprise web application designed for manufacturing and industrial environments. It provides:

- **Real-time machine health monitoring** with live sensor data (temperature, vibration, pressure, RPM)
- **AI-driven failure prediction** with Remaining Useful Life (RUL) and Time-to-Failure (TTF) estimates
- **Work order management** covering the full maintenance lifecycle
- **Alert & notification system** for threshold breaches and anomalies
- **Maintenance planning calendar** for scheduling preventive tasks
- **Performance reports** with cost savings, downtime reduction, and technician metrics
- **Role-based access control** for Admins, Engineers, and Technicians

The application ships with a complete in-memory mock API, enabling full development and testing without a backend server.

---

## Tech Stack

| Category | Library / Tool | Version |
|---|---|---|
| UI Framework | React | 19.2.0 |
| Build Tool | Vite | 7.2.4 |
| Component Library | MUI (Material-UI) | 7.3.7 |
| Language | TypeScript | 5.9.3 |
| Routing | React Router DOM | 7.13.0 |
| HTTP Client | Axios | 1.13.4 |
| Charts | Recharts | 3.7.0 |
| Calendar | react-big-calendar | 1.19.4 |
| Real-time | socket.io-client | 4.8.3 |
| PDF Export | html2pdf.js + react-to-print | 0.14.0 / 3.3.0 |
| Date Utilities | date-fns | 4.1.0 |
| Mocking (dev) | MSW (Mock Service Worker) | 2.12.10 |
| Testing | Vitest + @testing-library | 4.0.18 |
| Test DOM | jsdom | 28.1.0 |
| Linting | ESLint | 9.39.1 |

**MUI v7 Note**: Grid no longer accepts `item`/`container` props. The codebase uses the Grid2 API with `size={{ xs: 12, md: 6 }}` syntax.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone <repository-url>
cd predictive-maintenance
npm install
```

### Running the Development Server

```bash
npm run dev
```

The app runs at `http://localhost:5173` by default with Hot Module Replacement enabled.

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@abc.com | admin123 |
| Engineer | sara@abc.com | engineer123 |
| Technician | khaled@abc.com | tech123 |
| Technician | fatima@abc.com | tech123 |

### Production Build

```bash
npm run build
npm run preview
```

---

## Project Structure

```
predictive-maintenance/
├── public/
│   └── mockServiceWorker.js       # MSW service worker (auto-generated)
├── src/
│   ├── main.tsx                   # App entry point, MSW bootstrap
│   ├── App.tsx                    # Router + route definitions
│   ├── types/
│   │   └── index.ts               # All TypeScript interfaces & types
│   ├── context/
│   │   ├── AuthContext.tsx        # Authentication state & methods
│   │   └── ThemeContext.tsx       # Theme (light/dark) state & MUI theme
│   ├── services/
│   │   ├── api.ts                 # Dual-mode API layer (mock or real)
│   │   ├── mockApi.ts             # In-memory mock API implementation
│   │   └── socket.ts              # Mock WebSocket for real-time updates
│   ├── data/
│   │   └── mockData.ts            # Seed data (users, machines, alerts, etc.)
│   ├── utils/
│   │   ├── permissions.ts         # RBAC permission matrix & helpers
│   │   ├── constants.ts           # Enums, color maps, static config
│   │   └── validation.ts          # Field-level validation functions
│   ├── mocks/
│   │   ├── handlers.ts            # MSW HTTP request handlers
│   │   └── browser.ts             # MSW browser worker setup
│   ├── pages/
│   │   ├── public/                # Unauthenticated pages
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RequestAccessPage.tsx
│   │   │   ├── ActivatePage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── ResetPasswordPage.tsx
│   │   │   └── LogoutPage.tsx
│   │   ├── setup/                 # First-login setup wizard (admin)
│   │   │   ├── SetupWizard.tsx
│   │   │   ├── SetupWelcome.tsx
│   │   │   ├── CompanySettings.tsx
│   │   │   ├── AddMachines.tsx
│   │   │   ├── AddUsers.tsx
│   │   │   └── SetupComplete.tsx
│   │   └── app/                   # Protected application pages
│   │       ├── Dashboard.tsx
│   │       ├── MachinesList.tsx
│   │       ├── MachineDetails.tsx
│   │       ├── AddAsset.tsx
│   │       ├── WorkOrders.tsx
│   │       ├── CreateWorkOrder.tsx
│   │       ├── WorkOrderDetails.tsx
│   │       ├── MyWorkOrders.tsx
│   │       ├── Alerts.tsx
│   │       ├── MaintenancePlanning.tsx
│   │       ├── Reports.tsx
│   │       ├── Settings.tsx
│   │       ├── UserManagement.tsx
│   │       └── Profile.tsx
│   ├── components/
│   │   ├── common/                # Shared UI components
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── TableSkeleton.tsx
│   │   │   ├── CardGridSkeleton.tsx
│   │   │   ├── MiniMaxiLogo.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── layout/                # App shell components
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── setup/                 # Setup wizard UI helpers
│   │   │   ├── SetupHeader.tsx
│   │   │   └── SetupSidebar.tsx
│   │   └── dashboard/             # Dashboard chart components
│   │       ├── StatCard.tsx
│   │       ├── HealthPieChart.tsx
│   │       ├── TrendLineChart.tsx
│   │       ├── AIInsightCard.tsx
│   │       └── SensorTrendsChart.tsx
│   ├── locales/                   # i18n translation files
│   │   ├── en/translation.json
│   │   └── ar/translation.json
│   └── tests/
│       ├── setup.ts               # Vitest global setup & browser API stubs
│       ├── utils.tsx              # renderWithProviders & test helpers
│       ├── logic/                 # Unit tests (direct mockApi calls)
│       │   ├── auth.test.ts
│       │   ├── workOrders.test.ts
│       │   ├── alerts.test.ts
│       │   └── machines.test.ts
│       └── ui/                    # Integration tests (components + MSW)
│           ├── LoginForm.test.tsx
│           ├── MachinesList.test.tsx
│           ├── Dashboard.test.tsx
│           └── AlertsList.test.tsx
├── .env.development               # Development environment variables
├── vite.config.js                 # Vite + Vitest configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json
```

---

## Pages & Features

### Public Pages

| Route | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Marketing homepage with feature overview and CTAs |
| `/login` | `LoginPage` | Email/password login with demo credential hints |
| `/request-access` | `RequestAccessPage` | New company access request form |
| `/activate` | `ActivatePage` | Account activation from invitation link |
| `/forgot-password` | `ForgotPasswordPage` | Initiate password recovery |
| `/reset-password` | `ResetPasswordPage` | Set new password via recovery token |
| `/logout` | `LogoutPage` | Clears session and redirects to login |

### Setup Wizard

Triggered automatically for admin users on first login. A guided multi-step flow to configure the organization before using the platform.

| Route | Step | Description |
|---|---|---|
| `/setup/welcome` | 1 | Greeting and orientation |
| `/setup/company` | 2 | Company name, timezone, industry, logo upload |
| `/setup/machines` | 3 | Bulk add initial assets |
| `/setup/users` | 4 | Invite engineers and technicians |
| `/setup/complete` | 5 | Confirmation and redirect to dashboard |

### App Pages (Protected)

#### Dashboard — `/dashboard`
Central operations view available to all roles.

- **KPI Cards**: Total Assets, At-Risk Assets (warning + critical), Active Work Orders, Predicted Failures
- **Time & Asset Filters**: 24h / 7d / 30d / 90d range; filter by asset type
- **Health Distribution Pie Chart**: Healthy / Warning / Critical breakdown
- **Failure Probability Trend**: Daily, weekly, or monthly line chart
- **AI Insights Panel**: Machine-specific predictions with confidence scores and severity badges
- **Live Sensor Trends Chart**: Temperature, vibration, pressure — updated every 3 seconds via WebSocket

#### Machines List — `/machines`
Full asset inventory with filtering and status monitoring.

- Search (debounced 500ms), filter by type / location / status
- Table: Asset ID, Name, Type, Location, Status, Failure Probability, TTF, Actions
- Technicians see a read-only view; Engineers and Admins can create work orders from a machine row
- Pagination (10 rows/page)

#### Machine Details — `/machines/:id`
Detailed view for a single asset.

- Specifications: serial number, manufacturer, model, installation date, criticality
- Prediction panel: failure probability, RUL (Remaining Useful Life), TTF (Time to Failure), AI recommendation text
- Current sensor readings table
- 24-hour sensor history chart with configurable lookback window
- Create Work Order button (Engineers+), Delete button (Admin only)

#### Add Asset — `/machines/add`
Asset registration form (Admin / Engineer).

- Auto-generated Asset ID based on machine type (e.g., `CNC-001`)
- Fields: name, type, location, serial number, manufacturer, model, criticality, installation date, last maintenance date

#### Work Orders — `/work-orders`
Full work order management for Admins and Engineers.

- Table: WO#, Machine, Title, Priority (color-coded), Status, Assigned To, Due Date
- Filter by status, priority, and assigned technician; debounced search
- Create, view, edit, delete with confirmation dialogs
- Priority color scale: Critical (red) → High (orange) → Medium (amber) → Low (green)

#### Create Work Order — `/work-orders/new`
Work order creation form.

- Machine selector, title, description, priority, due date
- Assign to technician, estimated hours, parts needed

#### Work Order Details — `/work-orders/:id`
Full work order view with collaboration features.

- Header: WO number, machine link, priority badge, current status
- Inline status updates via edit modal
- Notes thread: view history, add timestamped notes (all roles with WO access)
- Edit / Delete controls (Admin / Engineer)

#### My Work Orders — `/my-work-orders`
Technician-specific view of their assigned work orders.

- Filtered automatically to the current user's assignments
- Can update status, add notes, view full details
- No delete or reassign capability

#### Alerts — `/alerts`
Alert monitoring and acknowledgment for Admins and Engineers.

- Summary cards: Total, Critical, Warning, Unacknowledged
- Filter: All / Unacknowledged / Critical / Warning / Info
- Alert cards: type icon, machine name, asset ID, severity badge, message, timestamp
- One-click acknowledgment (records the acknowledging user and timestamp)

#### Maintenance Planning — `/maintenance`
Calendar-based maintenance scheduling (Admin / Engineer).

- Monthly calendar view (react-big-calendar)
- Color-coded event types
- Event creation by selecting date ranges

#### Reports — `/reports`
Analytics and performance reporting (Admin / Engineer).

- **KPI Summary**: Downtime Reduction %, Prediction Accuracy %, Cost Savings ($)
- **Downtime Reduction Graph**: Before/after bar chart by month
- **Monthly Downtime Table**: Hours per month
- **Technician Performance Table**: Completed WOs, avg time, success rate, star rating
- **Preventive vs Reactive Pie Chart**: Maintenance type distribution
- **Model Accuracy Trend**: AI model accuracy over time (line chart)
- Full page print-to-PDF via react-to-print

#### Settings — `/settings`
System configuration (Admin only). Three tabbed sections:

1. **Asset Types** — CRUD table: name, description, maintenance interval, active toggle
2. **Sensor Thresholds** — CRUD table: name, unit, warning level, critical level, technician override permission
3. **AI Model** — View current model info (v2.1, Random Forest, 92% accuracy), training history, trigger manual retraining, schedule future training runs

#### User Management — `/users`
Team administration (Admin only).

- Users table: name, email, role, status, join date, actions
- Invite user by email — generates activation link (logged to console in dev)
- Edit name, role, and status
- Delete user with confirmation dialog

#### Profile — `/profile`
Personal settings for all authenticated users.

- View and edit display name
- Upload profile avatar (base64 encoded)
- Change password
- Toggle light/dark theme
- Logout

---

## Authentication & Authorization

### Authentication Flow

1. User submits credentials on `/login`
2. `AuthContext.login()` calls `api.login()` → returns `{ user, token }`
3. User object and token are persisted in `sessionStorage`
4. `ProtectedRoute` reads `sessionStorage` synchronously on every navigation — no auth flash
5. Axios request interceptor injects `Authorization: Bearer <token>` on every request
6. Axios response interceptor handles `401` — clears session and redirects to `/login`

**Post-login routing**:
- Admin (first login) → `/setup`
- Technician → `/my-work-orders`
- All others → `/dashboard`

### Role-Based Access Control

Three roles with a permission matrix defined in `src/utils/permissions.ts`:

| Permission | Admin | Engineer | Technician |
|---|---|---|---|
| View Dashboard | ✓ | ✓ | ✓ |
| View Machines | ✓ | ✓ | ✓ (read-only) |
| Add / Edit Machines | ✓ | ✓ | — |
| Delete Machines | ✓ | — | — |
| View All Work Orders | ✓ | ✓ | own only |
| Create / Edit Work Orders | ✓ | ✓ | — |
| Update WO Status / Add Notes | ✓ | ✓ | ✓ |
| View Alerts | ✓ | ✓ | — |
| Acknowledge Alerts | ✓ | ✓ | — |
| View Reports | ✓ | ✓ | — |
| View Maintenance Calendar | ✓ | ✓ | — |
| User Management | ✓ | — | — |
| Settings | ✓ | — | — |

Routes are guarded by `<ProtectedRoute roles={[...]} />`, which redirects to the user's default route on role mismatch.

---

## Key Features

### AI-Powered Predictions
Each machine carries a `MachinePrediction` object:

| Field | Description |
|---|---|
| `failure_probability` | 0–1 probability score |
| `rul` | Remaining Useful Life (hours) |
| `ttf` | Time to Failure (hours) |
| `status` | `healthy` / `warning` / `critical` |
| `recommendation` | Plain-language maintenance recommendation |

### Real-Time Sensor Monitoring
The Dashboard subscribes to a WebSocket on mount. Every 3 seconds it receives updated readings (temperature, vibration, pressure) and appends them to the live sensor trend chart (capped at the last 10 readings). A 10% chance event simulates a new incoming alert.

### Sensor History
Machine Details fetches 24 hours of sensor data per machine, visualized as a multi-line Recharts chart with an adjustable lookback window.

### Full Maintenance Workflow
```
Alert triggered
  → Work Order created
    → Assigned to Technician
      → Status updates + Notes added
        → Work Order completed
          → Reports updated
```

### PDF Export & Printing
The Reports page uses `react-to-print` to open the browser print dialog. The `api.exportPDF()` endpoint handles programmatic PDF generation via `html2pdf.js`.

### Responsive Layout
- Mobile: Sidebar renders as a slide-out MUI Drawer
- Desktop: Collapsible fixed sidebar with toggle persisted in `localStorage`
- Tables paginate at 10 rows/page
- MUI Grid breakpoints applied throughout all pages

---

## API Layer

**File**: `src/services/api.ts`

Supports two modes via the `USE_MOCK` constant:

```ts
// src/services/api.ts
const USE_MOCK = false;  // true → mockApi directly | false → axios (+ optional MSW)
```

The exported `api` object is typed as `typeof mockApi`, ensuring consistent types across both implementations.

**Real API** (when `USE_MOCK = false`):
- Base URL: `VITE_API_URL` env var, defaulting to `http://localhost:3001/api`
- 10-second request timeout
- Automatic Bearer token injection via request interceptor
- Automatic 401 logout + redirect via response interceptor

### Available API Methods

| Group | Methods |
|---|---|
| Auth | `login`, `logout`, `requestAccess`, `activateAccount` |
| Dashboard | `getDashboardStats`, `getHealthDistribution`, `getFailureTrend`, `getSensorTrends`, `getAIInsights` |
| Machines | `getMachines`, `getMachineById`, `createMachine`, `updateMachine`, `deleteMachine`, `getMachineSensorHistory` |
| Work Orders | `getWorkOrders`, `getWorkOrderById`, `createWorkOrder`, `updateWorkOrder`, `deleteWorkOrder`, `addWorkOrderNote` |
| Alerts | `getAlerts`, `acknowledgeAlert` |
| Users | `getUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser`, `inviteUser`, `updateAvatar` |
| Company | `getCompanySettings`, `updateCompanySettings`, `completeSetup` |
| Notifications | `getNotifications`, `markNotificationRead`, `markAllNotificationsRead` |
| Reports | `getReportsData` |
| Maintenance | `getMaintenanceEvents` |
| Settings | `getAssetTypes`, `createAssetType`, `updateAssetType`, `deleteAssetType`, `getSensorThresholds`, `createSensorThreshold`, `updateSensorThreshold`, `deleteSensorThreshold`, `getAIModelInfo`, `retrainAIModel`, `scheduleTraining` |
| Access Requests | `getAccessRequests` |
| Export | `exportPDF` |

---

## Mock API & MSW

Two complementary mocking strategies are available:

### 1. Direct Mock API (`src/services/mockApi.ts`)

An in-memory implementation of every API method. All business logic (auth, filtering, CRUD, ID generation) lives here.

- State is held in-memory and resets on page refresh
- Simulates network latency: 200–2000ms per endpoint
- Auto-increments identifiers: `WO-2026-102`, `CNC-001`, etc.
- Seeds 4 users, 10+ machines, multiple work orders, alerts, and notifications on startup

Activate by setting `USE_MOCK = true` in `src/services/api.ts`.

### 2. Mock Service Worker (`src/mocks/`)

MSW intercepts real `axios` HTTP calls at the network level and routes them to `mockApi`. This tests the full HTTP pipeline (auth headers, serialization, interceptors) while still using in-memory data.

**Enable in `.env.development`**:
```env
VITE_USE_MSW=true
```

MSW starts before React mounts (see `src/main.tsx`) to prevent request races during startup.

`src/mocks/handlers.ts` contains 50+ endpoint handlers covering the entire API surface.

### Mode Comparison

| Mode | `USE_MOCK` | `VITE_USE_MSW` | Description |
|---|---|---|---|
| Direct Mock | `true` | `false` | mockApi called directly, no HTTP involved |
| MSW Mock | `false` | `true` | axios → MSW intercept → mockApi |
| Real Backend | `false` | `false` | axios → actual backend server |

---

## Real-Time Updates

**File**: `src/services/socket.ts`

A `MockSocket` class simulates Socket.io client behavior for development:

- Emits `machine_update` every 3 seconds with randomized sensor readings for CNC-001, PUMP-023, ENGINE-012
- 10% chance per tick to emit `new_alert` with random severity and machine
- Singleton pattern: one shared connection per app instance

**Dashboard integration**:
```ts
// Mount
const socket = connectSocket();
socket.on('machine_update', (data) => {
  setSensorTrends(prev => [...prev.slice(-9), data]);
});

// Unmount
disconnectSocket();
```

To use real WebSocket in production, replace `MockSocket` with a real `socket.io-client` instance connecting to your backend.

---

## Theming & Internationalization

### Theme System

**File**: `src/context/ThemeContext.tsx`

- Light/dark toggle persisted in `localStorage['themeMode']`
- Two fully customized MUI themes with consistent palettes, typography, and component overrides

| | Light Theme | Dark Theme |
|---|---|---|
| Primary | `#2E75B6` (professional blue) | `#3B82F6` (bright blue) |
| Secondary | `#44546A` (gray) | `#8B5CF6` (purple) |
| Background | `#f5f5f5` (light gray) | `#1E2A3A` (dark blue-gray) |
| Text | `#333333` / `#666666` | `#F1F5F9` / `#94A3B8` |

Access via hook:
```ts
const { mode, isDark, toggleTheme } = useThemeMode();
```

### Internationalization (i18n)

Arabic (RTL) language support via `react-i18next`:

- Translation files: `src/locales/en/translation.json`, `src/locales/ar/translation.json`
- `ThemeContext` provides `direction`, `language`, and `changeLanguage`
- Language choice persisted in `localStorage['language']`
- MUI theme instantiated with `direction` for RTL-aware component layout
- `document.documentElement.dir` and `lang` updated dynamically on language change
- Header includes an EN / AR toggle button

---

## Testing

**Framework**: Vitest + @testing-library/react + @testing-library/user-event + MSW

**Status**: 60 / 60 tests pass.

### Setup Files

**`src/tests/setup.ts`**:
- Imports `@testing-library/jest-dom` for extended matchers
- Stubs `matchMedia`, `ResizeObserver`, `window.scrollTo` (required by MUI and Recharts in jsdom)
- Initializes MSW Node server with all handlers for UI tests

**`src/tests/utils.tsx`**:
- `renderWithProviders(ui, options)` — Wraps with MemoryRouter + ThemeContext + AuthProvider + MUI ThemeProvider
- `seedAuth(user)` / `clearAuth()` — Inject or clear sessionStorage auth state
- `mockAdminUser`, `mockEngineerUser`, `mockTechnicianUser` — Pre-built test user fixtures

### Test Suites

**Logic tests** (`src/tests/logic/`) — Call mockApi directly, verify data and business rules:
- `auth.test.ts` — Login, logout, registration, account activation
- `machines.test.ts` — CRUD, filter combinations, sensor history
- `workOrders.test.ts` — Create/update/delete, notes, status transitions
- `alerts.test.ts` — List, filter, acknowledge

**UI tests** (`src/tests/ui/`) — Render components; MSW intercepts HTTP:
- `LoginForm.test.tsx` — Form validation, success routing, error display
- `MachinesList.test.tsx` — Loading skeletons, filters, table rows
- `Dashboard.test.tsx` — KPI cards, chart data, socket mocking
- `AlertsList.test.tsx` — Alert display, acknowledgment interaction

### Running Tests

```bash
npm run test:run    # Run all tests once
npm test            # Watch mode
npm run test:ui     # Open Vitest UI dashboard
```

### Key Testing Patterns

```ts
// MUI Select — use mouseDown to open the dropdown
fireEvent.mouseDown(combobox);
fireEvent.click(option);

// Mock socket to prevent real intervals in tests
vi.mock('../../services/socket', () => ({
  connectSocket: vi.fn(() => ({ on: vi.fn() })),
  disconnectSocket: vi.fn(),
}));

// Combine debounce + loading assertions in a single waitFor
await waitFor(() => {
  expect(screen.getByText('CNC-001')).toBeInTheDocument();
  expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
});
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001/api` | Backend API base URL |
| `VITE_USE_MSW` | `false` | Enable MSW mock interception (`true` / `false`) |

Create `.env.development` or `.env.local` as needed:

```env
VITE_API_URL=http://localhost:3001/api
VITE_USE_MSW=true
```

---

## Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start dev server with HMR on port 5173 |
| `build` | `vite build` | Production build to `/dist` |
| `preview` | `vite preview` | Preview the production build locally |
| `lint` | `eslint .` | Run ESLint across all source files |
| `test` | `vitest` | Run tests in watch mode |
| `test:run` | `vitest run` | Run all tests once and exit |
| `test:ui` | `vitest --ui` | Open interactive Vitest UI dashboard |

---

## Known Limitations

1. **In-memory mock state**: All data resets on page refresh. Intended for development and demo use only.

2. **Pre-existing MUI Grid type errors**: 88 TypeScript errors (TS2769) from MUI v7 removing `item`/`container` props from Grid types. These do not affect runtime behavior.

3. **TypeScript strict mode disabled**: `tsconfig.json` has `strict: false` to allow gradual type coverage.

4. **Socket is simulated**: `src/services/socket.ts` generates random sensor data locally. Replace `MockSocket` with a real `socket.io-client` connection for production.

5. **Activation links logged to console**: In development, invitation and activation URLs are printed to the browser console rather than sent by email.

6. **Phone validation is Egypt-specific**: The validation regex (`^(\+20|0)?1[0125]\d{8}$`) matches Egyptian mobile numbers only.

7. **PDF margin type error**: `html2pdf.js` has a pre-existing TypeScript issue with the margin tuple type in `Reports.tsx:207`. It works correctly at runtime.

---

*minimaxi — Predictive Maintenance Platform*
