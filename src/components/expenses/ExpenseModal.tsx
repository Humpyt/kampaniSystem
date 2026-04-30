import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type {
  CreateExpenseInput,
  Expense,
  ExpenseLineItemInput,
  UpdateExpenseInput,
} from '../../types/expense';
import { EXPENSE_CATEGORIES, EXPENSE_STATUSES, PAYMENT_METHODS } from '../../types/expense';
import { formatCurrency } from '../../utils/formatCurrency';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateExpenseInput | UpdateExpenseInput) => Promise<void>;
  expense?: Expense | null;
  mode?: 'create' | 'edit';
}

interface ExpenseFormState {
  title: string;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod: string;
  vendor: string;
  notes: string;
  lineItems: ExpenseLineItemInput[];
}

const createEmptyLineItem = (): ExpenseLineItemInput => ({
  title: '',
  category: EXPENSE_CATEGORIES[0],
  amount: 0,
  notes: '',
});

const toToday = () => new Date().toISOString().split('T')[0];

const getInitialState = (expense?: Expense | null): ExpenseFormState => {
  if (!expense) {
    return {
      title: '',
      date: toToday(),
      status: 'pending',
      paymentMethod: '',
      vendor: '',
      notes: '',
      lineItems: [createEmptyLineItem()],
    };
  }

  return {
    title: expense.title || '',
    date: expense.date ? expense.date.split('T')[0] : toToday(),
    status: expense.status || 'pending',
    paymentMethod: expense.paymentMethod || '',
    vendor: expense.vendor || '',
    notes: expense.notes || '',
    lineItems: expense.lineItems?.length
      ? expense.lineItems.map((item) => ({
          id: item.id,
          title: item.title || '',
          category: item.category || EXPENSE_CATEGORIES[0],
          amount: Number(item.amount) || 0,
          notes: item.notes || '',
        }))
      : [
          {
            title: expense.title || '',
            category: expense.category || EXPENSE_CATEGORIES[0],
            amount: Number(expense.amount) || 0,
            notes: expense.notes || '',
          },
        ],
  };
};

export function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  expense = null,
  mode = 'create',
}: ExpenseModalProps) {
  const [form, setForm] = useState<ExpenseFormState>(() => getInitialState(expense));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(getInitialState(expense));
    setSaving(false);
    setError(null);
  }, [expense, isOpen]);

  const totalAmount = useMemo(
    () => form.lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [form.lineItems]
  );

  const updateField = <K extends keyof ExpenseFormState>(field: K, value: ExpenseFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateLineItem = (index: number, patch: Partial<ExpenseLineItemInput>) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const addLineItem = () => {
    setForm((prev) => ({ ...prev, lineItems: [...prev.lineItems, createEmptyLineItem()] }));
  };

  const removeLineItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanedLineItems = form.lineItems
      .map((item) => ({
        id: item.id,
        title: (item.title || '').trim(),
        category: item.category,
        amount: Number(item.amount),
        notes: item.notes?.trim() || undefined,
      }))
      .filter((item) => item.title || item.amount || item.notes);

    if (cleanedLineItems.length === 0) {
      setError('Add at least one line item.');
      return;
    }

    const invalidItem = cleanedLineItems.find(
      (item) => !item.title || !item.category || !Number.isFinite(item.amount) || item.amount <= 0
    );
    if (invalidItem) {
      setError('Each line item needs title, category, and amount greater than 0.');
      return;
    }

    const fallbackTitle =
      cleanedLineItems.length === 1 ? cleanedLineItems[0].title : `${cleanedLineItems.length} expense items`;

    const payload: CreateExpenseInput | UpdateExpenseInput = {
      title: (form.title || '').trim() || fallbackTitle,
      date: form.date || toToday(),
      status: form.status,
      paymentMethod: form.paymentMethod || undefined,
      vendor: (form.vendor || '').trim() || undefined,
      notes: (form.notes || '').trim() || undefined,
      lineItems: cleanedLineItems,
    };

    try {
      setSaving(true);
      setError(null);
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
      <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">
            {mode === 'edit' ? 'Edit Expense' : 'Quick Add Expense'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[88vh] overflow-y-auto">
          <div className="space-y-4 p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-1">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="md:col-span-1">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value as ExpenseFormState['status'])}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                >
                  {EXPENSE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => updateField('paymentMethod', e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Select method</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Vendor</label>
                <input
                  value={form.vendor}
                  onChange={(e) => updateField('vendor', e.target.value)}
                  placeholder="Vendor (optional)"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Summary Title</label>
                <input
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Optional summary title"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
                placeholder="Notes (optional)"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-700">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr className="border-b border-gray-700">
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Item</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Category</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Amount</th>
                    <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {form.lineItems.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-gray-700 last:border-b-0">
                      <td className="px-3 py-2">
                        <input
                          value={item.title}
                          onChange={(e) => updateLineItem(index, { title: e.target.value })}
                          placeholder="Expense item"
                          className="w-full rounded-md border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.category}
                          onChange={(e) => updateLineItem(index, { category: e.target.value })}
                          className="w-full rounded-md border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                        >
                          {EXPENSE_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.amount || ''}
                          onChange={(e) => updateLineItem(index, { amount: Number(e.target.value) })}
                          placeholder="0"
                          className="w-full rounded-md border border-gray-700 bg-gray-900 px-2 py-1.5 text-right text-sm text-white outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          disabled={form.lineItems.length === 1}
                          className="inline-flex rounded-md p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-rose-300 disabled:opacity-40"
                          aria-label="Remove line item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              <Plus size={14} />
              Add Item
            </button>

            {error && (
              <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-700 px-4 py-3">
            <p className="text-sm text-gray-300">Total: {formatCurrency(totalAmount)}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
              >
                {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Expense'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
