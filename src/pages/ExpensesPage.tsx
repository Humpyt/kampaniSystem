import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Edit, Plus, Search, Trash2, Wallet } from 'lucide-react';
import { useExpenses } from '../contexts/ExpenseContext';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { formatCurrency } from '../utils/formatCurrency';
import { CreateExpenseInput, UpdateExpenseInput } from '../types/expense';
import { useAuthStore } from '../store/authStore';

const ExpensesPage: React.FC = () => {
  const {
    expenses,
    loading,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses();
  const { user } = useAuthStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const visibleExpenses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return expenses;

    return expenses.filter((exp) => {
      const haystack = [
        exp.title,
        exp.category,
        exp.vendor,
        exp.paymentMethod,
        exp.createdByName,
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');
      return haystack.includes(query);
    });
  }, [expenses, searchTerm]);

  const totalVisible = useMemo(
    () => visibleExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0),
    [visibleExpenses]
  );

  const handleSaveExpense = async (data: CreateExpenseInput | UpdateExpenseInput) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, data as UpdateExpenseInput);
    } else {
      await addExpense({ ...data, createdBy: user?.id } as CreateExpenseInput);
    }
    await fetchExpenses();
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await deleteExpense(id);
    await fetchExpenses();
  };

  const openCreateModal = () => {
    setEditingExpense(null);
    setModalOpen(true);
  };

  const openEditModal = (expense: any) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-gray-400">Track and manage expense records.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 rounded-lg bg-gray-800 px-3 py-2 text-gray-400">
            <Wallet className="h-4 w-4" />
            <span className="text-sm">{visibleExpenses.length}</span>
            <span className="text-sm text-white">{formatCurrency(totalVisible)}</span>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-500"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      <div className="card-bevel mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title, category, vendor, payment method..."
            className="w-full rounded-lg border border-gray-600 bg-gray-700 py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="card-bevel overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-800/80 backdrop-blur-sm">
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Category</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Amount</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Vendor</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">Loading expenses...</td>
                </tr>
              ) : visibleExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No expenses found.</td>
                </tr>
              ) : (
                visibleExpenses.map((expense, index) => (
                  <tr
                    key={expense.id}
                    className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} border-b border-gray-700 hover:bg-gray-700 transition-colors`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-300">{format(new Date(expense.date), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 text-sm font-medium text-white">{expense.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{expense.category}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-white">{formatCurrency(expense.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        expense.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : expense.status === 'overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{expense.vendor || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                          aria-label="Edit expense"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="rounded-md p-1.5 text-rose-400 transition-colors hover:bg-gray-700 hover:text-rose-300"
                          aria-label="Delete expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        expense={editingExpense}
        mode={editingExpense ? 'edit' : 'create'}
      />
    </div>
  );
};

export default ExpensesPage;
