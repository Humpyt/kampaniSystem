import React, { useEffect, useState } from 'react';
import { ShoppingCart, Check, Package, Sparkles, DollarSign, Smartphone, CreditCard, Wallet } from 'lucide-react';
import { CartItem as CartItemType } from '../../types';
import CartItemCard from './CartItemCard';
import { formatCurrency } from '../../utils/formatCurrency';

type PaymentMethod = 'cash' | 'mobile_money' | 'bank_card' | 'store_credit';

interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
}

interface CartSummaryProps {
  items: CartItemType[];
  ticketNumber: string;
  onRemoveItem: (id: string) => void;
  onComplete: (data: { payments: PaymentEntry[]; discount: number }) => void;
  disabled?: boolean;
  previewItem?: CartItemType | null;
  onPriceChange?: (price: number) => void;
  onDone?: (item: CartItemType) => void;
  onCartItemPriceChange?: (id: string, price: number) => void;
  discount?: number;
  onDiscountChange?: (discount: number) => void;
  customer?: {
    id: string;
    name: string;
    accountBalance?: number;
  } | null;
}

const PAYMENT_METHODS: { method: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { method: 'cash', label: 'Cash', icon: DollarSign },
  { method: 'mobile_money', label: 'Mobile', icon: Smartphone },
  { method: 'bank_card', label: 'Card', icon: CreditCard },
  { method: 'store_credit', label: 'Credit', icon: Wallet },
];

