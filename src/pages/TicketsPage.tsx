import React, { useState } from 'react';
import { Tag, Search, Filter, Plus, Package, Clock, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import TicketTemplate from '../components/TicketTemplate';
import TagTemplate from '../components/TagTemplate';

interface Ticket {
  id: string;
  tagNumber: string;
  customerName: string;
  itemType: 'shoe' | 'bag' | 'other';
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'ready';
  dateReceived: string;
  estimatedCompletion: string;
  price: number;
  priority: 'normal' | 'rush' | 'express';
}

const mockTickets: Ticket[] = [
  {
    id: '1',
    tagNumber: 'A1234',
    customerName: 'John Smith',
    itemType: 'shoe',
    description: 'Black leather shoes - heel repair',
    status: 'in-progress',
    dateReceived: '2024-03-15',
    estimatedCompletion: '2024-03-17',
    price: 85.00,
    priority: 'rush'
  },
  {
    id: '2',
    tagNumber: 'B5678',
    customerName: 'Sarah Johnson',
    itemType: 'bag',
    description: 'Brown leather handbag - zipper repair',
    status: 'pending',
    dateReceived: '2024-03-15',
    estimatedCompletion: '2024-03-18',
    price: 45.00,
    priority: 'normal'
  }
];

const getStatusColor = (status: Ticket['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-600';
    case 'in-progress':
      return 'bg-indigo-600';
    case 'completed':
      return 'bg-emerald-600';
    case 'ready':
      return 'bg-blue-600';
    default:
      return 'bg-gray-600';
  }
};

export default function TicketsPage() {
  const [tickets] = useState<Ticket[]>(mockTickets);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Ticket['status']>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTagPreview, setShowTagPreview] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">Tickets & Tags</h1>
          <button
            className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600 flex items-center gap-2"
            onClick={() => setShowTagPreview(true)}
          >
            <Tag size={16} />
            Print Tags
          </button>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search tickets..."
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          
          <select
            className="bg-gray-800 text-white px-4 py-2 rounded-lg"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="ready">Ready</option>
          </select>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-emerald-500 font-mono">{ticket.tagNumber}</span>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
              <div className="text-white font-semibold mb-1">{ticket.customerName}</div>
              <div className="text-gray-400 text-sm mb-2">{ticket.description}</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Due: {ticket.estimatedCompletion}</span>
                <span className="text-emerald-500">{formatCurrency(ticket.price)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Print Preview Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 max-w-4xl w-full">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Print Preview</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedTicket(null)}
              >
                Close
              </button>
            </div>
            <TicketTemplate
              ticketNumber={selectedTicket.tagNumber}
              customerName={selectedTicket.customerName}
              customerAddress="247 Hoym St, Fort Lee"
              customerPhone="(201)592-6257"
              items={[
                {
                  name: selectedTicket.itemType === 'shoe' ? "Men's Golf" : "Women's Sneaker",
                  quantity: 1,
                  price: selectedTicket.price,
                  description: selectedTicket.description
                }
              ]}
              readyDate={new Date(selectedTicket.estimatedCompletion)}
              storeInfo={{
                name: "Arbelsoft Inc",
                address: "454 Main St Suite 6, Fort Lee NJ 07024",
                phone: "(201) 555-1212"
              }}
            />
            <div className="mt-4 flex justify-end">
              <button
                className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600"
                onClick={() => window.print()}
              >
                Print Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Preview Modal */}
      {showTagPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 max-w-4xl w-full">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Print Tags</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowTagPreview(false)}
              >
                Close
              </button>
            </div>
            <TagTemplate
              tagNumber="01-135187"
              services={[
                "Heels - Cut Down",
                "Clean - Regular",
                "Stitch - Left 5"
              ]}
              orderNumber="100"
            />
            <div className="mt-4 flex justify-end">
              <button
                className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600"
                onClick={() => window.print()}
              >
                Print Tags
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}