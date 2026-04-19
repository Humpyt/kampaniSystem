import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Users, Clock, History, Plus, X, Search } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { AddCreditModal } from '../components/AddCreditModal';
import { useAuthStore } from '../store/authStore';

interface CustomerCredit {
  id: string;
  name: string;
  phone: string;
  accountBalance: number;
  lastTransaction?: string;
}

interface CreditTransaction {
  id: string;
  customer_id: string;
  amount: number;
  balance_after: number;
  type: 'credit' | 'debit';
  description: string;
  created_by?: string;
  created_at: string;
}

const API_URL = '/api';

export default function CreditListPage() {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<CustomerCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCredit | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Fetch customers with credit (positive account_balance)
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/customers`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const result = await response.json();

      // Handle paginated response format
      const customersData = Array.isArray(result) ? result : (result.data || []);

      // Transform and filter customers with positive balance
      const credits: CustomerCredit[] = customersData
        .filter((c: any) => c.account_balance && c.account_balance > 0)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone || '',
          accountBalance: c.account_balance || 0,
          lastTransaction: c.updated_at || c.created_at,
        }))
        .sort((a: CustomerCredit, b: CustomerCredit) => b.accountBalance - a.accountBalance);

      setCustomers(credits);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch credit transactions for a customer
  const fetchCreditTransactions = async (customerId: string) => {
    try {
      setLoadingTransactions(true);
      const response = await fetch(`${API_URL}/customers/${customerId}/credits`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Handle view history button click
  const handleViewHistory = (customer: CustomerCredit) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
    fetchCreditTransactions(customer.id);
  };

  // Handle add credit
  const handleAddCredit = async (amount: number, description: string) => {
    if (!selectedCustomer) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/customers/${selectedCustomer.id}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          amount,
          description,
          createdBy: user?.name || 'System'
        })
      });

      if (!response.ok) throw new Error('Failed to add credit');

      // Refresh data
      await fetchCreditTransactions(selectedCustomer.id);
      await fetchCustomers();

      // Update selected customer balance
      const updated = customers.find(c => c.id === selectedCustomer.id);
      if (updated) {
        setSelectedCustomer({ ...updated, accountBalance: updated.accountBalance + amount });
      }
    } catch (error) {
      console.error('Error adding credit:', error);
      throw error;
    }
  };

  // Calculate metrics
  const totalCreditOutstanding = customers.reduce((sum, c) => sum + c.accountBalance, 0);
  const customersWithCredit = customers.length;
  const averageCreditPerCustomer = customersWithCredit > 0 ? totalCreditOutstanding / customersWithCredit : 0;

  // Recent credits (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentCredits = transactions.filter(t =>
    t.type === 'credit' && new Date(t.created_at) >= sevenDaysAgo
  ).reduce((sum, t) => sum + t.amount, 0);

  // Filter customers by search term
  const filteredCustomers = customers.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term)
    );
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-UG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Customer Credits</h1>
            <p className="text-gray-400">Manage customer account balances and credit history</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Credit Outstanding</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalCreditOutstanding)}</p>
              </div>
              <div className="bg-green-900/50 p-3 rounded-lg">
                <DollarSign className="text-green-400" size={24} />
              </div>
            </div>
          </div>

          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Customers with Credit</p>
                <p className="text-2xl font-bold text-white">{customersWithCredit}</p>
              </div>
              <div className="bg-blue-900/50 p-3 rounded-lg">
                <Users className="text-blue-400" size={24} />
              </div>
            </div>
          </div>

          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Credit per Customer</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(averageCreditPerCustomer)}</p>
              </div>
              <div className="bg-purple-900/50 p-3 rounded-lg">
                <CreditCard className="text-purple-400" size={24} />
              </div>
            </div>
          </div>

          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Recent Credits (7 days)</p>
                <p className="text-2xl font-bold text-cyan-400">{formatCurrency(recentCredits)}</p>
              </div>
              <div className="bg-cyan-900/50 p-3 rounded-lg">
                <Clock className="text-cyan-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Credits Table */}
        <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-400">Loading customer credits...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="text-gray-400" size={40} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Credits Found</h3>
              <p className="text-gray-400">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'No customers have account credit at this time'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Customer Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Phone</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Current Balance</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Last Transaction</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-750/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Users className="text-gray-400 mr-2" size={16} />
                          <span className="text-sm text-white font-medium">
                            {customer.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300">
                          {customer.phone || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-bold text-green-400">
                          {formatCurrency(customer.accountBalance)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Clock className="text-gray-400 mr-2" size={16} />
                          <span className="text-sm text-gray-300">
                            {customer.lastTransaction ? formatDate(customer.lastTransaction) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewHistory(customer)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-900/50 hover:bg-indigo-800/50 text-indigo-400 hover:text-indigo-300 rounded-lg text-sm font-medium transition-colors"
                        >
                          <History size={16} />
                          View History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Credit History Modal */}
      {showHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="text-indigo-400" size={24} />
                  Credit History
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedCustomer.name} - Current Balance: {formatCurrency(selectedCustomer.accountBalance)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCustomer(selectedCustomer);
                    setShowAddCreditModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={16} />
                  Add Credit
                </button>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedCustomer(null);
                    setTransactions([]);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              {loadingTransactions ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No credit transactions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`p-3 rounded-lg border ${
                        transaction.type === 'credit'
                          ? 'bg-green-900/20 border-green-800'
                          : 'bg-red-900/20 border-red-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${
                              transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {transaction.type === 'credit' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              transaction.type === 'credit'
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-red-900/50 text-red-300'
                            }`}>
                              {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mt-1">
                            {transaction.description || 'No description'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {transaction.created_by && `By: ${transaction.created_by} | `}
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Balance After</p>
                          <p className="text-sm font-medium text-white">
                            {formatCurrency(transaction.balance_after)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Credit Modal */}
      <AddCreditModal
        isOpen={showAddCreditModal}
        onClose={() => setShowAddCreditModal(false)}
        customer={selectedCustomer ? {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
          accountBalance: selectedCustomer.accountBalance
        } : null}
        onAddCredit={handleAddCredit}
      />
    </div>
  );
}
