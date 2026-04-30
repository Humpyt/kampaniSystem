import { useEffect, useState } from 'react';
import { CreditCard, Smartphone, DollarSign, X, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

interface PaymentMethod {
  method: 'cash' | 'mobile_money' | 'bank_card' | 'store_credit';
  amount: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  customer: {
    id: string;
    name: string;
    accountBalance?: number;
  } | null;
  onComplete: (payments: PaymentMethod[]) => Promise<void>;
  allowPartialPayments?: boolean;
}

const PAYMENT_METHODS: {
  method: PaymentMethod['method'];
  label: string;
  icon: typeof DollarSign;
  color: string;
}[] = [
  { method: 'cash', label: 'Cash', icon: DollarSign, color: 'text-green-400' },
  { method: 'mobile_money', label: 'Mobile Money', icon: Smartphone, color: 'text-blue-400' },
  { method: 'bank_card', label: 'Bank Card', icon: CreditCard, color: 'text-purple-400' },
  { method: 'store_credit', label: 'Store Credit', icon: DollarSign, color: 'text-yellow-400' },
];

export function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  customer,
  onComplete,
  allowPartialPayments = true,
}: PaymentModalProps) {
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod['method'] | null>(null);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = totalAmount - totalPaid;

  useEffect(() => {
    if (isOpen) {
      setPayments([]);
      setSelectedMethod(null);
      setAmount('');
    }
  }, [isOpen]);

  const handleAddPayment = () => {
    const paymentAmount = parseInt(amount, 10);

    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }

    if (!paymentAmount || paymentAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (selectedMethod === 'store_credit' && customer) {
      const availableCredit = customer.accountBalance || 0;
      if (paymentAmount > availableCredit) {
        alert(`Insufficient credit. Available: ${formatCurrency(availableCredit)}`);
        return;
      }
    }

    if (paymentAmount > remainingBalance) {
      alert(`Amount exceeds remaining balance of ${formatCurrency(remainingBalance)}`);
      return;
    }

    setPayments(prev => [...prev, { method: selectedMethod, amount: paymentAmount }]);
    setSelectedMethod(null);
    setAmount('');
  };

  const handleRemovePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (payments.length === 0) return;

    setIsSubmitting(true);
    try {
      await onComplete(payments);
      onClose();
    } catch (error: any) {
      alert(error.message || 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Record Payment</h2>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-gray-700 p-3 text-center">
            <p className="text-xs text-gray-400">Total Amount</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="rounded-lg bg-gray-700 p-3 text-center">
            <p className="text-xs text-gray-400">Paid So Far</p>
            <p className="text-lg font-bold text-green-400">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="rounded-lg bg-gray-700 p-3 text-center">
            <p className="text-xs text-gray-400">Remaining</p>
            <p className="text-lg font-bold text-red-400">{formatCurrency(remainingBalance)}</p>
          </div>
        </div>

        {customer && customer.accountBalance && customer.accountBalance > 0 && (
          <div className="mb-3 rounded-lg border border-green-700 bg-green-900/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-green-400" />
                <span className="text-sm text-green-300">Customer has available credit</span>
              </div>
              <span className="text-sm font-bold text-green-400">
                {formatCurrency(customer.accountBalance)}
              </span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-300">Select Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.filter(pm => {
              if (pm.method === 'store_credit') {
                return customer && customer.accountBalance && customer.accountBalance > 0;
              }
              return true;
            }).map(pm => (
              <button
                key={pm.method}
                onClick={() => setSelectedMethod(pm.method)}
                className={`rounded-lg border-2 p-3 transition-all ${
                  selectedMethod === pm.method
                    ? 'border-indigo-500 bg-indigo-900/30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <pm.icon className={pm.color} size={20} />
                  <span className="text-sm font-medium text-white">{pm.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedMethod && remainingBalance > 0 && (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-300">Enter Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 rounded-lg bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddPayment}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700"
              >
                <Plus size={18} />
                Add
              </button>
            </div>
            {selectedMethod === 'store_credit' && customer && (
              <p className="mt-1 text-xs text-yellow-400">
                Available Credit: {formatCurrency(customer.accountBalance || 0)}
              </p>
            )}
          </div>
        )}

        {payments.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-300">Payment Breakdown</h3>
            <div className="space-y-2">
              {payments.map((payment, index) => {
                const paymentMeta = PAYMENT_METHODS.find(p => p.method === payment.method);
                if (!paymentMeta) return null;

                return (
                  <div key={index} className="flex items-center justify-between rounded-lg bg-gray-700 p-3">
                    <div className="flex items-center gap-2">
                      <paymentMeta.icon className={paymentMeta.color} size={18} />
                      <span className="text-sm text-white">{paymentMeta.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{formatCurrency(payment.amount)}</span>
                      <button
                        onClick={() => handleRemovePayment(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {remainingBalance > 0 && allowPartialPayments && payments.length > 0 && (
          <div className="mb-4 rounded-lg border border-yellow-700 bg-yellow-900/30 p-3">
            <p className="text-xs text-yellow-300">
              Partial payment: {formatCurrency(remainingBalance)} will remain as outstanding balance.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-gray-600"
            disabled={isSubmitting || payments.length === 0}
          >
            {isSubmitting
              ? 'Processing...'
              : remainingBalance > 0 && allowPartialPayments
                ? `Record Partial Payment (${formatCurrency(totalPaid)})`
                : `Complete Payment (${formatCurrency(totalPaid)})`}
          </button>
        </div>
      </div>
    </div>
  );
}
