# Pickup Collector Information Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Picked Up By" collector information to pickup workflow - modal pre-filled with customer info, stored in DB, displayed on picked items page.

**Architecture:** Add two nullable columns to operations table (`picked_up_by_name`, `picked_up_by_phone`), update PATCH endpoint to accept them, create a modal component for collector input, integrate into PickupPage, display on PickedItemsPage.

**Tech Stack:** React (frontend), Express/PostgreSQL (backend), lucide-react icons

---

## File Structure

### Backend
- `server/db/postgres-schema.ts` - Add columns
- `server/operations.ts` - Accept new fields in PATCH endpoint

### Frontend
- `src/components/CollectorInfoModal.tsx` - New modal component
- `src/pages/PickupPage.tsx` - Integrate modal trigger
- `src/pages/PickedItemsPage.tsx` - Display collector info

---

## Task 1: Add Database Columns

**Files:**
- Modify: `server/db/postgres-schema.ts`

- [ ] **Step 1: Read postgres-schema.ts to find where picked_up_at is defined (around line 135)**

```bash
grep -n "picked_up_at" server/db/postgres-schema.ts
```

- [ ] **Step 2: Add two new columns after picked_up_at column definition**

In `postgres-schema.ts` around line 135, after `picked_up_at TIMESTAMPTZ,` add:

```typescript
picked_up_by_name VARCHAR(255),
picked_up_by_phone VARCHAR(50),
```

- [ ] **Step 3: Add migration block for existing database**

Find the migration block around line 150 where `picked_up_at` column is added (ALTER TABLE), and add similar blocks for the new columns:

```typescript
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'picked_up_by_name') THEN
  ALTER TABLE operations ADD COLUMN picked_up_by_name VARCHAR(255);
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'picked_up_by_phone') THEN
  ALTER TABLE operations ADD COLUMN picked_up_by_phone VARCHAR(50);
END IF;
```

---

## Task 2: Update Backend PATCH Endpoint

**Files:**
- Modify: `server/operations.ts`

- [ ] **Step 1: Read the workflow-status PATCH endpoint (around line 566)**

```bash
grep -n "workflow_status" server/operations.ts | head -20
```

- [ ] **Step 2: Find the PATCH handler and add destructuring for new fields**

Around line 566, find:
```typescript
const { workflow_status, picked_up_at } = req.body;
```

Change to:
```typescript
const { workflow_status, picked_up_at, picked_up_by_name, picked_up_by_phone } = req.body;
```

- [ ] **Step 3: Add SQL update for new fields in the updates array**

Find where `picked_up_at` is handled (around line 600) and add:

```typescript
if (picked_up_by_name !== undefined) {
  updates.push(`picked_up_by_name = $${paramIndex++}`);
  values.push(picked_up_by_name);
}

if (picked_up_by_phone !== undefined) {
  updates.push(`picked_up_by_phone = $${paramIndex++}`);
  values.push(picked_up_by_phone);
}
```

- [ ] **Step 4: Update transformOperation in server/utils.ts to include new fields**

Find `transformOperation` and ensure it includes:
```typescript
pickedUpByName: operation.picked_up_by_name || null,
pickedUpByPhone: operation.picked_up_by_phone || null,
```

---

## Task 3: Create CollectorInfoModal Component

**Files:**
- Create: `src/components/CollectorInfoModal.tsx`

- [ ] **Step 1: Create the modal component**

```tsx
import React, { useState } from 'react';
import { X, Package, User, Phone } from 'lucide-react';

interface CollectorInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, phone: string) => void;
  customerName: string;
  customerPhone: string;
}

export function CollectorInfoModal({
  isOpen,
  onClose,
  onConfirm,
  customerName,
  customerPhone,
}: CollectorInfoModalProps) {
  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);

  React.useEffect(() => {
    if (isOpen) {
      setName(customerName);
      setPhone(customerPhone);
    }
  }, [isOpen, customerName, customerPhone]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(name, phone);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Confirm Pickup</h2>
                <p className="text-emerald-100 text-xs">Enter collector information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Collected By
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter collector name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Confirm Pickup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CollectorInfoModal;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CollectorInfoModal.tsx
git commit -m "feat: add CollectorInfoModal component for pickup confirmation"
```

---

