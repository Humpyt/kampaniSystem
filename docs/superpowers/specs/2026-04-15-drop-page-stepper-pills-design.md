# Drop Page Stepper Pills & Multi-Drop Design

## Context

The current cascade stepper has completed steps showing as horizontal bars, which can feel cluttered when many steps are completed. Also, the multi-drop workflow needs a clear "Done" action per item.

## Design

### 1. Compact Pill Chips for Completed Steps

**Problem:** Horizontal stepper bars overwhelm when many steps are complete.

**Solution:** Replace bars with compact pill chips in a single row.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ 👠 Women's High Heel  🎨 Black  🏷️ Nike  🧵 Leather    +3  │
└──────────────────────────────────────────────────────────────┘
```

**Pill Design:**
- Each pill: `bg-gray-700 rounded-full px-3 py-1.5 text-sm`
- Shows: icon + truncated value
- `+N` indicator when more than 4 items (shows count of additional items)
- Click pill → opens that step for editing
- Hover → tooltip with full value

**Implementation:**
- Single row with `flex flex-wrap gap-2` and `overflow-x-auto` if needed
- Compact, minimal footprint
- Edit functionality preserved via click

### 2. Multi-Drop Workflow

**Current behavior (already implemented):**
- Price entered → item auto-adds to cart after 500ms
- Form resets to Category step (keeps: customer, color, brand)
- User continues adding items
- "Complete Drop" button in sidebar finalizes all items

**"Done" Button Behavior:**
- Instead of just auto-adding, show a "Done" button next to price input in sidebar
- "Done" button: adds current item to cart immediately, resets form to Category
- "Complete Drop" button: finalizes ticket with all items

**Flow:**
1. Fill steps: Customer → Category → Color → Brand → Material → Description → Memos → Service → Variation
2. Price shows in sidebar preview
3. User enters price
4. Click "Done" (or wait 500ms for auto-add)
5. Item appears in cart grid, form resets to Category
6. Repeat for more items
7. Click "Complete Drop" when customer is done

## Files to Modify

- `src/components/drop/CollapsedStep.tsx` - Replace with PillChip component
- `src/pages/DropPage.tsx` - Update stepper rendering logic
- `src/components/drop/CartSummary.tsx` - Add "Done" button to preview section

## Verification Checklist

- [ ] Pill chips display instead of stepper bars
- [ ] Pills are compact and don't overwhelm
- [ ] Click pill to edit step
- [ ] "Done" button adds item immediately
- [ ] Form resets to Category after "Done"
- [ ] Multiple items can be added to same ticket
- [ ] "Complete Drop" finalizes all items
