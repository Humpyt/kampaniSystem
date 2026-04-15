# Full-Height Right Panel Cart Design

## Context

The current cart sidebar is too small and doesn't show all item details (missing short description). User wants:
1. Much larger cart (50% width)
2. All item details visible including short description
3. Real-time cart preview as user builds
4. Done button after variation step

## Design

### Layout
- Cart takes **50% width** (`w-1/2`) of the screen
- Full height panel with scrollable content
- Fixed header with title and ticket
- Sticky footer with totals and Complete Drop button

### Visual Structure
```
┌────────────────────────────────────────────────────────────┐
│ HEADER: NEW DROP + Ticket + Customer Pill                  │
├─────────────────────────────────┬──────────────────────────┤
│                                 │ 🎫 DROP CART            │
│  STEPPER PILLS                  │ Ticket: #00123           │
│                                 ├──────────────────────────┤
│  ACTIVE FORM SECTION            │ ✨ NOW BUILDING          │
│  (Category → Color → etc)    │ ┌────────────────────┐  │
│                                 │ │ 👠 Women's High Heel│  │
│                                 │ │ Color: Black      │  │
│                                 │ │ Brand: Nike       │  │
│                                 │ │ Material: Leather │  │
│                                 │ │ "Worn soles"      │  │
│                                 │ │ 📋 Extra lace    │  │
│                                 │ │ 🔧 Resole • Half │  │
│                                 │ │ ───────────────── │  │
│                                 │ │ UGX 25,000 [Done]│  │
│                                 │ └────────────────────┘  │
│                                 ├──────────────────────────┤
│                                 │ 📦 ITEMS               │
│                                 │ ┌────────────────────┐  │
│                                 │ │ 1. 👠 High Heel  │  │
│                                 │ │ Black • Nike     │  │
│                                 │ │ UGX 25,000  🗑  │  │
│                                 │ └────────────────────┘  │
│                                 ├──────────────────────────┤
│                                 │ Total: UGX 70,000      │
│                                 │ [✅ COMPLETE DROP]      │
└─────────────────────────────────┴──────────────────────────┘
```

### Item Card Details
Each item card shows:
- Category icon + name
- Color (labeled)
- Brand (labeled)
- Material (labeled)
- Short description (if present)
- Memos as pills
- Services with variations
- Price

### Key Features
1. **50% width** - Much larger cart area
2. **Full item details** - All fields visible including short description
3. **Real-time preview** - "Now Building" section updates as user fills form
4. **Done button** - After variation step AND in cart preview
5. **Done button in Variation step** - Adds item to cart immediately
6. **Clear hierarchy** - Preview → Items → Totals → Action

## Files to Modify

- `src/pages/DropPage.tsx` - Change sidebar width to `w-1/2`
- `src/components/drop/CartSummary.tsx` - Larger panel with full details
- `src/components/drop/CartItemCard.tsx` - Show all details including short description
- `src/pages/DropPage.tsx` - Add Done button to variation step

## Verification Checklist

- [ ] Cart is 50% width
- [ ] Each item shows all details (category, color, brand, material, description, memos, services, price)
- [ ] Real-time preview updates as user fills form
- [ ] Done button in variation step adds item
- [ ] Done button in cart preview adds item
- [ ] Complete Drop button works
- [ ] Scroll works if many items
