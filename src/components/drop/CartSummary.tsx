import React from 'react';
import { ShoppingCart, Check, Eye, Package, Sparkles } from 'lucide-react';
import { CartItem as CartItemType } from '../../types';
import CartItem from './CartItem';
import { formatCurrency } from '../../utils/formatCurrency';

interface CartSummaryProps {
  items: CartItemType[];
  ticketNumber: string;
  onRemoveItem: (id: string) => void;
  onComplete: () => void;
  disabled?: boolean;
  previewItem?: CartItemType | null;
  onPriceChange?: (price: number) => void;
  onDone?: (item: CartItemType) => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  ticketNumber,
  onRemoveItem,
  onComplete,
  disabled = false,
  previewItem = null,
  onPriceChange,
  onDone,
}) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;
  const isDisabled = disabled || itemCount === 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Drop Cart</h3>
              <p className="text-slate-400 text-xs">Ticket: {ticketNumber}</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg">
            <span className="text-white font-bold text-lg">{itemCount}</span>
            <span className="text-slate-400 text-xs ml-1">items</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Items list */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
          {items.length === 0 && !previewItem ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">No items yet</p>
              <p className="text-gray-300 text-xs mt-1">Add items from the form</p>
            </div>
          ) : (
            <>
              {/* Preview item - shows what's being built */}
              {previewItem && (
                <div className="mb-4 p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-indigo-600 font-semibold text-sm">Now Building</span>
                  </div>
                  <CartItem item={previewItem} onRemove={() => {}} isPreview />
                  {/* Price input for preview */}
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <label className="text-xs text-indigo-600 font-medium mb-1.5 block">Set Price (UGX)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          placeholder="0"
                          value={previewItem.price || ''}
                          onChange={(e) => onPriceChange?.(parseInt(e.target.value, 10) || 0)}
                          className="w-full pl-4 pr-16 py-3 bg-white rounded-xl text-gray-800 font-bold text-lg placeholder-gray-300 border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">UGX</span>
                      </div>
                      <button
                        onClick={() => previewItem && onDone?.(previewItem)}
                        disabled={!previewItem.price || previewItem.price === 0}
                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Actual cart items */}
              {items.map((item, index) => (
                <CartItem key={item.id} item={item} onRemove={onRemoveItem} index={index + 1} />
              ))}
            </>
          )}
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 font-medium">Subtotal</span>
            <span className="text-gray-400 text-sm">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between items-center bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 rounded-xl">
            <span className="text-gray-800 font-bold">Total</span>
            <span className="text-emerald-600 font-extrabold text-2xl">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Complete button */}
        <button
          onClick={onComplete}
          disabled={isDisabled}
          className={`
            w-full mt-4 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 shadow-md
            ${isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
            }
          `}
        >
          <Check className="w-5 h-5" />
          COMPLETE DROP
        </button>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default CartSummary;
