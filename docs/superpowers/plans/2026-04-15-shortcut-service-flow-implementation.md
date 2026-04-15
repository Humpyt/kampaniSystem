# Shortcut Service Flow Implementation Plan (Option A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shortcut service buttons set Category="Other", Service, and Memo in one click, showing an immediate preview in the cart sidebar for review/confirmation.

**Architecture:** Update shortcut button handlers to set smart defaults (Category="Other", add service name to memos) and trigger preview. No step navigation — form stays in current state.

**Tech Stack:** React, TypeScript (no new dependencies)

---

## Task 1: Update First Row of Shortcut Buttons

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
          category: prev.category || 'Other',
          service,
          color: prev.color || '',
          material: prev.material || '',
          memos: prev.memos.includes(service) ? prev.memos : [...prev.memos, service]
        }));
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
git commit -m "feat: update first row shortcut buttons with smart defaults"
```

---

## Task 2: Update Second Row of Shortcut Buttons

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
          category: prev.category || 'Other',
          service,
          color: prev.color || '',
          material: prev.material || '',
          memos: prev.memos.includes(service) ? prev.memos : [...prev.memos, service]
        }));
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
git commit -m "feat: update second row shortcut buttons with smart defaults"
```

---

## Task 3: Verify Full Integration

**File:** `src/pages/DropPage.tsx`

- [ ] **Step 1: Test the flow manually**

1. Start dev server: `npm run dev`
2. Navigate to Drop page
3. Select a customer
4. Click "Clean" shortcut (without filling any other fields)
5. Verify:
   - Preview appears in cart sidebar
   - Category shows "Other"
   - Service shows "Clean"
   - Memo shows "Clean"
   - Price is 0
6. Click "Done" on preview
7. Verify item added to cart
8. Repeat with different shortcut and verify memo is added to existing memos (not duplicated)

- [ ] **Step 2: Final build verification**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: shortcut services use smart defaults with preview"
```
