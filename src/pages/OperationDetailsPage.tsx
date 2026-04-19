import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Package, Clock, DollarSign, User, CheckCircle, Wrench, Truck, Home, CreditCard, FileText, Tag } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { format } from 'date-fns';

// Helper function to safely format dates
const safeFormat = (date: string | Date | null | undefined, formatStr: string) => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';
    return format(dateObj, formatStr);
  } catch {
    return 'N/A';
  }
};

export default function OperationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [operation, setOperation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const fetchOperation = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_ENDPOINTS.operations}/${id}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setOperation(data);
        } else {
          setOperation(null);
        }
      } catch (error) {
        console.error('Error fetching operation:', error);
        setOperation(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOperation();
    }
  }, [id]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (id) {
        try {
          const response = await fetch(`${API_ENDPOINTS.operations}/${id}/payments`);
          if (response.ok) {
            const paymentsData = await response.json();
            setPayments(paymentsData);
          }
        } catch (error) {
          console.error('Error fetching payments:', error);
        }
      }
    };

    fetchPayments();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Operation Not Found</h1>
          <p className="text-gray-400 mb-4">The requested operation could not be found.</p>
          <Link
            to="/operation"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Operations
          </Link>
        </div>
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = (operation.totalAmount || 0) - totalPaid;
  const isPaidOff = balance <= 0;

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Pending' },
      held: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Held' },
      in_progress: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'In Progress' },
      ready: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', label: 'Ready' },
      completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Completed' },
      picked_up: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Picked Up' },
    };
    return configs[status] || { bg: 'bg-gray-500/10', text: 'text-gray-400', label: status };
  };

  const statusConfig = getStatusConfig(operation.status);

  // Collect all flags
  const flags = [];
  if (operation.isNoCharge) flags.push({ icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'No Charge' });
  if (operation.isDoOver) flags.push({ icon: Wrench, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Do Over' });
  if (operation.isDelivery) flags.push({ icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Delivery' });
  if (operation.isPickup) flags.push({ icon: Home, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Pickup' });
  if ((operation as any).discount > 0) flags.push({ icon: Tag, color: 'text-pink-400', bg: 'bg-pink-500/10', label: `Discount` });

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Operations</span>
      </button>

      {/* Hero Header */}
      <div className="card-bevel p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">
                  Ticket #{operation.id?.slice(-6).toUpperCase()}
                </h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Created {safeFormat(operation.createdAt, 'MMM d, yyyy')} at {safeFormat(operation.createdAt, 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Flags */}
          {flags.length > 0 && (
            <div className="flex items-center gap-2">
              {flags.map((flag, i) => (
                <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${flag.bg} ${flag.color}`}>
                  <flag.icon className="w-3.5 h-3.5" />
                  {flag.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="card-bevel p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Customer</h2>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-white">{operation.customer?.name || 'N/A'}</p>
              <p className="text-sm text-gray-400">{operation.customer?.phone || 'No phone'}</p>
              {operation.customer?.email && (
                <p className="text-sm text-gray-500">{operation.customer.email}</p>
              )}
            </div>
          </div>

          {/* Shoes & Services */}
          <div className="card-bevel p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Items ({operation.shoes?.length || 0})
              </h2>
            </div>
            <div className="space-y-3">
              {operation.shoes?.map((shoe: any, index: number) => (
                <div key={shoe.id || index} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{shoe.category || 'Unknown Item'}</p>
                      <p className="text-xs text-gray-500">{shoe.color || 'No color'}</p>
                    </div>
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                  </div>
                  {shoe.services && shoe.services.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-500 mb-2">Services</p>
                      <div className="flex flex-wrap gap-1.5">
                        {shoe.services.map((service: any, sIndex: number) => (
                          <span key={service.id || sIndex} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                            {service.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {operation.notes && (
            <div className="card-bevel p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Notes</h2>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{operation.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="card-bevel p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPaidOff ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                <CreditCard className={`w-4 h-4 ${isPaidOff ? 'text-emerald-400' : 'text-rose-400'}`} />
              </div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Payment Summary</h2>
            </div>

            {/* Balance Display */}
            <div className={`rounded-xl p-4 mb-4 ${isPaidOff ? 'bg-emerald-500/10' : 'bg-gray-800/50'}`}>
              <p className={`text-xs font-medium mb-1 ${isPaidOff ? 'text-emerald-400' : 'text-gray-400'}`}>
                {isPaidOff ? 'PAID OFF' : 'BALANCE DUE'}
              </p>
              <p className={`text-3xl font-bold ${isPaidOff ? 'text-emerald-400' : 'text-white'}`}>
                {formatCurrency(balance)}
              </p>
              {isPaidOff && (
                <p className="text-xs text-emerald-400/70 mt-1">All payments complete</p>
              )}
            </div>

            {/* Payment Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Amount</span>
                <span className="text-white font-medium">{formatCurrency(operation.totalAmount || 0)}</span>
              </div>
              {(operation as any).discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Discount</span>
                  <span className="text-pink-400 font-medium">-{formatCurrency((operation as any).discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount Paid</span>
                <span className="text-emerald-400 font-medium">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="h-px bg-gray-700 my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Remaining</span>
                <span className={`font-semibold ${isPaidOff ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="card-bevel p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Payments ({payments.length})
              </h2>
            </div>

            {payments.length > 0 ? (
              <div className="space-y-2">
                {payments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between py-2.5 border-b border-gray-700/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white capitalize">
                          {payment.payment_method?.replace('_', ' ') || 'Payment'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {safeFormat(payment.created_at, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-emerald-400">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-sm text-gray-400">No payments recorded</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="card-bevel p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Timeline</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <div className="flex-1">
                  <p className="text-sm text-white">Created</p>
                  <p className="text-xs text-gray-500">{safeFormat(operation.createdAt, 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
              {operation.updatedAt !== operation.createdAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <div className="flex-1">
                    <p className="text-sm text-white">Last Updated</p>
                    <p className="text-xs text-gray-500">{safeFormat(operation.updatedAt, 'MMM d, yyyy h:mm a')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
