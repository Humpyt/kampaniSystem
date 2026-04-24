import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { formatCurrency } from '../utils/formatCurrency';
import { useOperation } from '../contexts/OperationContext';
import { PaymentModal } from '../components/PaymentModal';
import { CollectorInfoModal } from '../components/CollectorInfoModal';
import { Link } from 'react-router-dom';
import { Search, Package, DollarSign, CreditCard, CheckSquare, X, Clock, User, Gift, Minus, CheckCircle, ArrowRight, ShoppingCart, Sparkles } from 'lucide-react';
import { buildPaymentReceiptPayload, printerService } from '../services/printer';

interface PickupTicket {
  id: string;
  customerName: string;
  customerPhone: string;
  customerId?: string;
  customerBalance?: number;
  date: string;
  pieces: number;
  rackNo?: string;
  total: number;
  originalTotal: number;
  discount: number;
  paidAmount: number;
  status: 'pending' | 'ready' | 'completed';
  workflowStatus: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  promisedDate?: string;
  items: {
    id: string;
    category: string;
    size?: string;
    color: string;
    description: string;
    services: {
      name: string;
      price: number;
    }[];
  }[];
  retailItems: {
    id: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }[];
}

export default function PickupPage() {
  const { operations, refreshOperations, updateOperation } = useOperation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingTicketId, setPayingTicketId] = useState<string | null>(null); // Track ticket being paid
  const [filter, setFilter] = useState<'all' | 'needs_payment' | 'ready'>('all');
  const [showCollectorModal, setShowCollectorModal] = useState(false);
  const [pendingPickupId, setPendingPickupId] = useState<string | null>(null);
  const [isSubmittingPickup, setIsSubmittingPickup] = useState(false);

  // Listen for drop-completed event to refresh data
  useEffect(() => {
    const handleDropCompleted = () => {
      refreshOperations();
    };
    window.addEventListener('drop-completed', handleDropCompleted);
    return () => window.removeEventListener('drop-completed', handleDropCompleted);
  }, [refreshOperations]);

  // Convert operations to pickup tickets
  const mapOperationToTicket = (op: any): PickupTicket => {
    const discount = Number(op.discount) || 0;
    const originalTotal = Number(op.totalAmount) + discount;
    const retailItems = (op.retailItems || []).map((item: any) => ({
      id: item.id || item.productId || Math.random().toString(36),
      productName: item.productName || item.name || 'Product',
      unitPrice: Number(item.unitPrice) || Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      totalPrice: Number(item.totalPrice) || Number(item.unitPrice) || Number(item.price) || 0,
    }));
    return {
      id: op.id,
      customerName: op.customer?.name || 'Unknown',
      customerPhone: op.customer?.phone || '',
      customerId: op.customer?.id,
      customerBalance: Number(op.customer?.accountBalance) || 0,
      date: new Date(op.createdAt).toLocaleDateString(),
      pieces: (op.shoes?.length || 0) + (op.retailItems?.length || 0),
      total: Number(op.totalAmount),
      originalTotal: originalTotal,
      discount: discount,
      paidAmount: Number(op.paidAmount) || 0,
      status: op.status,
      workflowStatus: op.workflowStatus || 'pending',
      paymentStatus: op.paymentStatus || 'unpaid',
      items: op.shoes.map((shoe: any) => ({
        id: shoe.id,
        category: shoe.category,
        size: shoe.size,
        color: shoe.color,
        description: shoe.description || shoe.category,
        services: shoe.services.map((service: any) => ({
          name: service.name,
          price: Number(service.price),
        })),
      })),
      promisedDate: op.promisedDate || undefined,
      retailItems,
    };
  };

  // Pending tickets (awaiting pickup)
  // Only show operations that have repair shoes (not just retail products)
  // workflowStatus not yet 'delivered' - still waiting to be picked up
  const pendingTickets: PickupTicket[] = operations
    .filter(op => op.workflowStatus !== 'delivered' && (op.shoes?.length || 0) > 0)
    .map(mapOperationToTicket);

  // Picked tickets (completed)
  // Only show operations that had repair shoes and are physically delivered
  const pickedTickets: PickupTicket[] = operations
    .filter(op => op.workflowStatus === 'delivered' && (op.shoes?.length || 0) > 0)
    .map(mapOperationToTicket);

  // Get selected ticket details
  const selected = [...pendingTickets, ...pickedTickets].find(t => t.id === selectedTicket);

  // Filter pending tickets based on search term and status filter
  const filteredTickets = pendingTickets.filter(ticket => {
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerPhone.includes(searchTerm);

    const ticketBalance = Math.max(0, ticket.total - ticket.paidAmount);

    if (filter === 'needs_payment') {
      return matchesSearch && ticketBalance > 0;
    }
    if (filter === 'ready') {
      return matchesSearch && ticketBalance === 0;
    }
    return matchesSearch;
  });

  // Calculate totals for selected ticket (use Number() to handle database string values)
  const selectedSubtotal = Number(selected?.originalTotal) || Number(selected?.total) || 0;
  const selectedTotal = Number(selected?.total) || 0;
  const selectedDiscount = Number(selected?.discount) || 0;
  const selectedPaid = Number(selected?.paidAmount) || 0;
  const selectedBalance = Math.max(0, selectedTotal - selectedPaid);

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicket(prev => prev === ticketId ? null : ticketId);
  };

  const handleMarkPickedUp = async (ticketId: string) => {
    // Instead of directly marking picked up, show modal
    setSelectedTicket(ticketId);
    setPendingPickupId(ticketId);
    setShowCollectorModal(true);
  };

  const handleCollectorConfirm = async (name: string, phone: string) => {
    if (!pendingPickupId) return;

    setIsSubmittingPickup(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };
      const pickedUpAt = new Date().toISOString();

      const transitions = [
        { status: 'in_progress', picked_up_at: undefined },
        { status: 'ready', picked_up_at: undefined },
        { status: 'delivered', picked_up_at: pickedUpAt, picked_up_by_name: name, picked_up_by_phone: phone },
      ];

      for (const transition of transitions) {
        const response = await fetch(`${API_ENDPOINTS.operations}/${pendingPickupId}/workflow-status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            workflow_status: transition.status,
            ...(transition.picked_up_at && { picked_up_at: transition.picked_up_at }),
            ...(name && { picked_up_by_name: name }),
            ...(phone && { picked_up_by_phone: phone }),
          }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to transition to ${transition.status}`);
        }
      }

      await refreshOperations();
      setSelectedTicket(null);
      setShowCollectorModal(false);
      setPendingPickupId(null);
    } catch (error) {
      console.error('Failed to mark as picked up:', error);
      alert(error instanceof Error ? error.message : 'Failed to mark as picked up. Please try again.');
    } finally {
      setIsSubmittingPickup(false);
    }
  };

  const handlePaymentComplete = async (payments: Array<{ method: string; amount: number }>) => {
    try {
      // Use selectedTicket as primary source — always set when PAY button is clicked
      const ticketId = selectedTicket || payingTicketId;
      if (!ticketId) {
        alert('Error: No ticket selected for payment');
        return;
      }

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_ENDPOINTS.operations}/${ticketId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ payments }),
      });
      if (!response.ok) {
        throw new Error('Payment failed');
      }

      const paymentResult = await response.json();
      await printerService.printPaymentReceipt(
        buildPaymentReceiptPayload(paymentResult, payments)
      );

      await refreshOperations();
      setSelectedTicket(null);
      setPayingTicketId(null); // Clear the paying ticket ID
      setIsPaymentModalOpen(false);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Page Label */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">Pickup</h1>
      </div>
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel */}
        <div className="col-span-7 space-y-6">
          {/* Search and Stats */}
          <div className="card-bevel p-6 bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets by ID or customer..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex space-x-6 ml-6">
                <div className="flex items-center space-x-3 bg-gray-800/50 rounded-lg p-3">
                  <Package className="h-5 w-5 text-indigo-400" />
                  <span className="text-gray-300 font-medium">{filteredTickets.length}</span>
                </div>
                <div className="flex items-center space-x-3 bg-gray-800/50 rounded-lg p-3">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <span className="text-gray-300 font-medium">
                    {formatCurrency(filteredTickets.reduce((sum, t) => sum + t.total, 0))}
                  </span>
                </div>
              </div>
            </div>
            {/* Filter Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('needs_payment')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                    filter === 'needs_payment'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>Needs Payment</span>
                </button>
                <button
                  onClick={() => setFilter('ready')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                    filter === 'ready'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <CheckSquare size={16} />
                  <span>Ready to Pickup</span>
                </button>
              </div>
              <Link
                to="/picked-items"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 bg-gray-700 text-gray-300 hover:bg-gray-600"
              >
                <CheckCircle size={16} />
                <span>Picked ({pickedTickets.length})</span>
              </Link>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="card-bevel p-6 bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              <table className="w-full">
                <thead className="bg-gray-800/80 backdrop-blur-sm sticky top-0">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Ticket No</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Ready By</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Pieces</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Amount</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Balance</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <Package size={48} className="text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No Tickets Found</h3>
                        <p className="text-sm text-gray-500">
                          {filter === 'needs_payment'
                            ? 'No tickets need payment'
                            : filter === 'ready'
                            ? 'No tickets ready for pickup'
                            : searchTerm
                            ? 'No tickets match your search'
                            : 'No tickets are ready for pickup'}
                        </p>
                      </td>
                    </tr>
                  )}
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={`group cursor-pointer transition-all ${
                        selectedTicket === ticket.id
                          ? 'bg-indigo-900/40 hover:bg-indigo-900/60'
                          : 'hover:bg-gray-800/60'
                      }`}
                      onClick={() => handleSelectTicket(ticket.id)}
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300 group-hover:bg-gray-600">
                          {`TKT-${ticket.id.slice(-6).toUpperCase()}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-200">{ticket.customerName}</div>
                          <div className="text-xs text-gray-400">{ticket.customerPhone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{ticket.date}</td>
                      <td className="px-6 py-4 text-sm text-indigo-400">{ticket.promisedDate ? new Date(ticket.promisedDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-300">{ticket.pieces}</td>
                      <td className="px-6 py-4 text-right">
                        {ticket.discount > 0 ? (
                          <div>
                            <div className="text-xs text-gray-400 line-through">
                              {formatCurrency(ticket.originalTotal)}
                            </div>
                            <div className="text-sm font-medium text-green-400">
                              {formatCurrency(ticket.total)}
                            </div>
                            <div className="text-xs text-pink-400">
                              -{formatCurrency(ticket.discount)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-gray-200">
                            {formatCurrency(ticket.total)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(() => {
                          const ticketBalance = Math.max(0, ticket.total - ticket.paidAmount);
                          if (ticketBalance === 0) {
                            return (
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-400">
                                Paid
                              </span>
                            );
                          }
                          return (
                            <span className="text-sm font-medium text-orange-400">
                              {formatCurrency(ticketBalance)}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        {ticket.status !== 'completed' ? (
                          (() => {
                            const ticketBalance = Math.max(0, ticket.total - ticket.paidAmount);
                            if (ticketBalance > 0) {
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPayingTicketId(ticket.id); // Set directly, synchronously
                                    setSelectedTicket(ticket.id); // Also set for display purposes
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded-lg transition-colors"
                                >
                                  PAY
                                </button>
                              );
                            }
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkPickedUp(ticket.id);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                              >
                                PICK
                              </button>
                            );
                          })()
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel - Cart Summary */}
        <div className="col-span-5 space-y-4">
          {selected ? (
            <>
              {/* Cart Summary Header - Same style as DropPage */}
              <div className="bg-white rounded-none shadow-xl border-l border-gray-100 h-full flex flex-col w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-4 py-3 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                        {selected.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-violet-400" />
                        ) : (
                          <Package className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">
                          {selected.status === 'completed' ? 'Picked Ticket' : 'Pickup Summary'}
                        </h3>
                        <p className="text-slate-400 text-xs">TKT-{selected.id.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                    {selected.status !== 'completed' && (
                      <div className="bg-white/10 px-3 py-1 rounded-lg">
                        <span className="text-white font-bold text-lg">{selected.pieces}</span>
                        <span className="text-slate-400 text-xs ml-1">pcs</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 text-sm font-bold">
                          {selected.customerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{selected.customerName}</p>
                        <p className="text-xs text-gray-400">{selected.customerPhone}</p>
                      </div>
                    </div>
                    {selected.customerBalance && selected.customerBalance > 0 && (
                      <div className="flex items-center mt-2 pt-2 border-t border-gray-200">
                        <Gift size={12} className="text-emerald-500 mr-1.5" />
                        <span className="text-xs text-emerald-600 font-medium">
                          Credit: {formatCurrency(selected.customerBalance)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Ticket Info */}
                  <div className="flex items-center justify-between text-sm px-1">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock size={14} />
                      <span>{selected.date}</span>
                    </div>
                  </div>

                  {/* Items List - Card Item Style */}
                  <div className="space-y-2">
                    {selected.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg border border-gray-200 group p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-800 text-sm truncate">{item.description}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                              {item.category}
                            </div>
                          </div>
                          <span className="text-gray-800 font-bold text-sm flex-shrink-0">
                            {formatCurrency(item.services.reduce((sum, s) => sum + s.price, 0))}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 flex-wrap">
                          {item.size && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                              Size {item.size}
                            </span>
                          )}
                          {item.color && <span>{item.color}</span>}
                          {item.color && item.size && <span>•</span>}
                          <span className="italic text-gray-400">{item.services.map(s => s.name).join(', ')}</span>
                        </div>
                      </div>
                    ))}

                    {/* Retail Products */}
                    {selected.retailItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg border border-gray-200 group p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-800 text-sm truncate">{item.productName}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                              Product
                            </div>
                          </div>
                          <span className="text-gray-800 font-bold text-sm flex-shrink-0">
                            {formatCurrency(item.totalPrice)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer - Totals and Action */}
                <div className="border-t-2 border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0 space-y-3">
                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium">Subtotal</span>
                      <span className="text-gray-800 font-semibold">{formatCurrency(selectedSubtotal)}</span>
                    </div>
                    {selectedDiscount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 font-medium">Discount</span>
                        <span className="text-pink-500 font-medium">-{formatCurrency(selectedDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium">Paid</span>
                      <span className="text-emerald-600 font-medium">{formatCurrency(selectedPaid)}</span>
                    </div>
                    <div className="h-px bg-gray-300 my-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-bold text-base">Balance</span>
                      <span className="text-gray-800 font-bold text-xl">{formatCurrency(selectedBalance)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {selected.status === 'completed' ? (
                    <div className="flex items-center justify-center gap-2 p-4 bg-violet-100 border border-violet-200 rounded-lg text-violet-600">
                      <CheckCircle size={20} />
                      <span className="font-semibold">Picked Up</span>
                    </div>
                  ) : selectedBalance > 0 ? (
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 shadow-lg"
                    >
                      <CreditCard size={18} />
                      PAY {formatCurrency(selectedBalance)}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkPickedUp(selected.id)}
                      className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg"
                    >
                      <ArrowRight size={18} />
                      PICK UP
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-none shadow-xl border-l border-gray-100 h-full flex flex-col w-full">
              <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-4 py-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Pickup Cart</h3>
                    <p className="text-slate-400 text-xs">Select a ticket</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <Package size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No Ticket Selected</h3>
                <p className="text-sm text-gray-400">Click on a ticket from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collector Info Modal */}
      {showCollectorModal && selected && (
        <CollectorInfoModal
          isOpen={showCollectorModal}
          onClose={() => {
            setShowCollectorModal(false);
            setPendingPickupId(null);
          }}
          onConfirm={handleCollectorConfirm}
          customerName={selected.customerName}
          customerPhone={selected.customerPhone}
          isSubmitting={isSubmittingPickup}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={selectedBalance}
        customer={selected ? {
          id: selected.customerId,
          name: selected.customerName,
          accountBalance: selected.customerBalance || 0
        } : null}
        onComplete={handlePaymentComplete}
      />
    </div>
  );
}
