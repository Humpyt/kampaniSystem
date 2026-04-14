# Done Button After Variation Step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Done button to variation step form to add item to cart directly.

**Tech Stack:** React, TypeScript, Tailwind CSS

---

## Task 1: Add Done Button to Variation Step

**Files:**
- Modify: `src/pages/DropPage.tsx:581-601`

- [ ] **Step 1: Update variation step form**

Find the variation step form (around lines 581-601):

```tsx
case 'variation':
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-400 mb-2">What needs fixing?</div>
      <div className="grid grid-cols-2 gap-2">
        {SERVICE_VARIATIONS.map(v => (
          <button
            key={v}
            onClick={() => handleVariationSelect(v)}
            className={`p-4 rounded-xl text-sm font-medium transition-all ${
              form.variation === v
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
```

Replace with:

```tsx
case 'variation':
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-400 mb-2">What needs fixing?</div>
      <div className="grid grid-cols-2 gap-2">
        {SERVICE_VARIATIONS.map(v => (
          <button
            key={v}
            onClick={() => handleVariationSelect(v)}
            className={`p-4 rounded-xl text-sm font-medium transition-all ${
              form.variation === v
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      {form.variation && (
        <button
          onClick={() => {
            // Create a temporary item to add
            const tempItem: CartItem = {
              id: crypto.randomUUID(),
              category: form.category,
              color: form.color,
              brand: form.brand,
              material: form.material,
              shortDescription: form.shortDescription,
              memos: form.memos,
              services: [{ service: form.service, variation: form.variation }],
              price: 0, // Price will be set in sidebar
            };
            // Trigger price entry in sidebar by setting preview
            setForm(prev => ({ ...prev, price: '' }));
            // Actually add with price from preview
            addToCart({ ...tempItem, price: parseInt(form.price, 10) || 0 });
            toast.success('Item added! Set price in cart.');
            // Reset form but keep customer, color, brand
            setForm(prev => ({
              ...prev,
              category: '',
              color: prev.color,
              brand: prev.brand,
              material: '',
              shortDescription: '',
              memos: [],
              service: '',
              variation: '',
              price: '',
            }));
            setActiveStep('category');
          }}
          className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg"
        >
          <Check className="w-5 h-5" />
          DONE
        </button>
      )}
    </div>
  );
```

- [ ] **Step 2: Verify build**

Run: `cd D:/WEB APPS/Kampani02/ProShoeRepair/.worktrees/drop-workflow && npm run build 2>&1 | tail -10`

- [ ] **Step 3: Commit**

```bash
git add src/pages/DropPage.tsx
git commit -m "feat(drop): add Done button to variation step"
```

---

## Verification Checklist

- [ ] Done button appears after variation is selected
- [ ] Done button adds item to cart
- [ ] Form resets to Category after Done
- [ ] Toast confirmation shows
- [ ] User can continue adding items
