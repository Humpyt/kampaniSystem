# Shortcut Service Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shortcut buttons pre-fill service and variation, force user through Category/Color/Brand, and auto-skip completed steps.

**Architecture:** Modify `advanceStep()` to auto-skip steps where `isStepCompleted` returns true. Update shortcut handlers to pre-fill service and variation.

**Tech Stack:** React, TypeScript (no new dependencies)

---

## Task 1: Modify `advanceStep()` to Auto-Skip Completed Steps

**File:** `src/pages/DropPage.tsx` (around line 218)

- [ ] **Step 1: Update `advanceStep()` function**

Find and replace the current `advanceStep` function:

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

- [ ] **Step 2: Verify file compiles**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/DropPage.tsx
git commit -m "feat: auto-skip completed steps in advanceStep"
```

---

## Task 2: Update First Row Shortcut Buttons

**File:** `src/pages/DropPage.tsx` (around line 893)

- [ ] **Step 1: Update first shortcut row (Clean, Dye, Waterproof, Shine)**

Find the first `<div className="grid grid-cols-4 gap-2">` after the service shortcuts comment and replace its button handlers:

```typescript
<div className="grid grid-cols-4 gap-2">
  {['Clean', 'Dye', 'Waterproof', 'Shine'].map(service => (
    <button
      key={service}
      onClick={() => {
        setForm(prev => ({
          ...prev,
          service,
          variation: 'New Pair'
        }));
        // Navigate to first incomplete required step
        if (!form.category) {
          setActiveStep('category');
        } else if (!form.color) {
          setActiveStep('color');
        } else if (!form.brand) {
          setActiveStep('brand');
        } else {
          advanceStep('category');
        }
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
git commit -m "feat: update first shortcut row to pre-fill service/variation"
```

---

## Task 3: Update Second Row Shortcut Buttons

**File:** `src/pages/DropPage.tsx` (around line 906)

- [ ] **Step 1: Update second shortcut row (Heels, Half Soles, Sole Guard, Others)**

Find the second `<div className="grid grid-cols-4 gap-2">` and update similarly:

```typescript
<div className="grid grid-cols-4 gap-2">
  {['Heels', 'Half Soles', 'Sole Guard', 'Others'].map(service => (
    <button
      key={service}
      onClick={() => {
        setForm(prev => ({
          ...prev,
          service,
          variation: 'New Pair'
        }));
        // Navigate to first incomplete required step
        if (!form.category) {
          setActiveStep('category');
        } else if (!form.color) {
          setActiveStep('color');
        } else if (!form.brand) {
          setActiveStep('brand');
        } else {
          advanceStep('category');
        }
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
git commit -m "feat: update second shortcut row to pre-fill service/variation"
```

---

## Task 4: Verify Full Integration

- [ ] **Step 1: Start dev server and test**

1. Run: `npm run dev`
2. Navigate to Drop page, select a customer
3. Click "Clean" shortcut
4. Verify:
   - Service shows "Clean" in stepper bar
   - Variation shows "New Pair" in stepper bar
   - Navigates to Category step
5. Select Category, verify advance to Color
6. Select Color, verify advance to Brand
7. Select Brand, verify auto-skips Service and Variation, shows Material
8. Skip Material, verify shows Description
9. Skip Description, verify shows Done button in preview
10. Click Done, verify item added to cart with all fields

- [ ] **Step 2: Final build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: shortcut services capture category, color, brand, material, description"
```
