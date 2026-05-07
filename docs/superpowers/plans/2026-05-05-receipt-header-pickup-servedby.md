# Receipt Enhancements: Header, Pickup Date, Served By

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update all 3 receipt generators with new header text, prominent pickup date, and served-by display.

**Architecture:** Three receipt generators share similar structure. Update each one: (1) on-screen React Receipt.tsx, (2) printer.ts PDF+HTML templates, (3) invoices.ts archived PDF. Use existing authStore.user.name for served-by. The STORE_INFO constant in printer.ts serves as the canonical header source.

**Tech Stack:** React/TSX, PDFKit, Express

---

### Task 1: Update STORE_INFO constants in printer.ts

**Files:**
- Modify: `/var/www/kampani/server/routes/printer.ts`

- [ ] **Step 1: Update header constants**

Replace the existing STORE_INFO object with the new business details:

```typescript
const STORE_INFO = {
  brand: 'KAMPANI',
  fullName: 'KAMPANI SHOES & BAGS CLINIC',
  tagline: 'Shoes & Bags Clinic',
  location: 'FORESTMALL LUGOGO GF06',
  phone: 'Mob: 0789 183 784 | 0704 830 016',
  footerLine1: 'Thank you for your business.',
  footerLine2: 'Items not collected after 30 days attract storage fees.',
  footerLine3: 'After 60 days, uncollected items may be disposed of.',
};
```

---

### Task 2: Add pickup date and served-by to generateReceiptPDF (printer.ts)

**Files:**
- Modify: `/var/www/kampani/server/routes/printer.ts`

- [ ] **Step 1: Add servedBy to function params**

Add `servedBy?: string` to the `generateReceiptPDF` data interface.

- [ ] **Step 2: Add pickup date section after totals, before footer**

After the totals section and before the footer, add a prominent pickup date block when `readyText` is present:

```typescript
  // Pickup Date — prominent
  if (readyText) {
    y += 4;
    rule(y);
    y += 8;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND.ink);
    doc.text('PICKUP DATE', ML, y, { align: 'center', width: CW });
    y += 12;
    doc.font('Helvetica-Bold').fontSize(14);
    doc.text(readyText, ML, y, { align: 'center', width: CW });
    y += 20;
  }
```

- [ ] **Step 3: Add servedBy line in footer area**

```typescript
  // Served by
  if (servedBy) {
    y += 4;
    doc.font('Helvetica').fontSize(7.5).fillColor(BRAND.ink);
    doc.text(`Served by: ${servedBy}`, ML, y, { align: 'center', width: CW });
    y += 10;
  }
```

- [ ] **Step 4: Add servedBy to metaPairs**

Add servedBy to the meta section:
```typescript
  if (servedBy) metaPairs.push(['Served by', servedBy]);
```

- [ ] **Step 5: Wire servedBy from call sites**

In the route handler that calls `generateReceiptPDF`, extract `servedBy` from the request body and pass it.

---

### Task 3: Update generateOrderPrintHtml in printer.ts

**Files:**
- Modify: `/var/www/kampani/server/routes/printer.ts`

- [ ] **Step 1: Add servedBy to function params and HTML**

Add `servedBy?: string` to the data interface and render it in the HTML template after the total section, along with a prominent pickup date block.

---

### Task 4: Update generateReceiptPdfBuffer in invoices.ts

**Files:**
- Modify: `/var/www/kampani/server/routes/invoices.ts`

- [ ] **Step 1: Update header text**

Replace `KAMPANIS SHOES & BAGS CLINIC` → `KAMPANI SHOES & BAGS CLINIC`
Replace `Forest Mall, Kampala` → `FORESTMALL LUGOGO GF06`
Replace `+256 789 183784` → `Mob: 0789 183 784 | 0704 830 016`

- [ ] **Step 2: Add pickup date section**

After the totals area and before the archive footer, add the prominent pickup date when `promised_date` exists.

- [ ] **Step 3: Add servedBy display**

Get `generated_by` from the invoice record and display as `Served by: [name]`.

---

### Task 5: Update Receipt.tsx (on-screen component)

**Files:**
- Modify: `/var/www/kampani/src/components/Receipt.tsx`

- [ ] **Step 1: Update header text**

```tsx
<h2 className="text-xl font-bold">KAMPANI SHOES & BAGS CLINIC</h2>
<p>FORESTMALL LUGOGO GF06</p>
<p>Mob: 0789 183 784 | 0704 830 016</p>
```

- [ ] **Step 2: Add pickup date prominence**

Replace the existing promised date section with larger, bolder styling.

- [ ] **Step 3: Add servedBy to props and display**

Add `servedBy?: string` to ReceiptProps, display below totals, before the thank you / footer section.

---

### Task 6: Build and deploy

**Files:**
- (Build artifacts)

- [ ] **Step 1: Build frontend**
`npm run build` in /var/www/kampani

- [ ] **Step 2: Restart PM2**
`pm2 restart shoe-repair-pos`

- [ ] **Step 3: Verify server is running**
`pm2 status` and check the app loads
