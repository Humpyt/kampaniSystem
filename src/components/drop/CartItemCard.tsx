import React, { useState } from 'react';
import { Trash2, Pencil, Check } from 'lucide-react';
import { CartItem } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface CartItemCardProps {
  item: CartItem;
  onEdit: (item: CartItem) => void;
  onRemove: (id: string) => void;
  onPriceChange?: (price: number) => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({ item, onEdit, onRemove, onPriceChange }) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState(item.price);

  const handlePriceSave = () => {
    if (onPriceChange && editedPrice !== item.price) {
      onPriceChange(editedPrice);
    }
    setIsEditingPrice(false);
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePriceSave();
    } else if (e.key === 'Escape') {
      setEditedPrice(item.price);
      setIsEditingPrice(false);
    }
  };

  return (
    <div
      onClick={() => !isEditingPrice && onEdit(item)}
      className="bg-white rounded-lg hover:shadow-md transition-all border border-gray-200 group p-3"
    >
      {/* Line 1: Category + Price + Trash */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {item.category === 'Product' ? (
            <>
              <div className="font-bold text-gray-800 text-sm truncate">{item.shortDescription}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">product</div>
            </>
          ) : (
            <div className="font-bold text-gray-800 text-sm truncate">{item.category}</div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isEditingPrice ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editedPrice}
                onChange={(e) => setEditedPrice(parseInt(e.target.value, 10) || 0)}
                onKeyDown={handlePriceKeyDown}
                onBlur={handlePriceSave}
                autoFocus
                className="w-20 px-2 py-1 text-gray-800 font-bold text-sm bg-gray-100 rounded border border-gray-300 focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={(e) => { e.stopPropagation(); handlePriceSave(); }}
                className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              </button>
            </div>
          ) : (
            <>
              <span className="text-gray-800 font-bold text-sm">{formatCurrency(item.price)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditingPrice(true); setEditedPrice(item.price); }}
                className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                className="p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Line 2: Color • Brand • Material • Description (single line) */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 flex-wrap">
        {item.color && <span>{item.color}</span>}
        {item.color && item.brand && <span>•</span>}
        {item.brand && <span>{item.brand}</span>}
        {(item.color || item.brand) && item.material && <span>•</span>}
        {item.material && <span>{item.material}</span>}
        {item.shortDescription && item.category !== 'Product' && (item.color || item.brand || item.material) && <span>•</span>}
        {item.shortDescription && item.category !== 'Product' && <span className="italic text-gray-400 truncate max-w-[100px]">{item.shortDescription}</span>}
      </div>

      {/* Line 3: Memos + Services */}
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {item.memos.map((memo, idx) => (
          <span key={idx} className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded font-medium">
            {memo}
          </span>
        ))}
        {item.services.map((svc, idx) => (
          <span key={idx} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] rounded font-medium">
            {svc.service}{svc.variation && `: ${svc.variation}`}
          </span>
        ))}
      </div>
    </div>
  );
};

export default CartItemCard;
