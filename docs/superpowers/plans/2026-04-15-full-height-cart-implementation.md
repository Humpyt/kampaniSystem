# Full-Height Right Panel Cart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full-height cart panel with 50% width, all item details visible, and Done button in variation step.

**Architecture:** Three file changes - CartItemCard (show all details), CartSummary (50% width panel), DropPage (Done button in variation step).

**Tech Stack:** React, TypeScript, Tailwind CSS

---

## Task 1: Update CartItemCard with All Details

**Files:**
- Modify: `src/components/drop/CartItemCard.tsx`

- [ ] **Step 1: Rewrite CartItemCard to show all details**

Replace the current CartItemCard with this implementation that shows all fields:

```tsx
import React from 'react';
import { Trash2 } from 'lucide-react';
import { CartItem } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface CartItemCardProps {
  item: CartItem;
  onEdit: (item: CartItem) => void;
  onRemove: (id: string) => void;
  showDetails?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Women's High Heel": '👠',
  "Women's Flat": '🥿',
  "Women's Dress Boot": '👢',
  "Women's Sneaker": '👟',
  "Men's Dress": '👞',
  "Men's Half Boot": '🥾',
  "Men's Sneaker": '👟',
  "Men's Work": '🥾',
  "Men's Western": '👢',
  "Men's Riding": '🥾',
  "Bag": '👜',
  "Other": '🔧',
};

export const CartItemCard: React.FC<CartItemCardProps> = ({ item, onEdit, onRemove, showDetails = true }) => {
  const icon = CATEGORY_ICONS[item.category] || '📦';

  return (
    <div
      onClick={() => onEdit(item)}
      className="bg-white rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all border border-gray-200 group overflow-hidden"
    >
      {/* Header with icon */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <div className="font-bold text-gray-800 text-base">{item.category}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold text-lg">{formatCurrency(item.price)}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
              className="p-2 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-sm">
          {item.color && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-16">Color:</span>
              <span className="text-gray-700">{item.color}</span>
            </div>
          )}
          {item.brand && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-16">Brand:</span>
              <span className="text-gray-700">{item.brand}</span>
            </div>
          )}
          {item.material && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-16">Material:</span>
              <span className="text-gray-700">{item.material}</span>
            </div>
          )}
          {item.shortDescription && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-gray-400 text-xs mb-1">Description</div>
              <div className="text-gray-700 italic">{item.shortDescription}</div>
            </div>
          )}
        </div>

        {/* Memos */}
        {item.memos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.memos.map((memo, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                {memo}
              </span>
            ))}
          </div>
        )}

        {/* Services */}
        {item.services.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
            {item.services.map((svc, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span className="text-gray-700">{svc.service}</span>
                {svc.variation && <span className="text-gray-400">• {svc.variation}</span>}
              </div>
            ))}
          </div>
        )}
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
git commit -m "feat(drop): update CartItemCard with all details visible"
```

---

## Task 2: Redesign CartSummary as Full-Height Panel

**Files:**
- Modify: `src/components/drop/CartSummary.tsx`

- [ ] **Step 1: Rewrite CartSummary for 50% width panel**

