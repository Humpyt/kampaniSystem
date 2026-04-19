# Balances Page Print Feature - Design Spec

## Overview

Replace the broken CSS `@media print` approach with a new browser window approach that guarantees clean print output containing only the balance data table.

## Approach: New Browser Window

When user clicks Print, open a new browser window with ONLY the clean balance data. The new window auto-triggers print dialog.

## Implementation Details

### 1. Print Handler Function

Location: `BalancesPage.tsx` - add `handlePrintBalances()` function

```typescript
const handlePrintBalances = () => {
  // Get current filtered/sorted data
  const printData = balanceRecords;
  const totalBalance = // calculated total
  const totalOriginal = // calculated total
  const totalPaid = // calculated total
  const recordCount = printData.length;

  // Build clean HTML for print window
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
          ${printData.map(record => `
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

  // Open new window and write content
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printHTML);
    printWindow.document.close();
  }
};
```

### 2. Update Print Button

Replace `onClick={handlePrint}` with `onClick={handlePrintBalances}` on the Print button.

### 3. Remove Old Print Code

After implementing, remove:
- The `.print-only` div from `BalancesPage.tsx`
- The print CSS from `index.css` related to `.print-only` and `.no-print` for this page
- Any inline print styles

## Files Modified

1. `src/pages/BalancesPage.tsx` - Add `handlePrintBalances` function, update button onClick, remove old print div
2. `src/index.css` - Remove print-only and no-print CSS rules (optional - keep if other pages use them)

## Success Criteria

- [ ] Clicking Print opens a new browser window
- [ ] New window contains only the clean balance data table
- [ ] Print dialog auto-opens in the new window
- [ ] All visible data (filtered/sorted) is included in print
- [ ] No dashboard UI, no dark backgrounds, no cards - just clean data
