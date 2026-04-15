# Drop Page Cascade Stepper Design

## Context

The current DropPage is cluttered with all form sections visible simultaneously. Users need a clearer, more guided flow where they complete one section at a time, with completed sections collapsing into compact bars. Selected items should appear in a 3-column grid for quick overview.

## Design

### Overall Layout (Fixed Screen - No Scrolling)
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: "NEW DROP" + Ticket Badge + Customer Pill + Clear │
├─────────────────────────────────────┬───────────────────────┤
│                                     │                       │
│  LEFT (flex-1)                     │  RIGHT (sidebar)     │
│                                     │                       │
│  ┌─────────────────────────────┐   │  ┌─────────────────┐ │
│  │  CART ITEMS GRID (3-col) │   │  │                 │ │
│  │  [Card] [Card] [Card]     │   │  │   CART SUMMARY  │ │
│  │  [Card] [Card] [Card]     │   │  │                 │ │
│  └─────────────────────────────┘   │  │  - Items list   │ │
│                                     │  │  - Total       │ │
│  ┌─────────────────────────────┐   │  │  - Complete Btn │ │
│  │  STEPPER BARS (collapsed) │   │  │                 │ │
│  │  [Customer ▾] [Category ▾] │   │  └─────────────────┘ │
│  └─────────────────────────────┘   │                       │
│                                     │                       │
│  ┌─────────────────────────────┐   │                       │
│  │  ACTIVE FORM SECTION      │   │                       │
│  │  (expanded, scrollable    │   │                       │
│  │   within fixed height)     │   │                       │
│  └─────────────────────────────┘   │                       │
│                                     │                       │
└─────────────────────────────────────┴───────────────────────┘
```

### Stepper Flow (Linear Cascade)

Steps in order:
1. **Customer** → select → collapses to bar
2. **Category** → select → collapses to bar, Color form expands
3. **Color** → select → collapses to bar, Brand form expands
4. **Brand** → select → collapses to bar, Material form expands
5. **Material** → select → collapses to bar, Description form expands
6. **Description** → optional → continue
7. **Memos** → select (multi) → collapses to bar, Service form expands
8. **Service** → select → collapses to bar, "What to Fix" form expands
9. **What to Fix** → select → collapses to bar, Price form expands
10. **Price** → enter → **auto-adds to cart grid**, form resets to Category

### Collapsed Stepper Bar
```
┌──────────────────────────────────────────────────┐
│ 👠 Category          Women's High Heel      [✎]  │
└──────────────────────────────────────────────────┘
```
- Shows: icon + name + selected value + edit icon
- Click **edit icon** → expand that section, collapse all sections after it
- Click **bar itself** → expand that section only (linear flow)

### Cart Items Grid (3 columns)
Each completed item shows as:
```
┌─────────────────────┐
│ 👠                  │
│ Women's High Heel    │
│ Black • Leather     │
│ ─────────────────  │
│ UGX 25,000    [🗑] │
└─────────────────────┘
```
- Compact card with category icon, details, price
- **Click card** → opens Edit Modal (popup)
- Trash icon to remove from cart

### Cart Sidebar (Right)
- Fixed width sidebar (~280px)
- Shows all cart items as mini-list
- Running total with bold styling
- "COMPLETE DROP" button

### No-Scroll Constraint
- Main content area uses `flex-col` with `overflow-hidden`
- Inner sections use `overflow-y-auto` with `max-height` constraints
- If content exceeds viewport, only the active form section scrolls internally

## Implementation Notes

### State Management
- Track `activeStep` (string: 'customer' | 'category' | 'color' | etc.)
- Track `completedSteps` (object: { stepName: selectedValue })
- When step completes → add to completedSteps, advance activeStep
- When editing collapsed step → set activeStep to that step, clear steps after it

### Collapsed Stepper Component
- Receives: stepName, icon, label, value, onEdit callback
- Renders compact bar with value preview and edit icon
- Click on bar → expand section

### Cart Item Edit Modal
- Opens when clicking a cart item card
- Shows all fields for that item
- Save/Cancel/Delete buttons
- Closes and returns to grid view

### Auto-Add Behavior
- When price is entered (after category selected), item auto-adds to cart after 500ms
- Form resets but keeps: customer, category, color, brand
- Clears: material, description, memos, service, variation, price

## Files to Modify

- `src/pages/DropPage.tsx` - Main layout and state management
- `src/components/drop/CollapsedStep.tsx` - New collapsed stepper bar component
- `src/components/drop/StepSection.tsx` - Individual expanded form section
- `src/components/drop/CartItemCard.tsx` - Grid card for cart items
- `src/components/drop/EditItemModal.tsx` - Modal for editing cart items
- `src/components/drop/CartSummary.tsx` - Right sidebar (existing)
