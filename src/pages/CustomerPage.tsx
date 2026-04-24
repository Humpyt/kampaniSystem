import React, { useState, useRef, useEffect, useMemo } from 'react';
import { API_ENDPOINTS } from '../config/api';
import {
  Search, Plus, Filter, Download, Phone, Mail,
  MapPin, Package, DollarSign, Calendar, Star,
  ChevronDown, Edit2, Trash2, Upload, X, AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { format, differenceInDays } from 'date-fns';
import type { Customer, Transaction, Operation } from '../types';
import { useCustomer } from '../contexts/CustomerContext';
import { useOperation } from '../contexts/OperationContext';
import { useAuthStore } from '../store/authStore';
import { AddCreditModal } from '../components/AddCreditModal';
import { PaymentModal } from '../components/PaymentModal';
import CustomerSummaryCards from '../components/customers/CustomerSummaryCards';
import CustomerListRow from '../components/customers/CustomerListRow';
import CustomerFilters from '../components/customers/CustomerFilters';

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface Alert {
  id: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
}

interface CustomerEvaluation {
  totalRevenue: number;
  visitFrequency: number;
  lastVisit: string;
  rank: number;
  totalCustomers: number;
}

export default function CustomerPage() {
  const {
    customers,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    loading,
    error
  } = useCustomer();
  const { operations } = useOperation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAddCreditModalOpen, setIsAddCreditModalOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [unpaidOperations, setUnpaidOperations] = useState<any[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOperationForPayment, setSelectedOperationForPayment] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<CustomerEvaluation | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 3;

  // Compute total earned from credit transactions
  const totalEarned = useMemo(() => {
    return creditTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [creditTransactions]);
  
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomers({ limit: 10000 });
  }, [fetchCustomers]);

  const validateForm = (data: CustomerFormData) => {
    const errors: { name?: string; phone?: string } = {};
    
    if (!data.name || data.name.trim() === '') {
      errors.name = 'Name is required';
    }
    
    if (!data.phone || data.phone.trim() === '') {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(data.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    return errors;
  };

  const handleAddNewCustomer = async (formData: CustomerFormData) => {
    const errors = validateForm(formData);
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      await addCustomer({
        ...formData,
        totalOrders: 0,
        totalSpent: 0,
        lastVisit: new Date().toISOString(),
        loyaltyPoints: 0,
        status: 'active'
      });
      setShowEditModal(false);
      setFormErrors({});
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
    } catch (err) {
      console.error('Failed to add customer:', err);
    }
  };

  const handleEditCustomer = async (formData: CustomerFormData) => {
    const errors = validateForm(formData);
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, formData);
        setShowEditModal(false);
        setFormErrors({});
        setFormData({
          name: '',
          phone: '',
          email: '',
          address: '',
          notes: ''
        });
      }
    } catch (err) {
      console.error('Failed to update customer:', err);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomer) {
      handleEditCustomer(formData);
    } else {
      handleAddNewCustomer(formData);
    }
  };

  const handleAddClick = () => {
    setSelectedCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedCustomer) {
      try {
        await deleteCustomer(selectedCustomer.id);
        setSelectedCustomer(null);
        setShowCustomerDetails(false);
        setShowDeleteConfirm(false);
      } catch (err) {
        // Error is handled by the context
        console.error('Failed to delete customer:', err);
      }
    }
  };

  // Calculate customer evaluation when selected customer changes
  useEffect(() => {
    if (selectedCustomer) {
      // Get customer's operations/transactions
      const customerOperations = operations.filter(
        op => op.customer?.id === selectedCustomer.id
      );

      // Convert operations to transactions
      const customerTransactions = customerOperations.map(op => ({
        id: op.id,
        type: 'payment',
        amount: op.totalAmount,
        date: op.createdAt,
        description: op.shoes.map(shoe =>
          `${shoe.category} - ${shoe.services.map(s => s.name).join(', ')}`
        ).join('; ')
      }));

      setTransactions(customerTransactions);

      // Set alerts based on customer notes
      const alerts: Alert[] = [];
      if (selectedCustomer.notes) {
        alerts.push({
          id: '1',
          message: selectedCustomer.notes,
          priority: 'medium',
          timestamp: new Date().toISOString()
        });
      }

      // Pending operations alert
      const pendingOps = customerOperations.filter(op => op.status === 'pending' || op.status === 'in_progress');
      if (pendingOps.length > 0) {
        alerts.push({
          id: '2',
          message: `${pendingOps.length} pending repair(s)`,
          priority: 'high',
          timestamp: new Date().toISOString()
        });
      }

      setAlerts(alerts);
    }
  }, [selectedCustomer?.id]); // Only run when selected customer changes, not when operations array ref changes

  // Fetch credit transactions when customer changes
  useEffect(() => {
    const fetchCreditTransactions = async () => {
      if (selectedCustomer) {
        try {
          const response = await fetch(`${API_ENDPOINTS.customers}/${selectedCustomer.id}/credits`);
          if (response.ok) {
            const credits = await response.json();
            setCreditTransactions(credits);
          } else {
            setCreditTransactions([]);
          }
        } catch (error) {
          console.error('Error fetching credit transactions:', error);
          setCreditTransactions([]);
        }
      }
    };

    fetchCreditTransactions();
  }, [selectedCustomer?.id]);

  // Merge credit transactions with operation transactions
  useEffect(() => {
    if (selectedCustomer) {
      // Get customer's operations
      const customerOperations = operations.filter(
        op => op.customer?.id === selectedCustomer.id
      );

      // Convert credit transactions (only credit additions, not debits)
      const creditTxns = creditTransactions
        .filter(credit => credit.type === 'credit')
        .map(credit => ({
          id: credit.id,
          type: 'credit',
          amount: credit.amount,
          date: credit.created_at,
          description: credit.description || 'Credit added'
        }));

      // Convert operations to transactions
      const operationTxns = customerOperations.map(op => ({
        id: op.id,
        type: 'payment',
        amount: op.totalAmount,
        date: op.createdAt,
        description: op.shoes.map(shoe =>
          `${shoe.category} - ${shoe.services.map(s => s.name).join(', ')}`
        ).join('; ')
      }));

      // Combine and sort by date descending
      const combined = [...creditTxns, ...operationTxns]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setAllTransactions(combined.slice(0, 10)); // Show last 10 transactions
    }
  }, [creditTransactions, operations, selectedCustomer]);

  // Fetch unpaid operations for customer
  useEffect(() => {
    const fetchUnpaidOperations = async () => {
      if (selectedCustomer) {
        try {
          // Fetch all operations
          const response = await fetch(API_ENDPOINTS.operations);
          if (response.ok) {
            const allOps = await response.json();
            // Filter for this customer's unpaid operations
            const unpaid = allOps
              .filter((op: any) =>
                op.customer?.id === selectedCustomer.id &&
                op.totalAmount > (op.paidAmount || 0)
              )
              .sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            setUnpaidOperations(unpaid);
          } else {
            setUnpaidOperations([]);
          }
        } catch (error) {
          console.error('Error fetching unpaid operations:', error);
          setUnpaidOperations([]);
        }
      } else {
        setUnpaidOperations([]);
      }
    };

    fetchUnpaidOperations();
  }, [selectedCustomer?.id]);

  // Get current transactions for pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Filter customers based on search term
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'spent'>('name');
  const [minVisits, setMinVisits] = useState<number>(0);
  const [minSpent, setMinSpent] = useState<number>(0);

  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVisits = customer.totalOrders >= minVisits;
      const matchesSpent = customer.totalSpent >= minSpent;
      return matchesSearch && matchesVisits && matchesSpent;
    })
    .sort((a, b) => {
      switch(sortBy) {
        case 'recent':
          return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
        case 'spent':
          return b.totalSpent - a.totalSpent;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',');
        
        const customers: Customer[] = rows.slice(1).map(row => {
          const values = row.split(',');
          return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: values[0] || '',
            phone: values[1] || '',
            email: values[2] || '',
            address: values[3] || '',
            notes: values[4] || '',
            status: 'active' as const,
            totalOrders: 0,
            totalSpent: 0,
            lastVisit: new Date().toISOString().split('T')[0],
            loyaltyPoints: 0
          };
        });

        customers.forEach(customer => addCustomer(customer));
      };
      reader.readAsText(file);
    }
  };

  const handleEditClick = () => {
    if (selectedCustomer) {
      setFormData({
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        email: selectedCustomer.email,
        address: selectedCustomer.address,
        notes: selectedCustomer.notes
      });
      setShowEditModal(true);
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handlePaymentCompletion = async (payments: Array<{method: string; amount: number}>) => {
    if (!selectedOperationForPayment || !selectedCustomer) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.operations}/${selectedOperationForPayment.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payments }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment failed');
      }

      await response.json();

      // Refresh unpaid operations
      const unpaidResponse = await fetch(API_ENDPOINTS.operations);
      if (unpaidResponse.ok) {
        const allOps = await unpaidResponse.json();
        const unpaid = allOps
          .filter((op: any) =>
            op.customer?.id === selectedCustomer.id &&
            op.totalAmount > (op.paidAmount || 0)
          )
          .sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        setUnpaidOperations(unpaid);
      }

      // Refresh customer list to update totalSpent, totalOrders, accountBalance
      await fetchCustomers();

      setIsPaymentModalOpen(false);
      setSelectedOperationForPayment(null);
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(error instanceof Error ? error.message : 'Failed to process payment');
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-indigo-400">Customer Management</h1>
          <p className="text-gray-400">Manage customer relationships and track repair history</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleAddClick}
            className="flex items-center px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Customer
          </button>
          {isAdmin && (
            <>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImportCSV}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                <Upload className="h-5 w-5 mr-2" />
                Import CSV
              </button>
              <button
                className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                onClick={() => {
                  const csvContent = customers.map(c =>
                    [c.name, c.phone, c.email, c.address, c.totalSpent, c.lastVisit].join(',')
                  ).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'customers.csv';
                  a.click();
                }}
              >
                <Download className="h-5 w-5 mr-2" />
                Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <CustomerSummaryCards customers={filteredCustomers} />

      {/* Filters */}
      <CustomerFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        minVisits={minVisits}
        onMinVisitsChange={setMinVisits}
        minSpent={minSpent}
        onMinSpentChange={setMinSpent}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="col-span-2 bg-gray-800 rounded-xl border border-gray-700 max-h-[calc(100vh-340px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 p-4 text-center">
              {error}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-gray-400 p-4 text-center">
              {searchTerm || minVisits > 0 || minSpent > 0
                ? 'No customers match your filters'
                : 'No customers yet'}
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filteredCustomers.map((customer) => (
                <CustomerListRow
                  key={customer.id}
                  customer={customer}
                  isSelected={selectedCustomer?.id === customer.id}
                  onClick={() => handleCustomerClick(customer)}
                  onEdit={() => {
                    setSelectedCustomer(customer);
                    setFormData({
                      name: customer.name,
                      phone: customer.phone,
                      email: customer.email || '',
                      address: customer.address || '',
                      notes: customer.notes || ''
                    });
                    setShowEditModal(true);
                  }}
                  onDelete={() => {
                    setSelectedCustomer(customer);
                    setShowDeleteConfirm(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Customer Details */}
        {selectedCustomer && showCustomerDetails ? (
          <div className="bg-gray-900 rounded-xl p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            <div className="flex justify-between items-start mb-6 flex-shrink-0">
              <h2 className="text-xl font-bold">Customer Details</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handleEditClick}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 hover:bg-red-600 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsAddCreditModalOpen(true)}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-1"
                >
                  <DollarSign size={16} />
                  Add Credit
                </button>
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto">
              {/* Customer Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm">Total Spent</div>
                  <div className="text-xl font-bold text-indigo-400">
                    {formatCurrency(selectedCustomer.totalSpent)}
                  </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm">Total Visits</div>
                  <div className="text-xl font-bold text-indigo-400">
                    {selectedCustomer.totalOrders}
                  </div>
                </div>

                {/* Store Credit */}
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                  <div className="text-green-300 text-sm font-semibold">Store Credit</div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(selectedCustomer.accountBalance || 0)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Available to spend now</div>
                  <div className="mt-3 pt-3 border-t border-green-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-green-300 text-xs">Total Earned</span>
                      <span className="text-green-400 text-sm font-bold">{formatCurrency(totalEarned)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">Used / Redeemed</span>
                      <span className="text-gray-400 text-sm font-bold">{formatCurrency(totalEarned - (selectedCustomer.accountBalance || 0))}</span>
                    </div>
                  </div>
                </div>

                {/* Outstanding Debt */}
                {(() => {
                  const totalDebt = unpaidOperations.reduce(
                    (sum, op) => sum + (op.totalAmount - (op.paidAmount || 0)),
                    0
                  );
                  if (totalDebt === 0) return null;

                  return (
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                      <div className="text-red-300 text-sm">Outstanding Debt</div>
                      <div className="text-2xl font-bold text-red-400">
                        {formatCurrency(totalDebt)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Total unpaid balance</div>
                    </div>
                  );
                })()}
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <Phone className="h-5 w-5 mr-3" />
                  {selectedCustomer.phone}
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center text-gray-300">
                    <Mail className="h-5 w-5 mr-3" />
                    {selectedCustomer.email}
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-center text-gray-300">
                    <MapPin className="h-5 w-5 mr-3" />
                    {selectedCustomer.address}
                  </div>
                )}
              </div>

              {/* Recent Transactions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-indigo-400">Recent Transactions</h3>
                {allTransactions.length > 0 ? (
                  allTransactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className="bg-gray-800 p-4 rounded-lg space-y-2"
                    >
                      {/* Transaction Type Badge */}
                      <div className="flex items-center gap-2 mb-1">
                        {transaction.type === 'credit' && (
                          <span className="px-2 py-1 text-xs bg-green-900/50 text-green-400 rounded-full">
                            + Credit Added
                          </span>
                        )}
                        {transaction.type === 'debit' && (
                          <span className="px-2 py-1 text-xs bg-orange-900/50 text-orange-400 rounded-full">
                            - Credit Used
                          </span>
                        )}
                        {transaction.type === 'payment' && (
                          <span className="px-2 py-1 text-xs bg-blue-900/50 text-blue-400 rounded-full">
                            Service Payment
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-300">{transaction.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-400">
                            {format(new Date(transaction.date), 'MMM d, yyyy')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(transaction.date), 'h:mm a')}
                          </span>
                        </div>
                        <span className={`text-lg font-semibold ${
                          transaction.type === 'credit'
                            ? 'text-green-400'
                            : transaction.type === 'debit'
                            ? 'text-orange-400'
                            : 'text-blue-400'
                        }`}>
                          {transaction.type === 'debit' ? '-' : ''}
                          {transaction.type === 'credit' ? '+' : ''}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-800 p-6 rounded-lg text-center text-gray-400">
                    <p>No transactions yet</p>
                  </div>
                )}
              </div>

              {/* Outstanding Debts Section */}
              {unpaidOperations.length > 0 && (
                <div id="outstanding-balances" className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                    <AlertCircle size={20} />
                    Outstanding Balances
                  </h3>
                  <div className="space-y-3">
                    {unpaidOperations.map((op) => {
                      const balance = op.totalAmount - (op.paidAmount || 0);
                      const paidPercent = Math.round(((op.paidAmount || 0) / op.totalAmount) * 100);

                      return (
                        <div
                          key={op.id}
                          className="bg-gray-800 p-4 rounded-lg border border-red-900/50"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="text-white font-medium mb-1">
                                Ticket #{op.id.slice(-6)}
                              </p>
                              <p className="text-sm text-gray-400 mb-2">
                                {op.shoes?.map((shoe: any) =>
                                  shoe.description || shoe.category
                                ).join(', ') || 'Services'}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar size={12} />
                                <span>
                                  {format(new Date(op.createdAt), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-red-400">
                                {formatCurrency(balance)}
                              </p>
                              <p className="text-xs text-gray-400">
                                of {formatCurrency(op.totalAmount)}
                              </p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Paid</span>
                              <span>{paidPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${paidPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedOperationForPayment(op);
                                setIsPaymentModalOpen(true);
                              }}
                              className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                            >
                              Record Payment
                            </button>
                            <button
                              onClick={() => {
                                window.location.href = `/operations/details/${op.id}`;
                              }}
                              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Customer Notes */}
              {selectedCustomer.notes && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-indigo-400 mb-2">Notes</h3>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-300">{selectedCustomer.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl p-6 flex items-center justify-center text-gray-400">
            Select a customer to view details
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setFormErrors({});
                  setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                    notes: ''
                  });
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                    formErrors.name ? 'border border-red-500' : ''
                  }`}
                  placeholder="Enter customer name"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                    formErrors.phone ? 'border border-red-500' : ''
                  }`}
                  placeholder="Enter phone number"
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Enter any additional notes"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setFormErrors({});
                    setFormData({
                      name: '',
                      phone: '',
                      email: '',
                      address: '',
                      notes: ''
                    });
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200"
                >
                  {selectedCustomer ? 'Save Changes' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Delete Customer</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete {selectedCustomer?.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Credit Modal */}
      <AddCreditModal
        isOpen={isAddCreditModalOpen}
        onClose={() => setIsAddCreditModalOpen(false)}
        customer={selectedCustomer}
        outstandingBalance={unpaidOperations.reduce((sum, op) => sum + (op.totalAmount - (op.paidAmount || 0)), 0)}
        onAddCredit={async (amount, description) => {
          const response = await fetch(`${API_ENDPOINTS.customers}/${selectedCustomer?.id}/credits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              description,
              createdBy: 'system'
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add credit');
          }

          // Auto-apply credit to outstanding debts
          try {
            const autoPayResponse = await fetch(`${API_ENDPOINTS.customers}/${selectedCustomer?.id}/apply-credit-to-debts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });

            if (autoPayResponse.ok) {
              const autoPayResult = await autoPayResponse.json();
              if (autoPayResult.paymentsMade && autoPayResult.paymentsMade.length > 0) {
                const debtCount = autoPayResult.paymentsMade.length;
                const remainingCredit = autoPayResult.remainingCredit;
                alert(
                  `Credit added successfully!\n\n` +
                  `Automatically applied to ${debtCount} outstanding debt${debtCount > 1 ? 's' : ''}.\n` +
                  (remainingCredit > 0 ? `Remaining credit: ${formatCurrency(remainingCredit)}` : '')
                );
              } else if (autoPayResult.message === 'No outstanding debts') {
                alert(`Credit added successfully!\n\nNo outstanding debts to pay off.`);
              }
            }
          } catch (error) {
            console.error('Error auto-applying credit:', error);
            // Don't fail credit addition if auto-pay fails
            alert('Credit added successfully!');
          }

          // Refresh customers list
          window.location.reload();
        }}
      />

      {/* Payment Modal for Outstanding Balances */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedOperationForPayment(null);
        }}
        totalAmount={selectedOperationForPayment?.totalAmount - (selectedOperationForPayment?.paidAmount || 0) || 0}
        customer={selectedCustomer}
        onComplete={handlePaymentCompletion}
      />
    </div>
  );
}
