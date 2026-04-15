# Drop Page Cascade Stepper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a cascade stepper UI for the Drop page where users complete one section at a time, completed sections collapse into bars, and selected items appear in a 3-column grid.

**Architecture:** Linear stepper flow with collapsed stepper bars, 3-column cart items grid above, active form section below, and a fixed right sidebar for cart summary. No scrolling on the main viewport.

**Tech Stack:** React, TypeScript, Tailwind CSS, existing contexts (OperationContext, CustomerContext)

---

## File Structure

```
src/pages/DropPage.tsx                    # Main layout, state management (rewrite)
src/components/drop/
  CollapsedStep.tsx                      # New: collapsed stepper bar
  StepSection.tsx                        # New: wrapper for expanded form section
  CartItemCard.tsx                       # New: 3-column grid card
  EditItemModal.tsx                      # New: modal for editing cart items
  CartSummary.tsx                        # Modify: update for new design
src/types/index.ts                       # Modify: add/edit types if needed
```

---

## Task 1: Create CollapsedStep Component

**Files:**
- Create: `src/components/drop/CollapsedStep.tsx`

- [ ] **Step 1: Write the CollapsedStep component**

```tsx
import React from 'react';
import { Pencil, ChevronDown } from 'lucide-react';

interface CollapsedStepProps {
  icon: string;
  label: string;
  value: string;
  onEdit: () => void;
}

export const CollapsedStep: React.FC<CollapsedStepProps> = ({ icon, label, value, onEdit }) => {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-700 rounded-xl">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-white font-medium text-sm">{value}</div>
      </div>
      <button
        onClick={onEdit}
        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
        aria-label={`Edit ${label}`}
      >
        <Pencil className="w-4 h-4 text-gray-400 hover:text-white" />
      </button>
    </div>
  );
};

export default CollapsedStep;
```

- [ ] **Step 2: Verify file compiles**

Run: `cd D:/WEB APPS/Kampani02/ProShoeRepair/.worktrees/drop-workflow && npx tsc --noEmit src/components/drop/CollapsedStep.tsx 2>&1 | head -20`
Expected: No errors (or ignore type-only warnings)

- [ ] **Step 3: Commit**

```bash
git add src/components/drop/CollapsedStep.tsx
git commit -m "feat(drop): add CollapsedStep component"
```

---

## Task 2: Create StepSection Component

**Files:**
- Create: `src/components/drop/StepSection.tsx`

- [ ] **Step 1: Write the StepSection wrapper component**

```tsx
import React from 'react';

interface StepSectionProps {
  title: string;
  icon: string;
  color: string; // border-top color class e.g. 'border-t-indigo-500'
  isActive: boolean;
  children: React.ReactNode;
}

export const StepSection: React.FC<StepSectionProps> = ({ title, icon, color, isActive, children }) => {
  if (!isActive) return null;

  return (
    <div className={`bg-gray-800 rounded-xl p-4 border border-gray-700 border-t-4 ${color}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-semibold text-gray-200">{title}</span>
      </div>
      {children}
    </div>
  );
};

export default StepSection;
```

- [ ] **Step 2: Verify file compiles**

Run: `cd D:/WEB APPS/Kampani02/ProShoeRepair/.worktrees/drop-workflow && npx tsc --noEmit src/components/drop/StepSection.tsx 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/drop/StepSection.tsx
git commit -m "feat(drop): add StepSection wrapper component"
```

---

## Task 3: Create CartItemCard Component

**Files:**
- Create: `src/components/drop/CartItemCard.tsx`

- [ ] **Step 1: Write the CartItemCard for 3-column grid**

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

export const CartItemCard: React.FC<CartItemCardProps> = ({ item, onEdit, onRemove }) => {
  const icon = CATEGORY_ICONS[item.category] || '📦';
  const details = [item.color, item.brand, item.material].filter(Boolean).join(' • ');

  return (
    <div 
      onClick={() => onEdit(item)}
      className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border border-gray-200 group"
    >
      {/* Header with icon */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          className="p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
        </button>
      </div>

      {/* Category */}
      <div className="font-bold text-gray-800 text-sm mb-1 leading-tight">
        {item.category}
      </div>

      {/* Details */}
      {details && (
        <div className="text-xs text-gray-500 mb-2 leading-tight">
          {details}
        </div>
      )}

      {/* Memos preview */}
      {item.memos.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {item.memos.slice(0, 2).map((memo, idx) => (
            <span key={idx} className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full">
              {memo}
            </span>
          ))}
          {item.memos.length > 2 && (
            <span className="text-[10px] text-gray-400">+{item.memos.length - 2}</span>
          )}
        </div>
      )}

      {/* Separator */}
      <div className="border-t border-gray-100 my-2" />

      {/* Price */}
      <div className="flex items-center justify-between">
        <span className="text-emerald-600 font-bold text-sm">
          {formatCurrency(item.price)}
        </span>
      </div>
    </div>
  );
};

export default CartItemCard;
```

