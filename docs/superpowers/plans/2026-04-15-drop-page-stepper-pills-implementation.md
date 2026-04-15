# Drop Page Stepper Pills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace cluttered stepper bars with compact pill chips, and add "Done" button for multi-drop workflow.

**Architecture:** Single-row pill chips with overflow handling, "Done" button in sidebar preview to immediately add items.

**Tech Stack:** React, TypeScript, Tailwind CSS

---

## File Structure

```
src/components/drop/PillChip.tsx         # New: compact pill chip component
src/components/drop/CollapsedStep.tsx    # To be replaced by PillChip
src/pages/DropPage.tsx                  # Modify: update stepper rendering
src/components/drop/CartSummary.tsx      # Modify: add "Done" button
```

---

## Task 1: Create PillChip Component

**Files:**
- Create: `src/components/drop/PillChip.tsx`

- [ ] **Step 1: Write the PillChip component**

```tsx
import React from 'react';
import { Pencil } from 'lucide-react';

interface PillChipProps {
  icon: string;
  value: string;
  onEdit: () => void;
}

export const PillChip: React.FC<PillChipProps> = ({ icon, value, onEdit }) => {
  return (
    <button
      onClick={onEdit}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition-colors group"
      title={value} // Shows full value on hover
    >
      <span className="text-base">{icon}</span>
      <span className="text-gray-200 max-w-[120px] truncate">{value}</span>
      <Pencil className="w-3 h-3 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

export default PillChip;
```

- [ ] **Step 2: Verify file compiles**

Run: `cd D:/WEB APPS/Kampani02/ProShoeRepair/.worktrees/drop-workflow && npx tsc --noEmit src/components/drop/PillChip.tsx 2>&1 | head -20`
Expected: No errors (or ignore pre-existing worktree errors)

- [ ] **Step 3: Commit**

```bash
git add src/components/drop/PillChip.tsx
git commit -m "feat(drop): add PillChip component for compact stepper display"
```

---

## Task 2: Update DropPage to Use PillChips

**Files:**
- Modify: `src/pages/DropPage.tsx`
- Modify: `src/components/drop/CollapsedStep.tsx` (can keep for backwards compatibility or delete)

- [ ] **Step 1: Update imports in DropPage.tsx**

Change:
```tsx
import CollapsedStep from '../components/drop/CollapsedStep';
```
To:
```tsx
import PillChip from '../components/drop/PillChip';
```

- [ ] **Step 2: Replace stepper bars rendering**

Find the section around line 666-680 that renders CollapsedStep bars:
```tsx
{/* Stepper bars for completed steps */}
<div className="flex gap-3 flex-wrap">
  {STEPS_ORDER.filter(step =>
    isStepCompleted(step) && step !== activeStep
  ).map(step => (
    <div key={step} className="flex-1 min-w-[180px]">
      <CollapsedStep
        icon={getStepIcon(step)}
        label={step.charAt(0).toUpperCase() + step.slice(1)}
        value={getStepValue(step)}
        onEdit={() => editStep(step)}
      />
    </div>
  ))}
</div>
```

Replace with compact pill row:
```tsx
{/* Stepper pills for completed steps */}
{STEPS_ORDER.filter(step => isStepCompleted(step) && step !== activeStep).length > 0 && (
  <div className="flex items-center gap-2 overflow-x-auto pb-1">
    {STEPS_ORDER.filter(step => isStepCompleted(step) && step !== activeStep)
      .slice(0, 4) // Show max 4 pills
      .map(step => (
        <PillChip
          key={step}
          icon={getStepIcon(step)}
          value={getStepValue(step)}
          onEdit={() => editStep(step)}
        />
    ))}
    {STEPS_ORDER.filter(step => isStepCompleted(step) && step !== activeStep).length > 4 && (
      <span className="text-gray-400 text-sm px-2">
        +{STEPS_ORDER.filter(step => isStepCompleted(step) && step !== activeStep).length - 4}
      </span>
    )}
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/DropPage.tsx
git commit -m "feat(drop): use PillChip for compact stepper display"
```

---

## Task 3: Add "Done" Button to CartSummary

**Files:**
- Modify: `src/components/drop/CartSummary.tsx`

- [ ] **Step 1: Read current CartSummary to find preview section**

Read `src/components/drop/CartSummary.tsx` around lines 66-90 where preview item is rendered.

- [ ] **Step 2: Add "Done" button to preview section**

In the preview section, find the price input and add a "Done" button next to it:

```tsx
{/* Price input for preview */}
<div className="mt-3 pt-3 border-t border-indigo-200">
  <label className="text-xs text-indigo-600 font-medium mb-1.5 block">Set Price (UGX)</label>
  <div className="flex gap-2">
    <div className="relative flex-1">
      <input
        type="number"
        placeholder="0"
        value={previewItem.price || ''}
        onChange={(e) => onPriceChange?.(parseInt(e.target.value, 10) || 0)}
        className="w-full pl-4 pr-16 py-3 bg-white rounded-xl text-gray-800 font-bold text-lg placeholder-gray-300 border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none transition-colors"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">UGX</span>
    </div>
    <button
      onClick={() => previewItem && onDone?.(previewItem)}
      disabled={!previewItem.price || previewItem.price === 0}
      className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
    >
      Done
    </button>
  </div>
</div>
```

- [ ] **Step 3: Add onDone prop to CartSummary**

Update interface:
```tsx
interface CartSummaryProps {
  // ... existing props
  onDone?: (item: CartItemType) => void;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/drop/CartSummary.tsx
git commit -m "feat(drop): add Done button to preview section"
```

---

## Task 4: Wire Up Done Button in DropPage

**Files:**
- Modify: `src/pages/DropPage.tsx`

- [ ] **Step 1: Add handleDone function**

Add this function to handle the Done button click:

```tsx
const handleDone = (item: CartItem) => {
  addToCart(item);
  setForm(prev => ({
    ...prev,
    category: '',
    color: '',
    brand: '',
    material: '',
    shortDescription: '',
    memos: [],
    service: '',
    variation: '',
    price: '',
  }));
  setActiveStep('category');
  toast.success('Item added to cart');
};
```

- [ ] **Step 2: Pass onDone to CartSummary**

Find the CartSummary component and add the onDone prop:

```tsx
<CartSummary
  items={cartItems}
  ticketNumber={ticketNumber}
  onRemoveItem={removeFromCart}
  onComplete={handleComplete}
  disabled={cartItems.length === 0}
  previewItem={previewItem}
  onPriceChange={(price) => setForm(prev => ({ ...prev, price: price.toString() }))}
  onDone={handleDone}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/DropPage.tsx
git commit -m "feat(drop): wire up Done button for immediate item add"
```

---

## Verification Checklist

- [ ] Pill chips display instead of stepper bars
- [ ] Pills are compact and show max 4 + "+N" indicator
- [ ] Click pill to edit step
- [ ] "Done" button adds item immediately
- [ ] Form resets to Category after "Done"
- [ ] Multiple items can be added to same ticket
- [ ] "Complete Drop" finalizes all items
