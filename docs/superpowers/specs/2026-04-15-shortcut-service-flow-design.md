# Drop Page Shortcut Service Flow

## Problem

When users click shortcut service buttons (Clean, Dye, Waterproof, Shine, Heels, Half Soles, Sole Guard, Others) on the Drop page, they currently only capture the service name and skip filling in Category, Color, Material, and Memo fields. This data loss makes the cart less useful for tracking and reporting.

## Current Behavior

1. User clicks a shortcut (e.g., "Clean")
2. System sets `service = "Clean"` 
3. Immediately jumps to variation step
4. Other fields remain empty

## New Behavior

1. User clicks a shortcut (e.g., "Clean")
2. System sets `service = "Clean"` and **Memo = service name** (e.g., "Clean" added to memos array)
3. System finds the first step that needs attention:
   - If **Category** is empty → stay on category step
   - If **Category** filled but **Color** is empty → stay on color step
   - If **Category & Color** filled but **Material** is empty → stay on material step
   - If **Category, Color, Material** filled but **Memo** not set → stay on memos step with service pre-selected
   - If all filled → proceed to variation step
4. User fills in missing fields at their own pace
5. Preview updates in real-time

## Implementation

### Logic: `getFirstIncompleteStep()`

```typescript
const getFirstIncompleteStep = (form: DropFormState): StepName => {
  if (!form.category) return 'category';
  if (!form.color) return 'color';
  if (!form.material) return 'material';
  if (form.memos.length === 0) return 'memos';
  return 'service'; // All filled, go to service
};
```

### Shortcut Button Handler

```typescript
const handleShortcutService = (service: string) => {
  setForm(prev => ({
    ...prev,
    service,
    memos: prev.memos.includes(service) ? prev.memos : [...prev.memos, service]
  }));
  setActiveStep(getFirstIncompleteStep(form));
};
```

### Edge Cases

- **All fields filled**: Shortcut goes directly to variation step
- **Memo already exists**: Don't duplicate the service name in memos
- **Editing a shortcut item**: User can edit any field before confirming

## Files to Modify

- `src/pages/DropPage.tsx`:
  - Add `getFirstIncompleteStep()` helper
  - Update shortcut button handlers to use new logic

## Success Criteria

- [ ] Shortcuts preserve existing form values
- [ ] Shortcuts auto-fill the service name as a memo
- [ ] Shortcuts navigate to the first incomplete step
- [ ] User can still manually edit any step
- [ ] Preview updates correctly after shortcut
