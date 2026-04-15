# Compact Cart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make cart more compact: 35% width, no emoji, no Now Building preview, single-line details.

**Architecture:** Modify CartItemCard and CartSummary for compact layout, update DropPage width.

**Tech Stack:** React, TypeScript, Tailwind CSS

---

## Task 1: Compact CartItemCard

**Files:**
- Modify: `src/components/drop/CartItemCard.tsx`

- [ ] **Step 1: Rewrite CartItemCard for compact layout**

```tsx
import React from 'react';
import { Trash2 } from 'lucide-react';
import { CartItem } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface CartItemCardProps {
  item: CartItem;
  onEdit: (item: CartItem) => void;
  onRemove: (id: string) => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({ item, onEdit, onRemove }) => {
  return (
    <div
      onClick={() => onEdit(item)}
      className="bg-white rounded-lg hover:shadow-md transition-all border border-gray-200 group p-3"
    >
      {/* Line 1: Category + Price + Trash */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800 text-sm truncate">{item.category}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-emerald-600 font-bold text-sm">{formatCurrency(item.price)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
            className="p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
          </button>
        </div>
      </div>

      {/* Line 2: Color • Brand • Material • Description (single line) */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 flex-wrap">
        {item.color && <span>{item.color}</span>}
        {item.color && item.brand && <span>•</span>}
        {item.brand && <span>{item.brand}</span>}
        {(item.color || item.brand) && item.material && <span>•</span>}
        {item.material && <span>{item.material}</span>}
        {item.shortDescription && (item.color || item.brand || item.material) && <span>•</span>}
        {item.shortDescription && <span className="italic text-gray-400 truncate max-w-[100px]">{item.shortDescription}</span>}
      </div>

      {/* Line 3: Memos + Services (single line) */}
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        {item.memos.slice(0, 2).map((memo, idx) => (
          <span key={idx} className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded font-medium">
            {memo}
          </span>
        ))}
        {item.memos.length > 2 && (
          <span className="text-[10px] text-gray-400">+{item.memos.length - 2}</span>
        )}
        {item.services.map((svc, idx) => (
          <span key={idx} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] rounded font-medium">
            {svc.service}{svc.variation && `: ${svc.variation}`}
          </span>
        ))}
      </div>
    </div>
  );
};

export default CartItemCard;
```

- [ ] **Step 2: Verify build**

Run: `cd D:/WEB APPS/Kampani02/ProShoeRepair/.worktrees/drop-workflow && npm run build 2>&1 | tail -10`

- [ ] **Step 3: Commit**

```bash
git add src/components/drop/CartItemCard.tsx
git commit -m "feat(drop): make CartItemCard compact with single-line details"
```

---

## Task 2: Compact CartSummary

**Files:**
- Modify: `src/components/drop/CartSummary.tsx`

- [ ] **Step 1: Rewrite CartSummary without Now Building preview**

```tsx
import React from 'react';
import { ShoppingCart, Check, Package } from 'lucide-react';
import { CartItem as CartItemType } from '../../types';
import CartItemCard from './CartItemCard';
import { formatCurrency } from '../../utils/formatCurrency';

interface CartSummaryProps {
  items: CartItemType[];
  ticketNumber: string;
  onRemoveItem: (id: string) => void;
  onComplete: () => void;
  disabled?: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  ticketNumber,
  onRemoveItem,
  onComplete,
  disabled = false,
}) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;
  const isDisabled = disabled || itemCount === 0;

  return (
    <div className="bg-white rounded-none shadow-xl border-l border-gray-100 h-full flex flex-col w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Drop Cart</h3>
              <p className="text-slate-400 text-xs">Ticket: {ticketNumber}</p>
            </div>
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-lg">
            <span className="text-white font-bold text-lg">{itemCount}</span>
            <span className="text-slate-400 text-xs ml-1">items</span>
          </div>
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Items section */}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onEdit={() => {}}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="py-10 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium text-sm">No items yet</p>
            <p className="text-gray-300 text-xs mt-1">Add items from the form</p>
          </div>
        )}
      </div>

      {/* Footer - totals and action */}
      <div className="border-t border-gray-100 p-3 bg-gray-50 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 text-sm">Total</span>
          <span className="text-emerald-600 font-bold text-xl">{formatCurrency(total)}</span>
        </div>
        <button
          onClick={onComplete}
          disabled={isDisabled}
          className={`
            w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all
            ${isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'
            }
          `}
        >
          <Check className="w-4 h-4" />
          COMPLETE DROP
        </button>
      </div>
    </div>
  );
};

export default CartSummary;
```

- [ ] **Step 2: Verify build**

Run: `cd D:/WEB APPS/Kampani02/ProShoeRepair/.worktrees/drop-workflow && npm run build 2>&1 | tail -10`

- [ ] **Step 3: Commit**

```bash
git add src/components/drop/CartSummary.tsx
git commit -m "feat(drop): make CartSummary compact without Now Building preview"
```

---

## Task 3: Update DropPage Width

**Files:**
- Modify: `src/pages/DropPage.tsx`

- [ ] **Step 1: Change sidebar width to 35%**

Find line with `className="w-1/2 flex-shrink-0"` and change to `className="w-[35%] flex-shrink-0"`.

Also remove `previewItem`, `onPriceChange`, `onDone` props from CartSummary since we removed those features.

- [ ] **Step 2: Verify build**

Run: `cd D:/WEB APPS/Kampani02/ProShoeRepair/.worktrees/drop-workflow && npm run build 2>&1 | tail -10`

- [ ] **Step 3: Commit**

```bash
git add src/pages/DropPage.tsx
git commit -m "feat(drop): update cart width to 35%"
```

---

## Verification Checklist

- [ ] Cart width is 35%
- [ ] No "Now Building" preview
- [ ] No category emoji
- [ ] Color, brand, material, description on one line
- [ ] Memos and services on one line
- [ ] No scrolling needed to see all items
- [ ] Complete Drop button visible