```tsx
import React from 'react';
import { ShoppingCart, Check, Package, Sparkles } from 'lucide-react';
import { CartItem as CartItemType } from '../../types';
import CartItemCard from './CartItemCard';
import { formatCurrency } from '../../utils/formatCurrency';

interface CartSummaryProps {
  items: CartItemType[];
  ticketNumber: string;
  onRemoveItem: (id: string) => void;
  onComplete: () => void;
  disabled?: boolean;
  previewItem?: CartItemType | null;
  onPriceChange?: (price: number) => void;
  onDone?: (item: CartItemType) => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  ticketNumber,
  onRemoveItem,
  onComplete,
  disabled = false,
  previewItem = null,
  onPriceChange,
  onDone,
}) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;
  const isDisabled = disabled || itemCount === 0;

  return (
    <div className="bg-white rounded-none shadow-xl border-l border-gray-100 h-full flex flex-col w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xl">Drop Cart</h3>
              <p className="text-slate-400 text-sm">Ticket: {ticketNumber}</p>
            </div>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl">
            <span className="text-white font-bold text-2xl">{itemCount}</span>
            <span className="text-slate-400 text-sm ml-2">items</span>
          </div>
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Preview item */}
        {previewItem && (
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-indigo-200 overflow-hidden">
            <div className="px-4 py-3 bg-indigo-100/50 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-indigo-700 font-semibold text-sm">Now Building</span>
            </div>
            <div className="p-4">
              <CartItemCard
                item={previewItem}
                onEdit={() => {}}
                onRemove={() => {}}
              />
              <div className="mt-4 pt-4 border-t border-indigo-200">
                <label className="text-xs text-indigo-600 font-semibold mb-2 block">Set Price (UGX)</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      placeholder="0"
                      value={previewItem.price || ''}
                      onChange={(e) => onPriceChange?.(parseInt(e.target.value, 10) || 0)}
                      className="w-full pl-4 pr-16 py-4 bg-white rounded-xl text-gray-800 font-bold text-xl placeholder-gray-300 border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">UGX</span>
                  </div>
                  <button
                    onClick={() => previewItem && onDone?.(previewItem)}
                    disabled={!previewItem.price || previewItem.price === 0}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items section */}
        {items.length > 0 && (
          <div>
            <h4 className="text-gray-500 font-semibold text-xs uppercase tracking-wider mb-4">Items</h4>
            <div className="space-y-4">
              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => {}}
                  onRemove={onRemoveItem}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && !previewItem && (
          <div className="py-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium text-lg">No items yet</p>
            <p className="text-gray-300 text-sm mt-1">Add items from the form</p>
          </div>
        )}
      </div>

      {/* Footer - totals and action */}
      <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-400">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between items-center bg-gradient-to-r from-emerald-50 to-green-50 px-5 py-4 rounded-xl">
            <span className="text-gray-800 font-bold text-lg">Total</span>
            <span className="text-emerald-600 font-extrabold text-3xl">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
        <button
          onClick={onComplete}
          disabled={isDisabled}
          className={`
            w-full py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg
            ${isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 active:scale-[0.98] hover:shadow-xl'
            }
          `}
        >
          <Check className="w-6 h-6" />
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
git commit -m "feat(drop): redesign CartSummary as full-height 50% panel"
```

---

## Task 3: Update DropPage Layout and Add Done Button

**Files:**
- Modify: `src/pages/DropPage.tsx`

- [ ] **Step 1: Update sidebar width to 50%**

Find line 697 with `className="w-96 flex-shrink-0"` and change to `className="w-1/2 flex-shrink-0"` (or remove width class entirely since CartSummary is now full-width).

- [ ] **Step 2: Add Done button to variation step**

Find the variation step rendering (around line 581) and add a Done button:

```tsx
case 'variation':
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400 mb-2">What needs fixing?</div>
      <div className="grid grid-cols-2 gap-2">
        {SERVICE_VARIATIONS.map(v => (
          <button
            key={v}
            onClick={() => handleVariationSelect(v)}
            className={`p-4 rounded-xl text-sm font-medium transition-all ${
              form.variation === v
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      {form.variation && (
        <button
          onClick={() => {
            if (form.category && form.variation) {
              const item: CartItem = {
                id: crypto.randomUUID(),
                category: form.category,
                color: form.color,
                brand: form.brand,
                material: form.material,
                shortDescription: form.shortDescription,
                memos: form.memos,
                services: [{ service: form.service, variation: form.variation }],
                price: parseInt(form.price, 10) || 0,
              };
              handleDone(item);
            }
          }}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors text-lg flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Done - Add to Cart
        </button>
      )}
    </div>
  );
```

Also add `Check` to the lucide-react import if not already there.

- [ ] **Step 3: Verify build**

Run: `cd D:/WEB APPS/Kampani02/ProShoeRepair/.worktrees/drop-workflow && npm run build 2>&1 | tail -10`

- [ ] **Step 4: Commit**

```bash
git add src/pages/DropPage.tsx
git commit -m "feat(drop): add Done button to variation step and 50% layout"
```

---

## Verification Checklist

- [ ] Cart is 50% width (or full panel)
- [ ] Each item shows all details (category, color, brand, material, description, memos, services, price)
- [ ] Real-time preview updates as user fills form
- [ ] Done button in variation step adds item
- [ ] Done button in cart preview adds item
- [ ] Complete Drop button works
- [ ] Scroll works if many items
