import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { useOperation } from '../contexts/OperationContext';
import { Search, Package, DollarSign, CreditCard, Banknote, CheckSquare, Gift, X, Plus, Minus, RefreshCw } from 'lucide-react';

interface PickupTicket {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  pieces: number;
  rackNo?: string;
  total: number;
  status: 'pending' | 'ready' | 'completed';
  items: {
    category: string;
    color: string;
    services: {
      name: string;
      price: number;
    }[];
  }[];
}

export default function PickupPage() {
  const { operations } = useOperation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'check' | 'store_credit'>('cash');
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const [showNumpad, setShowNumpad] = useState(false);
  const [discount, setDiscount] = useState<number>(0);

  // Convert operations to pickup tickets
  const tickets: PickupTicket[] = operations
    .filter(op => op.status === 'pending' || op.status === 'completed')
    .map(op => ({
      id: op.id,
      customerName: op.customer?.name || 'Unknown',
      customerPhone: op.customer?.phone || '',
      date: new Date(op.createdAt).toLocaleDateString(),
      pieces: op.shoes.length,
      total: op.totalAmount / 100,
      status: op.status,
      items: op.shoes.map(shoe => ({
        category: shoe.category,
        color: shoe.color,
        services: shoe.services.map(service => ({
          name: service.name,
          price: service.price / 100,
        })),
      })),
    }));

  // Filter tickets based on search term
  const filteredTickets = tickets.filter(ticket => 
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.customerPhone.includes(searchTerm)
  );

  const selectedTotal = selectedTickets.reduce((sum, ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    return sum + (ticket?.total || 0);
  }, 0);

  const finalAmount = selectedTotal - discount;
  const change = Math.max(0, amountTendered - finalAmount);

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTickets(filteredTickets.map(t => t.id));
  };

  const handleSelectNone = () => {
    setSelectedTickets([]);
  };

  const handleNumpadClick = (value: string) => {
    if (value === 'C') {
      setAmountTendered(0);
    } else if (value === '.') {
      if (!amountTendered.toString().includes('.')) {
        setAmountTendered(Number(amountTendered.toString() + '.'));
      }
    } else {
      const newValue = Number(amountTendered.toString() + value);
      setAmountTendered(newValue);
    }
  };

  const handlePayment = async () => {
    if (selectedTickets.length === 0) {
      alert('Please select tickets to process payment');
      return;
    }

    if (amountTendered < finalAmount && paymentMethod === 'cash') {
      alert('Amount tendered must be greater than or equal to the total amount');
      return;
    }

    try {
      // Process payment for each selected ticket
      for (const ticketId of selectedTickets) {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) continue;

        await fetch(`http://localhost:3000/api/operations/${ticketId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethod,
            amountPaid: ticket.total,
            discount: discount / selectedTickets.length, // Split discount evenly
          }),
        });
      }

      // Clear selections and reset form
      setSelectedTickets([]);
      setAmountTendered(0);
      setDiscount(0);
      setShowNumpad(false);
      
      alert('Payment processed successfully!');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel */}
        <div className="col-span-7 space-y-6">
          {/* Search and Stats */}
          <div className="card-bevel p-6 bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="flex items-center justify-between mb-6">
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
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800/50 rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleSelectNone}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800/50 rounded-lg transition-colors"
              >
                Clear Selection
              </button>
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
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Pieces</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Total</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredTickets.map((ticket) => (
                    <tr 
                      key={ticket.id}
                      className={`group cursor-pointer transition-all ${
                        selectedTickets.includes(ticket.id) 
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
                      <td className="px-6 py-4 text-center text-sm text-gray-300">{ticket.pieces}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-200">
                        {formatCurrency(ticket.total)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium
                          ${ticket.status === 'completed' 
                            ? 'bg-green-900/40 text-green-400' 
                            : 'bg-yellow-900/40 text-yellow-400'
                          }`}
                        >
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel - Payment Section */}
        <div className="col-span-5 space-y-6">
          <div className="card-bevel p-6 bg-gradient-to-br from-gray-800 to-gray-900">
            <h2 className="text-xl font-semibold text-gray-200 mb-6">Payment Details</h2>
            
            {/* Selected Tickets Summary */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-lg">
                <span className="text-gray-300">Selected Tickets</span>
                <span className="text-gray-200 font-medium">{selectedTickets.length}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-lg">
                <span className="text-gray-300">Subtotal</span>
                <span className="text-gray-200 font-medium">{formatCurrency(selectedTotal)}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-lg">
                <span className="text-gray-300">Discount</span>
                <span className="text-red-400 font-medium">-{formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between items-center bg-indigo-900/30 p-4 rounded-lg">
                <span className="text-gray-200 font-medium">Final Amount</span>
                <span className="text-indigo-400 font-semibold text-lg">{formatCurrency(finalAmount)}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                className={`p-4 rounded-lg flex items-center justify-center space-x-3 transition-all ${
                  paymentMethod === 'cash' 
                    ? 'bg-green-900/40 text-green-400 ring-2 ring-green-500/50' 
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                }`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="h-5 w-5" />
                <span>Cash</span>
              </button>
              <button
                className={`p-4 rounded-lg flex items-center justify-center space-x-3 transition-all ${
                  paymentMethod === 'card' 
                    ? 'bg-blue-900/40 text-blue-400 ring-2 ring-blue-500/50' 
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                }`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard className="h-5 w-5" />
                <span>Card</span>
              </button>
              <button
                className={`p-4 rounded-lg flex items-center justify-center space-x-3 transition-all ${
                  paymentMethod === 'check' 
                    ? 'bg-purple-900/40 text-purple-400 ring-2 ring-purple-500/50' 
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                }`}
                onClick={() => setPaymentMethod('check')}
              >
                <CheckSquare className="h-5 w-5" />
                <span>Check</span>
              </button>
              <button
                className={`p-4 rounded-lg flex items-center justify-center space-x-3 transition-all ${
                  paymentMethod === 'store_credit' 
                    ? 'bg-yellow-900/40 text-yellow-400 ring-2 ring-yellow-500/50' 
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                }`}
                onClick={() => setPaymentMethod('store_credit')}
              >
                <Gift className="h-5 w-5" />
                <span>Store Credit</span>
              </button>
            </div>

            {/* Amount Tendered Section */}
            {paymentMethod === 'cash' && (
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-lg">
                  <span className="text-gray-300">Amount Tendered</span>
                  <span className="text-gray-200 font-medium">{formatCurrency(amountTendered)}</span>
                </div>
                <div className="flex justify-between items-center bg-green-900/30 p-4 rounded-lg">
                  <span className="text-gray-300">Change</span>
                  <span className="text-green-400 font-medium">{formatCurrency(change)}</span>
                </div>
              </div>
            )}

            {/* Numpad */}
            {showNumpad && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumpadClick(num)}
                    className="p-4 text-lg font-medium rounded-lg bg-gray-800/50 text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowNumpad(!showNumpad)}
                className="flex items-center justify-center space-x-2 p-4 rounded-lg bg-gray-800/50 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                {showNumpad ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                <span>{showNumpad ? 'Hide Numpad' : 'Show Numpad'}</span>
              </button>
              <button
                onClick={handlePayment}
                className="flex items-center justify-center space-x-2 p-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedTickets.length === 0}
              >
                <DollarSign className="h-5 w-5" />
                <span>Process Payment</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}