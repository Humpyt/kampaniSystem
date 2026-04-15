# Drop Page Shortcut Service Flow

## Problem

When users click shortcut service buttons (Clean, Dye, Waterproof, Shine, Heels, Half Soles, Sole Guard, Others) on the Drop page, they currently only capture the service name and skip filling in Category, Color, Brand, Material, and Description fields. This data loss makes the cart less useful for tracking and reporting.

## Current Behavior

1. User clicks a shortcut (e.g., "Clean")
2. System sets `service = "Clean"`
3. Immediately jumps to variation step
4. Other fields remain empty

## New Behavior

1. User clicks a shortcut (e.g., "Clean")
2. System sets:
   - `service = "Clean"` (or clicked service name)
   - `variation = "New Pair"` (pre-filled, will auto-skip)
3. User fills in required fields:
   - **Category** → user selects (required)
   - **Color** → user selects (required)
   - **Brand** → user selects (required)
   - **Material** → user selects (optional)
   - **Description** → user enters (optional)
   - **Memos** → user selects (optional)
4. Service and Variation steps are **auto-skipped** (already filled)
5. User clicks Done on the preview to add item to cart

## Implementation

### Approach: Auto-Skip Completed Steps

Modify `advanceStep()` to skip any step where `isStepCompleted` is already true. This elegantly handles both the service and variation pre-filling without special-casing those steps.

```typescript
// Advance to next step, auto-skipping completed steps
const advanceStep = (currentStep: StepName) => {
  const currentIndex = STEPS_ORDER.indexOf(currentStep);
  for (let i = currentIndex + 1; i < STEPS_ORDER.length; i++) {
    const nextStep = STEPS_ORDER[i];
    if (!isStepCompleted(nextStep)) {
      setActiveStep(nextStep);
      return;
    }
  }
  // All remaining steps completed - stay on current
};
```

### Shortcut Button Handler

```typescript
const handleShortcutService = (service: string) => {
  setForm(prev => ({
    ...prev,
    service,
    variation: 'New Pair'  // Pre-fill variation
  }));
  // Navigate to first incomplete step (category if empty, else color, etc.)
  if (!form.category) {
    setActiveStep('category');
  } else if (!form.color) {
    setActiveStep('color');
  } else if (!form.brand) {
    setActiveStep('brand');
  } else {
    // All required fields filled, advanceStep will skip service/variation
    advanceStep('category');
  }
};
```

### Key Points

- **Service step**: Auto-skipped because `isStepCompleted('service')` returns true
- **Variation step**: Auto-skipped because `isStepCompleted('variation')` returns true (pre-filled to "New Pair")
- **Required flow**: Category → Color → Brand (user forced through these)
- **Optional flow**: Material → Description → Memos (user can skip or fill)

## Files to Modify

- `src/pages/DropPage.tsx`:
  - Modify `advanceStep()` to auto-skip completed steps
  - Update shortcut button handlers to pre-fill service and variation

## Success Criteria

- [ ] Shortcuts pre-fill service and variation
- [ ] Category, Color, Brand are required (user must fill)
- [ ] Material, Description, Memos are optional
- [ ] Service and Variation steps auto-skip when already filled
- [ ] Preview shows all captured data before Done
- [ ] User can still manually edit any step