- [ ] **Step 2: Verify file compiles**

Run: `cd D:/WEB APPS/Kampani02/ProShoeRepair/.worktrees/drop-workflow && npx tsc --noEmit src/components/drop/CartItemCard.tsx 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/drop/CartItemCard.tsx
git commit -m "feat(drop): add CartItemCard for 3-column grid"
```

---

## Task 4: Create EditItemModal Component

**Files:**
- Create: `src/components/drop/EditItemModal.tsx`

- [ ] **Step 1: Write the EditItemModal**

```tsx
import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { CartItem } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface EditItemModalProps {
  item: CartItem;
  onSave: (item: CartItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ item, onSave, onDelete, onClose }) => {
  const [editedItem, setEditedItem] = useState<CartItem>(item);

  useEffect(() => {
    setEditedItem(item);
  }, [item]);

  const handleSave = () => {
    onSave(editedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h3 className="text-white font-bold text-lg">Edit Item</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Category (read-only) */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Category</label>
            <div className="text-white font-medium">{editedItem.category}</div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Color</label>
            <input
              type="text"
              value={editedItem.color}
              onChange={(e) => setEditedItem({ ...editedItem, color: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm border border-gray-600 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Brand</label>
            <input
              type="text"
              value={editedItem.brand}
              onChange={(e) => setEditedItem({ ...editedItem, brand: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm border border-gray-600 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Material */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Material</label>
            <input
              type="text"
              value={editedItem.material}
              onChange={(e) => setEditedItem({ ...editedItem, material: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm border border-gray-600 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Price */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Price (UGX)</label>
            <input
              type="number"
              value={editedItem.price}
              onChange={(e) => setEditedItem({ ...editedItem, price: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm border border-gray-600 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-700">
          <button
            onClick={() => { onDelete(item.id); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;
```

- [ ] **Step 2: Verify file compiles**

Run: `cd D:/WEB APPS/Kampani02/ProShoeRepair/.worktrees/drop-workflow && npx tsc --noEmit src/components/drop/EditItemModal.tsx 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/drop/EditItemModal.tsx
git commit -m "feat(drop): add EditItemModal for editing cart items"
```

---

## Task 5: Rewrite DropPage with Cascade Stepper Layout

**Files:**
- Modify: `src/pages/DropPage.tsx`

This is a major rewrite. The new DropPage will:
1. Use `activeStep` state to track current step
2. Use `completedSteps` state to track completed selections
3. Render 3-column cart grid
4. Render collapsed stepper bars for completed steps
5. Render active form section only
6. Right sidebar for cart summary

- [ ] **Step 1: Read current DropPage structure**

Run: `wc -l src/pages/DropPage.tsx` to see current size

- [ ] **Step 2: Write new DropPage with stepper layout**