## Task 4: Integrate Modal into PickupPage

**Files:**
- Modify: `src/pages/PickupPage.tsx`

- [ ] **Step 1: Add CollectorInfoModal import**

```tsx
import { CollectorInfoModal } from '../components/CollectorInfoModal';
```

- [ ] **Step 2: Add state for modal and collector info**

Add after existing state:
```tsx
const [showCollectorModal, setShowCollectorModal] = useState(false);
const [pendingPickupId, setPendingPickupId] = useState<string | null>(null);
```

- [ ] **Step 3: Create handler for pickup confirmation with collector info**

Replace `handleMarkPickedUp` with:

```tsx
const handleMarkPickedUp = async (ticketId: string) => {
  // Instead of directly marking picked up, show modal
  setPendingPickupId(ticketId);
  setShowCollectorModal(true);
};

const handleCollectorConfirm = async (name: string, phone: string) => {
  if (!pendingPickupId) return;

  try {
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
    const pickedUpAt = new Date().toISOString();

    const transitions = [
      { status: 'in_progress', picked_up_at: undefined },
      { status: 'ready', picked_up_at: undefined },
      { status: 'delivered', picked_up_at: pickedUpAt, picked_up_by_name: name, picked_up_by_phone: phone },
    ];

    for (const transition of transitions) {
      const response = await fetch(`${API_ENDPOINTS.operations}/${pendingPickupId}/workflow-status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          workflow_status: transition.status,
          ...(transition.picked_up_at && { picked_up_at: transition.picked_up_at }),
          ...(name && { picked_up_by_name: name }),
          ...(phone && { picked_up_by_phone: phone }),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to transition to ${transition.status}`);
      }
    }

    await refreshOperations();
    setSelectedTicket(null);
    setShowCollectorModal(false);
    setPendingPickupId(null);
  } catch (error) {
    console.error('Failed to mark as picked up:', error);
    alert(error instanceof Error ? error.message : 'Failed to mark as picked up. Please try again.');
  }
};
```

- [ ] **Step 4: Add CollectorInfoModal JSX before PaymentModal**

Add before the PaymentModal closing tag:

```tsx
{showCollectorModal && selected && (
  <CollectorInfoModal
    isOpen={showCollectorModal}
    onClose={() => {
      setShowCollectorModal(false);
      setPendingPickupId(null);
    }}
    onConfirm={handleCollectorConfirm}
    customerName={selected.customerName}
    customerPhone={selected.customerPhone}
  />
)}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/PickupPage.tsx
git commit -m "feat: integrate CollectorInfoModal into PickupPage"
```

---

## Task 5: Update PickedItemsPage to Display Collector Info

**Files:**
- Modify: `src/pages/PickedItemsPage.tsx` (or check if it exists at a different path)

- [ ] **Step 1: Find and read the PickedItemsPage**

```bash
find src -name "*Picked*" -o -name "*picked*" | grep -i page
```

- [ ] **Step 2: Read the file and find where pickup info is displayed**

- [ ] **Step 3: Add collector info to the display**

Add a section showing:
- Collector name (with User icon)
- Collector phone (with Phone icon)
- Pickup date (already shows picked_up_at)

Example display:
```tsx
<div className="flex items-center gap-2 text-sm">
  <User className="w-4 h-4 text-gray-400" />
  <span className="text-gray-300">{pickedUpByName || 'N/A'}</span>
</div>
<div className="flex items-center gap-2 text-sm">
  <Phone className="w-4 h-4 text-gray-400" />
  <span className="text-gray-300">{pickedUpByPhone || 'N/A'}</span>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/PickedItemsPage.tsx
git commit -m "feat: display collector info on PickedItemsPage"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add `picked_up_by_name` and `picked_up_by_phone` columns to operations table |
| 2 | Update PATCH endpoint to accept and store new fields |
| 3 | Create CollectorInfoModal component |
| 4 | Integrate modal into PickupPage |
| 5 | Display collector info on PickedItemsPage |

---

## Verification

1. Start backend and frontend
2. Go to Pickup page
3. Select a ticket with zero balance
4. Click PICK UP button
5. Verify modal appears with customer name and phone pre-filled
6. Confirm pickup
7. Go to Picked Items page
8. Verify collector name, phone, and date are displayed
