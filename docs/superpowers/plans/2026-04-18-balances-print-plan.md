# Balances Page Print Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace broken CSS print approach with a new browser window that opens a clean printable balance report.

**Architecture:** When user clicks Print, open a new browser window with `window.open()`, write clean HTML containing only the balance data table, auto-trigger print dialog. No CSS conflicts, guaranteed clean output.

**Tech Stack:** Vanilla JS, no new dependencies

---

## Task 1: Add handlePrintBalances function to BalancesPage.tsx

**Files:**
- Modify: `src/pages/BalancesPage.tsx`

- [ ] **Step 1: Read current state of handlePrint and surrounding code**

Read `src/pages/BalancesPage.tsx` lines 95-105 to see current `handlePrint` function and understand where to add new function.

- [ ] **Step 2: Add handlePrintBalances function after handlePrint**

Add this function after line 102 (after `handlePrint` function):

```typescript
const handlePrintBalances = () => {
  // Build clean HTML for print window with current data
  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Customer Balances Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
        h1 { font-size: 20px; margin-bottom: 5px; }
        .header-info { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #1e3a8a; color: white; padding: 8px 6px; text-align: left; border: 1px solid #1e3a8a; }
        td { padding: 7px 6px; border: 1px solid #d1d5db; }
        tr:nth-child(even) td { background: #f9fafb; }
        tfoot td { background: #e5e7eb; font-weight: bold; border: 1px solid #d1d5db; }
        .summary { margin-top: 16px; text-align: right; font-size: 12px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>Customer Balances Report</h1>
      <div class="header-info">
        <div>Generated: ${new Date().toLocaleDateString('en-UG', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div>${recordCount} records</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Ticket #</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Date</th>
            <th style="text-align:right">Original (UGX)</th>
            <th style="text-align:right">Paid (UGX)</th>
            <th style="text-align:right">Balance (UGX)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${balanceRecords.map(record => `
            <tr>
              <td>#${record.id.slice(-6)}</td>
              <td>${record.customer?.name || 'Walk-in'}</td>
              <td>${record.customer?.phone || 'N/A'}</td>
              <td>${formatDate(record.createdAt)}</td>
              <td style="text-align:right">${formatCurrency(record.totalAmount)}</td>
              <td style="text-align:right;color:#059669">${formatCurrency(record.paidAmount)}</td>
              <td style="text-align:right;font-weight:600">${formatCurrency(record.balance)}</td>
              <td>${record.paidAmount === 0 ? 'Unpaid' : 'Partial'}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4">Total (${recordCount} records)</td>
            <td style="text-align:right">${formatCurrency(totalOriginal)}</td>
            <td style="text-align:right">${formatCurrency(totalPaid)}</td>
            <td style="text-align:right">${formatCurrency(totalBalance)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <div class="summary">
        <strong>Total Outstanding Balance: ${formatCurrency(totalBalance)}</strong>
      </div>
      <script>window.onload = () => { window.print(); }</script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printHTML);
    printWindow.document.close();
  }
};
```

- [ ] **Step 3: Update Print button onClick**

Find the Print button (around line 135) and change:
```typescript
onClick={handlePrint}
```
to:
```typescript
onClick={handlePrintBalances}
```

- [ ] **Step 4: Verify syntax is correct**

Check that the file compiles without errors by looking for any syntax issues in the function you just added.

---

## Task 2: Clean up old print code

**Files:**
- Modify: `src/pages/BalancesPage.tsx` - remove old print-only div and inline styles
- Modify: `src/index.css` - remove print-only related CSS rules

- [ ] **Step 1: Remove the old print-only div**

Find and remove the `<div className="print-only" style={{ display: 'none' }}>...</div>` section from BalancesPage.tsx. It should be at the end of the component, before the closing `</>`.

- [ ] **Step 2: Remove no-print class from main container**

Change line 119 from:
```typescript
<div className="min-h-screen bg-gray-900 p-6 no-print">
```
to:
```typescript
<div className="min-h-screen bg-gray-900 p-6">
```

- [ ] **Step 3: Remove no-print classes from child elements**

Remove `no-print` class from:
- Header div (line 122)
- Summary cards div (line 145)

- [ ] **Step 4: Clean up index.css print rules**

Remove or comment out the print-related CSS from `src/index.css`:
- Lines 114-128: `.print-only` and `@media print` rules for print

---

## Task 3: Test the print functionality

**Files:**
- Test: `src/pages/BalancesPage.tsx`

- [ ] **Step 1: Start dev server and navigate to balances page**

Verify page loads without errors:
```
npm run dev
```
Navigate to http://localhost:5176 (or current port) and go to balances page.

- [ ] **Step 2: Click Print button**

Verify:
- A new browser window opens
- It contains only the balance data table
- Print dialog auto-opens
- No dashboard UI visible

---

## Files Modified Summary

| File | Change |
|------|--------|
| `src/pages/BalancesPage.tsx` | Add handlePrintBalances function, update button onClick, remove old print-only div |
| `src/index.css` | Remove obsolete print-only CSS rules |

## Success Criteria

- [ ] Clicking Print opens new window with clean balance data
- [ ] Print dialog auto-triggers in new window
- [ ] No dashboard UI in print output
- [ ] All filtered/sorted data is included