The new DropPage structure:
```tsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, X, User, Pencil } from 'lucide-react';
import { useOperation } from '../contexts/OperationContext';
import { useCustomer } from '../contexts/CustomerContext';
import type { Customer, CartItem, DropFormState } from '../types';
import CollapsedStep from '../components/drop/CollapsedStep';
import StepSection from '../components/drop/StepSection';
import CartItemCard from '../components/drop/CartItemCard';
import EditItemModal from '../components/drop/EditItemModal';
import CartSummary from '../components/drop/CartSummary';
import TicketBadge from '../components/drop/TicketBadge';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

// ... CATEGORIES, COLORS, BRANDS, MATERIALS, MEMOS, SERVICES, SERVICE_VARIATIONS ...

type StepName = 'customer' | 'category' | 'color' | 'brand' | 'material' | 'memos' | 'service' | 'variation' | 'price';

const STEPS_ORDER: StepName[] = ['customer', 'category', 'color', 'brand', 'material', 'memos', 'service', 'variation', 'price'];

export default function DropPage() {
  const { cartItems, addToCart, removeFromCart, clearCart, updateCartItem, ticketNumber, fetchTicketNumber } = useOperation();
  const { customers, addCustomer } = useCustomer();

  const [form, setForm] = useState<DropFormState>(initialFormState);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [activeStep, setActiveStep] = useState<StepName>('customer');
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  // Fetch ticket number and colors on mount
  useEffect(() => { /* existing code */ }, []);

  // Auto-add to cart when price is entered
  useEffect(() => {
    if (form.category && form.price && parseInt(form.price, 10) > 0) {
      const timer = setTimeout(() => handleAddToCart(), 500);
      return () => clearTimeout(timer);
    }
  }, [form.price, form.category]);

  // Advance to next step when current step is completed
  const advanceStep = (step: StepName) => {
    const currentIndex = STEPS_ORDER.indexOf(step);
    if (currentIndex < STEPS_ORDER.length - 1) {
      setActiveStep(STEPS_ORDER[currentIndex + 1]);
    }
  };

  // Edit a collapsed step
  const editStep = (step: StepName) => {
    const stepIndex = STEPS_ORDER.indexOf(step);
    const activeIndex = STEPS_ORDER.indexOf(activeStep);
    // Clear all steps after this one
    if (stepIndex <= activeIndex) {
      // Reset form for steps after this one
      // Keep selected values for steps before
      setActiveStep(step);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setForm(prev => ({ ...prev, customerId: customer.id }));
    setShowCustomerSearch(false);
    setCustomerSearchTerm('');
    advanceStep('customer');
  };

  const handleCategorySelect = (category: string) => {
    setForm(prev => ({ ...prev, category }));
    advanceStep('category');
  };

  // ... other handlers for color, brand, material, memos, service, variation ...

  const handleAddToCart = () => {
    if (!form.category || !form.price) return;
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
    addToCart(item);
    setForm(prev => ({
      ...prev,
      category: '', // Reset for next item
      color: '',
      brand: '',
      material: '',
      shortDescription: '',
      memos: [],
      service: '',
      variation: '',
      price: '',
    }));
    setActiveStep('category'); // Reset to category step
    toast.success('Item added to cart');
  };

  const handleEditCartItem = (item: CartItem) => {
    setEditingItem(item);
  };

  const handleSaveCartItem = (updatedItem: CartItem) => {
    updateCartItem?.(updatedItem.id, updatedItem);
    setEditingItem(null);
  };

  const handleDeleteCartItem = (id: string) => {
    removeFromCart(id);
    setEditingItem(null);
  };

  // Check if step is completed (has value)
  const isStepCompleted = (step: StepName): boolean => {
    switch (step) {
      case 'customer': return Boolean(selectedCustomer);
      case 'category': return Boolean(form.category);
      case 'color': return Boolean(form.color);
      case 'brand': return Boolean(form.brand);
      case 'material': return Boolean(form.material);
      case 'memos': return form.memos.length > 0;
      case 'service': return Boolean(form.service);
      case 'variation': return Boolean(form.variation);
      case 'price': return Boolean(form.price);
      default: return false;
    }
  };

  // Get step value for display
  const getStepValue = (step: StepName): string => {
    switch (step) {
      case 'customer': return selectedCustomer?.name || '';
      case 'category': return form.category;
      case 'color': return form.color;
      case 'brand': return form.brand;
      case 'material': return form.material;
      case 'memos': return form.memos.join(', ');
      case 'service': return form.service;
      case 'variation': return form.variation;
      case 'price': return form.price ? formatCurrency(parseInt(form.price)) : '';
      default: return '';
    }
  };

  // Get step icon
  const getStepIcon = (step: StepName): string => {
    const icons: Record<StepName, string> = {
      customer: '👤',
      category: CATEGORIES.find(c => c.name === form.category)?.icon || '👠',
      color: '🎨',
      brand: '🏷️',
      material: '🧵',
      memos: '📝',
      service: '🔧',
      variation: '⚙️',
      price: '💰',
    };
    return icons[step];
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">NEW DROP</h1>
        {ticketNumber && <TicketBadge ticketNumber={ticketNumber} />}
        {selectedCustomer && (
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-200 text-sm">{selectedCustomer.name}</span>
            <button onClick={() => { setSelectedCustomer(null); setActiveStep('customer'); }} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Left side */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Cart items grid */}
          {cartItems.length > 0 && (
            <div className="flex-shrink-0">
              <h3 className="text-white font-semibold mb-2 text-sm">Items ({cartItems.length})</h3>
              <div className="grid grid-cols-3 gap-3">
                {cartItems.map(item => (
                  <CartItemCard key={item.id} item={item} onEdit={handleEditCartItem} onRemove={removeFromCart} />
                ))}
              </div>
            </div>
          )}

          {/* Stepper bars for completed steps */}
          <div className="flex gap-3 flex-wrap">
            {STEPS_ORDER.filter(step => isStepCompleted(step) && step !== activeStep).map(step => (
              <div key={step} className="flex-1 min-w-[200px]">
                <CollapsedStep
                  icon={getStepIcon(step)}
                  label={step.charAt(0).toUpperCase() + step.slice(1)}
                  value={getStepValue(step)}
                  onEdit={() => editStep(step)}
                />
              </div>
            ))}
          </div>

          {/* Active form section */}
          <div className="flex-1 overflow-y-auto">
            <StepSection
              title={activeStep.charAt(0).toUpperCase() + activeStep.slice(1)}
              icon={getStepIcon(activeStep)}
              color="border-t-indigo-500"
              isActive={true}
            >
              {/* Render form fields based on activeStep */}
              {activeStep === 'customer' && (
                <CustomerForm {...} />
              )}
              {activeStep === 'category' && (
                <CategoryForm {...} />
              )}
              {/* ... other steps */}
            </StepSection>
          </div>
        </div>

        {/* Right sidebar - Cart Summary */}
        <div className="w-72 flex-shrink-0">
          <CartSummary
            items={cartItems}
            ticketNumber={ticketNumber}
            onRemoveItem={removeFromCart}
            onComplete={handleComplete}
            disabled={cartItems.length === 0}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onSave={handleSaveCartItem}
          onDelete={handleDeleteCartItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd D:/WEB APPS/Kampani02/ProShoeRepair/.worktrees/drop-workflow && npx tsc --noEmit src/pages/DropPage.tsx 2>&1 | head -50`

