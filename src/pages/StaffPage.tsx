import React, { useState, useEffect } from 'react';
import { Grid, List, Plus, Receipt, Package, Calendar, TrendingUp, Wallet } from 'lucide-react';
import Staff from '../components/Staff';
import { useExpenses } from '../contexts/ExpenseContext';
import { useAuthStore } from '../store/authStore';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { formatCurrency } from '../utils/formatCurrency';
import { format } from 'date-fns';
import { CreateExpenseInput, UpdateExpenseInput } from '../types/expense';

const StaffPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'staff' | 'expenses'>('staff');
  const { expenses, addExpense, fetchExpenses, fetchAnalytics, pagination, loadMoreExpenses, loading } = useExpenses();
  const { user } = useAuthStore();
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'expenses') {
      fetchExpenses();
      fetchAnalytics();
    }
  }, [activeTab, fetchExpenses, fetchAnalytics]);

  const getCategoryIcon = (category: string) => {
    if (category.includes('Supplies') || category.includes('Materials')) return <Package size={14} />;
    if (category.includes('Rent') || category.includes('Utilities')) return <Calendar size={14} />;
    if (category.includes('Marketing') || category.includes('Advertising')) return <TrendingUp size={14} />;
    if (category.includes('Salaries') || category.includes('Wages')) return <Wallet size={14} />;
    return <Receipt size={14} />;
  };

  const handleSaveExpense = async (data: CreateExpenseInput | UpdateExpenseInput) => {
    await addExpense({ ...data, createdBy: user?.id } as CreateExpenseInput);
    await fetchExpenses();
    await fetchAnalytics();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-indigo-400">Staff Management</h1>
          <p className="text-gray-400">Daily target per staff: $750k</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'staff'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Grid size={14} />
                Staff
              </div>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'expenses'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Receipt size={14} />
                Expenses
              </div>
            </button>
          </div>
          {activeTab === 'staff' && (
            <div className="flex items-center gap-2">
              <button className="p-2 rounded bg-gray-800 hover:bg-gray-700">
                <Grid className="h-5 w-5" />
              </button>
              <button className="p-2 rounded bg-gray-800 hover:bg-gray-700">
                <List className="h-5 w-5" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white">
                <span className="text-xl">+</span>
                Add Staff Member
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'staff' && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 text-gray-400">
            <div>STAFF MEMBER</div>
            <div>ROLE & SPECIALIZATION</div>
            <div>WORKLOAD</div>
            <div>DAILY TARGET PROGRESS</div>
            <div>ACTIONS</div>
          </div>
          <Staff />
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-200">My Expenses</h3>
            <button
              onClick={() => setExpenseModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              <Plus size={16} />
              Add Expense
            </button>
          </div>
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="text-gray-500 mb-2" size={32} />
                <p className="text-gray-400 text-sm">No expenses recorded yet</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-700">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 hover:bg-gray-750/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            exp.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                            exp.status === 'overdue' ? 'bg-rose-500/10 text-rose-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {getCategoryIcon(exp.category)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{exp.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{exp.category}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-gray-500">
                                {format(new Date(exp.date), 'MMM d, yyyy')}
                              </span>
                              <span className="text-gray-600">•</span>
                              <span className="text-[10px] text-gray-500">
                                by {exp.createdByName || 'Unknown'}
                              </span>
                              {exp.vendor && (
                                <>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-[10px] text-gray-500">{exp.vendor}</span>
                                </>
                              )}
                            </div>
                            {exp.notes && (
                              <p className="text-[10px] text-gray-500 mt-1 truncate max-w-xs">{exp.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-sm font-semibold text-white">{formatCurrency(exp.amount)}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            exp.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            exp.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {exp.status}
                          </span>
                          {exp.paymentMethod && (
                            <span className="text-[10px] text-gray-500">{exp.paymentMethod}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Load More Button */}
                {pagination.offset + pagination.limit < pagination.total && (
                  <div className="p-4 border-t border-gray-700 flex justify-center">
                    <button
                      onClick={() => loadMoreExpenses()}
                      disabled={loading}
                      className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : `Load More (${pagination.total - pagination.offset - pagination.limit} remaining)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        mode="create"
      />
    </div>
  );
};

export default StaffPage;
