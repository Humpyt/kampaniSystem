import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Plus, Trash2, X } from 'lucide-react';
import {
  CreateExpenseInput,
  Expense,
  ExpenseLineItemInput,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  PAYMENT_METHODS,
  UpdateExpenseInput
} from '../../types/expense';
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
  notes: ''
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
      lineItems: [createEmptyLineItem()]
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
          notes: item.notes || ''
        }))
      : [
          {
            title: expense.title || '',
            category: expense.category || EXPENSE_CATEGORIES[0],
            amount: Number(expense.amount) || 0,
            notes: expense.notes || ''
          }
        ]
  };
};

export function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  expense = null,
  mode = 'create'
}: ExpenseModalProps) {
  const [form, setForm] = useState<ExpenseFormState>(() => getInitialState(expense));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setForm(getInitialState(expense));
    setSaving(false);
    setError(null);
    setShowDetails(Boolean(expense?.vendor || expense?.paymentMethod || expense?.notes));
  }, [expense, isOpen]);

  const updateField = <K extends keyof ExpenseFormState>(field: K, value: ExpenseFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateLineItem = (index: number, patch: Partial<ExpenseLineItemInput>) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => (i === index ? { ...item, ...patch } : item))
    }));
  };

  const addLineItem = () => {
    setForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, createEmptyLineItem()]
    }));
  };

  const removeLineItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const totalAmount = useMemo(
    () => form.lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [form.lineItems]
  );

  const usedCategories = useMemo(() => {
    const seen = new Set<string>();
    return form.lineItems
      .map((item) => item.category)
      .filter((category) => {
        if (!category || seen.has(category)) return false;
        seen.add(category);
        return true;
      });
  }, [form.lineItems]);

  const applyQuickCategory = (category: string) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, index) =>
        index === prev.lineItems.length - 1 ? { ...item, category } : item
      )
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanedLineItems = form.lineItems
      .map((item) => ({
        id: item.id,
        title: item.title.trim(),
        category: item.category,
        amount: Number(item.amount),
        notes: item.notes?.trim() || undefined
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
      setError('Each line item needs a title, category, and amount greater than 0.');
      return;
    }

    const fallbackTitle = cleanedLineItems.length === 1
      ? cleanedLineItems[0].title
      : `${cleanedLineItems.length} expense items`;

    const payload: CreateExpenseInput | UpdateExpenseInput = {
      title: form.title.trim() || fallbackTitle,
      date: form.date || toToday(),
      status: form.status,
      paymentMethod: form.paymentMethod || undefined,
      vendor: form.vendor.trim() || undefined,
      notes: form.notes.trim() || undefined,
      lineItems: cleanedLineItems
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 p-3 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3 md:px-5">
          <div>
            <h2 className="text-lg font-semibold text-white">{mode === 'edit' ? 'Edit expense' : 'Quick add expense'}</h2>
            <p className="text-xs text-gray-400">Start with items first. Everything else is optional.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[88vh] overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-gray-700 bg-gray-900/95 px-4 py-3 backdrop-blur md:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300">
                <Check size={13} />
                {form.lineItems.length} {form.lineItems.length === 1 ? 'item' : 'items'}
              </div>
              <p className="text-xl font-semibold text-white">{formatCurrency(totalAmount)}</p>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 md:px-5">
            <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Quick categories</p>
                <span className="text-[11px] text-gray-500">Applies to last row</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[...usedCategories, ...EXPENSE_CATEGORIES].slice(0, 8).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => applyQuickCategory(category)}
                    className="rounded-full border border-gray-600 px-3 py-1.5 text-xs text-gray-300 transition hover:border-indigo-400 hover:text-white"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {form.lineItems.map((item, index) => (
                <div key={item.id || index} className="rounded-xl border border-gray-700 bg-gray-800/50 p-3">
                  <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_0.8fr_auto]">
                    <input
                      value={item.title}
                      onChange={(e) => updateLineItem(index, { title: e.target.value })}
                      placeholder="What did you pay for?"
                      className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500"
                    />
                    <select
                      value={item.category}
                      onChange={(e) => updateLineItem(index, { category: e.target.value })}
                      className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500"
                    >
                      {EXPENSE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.amount || ''}
                      onChange={(e) => updateLineItem(index, { amount: Number(e.target.value) })}
                      placeholder="Amount"
                      className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      disabled={form.lineItems.length === 1}
                      className="rounded-lg border border-gray-700 px-2.5 py-2 text-gray-400 transition hover:border-rose-400/50 hover:text-rose-300 disabled:opacity-35"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addLineItem}
                className="mt-1 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
              >
                <Plus size={14} />
                Add another item
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="inline-flex items-center gap-2 text-sm text-gray-300 transition hover:text-white"
            >
              <ChevronsUpDown size={14} />
              {showDetails ? 'Hide extra details' : 'Add extra details'}
            </button>

            {showDetails && (
              <div className="grid gap-3 rounded-xl border border-gray-700 bg-gray-800/50 p-3 md:grid-cols-2">
                <input
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Optional summary title"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500"
                />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500"
                />
                <select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value as ExpenseFormState['status'])}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500"
                >
                  {EXPENSE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => updateField('paymentMethod', e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500"
                >
                  <option value="">Payment method</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <input
                  value={form.vendor}
                  onChange={(e) => updateField('vendor', e.target.value)}
                  placeholder="Vendor (optional)"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500 md:col-span-2"
                />
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={2}
                  placeholder="Notes (optional)"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500 md:col-span-2"
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-700 px-4 py-3 md:px-5">
            <p className="text-xs text-gray-500">Total: {formatCurrency(totalAmount)}</p>
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
                {saving ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Save expense'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
