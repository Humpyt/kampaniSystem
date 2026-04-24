import { v4 as uuidv4 } from 'uuid';
import db from '../database';

// Types for payment operations
export type PaymentMethod = 'cash' | 'mobile_money' | 'bank_card' | 'store_credit';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overpaid';
export type PaymentSource = 'drop' | 'pickup' | 'store_credit';

export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  transaction_id?: string;
}

export interface ApplyPaymentResult {
  success: boolean;
  operation?: any;
  newPaymentStatus?: PaymentStatus;
  paymentRecords?: any[];
  error?: string;
}

// Map lowercase method names to display names
const methodDisplayNames: Record<PaymentMethod, string> = {
  'cash': 'Cash',
  'mobile_money': 'Mobile Money',
  'bank_card': 'Credit Card',
  'store_credit': 'Store Credit',
};

/**
 * Validates payment inputs before applying
 */
function validatePayments(
  payments: PaymentInput[],
  operationTotal: number,
  existingPaidAmount: number
): { valid: boolean; error?: string } {
  const maxDue = operationTotal - existingPaidAmount;

  for (const payment of payments) {
    // Check amount is valid
    if (!Number.isFinite(payment.amount) || payment.amount <= 0) {
      return { valid: false, error: 'Payment amount must be a positive number' };
    }

    // Check method is valid
    if (!['cash', 'mobile_money', 'bank_card', 'store_credit'].includes(payment.method)) {
      return { valid: false, error: `Invalid payment method: ${payment.method}` };
    }

    // Check overpayment (unless explicitly supported)
    // For now, reject payments that would exceed the balance due
    if (payment.amount > maxDue && maxDue > 0) {
      return { valid: false, error: `Payment amount ${payment.amount} exceeds balance due ${maxDue}` };
    }
  }

  return { valid: true };
}

/**
 * Compute payment status based on paid amount
 */
function computePaymentStatus(
  totalAmount: number,
  paidAmount: number
): PaymentStatus {
  const amountDue = totalAmount;
  if (paidAmount <= 0) return 'unpaid';
  if (paidAmount >= amountDue) return 'paid';
  return 'partial';
}

/**
 * Apply payments to an operation
 * This is the shared helper used by:
 * - POST /api/operations (drop-time payments)
 * - POST /api/operations/:id/payments (pickup payments)
 * - POST /api/customers/:customerId/apply-credit-to-debts (store credit auto-pay)
 */
