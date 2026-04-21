import React from 'react';
import { Printer } from 'lucide-react';
import { printerService, type ReceiptData } from '../services/printer';
import { formatCurrency } from '../utils/formatCurrency';

interface ReceiptProps {
  data: ReceiptData;
  onPrint?: () => void;
}

export function Receipt({ data, onPrint }: ReceiptProps) {
  const handlePrint = async () => {
    try {
      await printerService.printReceipt(data);
      onPrint?.();
    } catch (error) {
      console.error('Failed to print receipt:', error);
    }
  };

  // Calculate balance if paid amount is provided
  const totalPaid = (data as any).totalPaid || data.total;
  const balance = data.total - totalPaid;

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-md mx-auto p-6">
      <div className="space-y-4 font-mono text-sm">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold">Kampani Shoes and Bag Clinic</h2>
          <p>FORESTMALL, KAMPALA, Uganda</p>
        </div>

        {/* Order Info */}
        <div className="text-center">
          <p className="font-bold">{data.orderNumber} - Customer Copy</p>
        </div>

        {/* Customer Info Block */}
        <div className="border-t border-b border-gray-200 py-2">
          <p>{data.customerName} {data.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} {data.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
          <p>DEF DEF KAMPANISTS-TWO</p>
          <p>, KAMPALA, Uganda</p>
          {data.customerPhone && (
            <p>Acct: N/A Tel ({data.customerPhone})</p>
          )}
        </div>

        {/* Items */}
        <div className="space-y-2">
          {data.items.map((item, index) => (
            <div key={index}>
              <p className="font-bold">1 {item.description} Ush{item.price}</p>
              <p className="text-gray-600">1 PIECES</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-2">
          <div className="flex justify-between">
            <p>SubTotal:</p>
            <p>Ush{data.subtotal}</p>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <p>Total:</p>
            <p>Ush{data.total}</p>
          </div>
          <div className="flex justify-between">
            <p>Paid Amount:</p>
            <p>Ush{totalPaid}</p>
          </div>
          <div className="flex justify-between font-bold">
            <p>Balance:</p>
            <p>Ush{balance}</p>
          </div>
        </div>

        {/* Promised Date */}
        {data.promisedDate && (
          <div className="text-center border-t border-gray-200 pt-2">
            <p className="font-bold">
              {data.promisedDate.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/(\d{2})\/(\d{2})\/(\d{4})/, (m, d, mo, y) => d + '/' + mo + '/' + y)} {data.promisedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="font-bold text-lg">REG/PICKUP</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center border-t border-gray-200 pt-2">
          <p>Thank You for Your Business</p>
          <p className="text-sm text-gray-600">Store Hours Mon-Fri:8:00AM - 6:30PM</p>
          <p className="text-sm text-gray-600">Saturday: 8:30AM - 5:00PM</p>
        </div>
      </div>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
      >
        <Printer className="h-5 w-5" />
        Print Receipt
      </button>
    </div>
  );
}
