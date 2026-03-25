import React, { useState } from 'react';
import { DollarSign, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

interface AddCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    accountBalance?: number;
  } | null;
  outstandingBalance?: number;
  onAddCredit: (amount: number, description: string) => Promise<void>;
}

export function AddCreditModal({ isOpen, onClose, customer, outstandingBalance = 0, onAddCredit }: AddCreditModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const creditAmount = parseInt(amount);
    if (!creditAmount || creditAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddCredit(creditAmount, description || 'Credit added');
      setAmount('');
      setDescription('');
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to add credit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="text-green-400" size={24} />
            Add Credit to Account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-300">Customer: <span className="font-semibold text-white">{customer.name}</span></p>
          <p className="text-sm text-gray-300">Current Balance: <span className="font-bold text-green-400">{formatCurrency(customer.accountBalance || 0)}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Credit Amount (UGX)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 50000"
              className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Pre-payment for repair"
              className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          {outstandingBalance > 0 && (
            <div className="mb-4 bg-blue-900/30 border border-blue-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <DollarSign size={16} className="text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-300">
                    Customer has outstanding balance: {formatCurrency(outstandingBalance)}
                  </p>
                  <p className="text-xs text-blue-400 mt-1">
                    💡 Credit will be automatically applied to unpaid debts, oldest first.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
            <p className="text-xs text-blue-300">
              💡 After adding credit: New Balance = {formatCurrency((customer.accountBalance || 0) + (parseInt(amount) || 0))}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Credit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
