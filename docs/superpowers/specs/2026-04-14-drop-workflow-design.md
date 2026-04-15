# Drop Workflow Redesign — Design Spec

**Date:** 2026-04-14
**Status:** Draft
**Branch:** `feature/drop-workflow-ticket-number`
**Worktree:** `.worktrees/drop-workflow`

---

## Context

The existing `/drop` page (DropPage.tsx) uses a multi-step modal flow that requires navigating through overlays to add customer, shoes, and services. Staff report it's slow and unintuitive for high-volume drop-offs.

This redesign converts the drop page into a **single-screen, state-driven form** where all fields are visible at once, selections cascade naturally (Category → Color → Brand → Memo → Material → Service → Service Variations), and a persistent cart shows the formatted end product.

A **ticket number** is assigned at the moment a drop is created — one ticket per drop, regardless of how many shoe items.

---

## Design Direction

**Layout:** Two-column split screen
- **Left column (60%):** The step-by-step input form — one card with all fields visible, fields are enabled/disabled based on cascade logic
- **Right column (40%):** The cart summary — live preview of items, total, and action buttons

**Cascade Logic (fields enable as previous steps complete):**

```
Customer → Category → Color → Brand → Material → Short Description → Memo → Service → Service Variations
```

Memo appears after Short Description. Service → Service Variations is sequential.