Expected: Type errors to fix (expected - this is a complex rewrite)

- [ ] **Step 4: Fix type errors and complete implementation**

This step involves fixing all the type errors and completing the form implementations for each step. Work through errors systematically.

- [ ] **Step 5: Test in browser**

Run dev server and navigate to `/drop`. Verify:
- No scrolling on main viewport
- Customer step is active first
- Selecting customer collapses it and shows Category step
- Cart items appear in 3-column grid when added
- Clicking cart item opens edit modal
- Collapsed steps can be clicked to edit

- [ ] **Step 6: Commit**

```bash
git add src/pages/DropPage.tsx
git commit -m "feat(drop): rewrite DropPage with cascade stepper layout"
```

---

## Task 6: Update CartSummary for Fixed Layout

**Files:**
- Modify: `src/components/drop/CartSummary.tsx`

- [ ] **Step 1: Update CartSummary to be more compact**

Make the existing CartSummary work better with the fixed layout - reduce padding, make items list smaller.

```bash
git add src/components/drop/CartSummary.tsx
git commit -m "fix(drop): update CartSummary for fixed layout"
```

---

## Verification Checklist

- [ ] No viewport scrolling on drop page
- [ ] Linear stepper flow works (customer → category → color → ...)
- [ ] Completed steps collapse into bars
- [ ] Clicking edit icon expands that step and clears subsequent steps
- [ ] Cart items appear in 3-column grid
- [ ] Clicking cart item opens edit modal
- [ ] Price auto-adds item to cart
- [ ] Cart sidebar shows total and complete button
- [ ] All form fields work in each step
