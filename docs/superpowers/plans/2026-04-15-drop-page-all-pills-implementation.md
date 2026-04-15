# Drop Page All Pills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show all stepper pills without limit, and edit steps without clearing subsequent values.

**Architecture:** Single file change in DropPage.tsx - remove slice limit and simplify editStep function.

**Tech Stack:** React, TypeScript, Tailwind CSS

---

## Task 1: Show All Pills (Remove Limit)

**Files:**
- Modify: `src/pages/DropPage.tsx:683-702`

- [ ] **Step 1: Update stepper pills rendering**

Find lines 683-702 with the stepper pills code. Replace with:

```tsx
{/* Stepper pills for completed steps */}
{STEPS_ORDER.filter(step => isStepCompleted(step) && step !== activeStep).length > 0 && (
  <div className="flex flex-wrap gap-2 pb-1">
    {STEPS_ORDER.filter(step => isStepCompleted(step) && step !== activeStep).map(step => (
      <PillChip
        key={step}
        icon={getStepIcon(step)}
        value={getStepValue(step)}
        onEdit={() => editStep(step)}
      />
    ))}
  </div>
)}
```

Changes:
- Removed `.slice(0, 4)` limit
- Removed the `+N` indicator code
- Changed `overflow-x-auto` to `flex-wrap` for natural wrapping

- [ ] **Step 2: Verify build**

Run: `cd D:/WEB APPS/Kampani02/ProShoeRepair/.worktrees/drop-workflow && npm run build 2>&1 | tail -10`

- [ ] **Step 3: Commit**

```bash
git add src/pages/DropPage.tsx
git commit -m "feat(drop): show all stepper pills without limit"
```

---

## Task 2: Edit Step Without Clearing

**Files:**
- Modify: `src/pages/DropPage.tsx:174-189`

- [ ] **Step 1: Simplify editStep function**

Find the editStep function (lines 174-189). Replace with:

```tsx
const editStep = (step: StepName) => {
  setActiveStep(step);
};
```

The old code was clearing form values when editing. Now we just set the active step without clearing anything.

- [ ] **Step 2: Verify build**

Run: `cd D:/WEB APPS/Kampani02/ProShoeRepair/.worktrees/drop-workflow && npm run build 2>&1 | tail -10`

- [ ] **Step 3: Commit**

```bash
git add src/pages/DropPage.tsx
git commit -m "feat(drop): edit step without clearing subsequent values"
```

---

## Verification Checklist

- [ ] All pills visible (no +N limit)
- [ ] Pills wrap to multiple rows if needed
- [ ] Clicking pill only changes active step
- [ ] Form values preserved when editing a step
- [ ] User can edit any step and continue forward
