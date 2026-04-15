import React, { useState } from 'react';
import { ShoppingCart, Check, Package, Sparkles, DollarSign, Smartphone, CreditCard, Clock } from 'lucide-react';
import { CartItem as CartItemType } from '../../types';
import CartItemCard from './CartItemCard';
import { formatCurrency } from '../../utils/formatCurrency';

type PaymentTiming = 'prepay' | 'postpay';
type PaymentMethod = 'cash' | 'mobile_money' | 'bank_card';

interface CartSummaryProps {
  items: CartItemType[];
  ticketNumber: string;
  onRemoveItem: (id: string) => void;
  onComplete: (data: { timing: PaymentTiming; method?: PaymentMethod }) => void;
  disabled?: boolean;
  previewItem?: CartItemType | null;
  onPriceChange?: (price: number) => void;
  onDone?: (item: CartItemType) => void;
  onCartItemPriceChange?: (id: string, price: number) => void;
}

const PAYMENT_ICONS = {
  cash: DollarSign,
  mobile_money: Smartphone,
  bank_card: CreditCard,
};

const PAYMENT_LABELS = {
  cash: 'Cash',
  mobile_money: 'Mobile',
  bank_card: 'Card',
};

const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  ticketNumber,
  onRemoveItem,
  onComplete,
  disabled = false,
  previewItem = null,
  onPriceChange,
  onDone,
  onCartItemPriceChange,
}) => {
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>('postpay');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;
  const isDisabled = disabled || itemCount === 0;

  const handleComplete = () => {
    if (paymentTiming === 'postpay') {
      onComplete({ timing: 'postpay' });
    } else {
      onComplete({ timing: 'prepay', method: selectedPayment || undefined });
    }
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

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Preview item */}
        {previewItem && (
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200 overflow-hidden">
            <div className="px-3 py-2 bg-indigo-100/50 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-indigo-700 font-semibold text-xs">Now Building</span>
            </div>
            <div className="p-3">
              <CartItemCard
                item={previewItem}
                onEdit={() => {}}
                onRemove={() => {}}
              />
              <div className="mt-3 pt-3 border-t border-indigo-200">
                <label className="text-xs text-indigo-600 font-semibold mb-1.5 block">Set Price (UGX)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="0"
                    value={previewItem.price || ''}
                    onChange={(e) => onPriceChange?.(parseInt(e.target.value, 10) || 0)}
                    className="flex-1 pl-3 pr-3 py-2 bg-white rounded-lg text-gray-800 font-bold text-sm placeholder-gray-300 border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => previewItem && onDone?.(previewItem)}
                    disabled={!previewItem.price || previewItem.price === 0}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items section */}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onEdit={() => {}}
                onRemove={onRemoveItem}
                onPriceChange={onCartItemPriceChange ? (price) => onCartItemPriceChange(item.id, price) : undefined}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="py-10 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium text-sm">No items yet</p>
            <p className="text-gray-300 text-xs mt-1">Add items from the form</p>
          </div>
        )}
      </div>

      {/* Footer - totals, payment, and action */}
      <div className="border-t-2 border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0 space-y-3">
        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-bold text-lg">TOTAL</span>
          <span className="text-gray-800 font-bold text-2xl">{formatCurrency(total)}</span>
        </div>

        {/* Payment Timing Toggle */}
        {items.length > 0 && (
          <>
            {/* Prepay / Postpay Toggle */}
            <div className="flex gap-1.5 p-1 bg-gray-200 rounded-xl">
              <button
                onClick={() => { setPaymentTiming('prepay'); setSelectedPayment(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  paymentTiming === 'prepay'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                PREPAY
              </button>
              <button
                onClick={() => { setPaymentTiming('postpay'); setSelectedPayment(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  paymentTiming === 'postpay'
                    ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg'
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                POST-PAY
              </button>
            </div>

            {/* Payment Methods - Only show for PREPAY */}
            {paymentTiming === 'prepay' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Payment Method</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(PAYMENT_ICONS) as PaymentMethod[]).map((method) => {
                    const Icon = PAYMENT_ICONS[method];
                    const isSelected = selectedPayment === method;
                    return (
                      <button
                        key={method}
                        onClick={() => setSelectedPayment(method)}
                        className={`
                          flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all text-xs font-medium
                          ${isSelected
                            ? method === 'cash' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                              : method === 'mobile_money' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                              : 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 mb-0.5" />
                        <span>{PAYMENT_LABELS[method]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Postpay Notice */}
            {paymentTiming === 'postpay' && (
              <div className="bg-slate-100 rounded-lg px-3 py-2 text-center">
                <span className="text-slate-600 text-xs font-medium">Payment collected on pickup</span>
              </div>
            )}
          </>
        )}

        {/* Complete Button */}
        <button
          onClick={handleComplete}
          disabled={isDisabled}
          className={`
            w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all
            ${isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : paymentTiming === 'prepay'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/20'
                : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 shadow-lg shadow-slate-500/20'
            }
          `}
        >
          <Check className="w-4 h-4" />
          {paymentTiming === 'prepay' && selectedPayment
            ? `PAY ${formatCurrency(total)} & COMPLETE`
            : paymentTiming === 'prepay'
              ? 'SELECT PAYMENT METHOD'
              : 'COMPLETE DROP'}
        </button>
      </div>
    </div>
  );
};

export default CartSummary;