export async function applyPaymentsToOperation(
  operationId: string,
  payments: PaymentInput[],
  source: PaymentSource
): Promise<ApplyPaymentResult> {
  // Validate inputs
  if (!Array.isArray(payments) || payments.length === 0) {
    return { success: false, error: 'No payments provided' };
  }

  try {
    return await db.withTransaction(async (client) => {
      // Get current operation state
      const operation = await client.get(
        `SELECT * FROM operations WHERE id = $1`,
        [operationId]
      );

      if (!operation) {
        return { success: false, error: 'Operation not found' };
      }

      // Validate all payments before applying
      const existingPaidAmount = Number(operation.paid_amount || 0);
      const totalAmount = Number(operation.total_amount || 0);
      const validation = validatePayments(payments, totalAmount, existingPaidAmount);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const now = new Date().toISOString();
      const paymentRecords: any[] = [];

      // Insert each payment record
      for (const payment of payments) {
        const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const displayMethod = methodDisplayNames[payment.method];

        await client.run(
          `INSERT INTO operation_payments (id, operation_id, payment_method, amount, transaction_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [paymentId, operationId, displayMethod, payment.amount, payment.transaction_id || null, now]
        );

        paymentRecords.push({
          id: paymentId,
          method: displayMethod,
          amount: payment.amount,
          transaction_id: payment.transaction_id,
        });
      }

      // Calculate new total paid using atomic update
      const totalPaymentAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const newPaidAmount = existingPaidAmount + totalPaymentAmount;

      // Compute new payment status
      const newPaymentStatus = computePaymentStatus(totalAmount, newPaidAmount);

      // Update operation with atomic paid_amount increment and set payment_status
      await client.run(
        `UPDATE operations
         SET paid_amount = paid_amount + $1,
             payment_status = $2,
             updated_at = $3
         WHERE id = $4`,
        [totalPaymentAmount, newPaymentStatus, now, operationId]
      );

      // Update customer stats (add to total_spent, update last_visit)
      if (operation.customer_id) {
        await client.run(
          `UPDATE customers
           SET total_spent = total_spent + $1,
               last_visit = $2
           WHERE id = $3`,
          [totalPaymentAmount, now, operation.customer_id]
        );
      }

      // Auto-capture 2% credit on transaction (not for store_credit source or store_credit payment method)
      const hasStoreCreditPayment = payments.some(p => p.method === 'store_credit');
      if (source !== 'store_credit' && !hasStoreCreditPayment && totalPaymentAmount > 0) {
        const creditAmount = Math.round(totalPaymentAmount * 0.02);
        if (creditAmount > 0 && operation.customer_id) {
          const creditTransactionId = `credit_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const currentCustomer = await client.get(
            'SELECT account_balance FROM customers WHERE id = $1',
            [operation.customer_id]
          );
          const newCreditBalance = (currentCustomer?.account_balance || 0) + creditAmount;

          await client.run(
            `INSERT INTO customer_credits (id, customer_id, amount, balance_after, type, description, created_by, created_at)
             VALUES ($1, $2, $3, $4, 'credit', $5, $6, $7)`,
            [creditTransactionId, operation.customer_id, creditAmount, newCreditBalance, '2% transaction credit', null, now]
          );

          await client.run(
            'UPDATE customers SET account_balance = $1 WHERE id = $2',
            [newCreditBalance, operation.customer_id]
          );
        }
      }

      // Get updated operation with customer info
      const updatedOperation = await client.get(
        `SELECT o.*, c.name as customer_name, c.phone as customer_phone
         FROM operations o
         LEFT JOIN customers c ON o.customer_id = c.id
         WHERE o.id = $1`,
        [operationId]
      );

      // Get updated payment records
      const allPaymentRecords = await client.all(
        `SELECT * FROM operation_payments WHERE operation_id = $1 ORDER BY created_at DESC`,
        [operationId]
      );

      return {
        success: true,
        operation: transformOperationResponse(updatedOperation, allPaymentRecords),
        newPaymentStatus,
        paymentRecords,
      };
    });
  } catch (error) {
    console.error('[applyPayments] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply payments'
    };
  }
}

/**
 * Transform operation response with payment records
 */
function transformOperationResponse(operation: any, paymentRecords: any[]) {
  if (!operation) return null;

  return {
    id: operation.id,
    customerId: operation.customer_id,
    ticketNumber: operation.ticket_number || null,
    status: operation.status || 'pending',
    workflowStatus: operation.workflow_status || 'pending',
    paymentStatus: operation.payment_status || 'unpaid',
    totalAmount: Number(operation.total_amount) || 0,
    paidAmount: Number(operation.paid_amount) || 0,
    discount: Number(operation.discount) || 0,
    notes: operation.notes || '',
    promisedDate: operation.promised_date || null,
    pickedUpAt: operation.picked_up_at || null,
    createdAt: operation.created_at,
    updatedAt: operation.updated_at,
    isNoCharge: operation.is_no_charge === 1 || operation.is_no_charge === true,
    isDoOver: operation.is_do_over === 1 || operation.is_do_over === true,
    isDelivery: operation.is_delivery === 1 || operation.is_delivery === true,
    isPickup: operation.is_pickup === 1 || operation.is_pickup === true,
    customer: operation.customer_id ? {
      id: operation.customer_id,
      name: operation.customer_name,
      phone: operation.customer_phone
    } : null,
    createdBy: operation.created_by || null,
    staffName: operation.staff_name || null,
    paymentRecords,
  };
}

/**
 * Apply payment status update to an operation based on current state
 * Called when operation is created or when additional payments are applied
 */
export async function updateOperationPaymentStatus(operationId: string): Promise<void> {
  await db.run(
    `UPDATE operations
     SET payment_status = CASE
       WHEN paid_amount >= total_amount THEN 'paid'
       WHEN paid_amount > 0 THEN 'partial'
       ELSE 'unpaid'
     END,
     updated_at = $1
     WHERE id = $2`,
    [new Date().toISOString(), operationId]
  );
}