**Field Behavior:**
- Each field appears as a **dropdown/search-select**
- Once a value is selected, the field locks (shows as filled chip) and the next field activates
- All fields have a **Clear/Change** button to go back
- Pressing Enter or an **Add to Cart** button adds the item

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  NEW DROP          Ticket: 2026-04-0001        [Customer: John] │
├────────────────────────────────┬────────────────────────────────┤
│                                │                                │
│  STEP 1: Select Customer       │  CART (2 items)                │
│  ┌──────────────────────────┐  │                                │
│  │ 🔍 Search or add...      │  │  ┌──────────────────────────┐  │
│  └──────────────────────────┘  │  │  Women's High Heel       │  │
│                                │  │  Black, Byblos, Delicate, │  │
│  STEP 2: Category             │  │  Special Attention, Fabric│  │
│  ┌──────────────────────────┐  │  │  CGGG                     │  │
│  │ Select Category ▼        │  │  │  Elastic - New Left      │  │
│  └──────────────────────────┘  │  │  ─────────────── UGX ??? │  │
│                                │  └──────────────────────────┘  │
│  STEP 3: Color                │  │                                │
│  ┌──────────────────────────┐  │  ┌──────────────────────────┐  │
│  │ Select Color ▼           │  │  │  Men's Dress Shoe        │  │
│  └──────────────────────────┘  │  │  Brown, Bass, Broken Zipper│ │
│                                │  │  Leather                  │  │
│  STEP 4: Brand                │  │  Zipper - New Pair        │  │
│  ┌──────────────────────────┐  │  │  ─────────────── UGX ??? │  │
│  │ Search brand... ▼        │  │  └──────────────────────────┘  │
│  └──────────────────────────┘  │                                │
│                                │  ─────────────────────────────  │
│  STEP 5: Material            │  TOTAL:  UGX 0                  │
│  ┌──────────────────────────┐  │  [COMPLETE DROP]               │
│  │ Select Material ▼        │  │                                │
│  └──────────────────────────┘  │                                │
│                                │                                │
│  STEP 6: Short Description    │                                │
│  ┌──────────────────────────┐  │                                │
│  │ (optional free text)     │  │                                │
│  └──────────────────────────┘  │                                │
│                                │                                │
│  STEP 7: Memo (multi-select)  │                                │
│  ┌──────────────────────────┐  │                                │
│  │ Select Memo ▼            │  │                                │
│  └──────────────────────────┘  │                                │
│                                │                                │
│  STEP 8: Service              │                                │
│  ┌──────────────────────────┐  │                                │
│  │ Select Service ▼         │  │                                │
│  └──────────────────────────┘  │                                │
│                                │                                │
│  STEP 9: Service Variations   │                                │
│  ┌──────────────────────────┐  │                                │
│  │ Select Variation ▼       │  │                                │
│  └──────────────────────────┘  │                                │
│                                │                                │
│  Price: [________] UGX        │                                │
│  [+ ADD TO CART]              │                                │
│                                │                                │
└────────────────────────────────┴────────────────────────────────┘
```

---

## Fields & Options

### Customer
- Existing search/add customer (already implemented)
- Shows selected customer name + phone in header

### Category
- From existing `categories` table or static list
- Options: Women's High Heel, Men's Dress Shoe, Men's Casual, Women's Flat, Children's, Sandal, Boot, Loafer, etc.

### Color
- From existing `colors` table (is_active = true)

### Brand
- Predefined list (alphabetical, ~100+ brands):
  Adidas, AFS, Air Jordan, Alberta Ferretti, Albertino, Alberto Fermani, Alberto Ferriti, Aldo, Alejandro Ingelmo, Allen Edmunds, ANAX, Andrew Marc, Anne Klein, Anyi Lu, Aquatalia by Marvin K, Armani, Armani Exchange, Ash, Australia Love Collective, Bally, Barney's, BASEMEN, Bass, BCBG Maxazria, Bench, Betsey Johnson, Bettye Muller, Beverly Hills, Boss, Boutique 9, Brooks, Bruno Magli, BRUNO MARC, BRUSQUE, Burberry, Bvlgari, Byblos, Calvin Klein, Carlos Falchi, [and the rest alphabetically]

### Memo
Multi-select from: Broken Button, Damaged Hardware, Damaged Material, Damaged Ornament, Missing Button, Missing Hardware, Missing Ornament, Delicate, Broken Zipper, Discolored, Faded Color, Faded/Removed Plate, ASAP, Rush, Special Attention

### Material
Single-select from: Canvas, Fabric, Nubuck, Leather, Patent Leather, Satin, Suede

### Service
Single-select from: Elastic, Glue, Hardware, Heel, Heel Fix, Insoles, Misc, Pad, Patches, Rips, Sling, Stitch, Straps, Stretch, Tassels, Zipper

### Service Variations
Single-select from: New Left, New Pair, New Right, Shorten Left, Shorten Pair, Shorten Right

### Price
Manual text input (numeric) — no price lookup

---

## Cart Item Display Format

Each cart item renders as:

```
Women's High Heel
Black, Byblos, Fabric, CGGG, Delicate, Special Attention
Elastic - New Left
────────────────────
UGX 50,000
```

**Format breakdown:**
- Line 1: Category
- Line 2: Color, Brand, Material, [Short Description], [all selected Memos comma-separated]
- Line 3: [Service] - [Service Variation]
- Line 4: ────────────────────
- Line 5: UGX [price]

Note: Short Description (e.g., "CGGG", "rush job") is optional free text entered by the user, placed before Memos on Line 2.

**When multiple services on same shoe:** each service appears on its own line within the same item block.

---

## Ticket Number

- **Format:** `2026-04-0001` (YYYY-MM-Sequential, reset monthly)
- **Generation:** On first item added to cart OR on page load (reserve the next number)
- **Storage:** `operations.ticket_number` column (new field, INTEGER UNIQUE NOT NULL)
- **Sequence:** PostgreSQL sequence `ticket_number_seq`, reset monthly via a scheduled job or manual trigger
- **Display:** Shown in page header, on all tickets/receipts

---

## Component Inventory

### `<DropPage>` (main container)
- Manages: selectedCustomer, cartItems[], ticketNumber, currentStep
- Renders: left column form + right column cart

### `<CustomerSelector>`
- Search existing customers + add new
- Already implemented in current app, reused

### `<CascadeSelect>`
- Generic field component: label, dropdown, selected value chip, clear button
- States: locked (filled), active (editable), disabled (waiting for prior step)

### `<MemoSelect>`
- Multi-select checkboxes/chips for Memo field
- Selected memos shown as removable chips

### `<CartSummary>`
- Lists cart items in the display format
- Shows running total
- "Complete Drop" button (creates operation + all items)

### `<CartItem>`
- Single shoe item in cart, formatted per display spec
- Edit / Remove buttons

### `<PriceInput>`
- Manual price entry with UGX prefix
- Numeric only, formatted with commas

### `<TicketBadge>`
- Displays current ticket number in header

---

## Data Flow

### Adding an item to cart:

```typescript
interface CartItem {
  id: string;               // temp uuid
  category: string;
  color: string;
  brand: string;
  material: string;
  shortDescription: string;  // optional free text
  memos: string[];         // multi-select
  services: {
    service: string;
    variation: string;
  }[];
  price: number;            // manually entered
}
```

1. User selects Category → locks, enables Color
2. User selects Color → locks, enables Brand
3. User selects Brand → locks, enables Material + Memo (parallel)
4. User selects Material + Memo → both lock, enable Service
5. User selects Service → locks, enables Service Variation
6. User selects Service Variation → locks
7. User enters Price
8. User clicks "Add to Cart" → item rendered in format, form resets to step 2

### Completing a drop:

```typescript
// POST /api/operations
{
  ticket_number: "2026-04-0001",
  customer_id: "uuid",
  items: [ /* CartItem[] */ ],
  total: number,
  // creates operations + operation_shoes + operation_services records
}
```

---

## Ticket Number Generation

```sql
-- New column in operations table
ALTER TABLE operations ADD COLUMN ticket_number TEXT UNIQUE NOT NULL;

