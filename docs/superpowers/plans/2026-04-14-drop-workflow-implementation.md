# Drop Workflow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the `/drop` page into a single-screen, two-column layout with a cascade form (Customer → Category → Color → Brand → Material → Short Description → Memo → Service → Service Variations → Price) and a live cart summary. Each drop gets a monthly-resetting ticket number (e.g., `2026-04-0001`).

**Architecture:** Backend adds `ticket_number` to the `operations` table with a PostgreSQL sequence. Frontend manages a local cart in `OperationContext`, with a complete rewrite of `DropPage.tsx` as a state-driven single-screen form. Components are broken into small, focused reusable pieces.

**Tech Stack:** React, TypeScript, Tailwind CSS, Material UI components, PostgreSQL, Express

---

## File Map

### Backend — Modified
| File | Responsibility |
|------|---------------|
| `server/db/postgres-schema.ts` | Add `ticket_number TEXT` column to `operations` |
| `server/operations.ts` | Accept `ticket_number` on create operation, return it in response |
| `server/utils.ts` | Add `ticket_number` to `transformOperation` |
| `server/routes/ticket.ts` | **NEW** — `GET /api/ticket/next` returns next available ticket number |

### Frontend — Modified
| File | Responsibility |
|------|---------------|
| `src/types/index.ts` | Add `CartItem`, `ServiceSelection`, `DropFormState` interfaces |
| `src/services/api.ts` | Add `ticket.getNext()` API call |
| `src/contexts/OperationContext.tsx` | Add `cartItems`, `addToCart`, `removeFromCart`, `clearCart`, `ticketNumber`, `setTicketNumber` state |

### Frontend — New Components
| File | Responsibility |
|------|---------------|
| `src/components/drop/TicketBadge.tsx` | Displays ticket number in page header |
| `src/components/drop/CascadeSelect.tsx` | Reusable locked/active dropdown field |
| `src/components/drop/MemoSelect.tsx` | Multi-select memo chips |
| `src/components/drop/PriceInput.tsx` | Manual price entry with UGX prefix |
| `src/components/drop/CartItem.tsx` | Single cart item rendered in display format |
| `src/components/drop/CartSummary.tsx` | Right-column cart with item list and total |
| `src/pages/DropPage.tsx` | Complete rewrite — main container, form state, cascade logic |

---

## Task 1: Database — Add ticket_number to operations

**Files:**
- Modify: `server/db/postgres-schema.ts`

- [ ] **Step 1: Add ticket_number column to operations table**

Find the `CREATE TABLE IF NOT EXISTS operations (` block in `server/db/postgres-schema.ts`. Add this column after `payment_method`:

```sql
ticket_number TEXT UNIQUE,
```

Also add a comment noting it uses the format `YYYY-MM-XXXX`.

Run verification:
```bash
psql -h localhost -U postgres -d cavemo-repair -c "\\d operations" | grep ticket_number
# Expected: ticket_number | text | 
```

---

## Task 2: Backend — Ticket number API endpoint

**Files:**
- Create: `server/routes/ticket.ts`
- Modify: `server/index.ts` (mount the route)

- [ ] **Step 1: Create server/routes/ticket.ts**

```typescript
import { Router } from 'express';
import { pool } from '../database.js';

const router = Router();

router.get('/next', async (req, res) => {
  try {
    const yearMonth = new Date().toISOString().slice(0, 7); // "2026-04"
    
    // Get the highest ticket number for the current month
    const result = await pool.query(
      `SELECT ticket_number FROM operations 
       WHERE ticket_number LIKE $1 
       ORDER BY ticket_number DESC LIMIT 1`,
      [`${yearMonth}-%`]
    );
    
    let seq = 1;
    if (result.rows.length > 0) {
      const last = result.rows[0].ticket_number;
      const lastSeq = parseInt(last.split('-')[2], 10);
      seq = lastSeq + 1;
    }
    
    const ticketNumber = `${yearMonth}-${String(seq).padStart(4, '0')}`;
    res.json({ ticket_number: ticketNumber });
  } catch (err) {
    console.error('ticket/next error:', err);
    res.status(500).json({ error: 'Failed to generate ticket number' });
  }
});

export default router;
```

