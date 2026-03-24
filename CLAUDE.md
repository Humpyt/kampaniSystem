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
```

**Database utilities:**
```bash
npm run init:supplies     # Initialize supplies table
npm run add:supplies      # Add dummy supply data
npm run create:admin      # Create admin user script
```

## Architecture

### Backend (Express + SQLite)

- **Entry point:** `server/index.ts` - Express server on port 3000
- **Database:** SQLite (`server/database.db`) initialized in `server/database.ts`
- **Router structure:** Modular routers in `server/routes/`:
  - `operations.ts` - Main router mounted at `/api/operations` (also exported as `server/operations.ts`)
  - `inventory.ts`, `sales.ts`, `printer.ts`, `qrcodes.ts`, `supplies.ts`, `categories.ts`, `products.ts`

**Database schema key tables:**
- `customers` - Customer records with loyalty points
- `operations` - Repair orders (linked to customers)
- `operation_shoes` - Individual shoes in an order
- `operation_services` - Services applied to each shoe
- `services` - Available services with pricing
- `sales_categories` / `sales_items` - Retail product categories and items
- `products` / `categories` - Additional product catalog (uses ProductContext)

**Important:** The app uses both SQLite (server-side) and Firebase Firestore (user authentication data).

### Frontend (React + Vite)

**State management:** Context-based architecture
- `CustomerContext` - Customer data and operations
- `OperationContext` - Repair order/ticket management
- `ProductContext` - Product/category catalog management
- `CartContext` - Shopping cart for sales
- `AdminContext` - Admin-specific state

**Authentication:** Local mock authentication using Zustand (`src/store/authStore.ts`)
- Mock users with different roles (admin, manager, staff)
- Credentials stored in localStorage
- Login component at `src/components/Login.tsx`

**Routing:** `react-router-dom` v7 with nested routes
- Protected routes use `ProtectedRoute` component with role-based access
- All routes nested under main layout with collapsible sidebar
- Entry point: `src/App.tsx`

**API integration:** Axios (or fetch) calls to backend via Vite proxy:
- Vite dev server proxies `/api` requests to `http://localhost:3000`

**Authentication:** Firebase Authentication
- Config: `src/config/firebase.ts` (currently has dummy values - needs real Firebase credentials)
- User roles stored in Firestore: `users` collection with `role` field
- Roles: `admin`, `manager`, `staff`

**UI Components:**
- Material-UI (`@mui/material`) for base components
- Tailwind CSS for styling
- Radix UI for select components
- Lucide React icons
- React Hot Toast for notifications

### Key Features

- **Repair orders:** Multi-step workflow (drop-off → assembly → racking → pickup)
- **Inventory management:** Supplies tracking with low-stock alerts
- **Sales:** Retail items for sale (polish, laces, insoles, accessories)
- **QR codes:** Generate printable QR codes for various purposes
- **Thermal printing:** Integration with thermal printers via USB
- **Role-based access:** Admin-only routes (staff page, admin page)

## Important Notes

1. **Database location:** SQLite database file at `server/database.db` - created automatically on first server run.

2. **Transaction handling:** Backend uses manual BEGIN TRANSACTION / COMMIT / ROLLBACK for multi-step database operations.

3. **Column naming convention:** SQLite uses snake_case (e.g., `customer_id`), but TypeScript interfaces use camelCase. A transformer utility (`server/utils.ts`) converts between formats.

4. **Printer support:** Uses `escpos` and `node-thermal-printer` packages for USB thermal printer integration.

5. **Image uploads:** Images are converted to base64 data URLs for local storage (no cloud storage required).

6. **Deployment:** Configured for Netlify (see `netlify.toml`). Note that the Express backend won't work on Netlify - it's designed for local development or a separate Node.js hosting.