const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  ticketNumber,
  onRemoveItem,
  onComplete,
  disabled = false,
  previewItem = null,
  onDone,
  discount = 0,
  onDiscountChange,
  customer,
}) => {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const normalizedDiscount = Math.min(Math.max(discount, 0), subtotal);
  const total = Math.max(0, subtotal - normalizedDiscount);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [creditError, setCreditError] = useState<string | null>(null);

  useEffect(() => {
    setPaymentAmount((current) => {
      const currentValue = parseInt(current, 10) || 0;

      if (!current) {
        return '';
      }

      if (currentValue > total) {
        return total > 0 ? total.toString() : '';
      }

      return current;
    });
  }, [total]);

  useEffect(() => {
    if (items.length === 0) {
      setPaymentAmount('');
      setSelectedMethod('cash');
      setCreditError(null);
    }
  }, [items.length, ticketNumber]);

  const paidAmount = parseInt(paymentAmount, 10) || 0;
  const balance = Math.max(0, total - paidAmount);
  const itemCount = items.length;
  const availableCredit = customer?.accountBalance || 0;

  // Validate store credit when selected
  const isStoreCreditSelected = selectedMethod === 'store_credit';
  const hasInsufficientCredit = isStoreCreditSelected && paidAmount > availableCredit;
  const needsSecondPayment = isStoreCreditSelected && paidAmount < total && paidAmount <= availableCredit;

  const isDisabled = disabled || itemCount === 0 || hasInsufficientCredit || needsSecondPayment;

  const handleComplete = () => {
    // Validate store credit
    if (selectedMethod === 'store_credit') {
      if (paidAmount > availableCredit) {
        setCreditError(`Insufficient credit. Available: ${formatCurrency(availableCredit)}`);
        return;
      }
      if (paidAmount < total) {
        setCreditError(`Store credit (${formatCurrency(paidAmount)}) is less than total (${formatCurrency(total)}). Please pay the difference with another method.`);
        return;
      }
    }
    setCreditError(null);

    const payments: PaymentEntry[] = [];
    if (paidAmount > 0) {
      payments.push({ method: selectedMethod, amount: paidAmount });
    }
    onComplete({ payments, discount: normalizedDiscount });
  };

  return (
    <div className="bg-white rounded-none shadow-xl border-l border-gray-100 h-full flex flex-col w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Drop Cart</h3>
              <p className="text-slate-400 text-xs">Ticket: {ticketNumber}</p>
            </div>
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-lg">
            <span className="text-white font-bold text-lg">{itemCount}</span>
            <span className="text-slate-400 text-xs ml-1">items</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Preview item */}
        {previewItem && (
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200 overflow-hidden">
            <div className="px-3 py-2 bg-indigo-100/50 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-indigo-700 font-semibold text-xs">Now Building</span>
            </div>
            <div className="p-3">
              <CartItemCard item={previewItem} onEdit={() => {}} onRemove={() => {}} />
              <div className="mt-3 pt-3 border-t border-indigo-200">
                <label className="text-xs text-indigo-600 font-semibold mb-1.5 block">Price (UGX)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="0"
                    value={previewItem.price || ''}
                    readOnly
                    aria-readonly="true"
                    title="Service prices are controlled by the service catalog"
                    className="flex-1 pl-3 pr-3 py-2 bg-gray-100 rounded-lg text-gray-800 font-bold text-sm placeholder-gray-300 border-2 border-indigo-200 cursor-not-allowed"
                  />
                  <button
                    onClick={() => previewItem && onDone?.(previewItem)}
                    disabled={!previewItem.price || previewItem.price === 0}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold rounded-lg text-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        {items.map((item) => (
          <CartItemCard
            key={item.id}
            item={item}
            onEdit={() => {}}
            onRemove={onRemoveItem}
            onPriceChange={undefined}
          />
        ))}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="py-10 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium text-sm">No items yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0 space-y-3">
        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Subtotal</span>
            <span className="text-gray-700 font-semibold">{formatCurrency(subtotal)}</span>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-gray-500 font-medium text-sm whitespace-nowrap">Discount</label>
              <input
                type="number"
                min="0"
                max={subtotal}
                step="100"
                placeholder="Optional"
                value={normalizedDiscount > 0 ? normalizedDiscount : ''}
                onChange={(e) => {
                  const nextDiscount = Math.min(Math.max(parseInt(e.target.value, 10) || 0, 0), subtotal);
                  onDiscountChange?.(nextDiscount);
                  setCreditError(null);
                }}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 font-medium placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          <div className="h-px bg-gray-300 my-1" />
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-bold text-lg">TOTAL</span>
            <span className="text-gray-800 font-bold text-2xl">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment input - only show if items exist */}
        {items.length > 0 && (
          <>
            {/* Payment method buttons */}
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(({ method, label, icon: Icon }) => (
                <button
                  key={method}
                  onClick={() => { setSelectedMethod(method); setCreditError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                    selectedMethod === method
                      ? method === 'cash' ? 'bg-emerald-500 text-white'
                        : method === 'mobile_money' ? 'bg-blue-500 text-white'
                        : method === 'store_credit' ? 'bg-yellow-500 text-white'
                        : 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <input
              type="number"
              max={isStoreCreditSelected ? availableCredit : total}
              placeholder={isStoreCreditSelected ? "Enter credit amount to use" : "Enter amount received"}
              value={paymentAmount}
              onChange={(e) => { setPaymentAmount(e.target.value); setCreditError(null); }}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-800 font-bold text-lg placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
            />

            {/* Available credit notice when store_credit is selected */}
            {isStoreCreditSelected && (
              <div className="text-xs text-yellow-600 font-medium">
                Available Credit: {formatCurrency(availableCredit)}
              </div>
            )}

            {/* Credit error */}
            {creditError && (
              <div className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {creditError}
              </div>
            )}

            {/* Second payment notice */}
            {needsSecondPayment && (
              <div className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Remaining {formatCurrency(total - paidAmount)} must be paid with another method
              </div>
            )}

            {/* Balance info */}
            {paidAmount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Paid</span>
                <span className="text-emerald-600 font-bold">{formatCurrency(paidAmount)}</span>
              </div>
            )}
            {balance > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Balance</span>
                <span className="text-amber-600 font-bold">{formatCurrency(balance)}</span>
              </div>
            )}
          </>
        )}

        {/* Complete Button */}
        <button
          onClick={handleComplete}
          disabled={isDisabled}
          className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
            isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg'
          }`}
        >
          <Check className="w-5 h-5" />
          COMPLETE DROP
        </button>
      </div>
    </div>
  );
};

export default CartSummary;
