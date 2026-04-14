# Cart Compact Items Design

## Context

The cart items are too wide and take up too much space. User wants:
1. Remove Done button from variation step - auto-add when price inserted
2. Make cart items more compact with two-column stacked layout
3. Make sidebar wider to accommodate
4. Make cart item price editable

## Design

### Layout Changes
- Sidebar width: `w-96` → `w-[480px]` (480px)
- Remove variation step Done button (revert previous change)

### Cart Item: Two-Column Stacked Layout
```
┌─────────────────────────────────────────────────────────┐
│ 👠  │ Women's High Heel                        │ UGX │
│     │ Black • Nike • Leather                   │25K  │
│     │ Sole repair                              │[✎] │
└─────────────────────────────────────────────────────────┘
```

- **Left column**: Large icon (48px)
- **Right column**: Category name (bold), details (single line), service (small)
- **Far right**: Price + edit button
- **Total height**: ~80px per item

### Auto-Add Behavior
- When price is entered in sidebar, item auto-adds after 500ms
- Item appears in cart with price 0 initially, then price is editable inline

### Editable Price in Cart
- Click price to edit inline
- Updates total in real-time

## Files to Modify

- `src/pages/DropPage.tsx` - Remove Done button from variation, increase sidebar width
- `src/components/drop/CartSummary.tsx` - Redesign with compact items and editable price

## Verification Checklist

- [ ] Done button removed from variation step
- [ ] Sidebar is wider (480px)
- [ ] Items use two-column stacked layout
- [ ] Items are compact (~80px height)
- [ ] Price is editable inline in cart
- [ ] Auto-add works when price entered
