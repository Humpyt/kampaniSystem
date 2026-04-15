# Drop Page Stepper All Pills Design

## Context

The current stepper pills implementation:
1. Limits display to 4 pills with "+N" indicator - user wants all pills visible
2. Clicking a pill clears all subsequent step values - user wants to edit just that step without losing other selections

## Design

### 1. Show All Pills

**Change:** Remove `.slice(0, 4)` limit and "+N" indicator.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 👠 Women's High Heel  🎨 Black  🏷️ Nike  🧵 Leather  📝 Sole worn  📋 Extra lace  🔧 Resole  ⚙️ Half sole  │
└─────────────────────────────────────────────────────────────────┘
```

- All completed steps show as pills
- Use `flex-wrap` to handle overflow
- Scrollable container only if viewport is very narrow

### 2. Edit Without Clearing

**Current behavior:** Clicking a pill resets activeStep and clears all subsequent form values.

**New behavior:** Clicking a pill only sets that step as active, preserving all other form values.

**editStep function changes:**
- Remove the form clearing logic entirely
- Simply set `activeStep` to the clicked step
- All form values remain intact

**Flow after change:**
1. User fills: Category → Color → Brand → Material → Service
2. User clicks "Material" pill
3. Material form section becomes active
4. User changes "Leather" to "Suede"
5. User continues → advances to next uncompleted step

## Files to Modify

- `src/pages/DropPage.tsx` - Remove slice limit, simplify editStep

## Verification Checklist

- [ ] All pills visible (no +N limit)
- [ ] Pills wrap to multiple rows if needed
- [ ] Clicking pill only changes active step
- [ ] Form values preserved when editing a step
- [ ] User can edit any step and continue forward
