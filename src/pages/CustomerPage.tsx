import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Plus, Filter, Download, Phone, Mail, 
  MapPin, Package, DollarSign, Calendar, Star,
  ChevronDown, Edit2, Trash2, Upload, X
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { format, differenceInDays } from 'date-fns';
import type { Customer, Transaction, Operation } from '../types';
import { useCustomer } from '../contexts/CustomerContext';
import { useOperation } from '../contexts/OperationContext';

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
    addCustomer, 
    updateCustomer, 
    deleteCustomer,
    loading,
    error 
  } = useCustomer();
  const { operations } = useOperation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [evaluation, setEvaluation] = useState<CustomerEvaluation | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 3;
  
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
  }, [selectedCustomer?.id, operations]);

  // Get current transactions for pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <select 
          className="bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          onChange={(e) => {
            const sortedCustomers = [...customers].sort((a, b) => {
              switch(e.target.value) {
                case 'recent':
                  return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
                case 'spent':
                  return b.totalSpent - a.totalSpent;
                default:
                  return a.name.localeCompare(b.name);
              }
            });
            // Update customers through context
          }}
        >
          <option value="name">Sort by Name</option>
          <option value="recent">Sort by Recent Visit</option>
          <option value="spent">Sort by Total Spent</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="col-span-2 bg-gray-900 rounded-xl p-4 max-h-[calc(100vh-240px)] overflow-y-auto">
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
              {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerClick(customer)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedCustomer?.id === customer.id
                      ? 'bg-indigo-600'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <div className="flex items-center text-gray-400 space-x-4 mt-1">
                        <span className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {customer.phone}
                        </span>
                        {customer.email && (
                          <span className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {customer.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-indigo-400 font-semibold">
                        {formatCurrency(customer.totalSpent)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {customer.lastVisit 
                          ? `${differenceInDays(new Date(), new Date(customer.lastVisit))} days ago`
                          : 'No visits yet'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Details */}
        {selectedCustomer && showCustomerDetails ? (
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex justify-between items-start mb-6">
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
              </div>
            </div>

            <div className="space-y-6">
              {/* Customer Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm">Total Spent</div>
                  <div className="text-xl font-bold text-indigo-400">
                    {formatCurrency(selectedCustomer.totalSpent)}
                  </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm">Orders</div>
                  <div className="text-xl font-bold text-indigo-400">
                    {selectedCustomer.totalOrders}
                  </div>
                </div>
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
                {currentTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="bg-gray-800 p-4 rounded-lg space-y-2"
                  >
                    <p className="text-sm text-gray-300">{transaction.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </span>
                      <span className={`text-lg font-semibold ${
                        transaction.type === 'credit' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {transaction.type === 'credit' ? '-' : ''}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-4">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`px-3 py-1 rounded ${
                          currentPage === i + 1
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
    </div>
  );
}