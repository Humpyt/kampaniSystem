import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Calendar, Download, Eye, FileArchive, Receipt, Search } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ReceiptRow {
  id: string;
  operationId: string;
  type: 'invoice' | 'receipt';
  ticketNumber: string | null;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  amountPaid: number;
  paymentMethod: string | null;
  createdAt: string;
  pdfFileName: string | null;
  pdfUrl: string | null;
  downloadUrl: string | null;
  pdfStoredAt: string | null;
}

export default function InvoicesPage() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    const handleDropCompleted = () => {
      fetchReceipts();
    };
    window.addEventListener('drop-completed', handleDropCompleted);
    return () => window.removeEventListener('drop-completed', handleDropCompleted);
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(`${API_ENDPOINTS.invoices}?${params.toString()}`);
      setReceipts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
      toast.error('Failed to load receipts and tickets');
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter((receipt) => {
    const needle = searchTerm.toLowerCase();
    return (
      receipt.customerName.toLowerCase().includes(needle) ||
      receipt.invoiceNumber.toLowerCase().includes(needle) ||
      (receipt.ticketNumber || '').toLowerCase().includes(needle)
    );
  });

  const openPdf = (url: string | null) => {
    if (!url) {
      toast.error('Stored PDF not available');
      return;
    }
    window.open(url, '_blank');
  };

  const downloadPdf = (url: string | null) => {
    if (!url) {
      toast.error('Stored PDF not available');
      return;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Receipts & Tickets</h1>
          <p className="text-sm text-gray-400">Archive of payment receipts and order tickets</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-right">
          <div className="text-xs uppercase tracking-widest text-emerald-300">Archive</div>
          <div className="text-lg font-semibold text-white">{filteredReceipts.length} records</div>
        </div>
      </div>

      <div className="card-bevel mb-6 p-4">
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, document number, or ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={fetchReceipts}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Refresh Archive
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 py-2 pl-10 pr-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 py-2 pl-10 pr-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={fetchReceipts}
            className="rounded-lg bg-gray-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="card-bevel overflow-hidden">
        <div className="max-h-[560px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-800/90 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Document #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Ticket</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Type</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Stored PDF</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    Loading archive...
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt, index) => (
                  <tr
                    key={receipt.id}
                    className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} transition-colors hover:bg-gray-700`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{receipt.customerName}</div>
                      <div className="text-xs text-gray-500">{receipt.customerPhone || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Receipt size={15} className={receipt.type === 'receipt' ? 'text-emerald-400' : 'text-amber-400'} />
                        <span className="font-mono text-sm text-indigo-400">{receipt.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300">{receipt.ticketNumber || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-1 text-xs font-medium uppercase tracking-wide ${receipt.type === 'receipt' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {receipt.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-white">{formatCurrency(receipt.total)}</div>
                      <div className="text-xs text-emerald-400">Paid {formatCurrency(receipt.amountPaid)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileArchive size={15} className="text-emerald-400" />
                        <div>
                          <div className="text-sm text-white">{receipt.pdfFileName || 'Pending'}</div>
                          <div className="text-xs text-gray-500">
                            {receipt.pdfStoredAt ? `Stored ${new Date(receipt.pdfStoredAt).toLocaleString()}` : 'Not stored yet'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-400">
                        {new Date(receipt.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openPdf(receipt.pdfUrl)}
                          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-indigo-500/10 hover:text-indigo-400"
                          title="View PDF"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => downloadPdf(receipt.downloadUrl)}
                          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
                          title="Download PDF"
                        >
                          <Download size={16} />
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
    </div>
  );
}
