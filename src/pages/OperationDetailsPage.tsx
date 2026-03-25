import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Package, Clock, DollarSign, User, CheckCircle, Wrench, Truck, Home } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { useOperation } from '../contexts/OperationContext';
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
  const { operations } = useOperation();
  const [operation, setOperation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const foundOperation = operations.find(op => op.id === id);
    if (foundOperation) {
      setOperation(foundOperation);
    }
    setLoading(false);
  }, [id, operations]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (id) {
        try {
          const response = await fetch(`http://localhost:3000/api/operations/${id}/payments`);
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
        <div className="text-white text-xl">Loading...</div>
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

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      held: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-purple-500/20 text-purple-400',
      completed: 'bg-green-500/20 text-green-400',
      picked_up: 'bg-gray-500/20 text-gray-400',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Operation Details</h1>
            <p className="text-gray-400">Ticket #{operation.id?.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(operation.status)}`}>
            {operation.status?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-indigo-400" />
            Customer Information
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Name</p>
              <p className="text-white font-medium">{operation.customer?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Phone</p>
              <p className="text-white font-medium">{operation.customer?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Email</p>
              <p className="text-white font-medium">{operation.customer?.email || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Operation Details */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-indigo-400" />
            Operation Details
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Created</p>
              <p className="text-white font-medium">
                {safeFormat(operation.createdAt, 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Last Updated</p>
              <p className="text-white font-medium">
                {safeFormat(operation.updatedAt, 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Amount</p>
              {(operation as any).discount && (operation as any).discount > 0 ? (
                <div>
                  <p className="text-sm text-gray-400 line-through">
                    {formatCurrency((operation.totalAmount || 0) + ((operation as any).discount || 0))}
                  </p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(operation.totalAmount || 0)}
                  </p>
                  <p className="text-sm text-pink-400">
                    Discount: -{formatCurrency((operation as any).discount || 0)}
                  </p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(operation.totalAmount || 0)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Special Flags */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-indigo-400" />
            Special Flags
          </h2>
          <div className="space-y-2">
            {operation.isNoCharge && (
              <div className="flex items-center text-yellow-400">
                <DollarSign className="w-4 h-4 mr-2" />
                <span>No Charge</span>
              </div>
            )}
            {operation.isDoOver && (
              <div className="flex items-center text-orange-400">
                <Wrench className="w-4 h-4 mr-2" />
                <span>Do Over</span>
              </div>
            )}
            {operation.isDelivery && (
              <div className="flex items-center text-blue-400">
                <Truck className="w-4 h-4 mr-2" />
                <span>Delivery</span>
              </div>
            )}
            {operation.isPickup && (
              <div className="flex items-center text-green-400">
                <Home className="w-4 h-4 mr-2" />
                <span>Pickup</span>
              </div>
            )}
            {(operation as any).discount && (operation as any).discount > 0 && (
              <div className="flex items-center text-pink-400">
                <span className="font-semibold mr-2">%</span>
                <span>Discount Applied ({formatCurrency((operation as any).discount || 0)})</span>
              </div>
            )}
            {!operation.isNoCharge && !operation.isDoOver && !operation.isDelivery && !operation.isPickup && !(operation as any).discount && (
              <p className="text-gray-400">No special flags</p>
            )}
          </div>
        </div>

        {/* Shoes and Services */}
        <div className="lg:col-span-3 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Shoes & Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operation.shoes?.map((shoe: any, index: number) => (
              <div key={shoe.id || index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="mb-3">
                  <p className="text-gray-400 text-sm">Shoe #{index + 1}</p>
                  <p className="text-white font-medium">{shoe.category || 'Unknown'}</p>
                  <p className="text-gray-300 text-sm">{shoe.color || 'No color specified'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Services:</p>
                  {shoe.services && shoe.services.length > 0 ? (
                    <ul className="space-y-1">
                      {shoe.services.map((service: any, sIndex: number) => (
                        <li key={service.id || sIndex} className="text-sm text-white">
                          • {service.name} - {formatCurrency(service.price || 0)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">No services</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {operation.notes && (
          <div className="lg:col-span-3 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Notes</h2>
            <p className="text-gray-300">{operation.notes}</p>
          </div>
        )}

        {/* Payment History */}
        <div className="lg:col-span-3 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-400" />
            Payment History
          </h2>

          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-700 rounded-lg p-4">
                  <div>
                    <p className="text-white font-medium capitalize">
                      {payment.payment_method.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {safeFormat(payment.created_at, 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-400">
                      {formatCurrency(payment.amount)}
                    </p>
                    {payment.transaction_id && (
                      <p className="text-xs text-gray-500">
                        Ref: {payment.transaction_id}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <div className="mt-4 pt-4 border-t border-gray-600 flex justify-between">
                <span className="text-gray-400">Total Paid:</span>
                <span className="text-xl font-bold text-green-400">
                  {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>No payments recorded yet</p>
            </div>
          )}

          {/* Remaining Balance */}
          {operation && (
            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Amount:</span>
                <span className="text-white font-medium">{formatCurrency(operation.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Amount Paid:</span>
                <span className="text-green-400 font-medium">{formatCurrency(operation.paidAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Remaining Balance:</span>
                <span className={operation.paidAmount >= operation.totalAmount ? "text-green-400" : "text-red-400"} font-medium>
                  {formatCurrency((operation.totalAmount || 0) - (operation.paidAmount || 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
