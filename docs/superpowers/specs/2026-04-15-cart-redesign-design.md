# Cart Redesign - Larger Sidebar with Item Cards

## Context

The current cart sidebar is too small and compact. Items show in a list format that doesn't give enough detail. User wants a larger, better-designed cart.

## Design

### Layout
- Sidebar width: `w-72` (288px) → `w-96` (384px)
- Use full `CartItemCard` components instead of compact list items

### Visual Structure
```
┌─────────────────────────────────────────┐
│ 🎫 DROP CART          Ticket: #00123   │
│                              3 items   │
├─────────────────────────────────────────┤
│ ✨ NOW BUILDING                         │
│ ┌─────────────────────────────────────┐│
│ │ 👠 Women's High Heel                 ││
│ │ Black • Nike • Leather               ││
│ │ ─────────────────────────────────── ││
│ │ UGX 25,000           [Done]         ││
│ └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│ ITEMS                                   │
│ ┌─────────────────────────────────────┐│
│ │ 1. 👠 Women's High Heel        🗑   ││
│ │    Black • Nike • Leather           ││
│ │    UGX 25,000                      ││
│ └─────────────────────────────────────┘│
│ ┌─────────────────────────────────────┐│
│ │ 2. 👞 Men's Dress              🗑   ││
│ │    Brown • Allen Edmonds • Leather   ││
│ │    UGX 45,000                      ││
│ └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│ Subtotal: UGX 70,000                   │
│ Total:    UGX 70,000                   │
│ ┌─────────────────────────────────────┐│
│ │      ✅ COMPLETE DROP               ││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Key Improvements
1. **Wider sidebar** - 384px vs 288px for more detail space
2. **Full card display** - Each item shows as a CardItemCard with all details
3. **Clear visual hierarchy** - Preview → Items → Totals → Action
4. **"Now Building" section** - Stands out with gradient background and prominent Done button
5. **Item index numbers** - Easy to reference when discussing with customer

## Files to Modify

- `src/pages/DropPage.tsx` - Change sidebar width from `w-72` to `w-96`
- `src/components/drop/CartSummary.tsx` - Redesign to use CartItemCard components

## Verification Checklist

- [ ] Sidebar is wider (384px)
- [ ] Each cart item shows as full card with all details
- [ ] "Now Building" preview section is prominent
- [ ] Done button is visible and functional
- [ ] Items list scrolls if many items
- [ ] Total and Complete Drop button are clearly visible