- [ ] **Step 2: Mount ticket route in server/index.ts**

Find where other routes are imported/mounted. Add:
```typescript
import ticketRouter from './routes/ticket.js';
// ...
app.use('/api/ticket', ticketRouter);
```

Run verification:
```bash
curl http://localhost:3000/api/ticket/next
# Expected: { "ticket_number": "2026-04-0001" }
```

---

## Task 3: Backend — Update operations.ts to use ticket_number

**Files:**
- Modify: `server/operations.ts`
- Modify: `server/utils.ts`

- [ ] **Step 1: Update POST /api/operations to accept ticket_number**

In `server/operations.ts`, find the POST handler. Accept `ticket_number` from `req.body` and insert it:
```typescript
const { customer_id, items, notes, promised_date, ticket_number } = req.body;
// ...
INSERT INTO operations (..., ticket_number, ...) VALUES (..., $N, ...)
// Include ticket_number in the VALUES list
```

- [ ] **Step 2: Update transformOperation in server/utils.ts**

Add `ticket_number` to the transform:
```typescript
export const transformOperation = (operation: any) => ({
  // ...existing fields...
  ticketNumber: operation.ticket_number,
});
```

---

## Task 4: Frontend Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add CartItem and related types**

Add at the end of `src/types/index.ts`:

```typescript
export interface ServiceSelection {
  service: string;
  variation: string;
}

export interface CartItem {
  id: string;           // temp uuid
  category: string;
  color: string;
  brand: string;
  material: string;
  shortDescription: string;  // optional free text
  memos: string[];      // multi-select
  services: ServiceSelection[];
  price: number;        // manually entered
}

export interface DropFormState {
  customerId: string;
  category: string;
  color: string;
  brand: string;
  material: string;
  shortDescription: string;
  memos: string[];
  service: string;
  variation: string;
  price: string;
}
```

---

## Task 5: API — Ticket endpoint and cart state

**Files:**
- Modify: `src/services/api.ts`

- [ ] **Step 1: Add ticket.getNext() to api.ts**

Find the api object in `src/services/api.ts`. Add a `ticket` section:

```typescript
const api = {
  // ...existing entries...
  
  ticket: {
    getNext: async (): Promise<string> => {
      const response = await fetch(`${API_URL}/ticket/next`);
      const data = await response.json();
      return data.ticket_number;
    },
  },
};
```

---

## Task 6: OperationContext — Cart state management

**Files:**
- Modify: `src/contexts/OperationContext.tsx`

- [ ] **Step 1: Add cart state to OperationContext**

In `OperationContext.tsx`, add to the context state:
```typescript
const [cartItems, setCartItems] = useState<CartItem[]>([]);
const [ticketNumber, setTicketNumber] = useState<string>('');
```

Add these functions:
```typescript
const addToCart = (item: CartItem) => {
  setCartItems(prev => [...prev, item]);
};

const removeFromCart = (id: string) => {
  setCartItems(prev => prev.filter(item => item.id !== id));
};

const clearCart = () => {
  setCartItems([]);
  setTicketNumber('');
};

const fetchTicketNumber = async () => {
  const num = await api.ticket.getNext();
  setTicketNumber(num);
  return num;
};
```

Make these available in the context value.

---

## Task 7: New components — CascadeSelect, MemoSelect, PriceInput

**Files:**
- Create: `src/components/drop/CascadeSelect.tsx`
- Create: `src/components/drop/MemoSelect.tsx`
- Create: `src/components/drop/PriceInput.tsx`
- Create: `src/components/drop/TicketBadge.tsx`

