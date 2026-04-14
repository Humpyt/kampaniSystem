import React from 'react';
import { Trash2 } from 'lucide-react';
import { CartItem } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface CartItemCardProps {
  item: CartItem;
  onEdit: (item: CartItem) => void;
  onRemove: (id: string) => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({ item, onEdit, onRemove }) => {
  return (
    <div
      onClick={() => onEdit(item)}
      className="bg-white rounded-lg hover:shadow-md transition-all border border-gray-200 group p-3"
    >
      {/* Line 1: Category + Price + Trash */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800 text-sm truncate">{item.category}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-emerald-600 font-bold text-sm">{formatCurrency(item.price)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
            className="p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
          </button>
        </div>
      </div>

      {/* Line 2: Color • Brand • Material • Description (single line) */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 flex-wrap">
        {item.color && <span>{item.color}</span>}
        {item.color && item.brand && <span>•</span>}
        {item.brand && <span>{item.brand}</span>}
        {(item.color || item.brand) && item.material && <span>•</span>}
        {item.material && <span>{item.material}</span>}
        {item.shortDescription && (item.color || item.brand || item.material) && <span>•</span>}
        {item.shortDescription && <span className="italic text-gray-400 truncate max-w-[100px]">{item.shortDescription}</span>}
      </div>

      {/* Line 3: Memos + Services (single line) */}
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        {item.memos.slice(0, 2).map((memo, idx) => (
          <span key={idx} className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded font-medium">
            {memo}
          </span>
        ))}
        {item.memos.length > 2 && (
          <span className="text-[10px] text-gray-400">+{item.memos.length - 2}</span>
        )}
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
