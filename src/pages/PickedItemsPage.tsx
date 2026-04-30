import { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { useOperation } from '../contexts/OperationContext';
import { Search, CheckCircle, Calendar, User, Phone } from 'lucide-react';

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
  pickedUpByName?: string | null;
  pickedUpByPhone?: string | null;
  pickedUpAt?: string | null;
  pickupEvents: PickupEvent[];
  items: {
    id: string;
    category: string;
    color: string;
    description: string;
    services: {
      name: string;
      price: number;
    }[];
  }[];
}

type DateFilter = 'all' | 'today' | 'week' | 'month';

// Helper function to safely format dates
const safeFormatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

export default function PickedItemsPage() {
  const { operations, refreshOperations } = useOperation();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedTicket, setSelectedTicket] = useState<PickupTicket | null>(null);

  useEffect(() => {
    refreshOperations();
  }, [refreshOperations]);

  const mapOperationToTicket = (op: any): PickupTicket => {
    const discount = op.discount || 0;
    const originalTotal = op.totalAmount + discount;
    return {
      id: op.id,
      customerName: op.customer?.name || 'Unknown',
      customerPhone: op.customer?.phone || '',
      customerId: op.customer?.id,
      customerBalance: op.customer?.accountBalance || 0,
      date: new Date(op.createdAt).toLocaleDateString(),
      pieces: op.shoes.length,
      total: op.totalAmount,
      originalTotal: originalTotal,
      discount: discount,
      paidAmount: op.paidAmount || 0,
      status: op.workflowStatus === 'delivered' ? 'completed' : op.workflowStatus || 'pending',
      workflowStatus: op.workflowStatus || 'pending',
      paymentStatus: op.paymentStatus || 'unpaid',
      pickedUpByName: op.pickedUpByName || null,
      pickedUpByPhone: op.pickedUpByPhone || null,
      pickedUpAt: op.pickedUpAt || null,
      pickupEvents: Array.isArray(op.pickupEvents) ? op.pickupEvents : [],
      items: op.shoes.map((shoe: any) => ({
        id: shoe.id,
        category: shoe.category,
        color: shoe.color,
        description: shoe.description || shoe.category,
        services: shoe.services.map((service: any) => ({
          name: service.name,
          price: service.price,
        })),
      })),
    };
  };

  const pickedTickets: PickupTicket[] = operations
    .filter(op => op.workflowStatus === 'delivered')
    .map(mapOperationToTicket);

  const isWithinDateFilter = (ticket: PickupTicket): boolean => {
    if (dateFilter === 'all') return true;

    const pickupDates = ticket.pickupEvents
      .map(event => event.pickedUpAt)
      .filter(Boolean)
      .sort();
    const latestPickupDate = pickupDates[pickupDates.length - 1];
    const ticketDate = new Date(latestPickupDate || ticket.pickedUpAt || ticket.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      return ticketDate.toDateString() === today.toDateString();
    }

    if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return ticketDate >= weekAgo && ticketDate <= today;
    }

    if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return ticketDate >= monthAgo && ticketDate <= today;
    }

    return true;
  };

  const filteredTickets = pickedTickets.filter(ticket => {
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerPhone.includes(searchTerm);

    return matchesSearch && isWithinDateFilter(ticket);
  });

  const getDateFilterLabel = (filter: DateFilter): string => {
    switch (filter) {
      case 'all': return 'All Time';
      case 'today': return 'Today';
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Picked Items List */}
        <div className="col-span-7 space-y-6">
          {/* Search and Filters */}
          <div className="card-bevel p-6 bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search picked tickets by ID or customer..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl border border-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-3 ml-6 bg-gray-800/50 rounded-lg p-3">
                <CheckCircle className="h-5 w-5 text-violet-400" />
                <span className="text-gray-300 font-medium">{filteredTickets.length}</span>
              </div>
            </div>

            {/* Date Filter Tabs */}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm text-gray-400 mr-2">Filter by date:</span>
              {(['all', 'today', 'week', 'month'] as DateFilter[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    dateFilter === filter
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {getDateFilterLabel(filter)}
                </button>
              ))}
            </div>
          </div>

          {/* Picked Tickets Table */}
          <div className="card-bevel p-6 bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              <table className="w-full">
                <thead className="bg-gray-800/80 backdrop-blur-sm sticky top-0">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Ticket No</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Pieces</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Amount</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <CheckCircle size={48} className="text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No Picked Tickets Found</h3>
                        <p className="text-sm text-gray-500">
                          {searchTerm
                            ? 'No tickets match your search'
                            : dateFilter === 'today'
                            ? 'No tickets picked today'
                            : dateFilter === 'week'
                            ? 'No tickets picked in the last 7 days'
                            : dateFilter === 'month'
                            ? 'No tickets picked in the last 30 days'
                            : 'No picked tickets yet'}
                        </p>
                      </td>
                    </tr>
                  )}
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={`group cursor-pointer transition-all ${
                        selectedTicket?.id === ticket.id
                          ? 'bg-violet-900/40 hover:bg-violet-900/60'
                          : 'hover:bg-gray-800/60'
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-900/50 text-violet-300">
                          TKT-{ticket.id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-200">{ticket.customerName}</div>
                          <div className="text-xs text-gray-400">{ticket.customerPhone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{ticket.date}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-300">{ticket.pieces}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-emerald-400">
                          {formatCurrency(ticket.total)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(ticket);
                          }}
                          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          VIEW
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel - Ticket Details */}
        <div className="col-span-5 space-y-4">
          {selectedTicket ? (
            <>
              {/* Cart Summary Header */}
              <div className="card-bevel p-6 bg-gradient-to-br from-violet-950/50 via-gray-900 to-gray-900 border-t-4 border-t-violet-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg border bg-violet-900/50 border-violet-700/50">
                      <CheckCircle size={20} className="text-violet-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-200">Picked Ticket</h2>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 border-l-4 border-l-violet-500 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-violet-900/50 rounded-full flex items-center justify-center">
                      <span className="text-violet-300 text-sm font-bold">
                        {selectedTicket.customerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">{selectedTicket.customerName}</p>
                      <p className="text-xs text-gray-400">{selectedTicket.customerPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Ticket Info */}
                <div className="flex items-center justify-between text-sm mb-4 pb-3 border-b border-gray-700">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <span>{selectedTicket.date}</span>
                    <span className="text-gray-600">|</span>
                    <span>{selectedTicket.pieces} piece(s)</span>
                  </div>
                  <span className="text-xs font-mono text-gray-500">TKT-{selectedTicket.id.slice(-6).toUpperCase()}</span>
                </div>

                {/* Items List */}
                <div className="space-y-3 max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                  {selectedTicket.items.map((item) => (
                    <div key={item.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-200">{item.description}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {item.color && item.color !== 'none' && (
                              <span className="text-xs text-gray-400 capitalize">{item.color}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-green-400">
                          {formatCurrency(item.services.reduce((sum, s) => sum + s.price, 0))}
                        </span>
                      </div>
                      {item.services.map((service, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-500 mt-1 pl-2 border-l-2 border-gray-700">
                          <span>{service.name}</span>
                          <span>{formatCurrency(service.price)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Card */}
              <div className="card-bevel p-6 bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Subtotal</span>
                      <span className="text-gray-200">{formatCurrency(selectedTicket.originalTotal)}</span>
                    </div>
                  {selectedTicket.discount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Discount</span>
                      <span className="text-pink-400">-{formatCurrency(selectedTicket.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Paid</span>
                    <span className="text-emerald-400">{formatCurrency(selectedTicket.paidAmount)}</span>
                  </div>
                  <div className="h-px bg-gray-700 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-200 font-medium">Total</span>
                    <span className="text-lg font-bold text-violet-400">{formatCurrency(selectedTicket.total)}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 p-4 bg-violet-900/30 border border-violet-500/30 rounded-lg text-violet-400">
                  <CheckCircle size={20} />
                  <span className="font-medium">Picked Up</span>
                </div>

                {/* Collector Info */}
                {selectedTicket.pickupEvents.length > 0 ? (
                  <div className="card-bevel p-4 bg-gray-800/50 border border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pickup History</h4>
                    <div className="space-y-3">
                      {selectedTicket.pickupEvents.map((event, index) => (
                        <div key={event.id} className="rounded-lg border border-gray-700 bg-gray-900/40 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-violet-300">
                              Pickup {index + 1}
                            </span>
                            <span className="text-xs text-gray-400">{safeFormatDate(event.pickedUpAt)}</span>
                          </div>
                          <div className="space-y-2">
                            {event.collectorName && (
                              <div className="flex items-center gap-2 text-sm">
                                <User size={14} className="text-gray-400" />
                                <span className="text-gray-400">Collected by:</span>
                                <span className="text-gray-200 font-medium">{event.collectorName}</span>
                              </div>
                            )}
                            {event.collectorPhone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone size={14} className="text-gray-400" />
                                <span className="text-gray-400">Phone:</span>
                                <span className="text-gray-200">{event.collectorPhone}</span>
                              </div>
                            )}
                            {event.shoes.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {event.shoes.map(shoe => (
                                  <span key={shoe.id} className="rounded-full bg-violet-900/40 px-2 py-1 text-xs text-violet-200">
                                    {shoe.description || shoe.category}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (selectedTicket.pickedUpByName || selectedTicket.pickedUpByPhone || selectedTicket.pickedUpAt) && (
                  <div className="card-bevel p-4 bg-gray-800/50 border border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Collector Information</h4>
                    <div className="space-y-2">
                      {selectedTicket.pickedUpByName && (
                        <div className="flex items-center gap-2 text-sm">
                          <User size={14} className="text-gray-400" />
                          <span className="text-gray-400">Collected by:</span>
                          <span className="text-gray-200 font-medium">{selectedTicket.pickedUpByName}</span>
                        </div>
                      )}
                      {selectedTicket.pickedUpByPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-gray-400">Phone:</span>
                          <span className="text-gray-200">{selectedTicket.pickedUpByPhone}</span>
                        </div>
                      )}
                      {selectedTicket.pickedUpAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-gray-400">Picked up:</span>
                          <span className="text-gray-200">
                            {safeFormatDate(selectedTicket.pickedUpAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card-bevel p-6 bg-gradient-to-br from-gray-800 to-gray-900 h-full flex flex-col items-center justify-center text-center">
              <CheckCircle size={48} className="text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No Ticket Selected</h3>
              <p className="text-sm text-gray-500">Click on a picked ticket from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
