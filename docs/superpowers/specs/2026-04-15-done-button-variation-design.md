# Done Button After Variation Step Design

## Context

After selecting "What to Fix" (variation), user wants a Done button to add the item to cart directly from the stepper form, instead of having to scroll down to the sidebar to enter price and click Done.

## Design

### Variation Step with Done Button

After selecting a variation, show a prominent Done button at the bottom of the form section:

```
┌─────────────────────────────────────────┐
│ ⚙️ What to Fix                         │
├─────────────────────────────────────────┤
│ What needs fixing?                      │
│ ┌──────────┐ ┌──────────┐              │
│ │ Half sole│ │ Full sole│              │
│ └──────────┘ └──────────┘              │
│ ┌──────────┐ ┌──────────┐              │
│ │ Heel     │ │ Other    │              │
│ └──────────┘ └──────────┘              │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │         ✅ DONE                  │   │
│ └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Behavior
- Done button appears after variation is selected
- Button is prominent with gradient background
- Clicking Done:
  1. Creates item from current form state
  2. Adds to cart
  3. Resets form to Category (keeps customer, color, brand for next item)
  4. Shows success toast
  5. Advances to next item entry

## Files to Modify

- `src/pages/DropPage.tsx` - Add Done button to variation step form

## Verification Checklist

- [ ] Done button appears after variation is selected
- [ ] Done button adds item to cart
- [ ] Form resets to Category after Done (keeps customer, color, brand)
- [ ] Toast confirmation shows
- [ ] User can continue adding items seamlessly
