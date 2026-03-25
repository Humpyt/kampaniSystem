# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack Point of Sale (POS) system for shoe repair businesses. Built with React + TypeScript (Vite) frontend and Express + SQLite backend.

## Development Commands

**Start development servers (both client and server):**
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

**Database utilities:**
```bash
npm run init:supplies     # Initialize supplies table
npm run add:supplies      # Add dummy supply data
```

**Database seeding scripts (run via tsx):**
```bash
tsx server/reset_database.ts     # Reset and reinitialize database
tsx server/add_customers.ts      # Add sample customer data
tsx server/add_services.ts       # Add sample service data
```

**Service management:**
```bash
npm run import:services          # Import services from pricing.txt to database
```

## Architecture

### Backend (Express + SQLite)

- **Entry point:** `server/index.ts` - Express server on port 3000
- **Database:** SQLite (`server/database.db`) initialized in `server/database.ts`
- **Auto-seeding:** Database automatically seeds default categories, services, and products on first run via `server/seed-data.ts`

**Router structure:** Modular routers in `server/routes/`:
- `operations.ts` - Main router mounted at `/api/operations` (also at `server/operations.ts`)
- `orders.ts` - Order management endpoints
- `inventory.ts` - Inventory management
- `sales.ts` - Sales endpoints
- `printer.ts` - Thermal printer integration
- `qrcodes.ts` - QR code generation
- `supplies.ts` - Supplies tracking
- `categories.ts` - Product categories
- `products.ts` - Product catalog

**Database schema key tables:**
- `customers` - Customer records with loyalty points, total_orders, total_spent
- `operations` - Repair orders (linked to customers, supports no_charge, do_over, delivery, pickup flags)
- `operation_shoes` - Individual shoes in an order
- `operation_services` - Services applied to each shoe
- `services` - Available services with pricing and estimated_days
- `sales_categories` / `sales_items` - Retail product categories and items
- `products` / `categories` - Additional product catalog (uses ProductContext)
- `supplies` - Supply inventory tracking with low-stock alerts
- `inventory_items` - Full inventory management system
- `sales` - Transaction tracking (repair, retail, pickup types)
- `qrcodes` - QR code storage

### Frontend (React + Vite)

**State management:** Context-based architecture with nested providers
- `CustomerProvider` → `OperationProvider` → `AdminProvider` → `CartProvider` → `ProductProvider` → `ServiceProvider`
- `CustomerContext` - Customer data and operations
- `OperationContext` - Repair order/ticket management
- `ProductContext` - Product/category catalog management
- `CartContext` - Shopping cart for sales
- `AdminContext` - Admin-specific state
- `ServiceContext` - Service catalog and pricing

**Authentication:** Local mock authentication using Zustand (`src/store/authStore.ts`)
- Mock users with roles: admin, manager, staff
- Credentials stored in localStorage
- Login component at `src/pages/LoginPage.tsx`
- Test credentials (username / password):
  - admin@repairpro.com / admin123
  - manager@repairpro.com / manager123
  - staff1@repairpro.com / staff123
- Protected routes use `ProtectedRoute` component with role-based access control

**Routing:** `react-router-dom` v7 with nested routes
- All routes nested under main layout with collapsible sidebar
- Protected routes use `ProtectedRoute` component with role-based access
- Entry point: `src/App.tsx`
- Online/offline detection built-in with status indicator

**API integration:** Backend via Vite proxy:
- Vite dev server proxies `/api` requests to `http://localhost:3000`
- Direct fetch/axios calls to backend endpoints

**UI Components:**
- Material-UI (`@mui/material`) for base components
- Tailwind CSS for styling
- Radix UI for select/switch/toast components
- Lucide React icons
- React Hot Toast for notifications
- React Chart.js 2 for analytics

**Utility functions:**
- `src/utils/formatCurrency.ts` - Currency formatting using UGX locale
- `server/utils.ts` - Data transformers for snake_case ↔ camelCase conversion (transformCustomer, transformOperation, transformService)

### Key Features

- **Repair orders:** Multi-step workflow (drop-off → assembly → racking → pickup)
- **Quick actions:** Hold/Quick Drop, No Charge/Do Over pages
- **Inventory management:** Supplies tracking with low-stock alerts
- **Sales:** Retail items for sale (polish, laces, insoles, accessories)
- **QR codes:** Generate printable QR codes for various purposes
- **Thermal printing:** Integration with thermal printers via USB
- **Role-based access:** Admin-only routes (staff page, admin page)
- **Reports:** Analytics dashboard with charts

## Important Notes

1. **Currency:** System uses Ugandan Shilling (UGX) with 0 decimal places. Currency config is centralized in `src/config/currency.ts` and `server/config/currency.ts`.

2. **Service pricing:** Services are imported from `pricing.txt` file containing 45 services with prices in UGX. Use `npm run import:services` to import/update services. The import script:
   - Parses CSV format with quoted price fields
   - Handles price ranges by using maximum value (e.g., "80,000-150,000" → 150,000)
   - Auto-categorizes services based on name patterns (cleaning, heel, sole, dyeing, etc.)
   - Assigns estimated days based on service complexity
   - Safe to re-run (uses INSERT OR REPLACE)

3. **Database location:** SQLite database file at `server/database.db` - created automatically on first server run.

3. **Transaction handling:** Backend uses manual BEGIN TRANSACTION / COMMIT / ROLLBACK for multi-step database operations. The database module also provides a transaction wrapper function.

4. **Column naming convention:** SQLite uses snake_case (e.g., `customer_id`), but TypeScript interfaces use camelCase. A transformer utility (`server/utils.ts`) converts between formats.

5. **Database promisification:** The sqlite3 callback-based API is promisified in `server/database.ts` for async/await usage.

6. **Printer support:** Uses `escpos` and `node-thermal-printer` packages for USB thermal printer integration.

7. **Image uploads:** Images are converted to base64 data URLs for local storage (no cloud storage required).

8. **Online/offline detection:** App automatically detects network status and shows offline indicator when disconnected.

9. **Error handling:** Frontend uses `ErrorBoundary` component for catching React errors; backend has error middleware at the end of the Express middleware chain.

10. **Deployment:** Configured for Netlify (see `netlify.toml`). Note that the Express backend won't work on Netlify - it's designed for local development or a separate Node.js hosting.

11. **TypeScript:** Uses project references (tsconfig.app.json, tsconfig.node.json) for better type checking across frontend and backend.

## Database Schema Relationships

```
customers (1) ----< (many) operations
operations (1) ----< (many) operation_shoes
operation_shoes (1) ----< (many) operation_services
services (1) ----< (many) operation_services

categories (1) ----< (many) products
sales_categories (1) ----< (many) sales_items
```
