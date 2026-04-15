# Drop Page Shortcut Service Flow

## Problem

When users click shortcut service buttons (Clean, Dye, Waterproof, Shine, Heels, Half Soles, Sole Guard, Others) on the Drop page, they currently only capture the service name and skip filling in Category, Color, Material, and Memo fields. This data loss makes the cart less useful for tracking and reporting.

## Design: Option A - Smart Defaults + Preview

This approach is the fastest for users. Shortcuts fill in sensible defaults, immediately show a preview, and let users confirm or adjust.

### Behavior

1. User clicks a shortcut (e.g., "Clean")
2. System immediately:
   - Sets `category = "Other"`
   - Sets `service = "Clean"`
   - Adds "Clean" to `memos` array
   - Sets `color = ""`
   - Sets `material = ""`
3. Preview item appears in cart sidebar with all filled data
4. User can:
   - Click "Done" to add item directly to cart, OR
   - Click the pencil icon on the preview to edit any field before confirming
5. Item is added to cart

### Why "Other" for Category?

Using "Other" as default preserves the existing repair order workflow pattern. Users who want a specific category can still select one manually before or after using a shortcut.

### Preview Behavior

The preview item in the cart shows:
- Category: "Other"
- Service: "Clean" (shown as service tag)
- Memo: "Clean"
- Price: 0 (waiting for user to set)

### Files to Modify

- `src/pages/DropPage.tsx`:
  - Update shortcut button handlers to set all fields with defaults
  - No step navigation needed — form stays in current state

### Success Criteria

- [ ] Shortcuts set Category="Other", Service, and Memo in one click
- [ ] Preview appears immediately in cart sidebar
- [ ] User can edit preview before confirming
- [ ] User can confirm and add to cart in minimum clicks
