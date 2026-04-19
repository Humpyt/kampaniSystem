import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { CartItem } from '../../types';

interface EditItemModalProps {
  item: CartItem;
  onSave: (item: CartItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ item, onSave, onDelete, onClose }) => {
  const [editedItem, setEditedItem] = useState<CartItem>(item);

  useEffect(() => {
    setEditedItem(item);
  }, [item]);

  const handleSave = () => {
    onSave(editedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h3 className="text-white font-bold text-lg">Edit Item</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Category (read-only) */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Category</label>
            <div className="text-white font-medium">{editedItem.category}</div>
          </div>

          {editedItem.category !== 'Product' && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Shoe Size</label>
              <input
                type="text"
                value={editedItem.size || ''}
                onChange={(e) => setEditedItem({ ...editedItem, size: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm border border-gray-600 focus:border-indigo-500 outline-none"
              />
            </div>
          )}

          {/* Color */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Color</label>
            <input
              type="text"
              value={editedItem.color}
              onChange={(e) => setEditedItem({ ...editedItem, color: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm border border-gray-600 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Brand</label>
            <input
              type="text"
              value={editedItem.brand}
              onChange={(e) => setEditedItem({ ...editedItem, brand: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm border border-gray-600 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Material */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Material</label>
            <input
              type="text"
              value={editedItem.material}
              onChange={(e) => setEditedItem({ ...editedItem, material: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm border border-gray-600 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Price */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Price (UGX)</label>
            <input
              type="number"
              value={editedItem.price}
              onChange={(e) => setEditedItem({ ...editedItem, price: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm border border-gray-600 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-700">
          <button
            onClick={() => { onDelete(item.id); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;
