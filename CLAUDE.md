# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack Point of Sale (POS) system for shoe repair businesses. Built with React + TypeScript (Vite) frontend and Express + PostgreSQL backend with a SQLite-compatible wrapper layer. Currency is Ugandan Shilling (UGX, 0 decimal places).

**Important:** The database uses PostgreSQL via `pg` Pool, but a compatibility layer (`server/database.ts`) wraps it to provide SQLite-like `db.run()`, `db.get()`, `db.all()` methods. Always use this wrapper, not raw `pool.query()` directly.

## Development Commands

**Environment setup:**
```bash
cp .env.example .env
```

**Start both client and server:**
```bash
npm run dev
```

**Start individual servers:**
```bash
npm run dev:client  # Vite dev server on port 5173
npm run dev:server  # Express server on port 3000
```

**Build and lint:**
```bash
npm run build    # TypeScript compilation + Vite build
npm run lint     # ESLint with TypeScript rules
npm run preview  # Preview production build locally
```

**Database seeding (via tsx):**
```bash
tsx server/reset_database.ts     # Reset and reinitialize database
tsx server/add_services.ts      # Add sample service data
```

**Import services from pricing.txt:**
```bash
npm run import:services    # Import 45 services with UGX pricing
npm run cleanup:services   # Remove duplicate services
```

## Architecture

### Backend (Express + PostgreSQL)

**Entry point:** `server/index.ts` (port 3000)

**Database:** PostgreSQL via `pg` Pool (`server/database.ts`)
- Connection: `cavemo-repair` database on localhost:5432
- Schema: `server/db/postgres-schema.ts`
- Seeds: `server/db/postgres-seeds.ts` (auto-runs on startup)
- Uses `withTransaction()` helper for multi-step operations

**API Routes** (mounted at `/api/<name>`):
- `operations` - Repair order management (main router at `server/operations.ts`)
- `inventory` - Inventory management
- `printer` - Thermal printer integration (escpos/node-thermal-printer)
- `sales` - Sales transactions
- `qrcodes` - QR code generation
- `supplies` - Supply inventory tracking
- `categories` - Product categories
- `products` - Product catalog
- `analytics` - Reporting data
- `auth` - Authentication
- `business` - Business settings
- `customers` - Customer management (served by `creditRoutes`)
- `expenses` - Expense tracking
- `invoices` - Invoice management
- `retail-products` - Retail product catalog
- `staff-messages` - Staff messaging
- `ticket` - Ticket-specific endpoints
- `colors` - Color/swatch management

**Key tables:** `customers`, `operations`, `operation_shoes`, `operation_services`, `services`, `products`, `categories`, `supplies`, `inventory_items`, `sales`, `sales_items`, `sales_categories`

### Frontend (React + Vite)

**Context provider nesting** (outer to inner):
```
CustomerProvider → OperationProvider → AdminProvider → CartProvider →
ProductProvider → RetailProductProvider → ServiceProvider → StaffMessageProvider → ExpenseProvider
```

**Lazy-loaded pages** (for performance):
```
CustomerPage, SalesPage, ReportsPage, BusinessTargetsPage, AdminPage, ExpensesPage
```
These use React.lazy() + Suspense with a spinner fallback.

**Authentication:** Zustand store (`src/store/authStore.ts`) with local mock users in localStorage. Roles: admin, manager, staff. Login at `src/pages/LoginPage.tsx`. Protected routes use `ProtectedRoute` component with permission-based and role-based access control.

**Key routes:**
- `/store` - Main dashboard
- `/customers` - Customer management (lazy)
- `/drop` - New repair order drop-off
- `/pickup`, `/pickup-order`, `/picked-items` - Customer pickup workflow
- `/tickets` - Main repair orders list
- `/ticket-search` - Search tickets
- `/assembly`, `/racking` - Workshop workflow stages
- `/deliveries` - Delivery management
- `/cod-payment` - Cash on delivery payments
- `/ready-to-pick` - Orders ready for pickup
- `/balances`, `/unpaid-balances` - Balance tracking
- `/sales` - Retail sales (lazy)
- `/expenses` - Business expense tracking (lazy)
- `/reports` - Analytics dashboard (lazy)
- `/invoices` - Invoice management
- `/admin` - Admin panel (lazy)
- `/business-targets` - Business targets (lazy)
- `/credits`, `/credit-list` - Customer credits
- `/new-customers` - New customer registration
- `/stock-levels` - Inventory stock levels
- `/customer-rankings` - Customer analytics
- `/most-performing` - Performance analytics
- `/discounts` - Discount management
- `/notifications`, `/notification` - Notifications
- `/no-charge-do-over` - No-charge redo orders

**API integration:** Vite proxy forwards `/api` requests to `http://localhost:3000`. API config at `src/config/api.ts`.

**UI stack:** Material-UI + Tailwind CSS + Radix UI (select/switch/toast) + Lucide/FontAwesome icons + React Hot Toast + Chart.js 2/Recharts.

## Critical Development Rules

**Do NOT delete functionality, remove pages, or make destructive changes unless explicitly requested.** The codebase has had accidental removals of financial summary cards and other functionality. Always read a file's current state before editing. Preserve all existing functionality when adding new features.

## Key Implementation Details

- **Currency formatting:** `src/config/currency.ts` and `server/config/currency.ts` - UGX with 0 decimals
- **Service import:** `pricing.txt` → `tsx server/import_services_from_pricing.ts`. Parses CSV with quoted prices, handles ranges (uses max value), auto-categorizes by name patterns, safe to re-run (INSERT OR REPLACE)
- **Snake_case ↔ camelCase:** `server/utils.ts` has `transformCustomer`, `transformOperation`, `transformService`
- **Image uploads:** Converted to base64 data URLs (no cloud storage)
- **Online/offline:** Built-in detection with status indicator
- **Error handling:** `ErrorBoundary` component on frontend; Express error middleware at end of chain
- **Layout:** Collapsible sidebar (`MainMenu`) + `QuickActionButtons` on right side + `Outlet` for page content

## Database Schema Relationships

```
customers (1) ----< (many) operations
operations (1) ----< (many) operation_shoes
operation_shoes (1) ----< (many) operation_services
services (1) ----< (many) operation_services
categories (1) ----< (many) products
sales_categories (1) ----< (many) sales_items
```

## Development Guidelines

Behavioral guidelines derived from Andrej Karpathy's LLM coding observations. These complement the project-specific rules above.

**Tradeoff:** These bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: *"Would a senior engineer say this is overcomplicated?"* If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that *your* changes made unused.
- Don't remove pre-existing dead code unless asked.

**Test:** Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan before starting:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
