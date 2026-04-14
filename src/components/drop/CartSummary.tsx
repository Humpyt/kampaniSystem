import React from 'react';
import { ShoppingCart, Check, Package, Sparkles } from 'lucide-react';
import { CartItem as CartItemType } from '../../types';
import CartItemCard from './CartItemCard';
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

      {/* Footer - totals and action */}
      <div className="border-t border-gray-100 p-3 bg-gray-50 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 text-sm">Total</span>
          <span className="text-emerald-600 font-bold text-xl">{formatCurrency(total)}</span>
        </div>
        <button
          onClick={onComplete}
          disabled={isDisabled}
          className={`
            w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all
            ${isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'
            }
          `}
        >
          <Check className="w-4 h-4" />
          COMPLETE DROP
        </button>
      </div>
    </div>
  );
};

export default CartSummary;
