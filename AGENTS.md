# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the Vite + React frontend (TypeScript).
- `src/pages/` holds route-level screens; `src/components/` stores reusable UI; `src/contexts/` handles shared state.
- `src/services/` contains API and integration clients (for example printing and WhatsApp helpers).
- `server/` contains the Express backend (`server/index.ts`) plus route modules in `server/routes/` and DB scripts in `server/db/` and `server/migrations/`.
- `public/` stores static assets (logos, receipt branding, `_redirects`).
- `docs/superpowers/` contains implementation plans/specs; treat as supporting design docs, not runtime code.

## Build, Test, and Development Commands
Run commands from the repository root (`kampani-local/`):
- `npm install`: install dependencies.
- `npm run dev`: start frontend (`:5173`) and backend (`:3000`) concurrently.
- `npm run dev:client`: run only Vite frontend.
- `npm run dev:server`: run only backend with `tsx watch`.
- `npm run build`: type-check and build production assets.
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint with zero warnings allowed.

## Coding Style & Naming Conventions
- Language: TypeScript for frontend and backend.
- Indentation: 2 spaces; prefer semicolons and single quotes to match existing files.
- Components/pages: PascalCase file names (for example `PickupPage.tsx`, `QuickActionButtons.tsx`).
- Utilities/services/stores: camelCase file names (for example `formatCurrency.ts`, `authStore.ts`).
- Keep route handlers focused; move shared logic into `server/helpers/` or `server/utils/`.

## Testing Guidelines
- There is currently no automated test suite configured in `package.json`.
- Minimum gate before PR: `npm run lint` and `npm run build` must pass.
- Validate affected flows manually in dev mode (drop, pickup, invoices, printing, and any changed API route).
- For new features, include a short manual test checklist in the PR description.

## Commit & Pull Request Guidelines
- Follow the existing commit style seen in history: Conventional Commit prefixes such as `feat:`, `fix:`, `chore:` (optionally scoped, e.g. `feat(expenses): ...`).
- Keep commits focused and logically grouped.
- PRs should include: purpose, key changes, manual test steps, and screenshots/GIFs for UI updates.
- Link related issues/tasks and call out schema or migration impacts explicitly.
