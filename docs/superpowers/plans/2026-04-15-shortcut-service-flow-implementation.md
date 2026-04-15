# Shortcut Service Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shortcut service buttons preserve existing form values (Category, Color, Material, Memo) and navigate to the first incomplete step instead of jumping directly to variation.

**Architecture:** Add a helper function `getFirstIncompleteStep()` that checks which form fields are empty and returns the first incomplete step. Update shortcut button handlers to use this helper instead of always jumping to 'variation'.

**Tech Stack:** React, TypeScript (no new dependencies)

---

## Task 1: Add `getFirstIncompleteStep` Helper

**File:** `src/pages/DropPage.tsx` (add near line 138, after state declarations)

- [ ] **Step 1: Add the helper function after the existing state declarations (around line 138)**

```typescript
// Find the first incomplete step to navigate to after shortcut selection
const getFirstIncompleteStep = (form: DropFormState): StepName => {
  if (!form.category) return 'category';
  if (!form.color) return 'color';
  if (!form.material) return 'material';
  if (form.memos.length === 0) return 'memos';
  return 'service'; // All filled, go to service step
};
```

- [ ] **Step 2: Verify file compiles**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/DropPage.tsx
git commit -m "feat: add getFirstIncompleteStep helper for shortcut flow"
```

---

## Task 2: Update First Row of Shortcut Buttons

**File:** `src/pages/DropPage.tsx` (lines 892-904)

- [ ] **Step 1: Update the first shortcut button row (Clean, Dye, Waterproof, Shine)**

Locate this code:
```typescript
<div className="grid grid-cols-4 gap-2">
  {['Clean', 'Dye', 'Waterproof', 'Shine'].map(service => (
    <button
      key={service}
      onClick={() => {
        setForm(prev => ({ ...prev, service }));
        setActiveStep('variation');
      }}
      className="px-3 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded-lg transition-colors"
    >
      {service}
    </button>
  ))}
</div>
```

Replace with:
```typescript
<div className="grid grid-cols-4 gap-2">
  {['Clean', 'Dye', 'Waterproof', 'Shine'].map(service => (
    <button
      key={service}
      onClick={() => {
        setForm(prev => ({
          ...prev,
          service,
          memos: prev.memos.includes(service) ? prev.memos : [...prev.memos, service]
        }));
        setActiveStep(getFirstIncompleteStep(form));
      }}
      className="px-3 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded-lg transition-colors"
    >
      {service}
    </button>
  ))}
</div>
```

- [ ] **Step 2: Verify file compiles**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/DropPage.tsx
git commit -m "feat: update first row shortcut buttons with smart navigation"
```

---

## Task 3: Update Second Row of Shortcut Buttons

**File:** `src/pages/DropPage.tsx` (lines 906-918)

- [ ] **Step 1: Update the second shortcut button row (Heels, Half Soles, Sole Guard, Others)**

Locate this code:
```typescript
<div className="grid grid-cols-4 gap-2">
  {['Heels', 'Half Soles', 'Sole Guard', 'Others'].map(service => (
    <button
      key={service}
      onClick={() => {
        setForm(prev => ({ ...prev, service }));
        setActiveStep('variation');
      }}
      className="px-3 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors"
    >
      {service}
    </button>
  ))}
</div>
```

Replace with:
```typescript
<div className="grid grid-cols-4 gap-2">
  {['Heels', 'Half Soles', 'Sole Guard', 'Others'].map(service => (
    <button
      key={service}
      onClick={() => {
        setForm(prev => ({
          ...prev,
          service,
          memos: prev.memos.includes(service) ? prev.memos : [...prev.memos, service]
        }));
        setActiveStep(getFirstIncompleteStep(form));
      }}
      className="px-3 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors"
    >
      {service}
    </button>
  ))}
</div>
```

- [ ] **Step 2: Verify file compiles**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/DropPage.tsx
git commit -m "feat: update second row shortcut buttons with smart navigation"
```

---

## Task 4: Verify Full Integration

**File:** `src/pages/DropPage.tsx`

- [ ] **Step 1: Test the flow manually**

1. Start dev server: `npm run dev`
2. Navigate to Drop page
3. Select a customer
4. Fill in Category, Color, Material
5. Click "Clean" shortcut
6. Verify:
   - Service is set to "Clean"
   - Memo shows "Clean"
   - Navigates to variation step (all fields filled)
7. Clear cart and repeat without filling all fields
8. Verify it navigates to the first incomplete step

- [ ] **Step 2: Final build verification**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: shortcut services capture category, color, material, memo"
```