### CascadeSelect Props:
```typescript
interface CascadeSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled: boolean;
  placeholder?: string;
}
```

**States:**
- `disabled` — greyed out, not interactive
- `active` — open dropdown, value can be selected
- `locked` — shows selected value as a chip with ✕ clear button

### MemoSelect Props:
```typescript
interface MemoSelectProps {
  options: string[];
  value: string[];
  onChange: (memos: string[]) => void;
  disabled: boolean;
}
```

### PriceInput:
Simple MUI TextField with UGX prefix, numeric only.

### TicketBadge:
Shows current ticket number in header badge format: `Ticket: 2026-04-0001`

---

## Task 8: CartItem and CartSummary components

**Files:**
- Create: `src/components/drop/CartItem.tsx`
- Create: `src/components/drop/CartSummary.tsx`

### CartItem Display Format (per item):
```
<Category>
<Color>, <Brand>, <Material>, <ShortDescription>, <Memo1>, <Memo2>, ...
<Service> - <Variation>
────────────────────
UGX <price>
```

### CartSummary:
- Header: "CART (<count> items)"
- Lists all CartItems
- Running total at bottom
- "COMPLETE DROP" button (disabled if cart empty or no customer selected)

---

## Task 9: DropPage rewrite

**Files:**
- Rewrite: `src/pages/DropPage.tsx`

This is the main container. Key structure:

```typescript
// State
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
const [form, setForm] = useState<DropFormState>({...});
const [cartItems, setCartItems] = useState<CartItem[]>([]);
const [ticketNumber, setTicketNumber] = useState('');

// Cascade: each field's "done" boolean gates the next
const steps = {
  customer: !!selectedCustomer,
  category: !!form.category,
  color: !!form.color,
  brand: !!form.brand,
  material: !!form.material,
  shortDesc: true, // always available after material
  memos: form.memos.length > 0,
  service: !!form.service,
  variation: !!form.variation,
};

// Add to cart handler
const handleAddToCart = () => {
  const item: CartItem = {
    id: uuidv4(),
    category: form.category,
    color: form.color,
    brand: form.brand,
    material: form.material,
    shortDescription: form.shortDescription,
    memos: form.memos,
    services: [{ service: form.service, variation: form.variation }],
    price: parseInt(form.price, 10) || 0,
  };
  setCartItems(prev => [...prev, item]);
  // Reset form fields below Brand (keep customer + category + color + brand)
};

// Complete drop handler
const handleCompleteDrop = async () => {
  await api.operations.create({
    ticket_number: ticketNumber,
    customer_id: selectedCustomer.id,
    items: cartItems,
  });
  // Reset all
};
```

### Layout: Two-column Tailwind grid `grid-cols-[3fr_2fr]` with the left form and right cart.

---

## Task 10: Integration — wire up to existing app

**Files:**
- Verify: `src/App.tsx` (already has DropPage at `/drop`)
- Verify: `server/index.ts` — no conflicts with ticket route mount

---

## Verification Plan

1. Start the server and client:
   ```bash
   cd .worktrees/drop-workflow && npm run dev
   ```
2. Navigate to `/drop` — ticket number should appear in header
3. Select a customer — Customer step locks
4. Select Category → Color → Brand — each locks, next enables
5. Select Material → enter Short Description → select Memos
6. Select Service → Service Variation → enter Price
7. Click "Add to Cart" — item appears in right column with correct format
8. Click "Complete Drop" — operation created
9. Check TicketsPage — new operation appears with correct ticket number
10. Reload `/drop` — ticket number increments

---

## Seed Data

Verify these tables have data (they should from existing seeds):
- `colors` — list of colors
- `services` — Elastic, Glue, Hardware, Heel, etc.
- `categories` — Women's High Heel, Men's Dress Shoe, etc.

If missing, they need to be seeded. Check `server/db/postgres-seeds.ts`.
