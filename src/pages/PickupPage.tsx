import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, CheckSquare, Clock, CreditCard, DollarSign, Gift, Package, Search, ShoppingCart } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { formatCurrency } from '../utils/formatCurrency';
import { useOperation } from '../contexts/OperationContext';
import { PaymentModal } from '../components/PaymentModal';
import { CollectorInfoModal } from '../components/CollectorInfoModal';
import { buildPaymentReceiptPayload, printerService } from '../services/printer';
import { useAuthStore } from '../store/authStore';

interface PickupEvent {
  id: string;
  collectorName?: string | null;
  collectorPhone?: string | null;
  pickedUpAt?: string | null;
  shoes: {
    id: string;
    category: string;
    color?: string;
    description?: string;
  }[];
}

interface PickupTicket {
  id: string;
  customerName: string;
  customerPhone: string;
  customerId?: string;
  customerBalance: number;
  date: string;
  pieces: number;
  total: number;
  originalTotal: number;
  discount: number;
  paidAmount: number;
  status: 'ready' | 'completed';
  workflowStatus: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  promisedDate?: string;
  pickupEvents: PickupEvent[];
  items: {
    id: string;
    category: string;
    size?: string;
    color: string;
    description: string;
    pickupStatus: 'pending' | 'picked_up';
    pickedUpAt?: string | null;
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

const ticketLabel = (id: string) => `TKT-${id.slice(-6).toUpperCase()}`;

export default function PickupPage() {
  const { user } = useAuthStore();
  const { operations, refreshOperations } = useOperation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'needs_payment' | 'ready'>('all');
  const [showCollectorModal, setShowCollectorModal] = useState(false);
  const [pendingPickupId, setPendingPickupId] = useState<string | null>(null);
  const [isSubmittingPickup, setIsSubmittingPickup] = useState(false);
  const [selectedShoeIds, setSelectedShoeIds] = useState<string[]>([]);

  useEffect(() => {
    const handleDropCompleted = () => {
      refreshOperations();
    };
    window.addEventListener('drop-completed', handleDropCompleted);
    return () => window.removeEventListener('drop-completed', handleDropCompleted);
  }, [refreshOperations]);

  const mapOperationToTicket = (op: any): PickupTicket => {
    const discount = Number(op.discount) || 0;
    const shoes = Array.isArray(op.shoes) ? op.shoes : [];
    const pendingShoeCount = shoes.filter((shoe: any) => (shoe.pickupStatus || 'pending') !== 'picked_up').length;
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
      pieces: shoes.length + retailItems.length,
      total: Number(op.totalAmount) || 0,
      originalTotal: (Number(op.totalAmount) || 0) + discount,
      discount,
      paidAmount: Number(op.paidAmount) || 0,
      status: pendingShoeCount === 0 ? 'completed' : 'ready',
      workflowStatus: op.workflowStatus || 'pending',
      paymentStatus: op.paymentStatus || 'unpaid',
      promisedDate: op.promisedDate || undefined,
      pickupEvents: Array.isArray(op.pickupEvents) ? op.pickupEvents : [],
      items: shoes.map((shoe: any) => ({
        id: shoe.id,
        category: shoe.category,
        size: shoe.size || undefined,
        color: shoe.color || '',
        description: shoe.description || shoe.notes || shoe.category,
        pickupStatus: shoe.pickupStatus || 'pending',
        pickedUpAt: shoe.pickedUpAt || null,
        services: (shoe.services || []).map((service: any) => ({
          name: service.name,
          price: Number(service.price) || 0,
        })),
      })),
      retailItems,
    };
  };

  const openTickets = operations
    .filter(op => op.shoes?.some((shoe: any) => (shoe.pickupStatus || 'pending') !== 'picked_up'))
    .map(mapOperationToTicket);

  const pickedTickets = operations
    .filter(op => (op.shoes?.length || 0) > 0 && op.shoes.every((shoe: any) => (shoe.pickupStatus || 'pending') === 'picked_up'))
    .map(mapOperationToTicket);

  const selected = [...openTickets, ...pickedTickets].find(ticket => ticket.id === selectedTicket);
  const selectedPendingItems = selected?.items.filter(item => item.pickupStatus !== 'picked_up') || [];
  const selectedPickedItems = selected?.items.filter(item => item.pickupStatus === 'picked_up') || [];

  const filteredTickets = openTickets.filter(ticket => {
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerPhone.includes(searchTerm);
    const balance = Math.max(0, ticket.total - ticket.paidAmount);

    if (filter === 'needs_payment') return matchesSearch && balance > 0;
    if (filter === 'ready') return matchesSearch && balance === 0;
    return matchesSearch;
  });

  const selectedSubtotal = Number(selected?.originalTotal) || Number(selected?.total) || 0;
  const selectedTotal = Number(selected?.total) || 0;
  const selectedDiscount = Number(selected?.discount) || 0;
  const selectedPaid = Number(selected?.paidAmount) || 0;
  const selectedBalance = Math.max(0, selectedTotal - selectedPaid);

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicket(prev => {
      const nextTicket = prev === ticketId ? null : ticketId;
      setSelectedShoeIds([]);
      return nextTicket;
    });
  };