-- Sequence (managed per-month)
CREATE SEQUENCE ticket_number_seq;

-- Generate ticket number: YYYY-MM-XXXX
SELECT
  to_char(CURRENT_DATE, 'YYYY-MM') || '-' ||
  lpad(nextval('ticket_number_seq')::text, 4, '0');
```

The sequence should be scoped to the month. A simple approach: at the start of each month, manually reset the sequence via `SELECT setval('ticket_number_seq', 1)`.

---

## Files to Modify

### New files (worktree):
- `src/pages/DropPage.tsx` — complete rewrite as single-screen
- `src/components/drop/CascadeSelect.tsx` — reusable cascade dropdown
- `src/components/drop/CartSummary.tsx` — right column cart
- `src/components/drop/CartItem.tsx` — individual cart item
- `src/components/drop/MemoSelect.tsx` — multi-select memo field
- `src/components/drop/PriceInput.tsx` — manual price field
- `src/components/drop/TicketBadge.tsx` — ticket number header badge

### Modify:
- `server/db/postgres-schema.ts` — add `ticket_number` column to `operations`
- `server/operations.ts` — handle ticket number generation
- `server/index.ts` — ticket number in response
- `src/types/index.ts` — add `CartItem`, `TicketNumber` types
- `src/contexts/OperationContext.tsx` — add to cart, remove from cart, complete drop
- `src/services/api.ts` — include ticket_number in API calls
- `src/App.tsx` — route for DropPage

---

## Verification

1. Load `/drop` — verify ticket number appears in header
2. Search and select an existing customer
3. Complete cascade: Category → Color → Brand → Material/Memo → Service → Service Variation
4. Enter price, click Add to Cart — item appears in cart with correct format
5. Add a second item with different values
6. Verify cart total updates
7. Click Complete Drop — operation created with correct ticket number
8. Verify on TicketsPage that the new operation appears with correct ticket number
9. Page reload — ticket number increments to next value

---

## Verification Commands

```bash
# Start the app
cd .worktrees/drop-workflow && npm run dev

# Test ticket number endpoint (after implementation)
curl http://localhost:3000/api/ticket/next
# Expected: { "ticket_number": "2026-04-0001" }

# Verify database column
psql -h localhost -U postgres -d cavemo-repair -c "\d operations" | grep ticket_number
```
