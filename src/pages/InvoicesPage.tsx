import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Receipt, Search, Calendar, X, Printer, Eye, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Invoice {
  id: string;
  operationId: string;
  type: 'invoice' | 'receipt';
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  paymentMethod: string;
  promisedDate: string;
  createdAt: string;
}

interface InvoiceDetail extends Invoice {
  items: Array<{
    id: string;
    category: string;
    color: string;
    notes: string;
    serviceName: string;
    price: number;
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount: number;
    createdAt: string;
  }>;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'invoice' | 'receipt'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [activeTab]);

  // Listen for drop-completed event to refresh invoices
  useEffect(() => {
    const handleDropCompleted = () => {
      fetchInvoices();
    };
    window.addEventListener('drop-completed', handleDropCompleted);
    return () => window.removeEventListener('drop-completed', handleDropCompleted);
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('type', activeTab);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(`${API_ENDPOINTS.invoices}?${params}`);
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to load invoices');
    }
    setLoading(false);
  };

  const handleSearch = () => {
    fetchInvoices();
  };

  const handleViewInvoice = async (id: string) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.invoices}/${id}`);
      setSelectedInvoice(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to fetch invoice details:', error);
      toast.error('Failed to load invoice details');
    }
  };

  const handlePrintInvoice = async (id: string) => {
    setPrinting(true);
    try {
      const response = await axios.post(`${API_ENDPOINTS.invoices}/${id}/print`);
      if (response.data.success) {
        toast.success(response.data.simulated ? 'Print simulated (no printer)' : 'Print sent to printer');
      } else {
        toast.error(response.data.error || 'Print failed');
      }
    } catch (error: any) {
      console.error('Failed to print invoice:', error);
      toast.error(error?.response?.data?.error || 'Failed to prepare print');
    }
    setPrinting(false);
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices & Receipts</h1>
          <p className="text-gray-400 text-sm">Manage your sales documents</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card-bevel p-4 mb-6">
        {/* Tabs and Search Row */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('invoice')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'invoice'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText size={14} />
              <span>Invoices</span>
            </button>
            <button
              onClick={() => setActiveTab('receipt')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'receipt'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Receipt size={14} />
              <span>Receipts</span>
            </button>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Date Filters Row */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card-bevel overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <table className="w-full">
            <thead className="bg-gray-800/80 backdrop-blur-sm sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Invoice #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Customer</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Total</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Paid</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice, index) => (
                  <tr key={invoice.id} className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700 transition-colors`}>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-indigo-400">{invoice.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.type === 'receipt'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {invoice.type === 'receipt' ? 'Receipt' : 'Invoice'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{invoice.customerName}</div>
                      <div className="text-xs text-gray-500">{invoice.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-white">{formatCurrency(invoice.total)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${
                        invoice.amountPaid >= invoice.total ? 'text-emerald-400' : 'text-orange-400'
                      }`}>
                        {formatCurrency(invoice.amountPaid)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-400">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleViewInvoice(invoice.id)}
                          className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(invoice.id)}
                          disabled={printing}
                          className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                          title="Print"
                        >
                          <Printer size={16} />
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

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-violet-900/30 to-purple-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${
                    selectedInvoice.type === 'receipt'
                      ? 'bg-emerald-900/50'
                      : 'bg-orange-900/50'
                  }`}>
                    {selectedInvoice.type === 'receipt' ? (
                      <Receipt className="text-emerald-400 w-6 h-6" />
                    ) : (
                      <FileText className="text-orange-400 w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedInvoice.type === 'receipt' ? 'Receipt' : 'Invoice'}
                    </h2>
                    <p className="text-sm font-mono text-gray-400">{selectedInvoice.invoiceNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Store Info */}
              <div className="text-center mb-6 p-4 bg-gray-900/50 rounded-xl">
                <h3 className="text-lg font-bold text-white">Kampani Shoes and Bag Clinic</h3>
                <p className="text-sm text-gray-400">FORESTMALL, KAMPALA, Uganda</p>
                <p className="text-sm text-gray-400">Your Trusted Shoe Repair Service</p>
              </div>

              {/* Customer & Date Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-900/50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">Customer</p>
                  <p className="text-sm font-medium text-white">{selectedInvoice.customerName}</p>
                  <p className="text-xs text-gray-400">{selectedInvoice.customerPhone}</p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">Date</p>
                  <p className="text-sm font-medium text-white">
                    {new Date(selectedInvoice.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  {selectedInvoice.promisedDate && (
                    <p className="text-xs text-violet-400 mt-1">
                      Promised: {new Date(selectedInvoice.promisedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedInvoice.items.map((item, index) => (
                    <div key={item.id || index} className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                      <div>
                        <p className="text-sm text-white">{item.serviceName || item.category}</p>
                        {item.color && (
                          <p className="text-xs text-gray-400">
                            Color: {item.color}
                            {item.colorDescription && (
                              <span className="text-indigo-400 italic ml-1">"{item.colorDescription}"</span>
                            )}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-white">{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Discount</span>
                    <span className="text-emerald-400">-{formatCurrency(selectedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
                  <span className="text-white">Total</span>
                  <span className="text-white">{formatCurrency(selectedInvoice.total)}</span>
                </div>
                {selectedInvoice.type === 'invoice' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Balance Due</span>
                    <span className="text-orange-400 font-medium">
                      {formatCurrency(selectedInvoice.total - selectedInvoice.amountPaid)}
                    </span>
                  </div>
                )}
                {selectedInvoice.type === 'receipt' && selectedInvoice.payments.length > 0 && (
                  <div className="p-3 bg-emerald-900/20 rounded-lg border border-emerald-800">
                    <p className="text-xs text-emerald-400 mb-2">Payment Information</p>
                    {selectedInvoice.payments.map((payment, index) => (
                      <div key={payment.id || index} className="flex justify-between text-sm">
                        <span className="text-gray-400 capitalize">{payment.method.replace('_', ' ')}</span>
                        <span className="text-emerald-400">{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700 bg-gray-900/30">
              <div className="flex space-x-3">
                <button
                  onClick={() => handlePrintInvoice(selectedInvoice.id)}
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Printer size={18} />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
              </div>
              <p className="text-center text-xs text-gray-500 mt-4">
                Thank you for your business!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