  const toggleShoeSelection = (shoeId: string) => {
    setSelectedShoeIds(prev =>
      prev.includes(shoeId) ? prev.filter(id => id !== shoeId) : [...prev, shoeId]
    );
  };

  const handleMarkPickedUp = (ticketId: string) => {
    if (selectedShoeIds.length === 0) {
      alert('Select at least one item to pick up.');
      return;
    }

    setSelectedTicket(ticketId);
    setPendingPickupId(ticketId);
    setShowCollectorModal(true);
  };

  const handleCollectorConfirm = async (name: string, phone: string) => {
    if (!pendingPickupId) return;

    setIsSubmittingPickup(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_ENDPOINTS.operations}/${pendingPickupId}/pickup-shoes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          shoe_ids: selectedShoeIds,
          collector_name: name,
          collector_phone: phone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process pickup');
      }

      await refreshOperations();
      setSelectedTicket(null);
      setSelectedShoeIds([]);
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
    if (!selectedTicket) {
      alert('Error: No ticket selected for payment');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_ENDPOINTS.operations}/${selectedTicket}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ payments }),
      });

      if (!response.ok) throw new Error('Payment failed');

      const paymentResult = await response.json();
      await printerService.printPaymentReceipt(buildPaymentReceiptPayload(paymentResult, payments, user?.name));
      await refreshOperations();
      setSelectedTicket(null);
      setIsPaymentModalOpen(false);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">Pickup</h1>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 space-y-6">
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search open pickups by ticket or customer..."
                  className="w-full rounded-xl border border-gray-700 bg-gray-700/50 py-3 pl-12 pr-4 text-gray-100 transition-all focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="ml-6 flex space-x-6">
                <div className="flex items-center space-x-3 rounded-lg bg-gray-800/50 p-3">
                  <Package className="h-5 w-5 text-indigo-400" />
                  <span className="font-medium text-gray-300">{filteredTickets.length}</span>
                </div>
                <div className="flex items-center space-x-3 rounded-lg bg-gray-800/50 p-3">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-gray-300">
                    {formatCurrency(filteredTickets.reduce((sum, ticket) => sum + ticket.total, 0))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Open Pickups
                </button>
                <button
                  onClick={() => setFilter('needs_payment')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    filter === 'needs_payment' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Needs Payment
                </button>
                <button
                  onClick={() => setFilter('ready')}
                  className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    filter === 'ready' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <CheckSquare size={16} />
                  <span>Paid</span>
                </button>
              </div>
              <Link
                to="/picked-items"
                className="flex items-center space-x-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-gray-600"
              >
                <CheckCircle size={16} />
                <span>Picked ({pickedTickets.length})</span>
              </Link>
            </div>
          </div>

          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 p-6">
            <div className="max-h-[500px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700">
              <table className="min-w-[980px] w-full">
                <thead className="sticky top-0 bg-gray-800/80 backdrop-blur-sm">
                  <tr>
                    <th className="sticky left-0 z-20 bg-gray-800/95 px-6 py-4 text-left text-sm font-medium text-gray-300">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Ticket No</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Ready By</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Open</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Amount</th>
                    <th className="sticky right-[88px] z-20 bg-gray-800/95 px-4 py-4 text-center text-sm font-medium text-gray-300">Balance</th>
                    <th className="sticky right-0 z-30 bg-gray-800/95 px-4 py-4 text-center text-sm font-medium text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <Package size={48} className="mx-auto mb-4 text-gray-600" />
                        <h3 className="mb-2 text-lg font-medium text-gray-400">No Open Pickups Found</h3>
                        <p className="text-sm text-gray-500">
                          {searchTerm ? 'No tickets match your search' : 'No tickets have pending items for pickup'}
                        </p>
                      </td>
                    </tr>
                  )}
                  {filteredTickets.map(ticket => {
                    const balance = Math.max(0, ticket.total - ticket.paidAmount);
                    const openItemCount = ticket.items.filter(item => item.pickupStatus !== 'picked_up').length;
                    return (
                      <tr
                        key={ticket.id}
                        className={`group cursor-pointer transition-all ${
                          selectedTicket === ticket.id ? 'bg-indigo-900/40 hover:bg-indigo-900/60' : 'hover:bg-gray-800/60'
                        }`}
                        onClick={() => handleSelectTicket(ticket.id)}
                      >
                        <td className="sticky left-0 z-10 bg-gray-900 px-6 py-4 group-hover:bg-gray-800/95">
                          <div className="text-sm font-medium text-gray-200">{ticket.customerName}</div>
                          <div className="text-xs text-gray-400">{ticket.customerPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-gray-700 px-3 py-1 text-xs font-medium text-gray-300 group-hover:bg-gray-600">
                            {ticketLabel(ticket.id)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{ticket.date}</td>
                        <td className="px-6 py-4 text-sm text-indigo-400">
                          {ticket.promisedDate ? new Date(ticket.promisedDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-300">{openItemCount}</td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-200">{formatCurrency(ticket.total)}</td>
                        <td className="sticky right-[88px] z-10 bg-gray-900 px-4 py-4 text-center group-hover:bg-gray-800/95">
                          {balance === 0 ? (
                            <span className="inline-flex items-center justify-center rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-medium text-emerald-400">
                              Paid
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-orange-400">{formatCurrency(balance)}</span>
                          )}
                        </td>
                        <td className="sticky right-0 z-20 bg-gray-900 px-4 py-4 text-center group-hover:bg-gray-800/95">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedTicket(ticket.id);
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                          >
                            PICK
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-5 space-y-4">
          {selected ? (
            <div className="flex h-full w-full flex-col rounded-none border-l border-gray-100 bg-white shadow-xl">
              <div className="flex-shrink-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Pickup Summary</h3>
                      <p className="text-xs text-slate-400">{ticketLabel(selected.id)}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/10 px-3 py-1">
                    <span className="text-lg font-bold text-white">{selectedPendingItems.length}</span>
                    <span className="ml-1 text-xs text-slate-400">open</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                      <span className="text-sm font-bold text-indigo-600">
                        {selected.customerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{selected.customerName}</p>
                      <p className="text-xs text-gray-400">{selected.customerPhone}</p>
                    </div>
                  </div>
                  {selected.customerBalance > 0 && (
                    <div className="mt-2 flex items-center border-t border-gray-200 pt-2">
                      <Gift size={12} className="mr-1.5 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">
                        Credit: {formatCurrency(selected.customerBalance)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock size={14} />
                    <span>{selected.date}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedPickedItems.length} picked / {selected.items.length} repair item(s)
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedPendingItems.map(item => (
                    <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <label className="pt-1">
                          <input
                            type="checkbox"
                            checked={selectedShoeIds.includes(item.id)}
                            onChange={() => toggleShoeSelection(item.id)}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </label>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-gray-800">{item.description}</div>
                          <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{item.category}</div>
                        </div>
                        <span className="flex-shrink-0 text-sm font-bold text-gray-800">
                          {formatCurrency(item.services.reduce((sum, service) => sum + service.price, 0))}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                        {item.size && (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            Size {item.size}
                          </span>
                        )}
                        {item.color && <span>{item.color}</span>}
                        {item.services.length > 0 && <span className="italic text-gray-400">{item.services.map(service => service.name).join(', ')}</span>}
                      </div>
                    </div>
                  ))}

                  {selectedPickedItems.length > 0 && (
                    <div className="pt-3">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Already Picked</div>
                      <div className="space-y-2">
                        {selectedPickedItems.map(item => (
                          <div key={item.id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-bold text-gray-800">{item.description}</div>
                                <div className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                                  Picked up
                                </div>
                              </div>
                              <span className="flex-shrink-0 text-sm font-bold text-gray-800">
                                {formatCurrency(item.services.reduce((sum, service) => sum + service.price, 0))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.retailItems.map(item => (
                    <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-gray-800">{item.productName}</div>
                          <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Product</div>
                        </div>
                        <span className="flex-shrink-0 text-sm font-bold text-gray-800">{formatCurrency(item.totalPrice)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0 space-y-3 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(selectedSubtotal)}</span>
                  </div>
                  {selectedDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-600">Discount</span>
                      <span className="font-medium text-pink-500">-{formatCurrency(selectedDiscount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-600">Paid</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(selectedPaid)}</span>
                  </div>
                  <div className="my-1 h-px bg-gray-300" />
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-gray-800">Balance</span>
                    <span className="text-xl font-bold text-gray-800">{formatCurrency(selectedBalance)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedBalance > 0 && (
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 py-3 text-sm font-bold text-white shadow-lg hover:from-cyan-600 hover:to-cyan-700"
                    >
                      <CreditCard size={18} />
                      PAY {formatCurrency(selectedBalance)}
                    </button>
                  )}
                  <button
                    onClick={() => handleMarkPickedUp(selected.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-white shadow-lg hover:from-emerald-600 hover:to-emerald-700"
                  >
                    <ArrowRight size={18} />
                    PICK SELECTED {selectedShoeIds.length > 0 ? `(${selectedShoeIds.length})` : ''}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full flex-col rounded-none border-l border-gray-100 bg-white shadow-xl">
              <div className="flex-shrink-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <ShoppingCart className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Pickup Cart</h3>
                    <p className="text-xs text-slate-400">Select a ticket</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <Package size={48} className="mb-4 text-gray-300" />
                <h3 className="mb-2 text-lg font-medium text-gray-500">No Ticket Selected</h3>
                <p className="text-sm text-gray-400">Click on a ticket from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

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

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={selectedBalance}
        customer={selected && selected.customerId ? {
          id: selected.customerId,
          name: selected.customerName,
          accountBalance: selected.customerBalance,
        } : null}
        onComplete={handlePaymentComplete}
      />
    </div>
  );
}
