import React from 'react';
import { X, Tag, Palette, Info } from 'lucide-react';
import { CartItem as CartItemType } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface CartItemProps {
  item: CartItemType;
  onRemove: (id: string) => void;
  isPreview?: boolean;
  index?: number;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemove, isPreview = false, index }) => {
  // Build line 2: compressed comma-separated values
  const line2Parts: string[] = [];
  if (item.color) line2Parts.push(item.color);
  if (item.brand) line2Parts.push(item.brand);
  if (item.material) line2Parts.push(item.material);

  return (
    <div className={`rounded-xl p-4 transition-all duration-200 ${isPreview ? 'bg-white border-2 border-indigo-200 shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        {/* Left: Index number or icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isPreview ? 'bg-indigo-100' : index ? 'bg-slate-700' : 'bg-gray-200'}`}>
          {isPreview ? (
            <Tag className="w-4 h-4 text-indigo-600" />
          ) : index ? (
            <span className="text-white font-bold text-sm">{index}</span>
          ) : (
            <Info className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {/* Center: Content */}
        <div className="flex-1 min-w-0">
          {/* Category */}
          <div className="font-bold text-gray-800 text-base leading-tight">
            {item.category}
          </div>

          {/* Details row */}
          {line2Parts.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Palette className="w-3 h-3 text-gray-400" />
              <span className="text-gray-500 text-xs">{line2Parts.join(' • ')}</span>
            </div>
          )}

          {/* Description */}
          {item.shortDescription && (
            <div className="text-gray-600 text-xs mt-1 italic">
              {item.shortDescription}
            </div>
          )}

          {/* Memos as pills */}
          {item.memos.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.memos.slice(0, 3).map((memo, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                  {memo}
                </span>
              ))}
              {item.memos.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                  +{item.memos.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Services */}
          {item.services.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              {item.services.map((svc, idx) => (
                <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span>{svc.service}</span>
                  {svc.variation && <span className="text-gray-400">• {svc.variation}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Price and remove */}
        <div className="flex flex-col items-end justify-between h-full">
          <div className="font-bold text-emerald-600 text-lg leading-tight">
            {formatCurrency(item.price)}
          </div>
          {!isPreview && (
            <button
              onClick={() => onRemove(item.id)}
              className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors group"
              aria-label="Remove item"
            >
              <X className="w-4 h-4 text-red-400 group-hover:text-red-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItem;
