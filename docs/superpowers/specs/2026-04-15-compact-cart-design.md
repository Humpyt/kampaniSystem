# Compact Cart Design

## Context

The current cart is too large and shows too much information per item. User wants:
1. Reduce width by 30% (from 50% to 35%)
2. Remove "Now Building" preview section
3. Remove category emoji
4. Single-line details: Color • Brand • Material • Description
5. Single-line extras: Memo pills + Service: Variation
6. No scrolling - everything visible

## Design

### Layout
- Width: 35% (`w-[35%]`)
- No "Now Building" preview section
- All items visible without scrolling

### Item Card Layout
```
┌──────────────────────────────────────────┐
│ Women's High Heel              UGX 25,000🗑│
│ Black • Nike • Leather • "Worn soles"      │
│ [Extra lace] [Resole: Half sole]        │
└──────────────────────────────────────────┘
```

### Details
- **Line 1:** Category name + Price + Trash
- **Line 2:** Color • Brand • Material • Description (all on one line if possible)
- **Line 3:** Memos as pills + Service: Variation

### Cart Structure
- Header: Cart title + item count
- Items: Compact cards with single-line details
- Footer: Total + Complete Drop button

## Files to Modify

- `src/components/drop/CartItemCard.tsx` - Compact layout, no emoji, single-line details
- `src/components/drop/CartSummary.tsx` - Remove Now Building, 35% width
- `src/pages/DropPage.tsx` - Update sidebar width to 35%

## Verification Checklist

- [ ] Cart width is 35%
- [ ] No "Now Building" preview
- [ ] No category emoji
- [ ] Color, brand, material, description on one line
- [ ] Memos and services on one line
- [ ] No scrolling needed to see all items
- [ ] Complete Drop button visible
