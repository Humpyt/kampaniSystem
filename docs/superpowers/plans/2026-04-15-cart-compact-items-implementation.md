# Cart Compact Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign cart with compact two-column stacked items, remove Done button from variation step, make price editable.

**Tech Stack:** React, TypeScript, Tailwind CSS

---

## Task 1: Remove Done Button from Variation Step

**Files:**
- Modify: `src/pages/DropPage.tsx`

- [ ] **Step 1: Remove Done button from variation step**

Find the Done button in the variation step and remove it.

```tsx
case 'variation':
  return (
    <div className="space-y-3">
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
      {/* DONE BUTTON REMOVED - item auto-adds when price is entered */}
    </div>
  );
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/DropPage.tsx
git commit -m "feat(drop): remove Done button from variation step"
```

---

## Task 2: Redesign CartSummary with Compact Items

**Files:**
- Modify: `src/pages/DropPage.tsx` - increase sidebar width to w-[480px]
- Modify: `src/components/drop/CartSummary.tsx` - compact two-column items, editable price

- [ ] **Step 1: Update sidebar width**

In DropPage.tsx line 697, change `w-96` to `w-[480px]`:

```tsx
<div className="w-[480px] flex-shrink-0">
```

- [ ] **Step 2: Create new compact cart item structure**

Replace the CartSummary with:

```tsx
import React from 'react';
import { ShoppingCart, Check, Package, Sparkles, Pencil, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface CartSummaryProps {
  items: CartItemType[];
  ticketNumber: string;
  onRemoveItem: (id: string) => void;
  onUpdateItemPrice: (id: string, price: number) => void;
  onComplete: () => void;
  disabled?: boolean;
  previewItem?: CartItemType | null;
  onPriceChange?: (price: number) => void;
  onDone?: (item: CartItemType) => void;
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

const CartItemRow: React.FC<{
  item: CartItemType;
  index?: number;
  onRemove?: (id: string) => void;
  onUpdatePrice?: (id: string, price: number) => void;
  isPreview?: boolean;
}> = ({ item, index, onRemove, onUpdatePrice, isPreview }) => {
  const [editingPrice, setEditingPrice] = React.useState(false);
  const [priceValue, setPriceValue] = React.useState(item.price.toString());

  const icon = CATEGORY_ICONS[item.category] || '📦';
  const details = [item.color, item.brand, item.material].filter(Boolean).join(' • ');
  const serviceText = item.services.map(s => s.service).join(', ');

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${isPreview ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
      {/* Icon */}
      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-800 text-sm leading-tight">{item.category}</div>
        <div className="text-xs text-gray-500 leading-tight truncate">{details}</div>
        {serviceText && <div className="text-xs text-gray-400 leading-tight">{serviceText}</div>}
      </div>

      {/* Price */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {editingPrice ? (
          <input
            type="number"
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
            onBlur={() => {
              setEditingPrice(false);
              onUpdatePrice?.(item.id, parseInt(priceValue, 10) || 0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setEditingPrice(false);
                onUpdatePrice?.(item.id, parseInt(priceValue, 10) || 0);
              }
            }}
            className="w-24 px-2 py-1 text-sm font-bold text-right bg-white border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none"
            autoFocus
          />
        ) : (
          <button
            onClick={() => !isPreview && setEditingPrice(true)}
            className={`font-bold text-lg ${isPreview ? 'text-emerald-600' : 'text-gray-800 hover:text-indigo-600'}`}
          >
            {formatCurrency(item.price)}
          </button>
        )}
        {!isPreview && (
          <>
            <button
              onClick={() => onRemove?.(item.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {index !== undefined && <span className="text-xs text-gray-400 w-4">{index + 1}</span>}
          </>
        )}
      </div>
    </div>
  );
};

const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  ticketNumber,
  onRemoveItem,
  onUpdateItemPrice,
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
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Drop Cart</h3>
              <p className="text-slate-400 text-xs">Ticket: {ticketNumber}</p>
            </div>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-lg">
            <span className="text-white font-bold text-lg">{itemCount}</span>
            <span className="text-slate-400 text-xs ml-1">items</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Preview item */}
        {previewItem && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-indigo-600 font-semibold text-xs uppercase">Now Building</span>
            </div>
            <CartItemRow item={previewItem} isPreview />
            <div className="mt-2">
              <label className="text-xs text-gray-500 font-medium mb-1 block">Set Price</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="0"
                  value={previewItem.price || ''}
                  onChange={(e) => onPriceChange?.(parseInt(e.target.value, 10) || 0)}
                  className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-gray-800 font-bold text-sm border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => previewItem && onDone?.(previewItem)}
                  disabled={!previewItem.price || previewItem.price === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold rounded-lg"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500 font-semibold text-xs uppercase">Items</span>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  index={idx}
                  onRemove={onRemoveItem}
                  onUpdatePrice={onUpdateItemPrice}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && !previewItem && (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No items yet</p>
            <p className="text-gray-300 text-xs mt-1">Add items from the form</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-800 font-bold text-lg">Total</span>
          <span className="text-emerald-600 font-extrabold text-2xl">{formatCurrency(total)}</span>
        </div>
        <button
          onClick={onComplete}
          disabled={isDisabled}
          className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${isDisabled ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg'}`}
        >
          <Check className="w-5 h-5" />
          COMPLETE DROP
        </button>
      </div>
    </div>
  );
};

export default CartSummary;
```

- [ ] **Step 3: Update DropPage to pass onUpdateItemPrice**

Find where CartSummary is used and add `onUpdateItemPrice`:

```tsx
<CartSummary
  items={cartItems}
  ticketNumber={ticketNumber}
  onRemoveItem={removeFromCart}
  onUpdateItemPrice={(id, price) => {
    const item = cartItems.find(i => i.id === id);
    if (item) {
      updateCartItem?.(id, { ...item, price });
    }
  }}
  onComplete={handleComplete}
  disabled={cartItems.length === 0}
  previewItem={previewItem}
  onPriceChange={(price) => setForm(prev => ({ ...prev, price: price.toString() }))}
  onDone={handleDone}
/>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/DropPage.tsx src/components/drop/CartSummary.tsx
git commit -m "feat(drop): redesign cart with compact items and editable prices"
```

---

## Verification Checklist

- [ ] Done button removed from variation step
- [ ] Sidebar is wider (480px)
- [ ] Items use two-column stacked layout (~80px height)
- [ ] Price is editable inline in cart
- [ ] Auto-add works when price entered and Add clicked
