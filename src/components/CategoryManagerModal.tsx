import React, { useState } from 'react';
import { X, Edit2, Trash2, FolderOpen, AlertCircle } from 'lucide-react';
import type { Service } from '../contexts/ServiceContext';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  onRenameCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (categoryName: string, reassignTo?: string) => Promise<void>;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  services,
  onRenameCategory,
  onDeleteCategory
}) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get unique categories with counts
  const categories = React.useMemo(() => {
    const catMap = new Map<string, number>();
    services.forEach(service => {
      const cat = service.category || 'other';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
    return Array.from(catMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [services]);

  const handleRename = async (oldName: string) => {
    if (!newCategoryName.trim()) return;

    setIsProcessing(true);
    try {
      await onRenameCategory(oldName, newCategoryName.trim().toLowerCase());
      setEditingCategory(null);
      setNewCategoryName('');
    } catch (error) {
      console.error('Failed to rename category:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    setIsProcessing(true);
    try {
      await onDeleteCategory(deletingCategory, reassignTo || undefined);
      setDeletingCategory(null);
      setReassignTo('');
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FolderOpen className="text-indigo-400 mr-2" />
              Manage Categories
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Categories List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {categories.map(category => (
              <div
                key={category.name}
                className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
              >
                {editingCategory === category.name ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="text"
                      defaultValue={category.name}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 bg-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(category.name);
                        if (e.key === 'Escape') {
                          setEditingCategory(null);
                          setNewCategoryName('');
                        }
                      }}
                      disabled={isProcessing}
                    />
                    <button
                      onClick={() => handleRename(category.name)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setNewCategoryName('');
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                      disabled={isProcessing}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-medium capitalize">
                        {category.name}
                      </span>
                      <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-full">
                        {category.count} service{category.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingCategory(category.name);
                          setNewCategoryName(category.name);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Rename category"
                        disabled={isProcessing}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingCategory(category.name)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete category"
                        disabled={category.count === 0 || isProcessing}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Info Message */}
          <div className="mt-4 p-3 bg-indigo-900/30 rounded-lg flex items-start space-x-2">
            <AlertCircle size={20} className="text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-200">
              Categories are created automatically when you add a service with a new category name.
              Use the controls above to rename or delete existing categories.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              Delete Category: {deletingCategory}
            </h3>

            <div className="space-y-4">
              {categories.find(c => c.name === deletingCategory)?.count ?? 0 > 0 ? (
                <>
                  <p className="text-gray-300">
                    This category has {categories.find(c => c.name === deletingCategory)?.count} service(s).
                    Please select a category to reassign them to:
                  </p>
                  <select
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  >
                    <option value="">Select a category...</option>
                    {categories
                      .filter(c => c.name !== deletingCategory)
                      .map(cat => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)} ({cat.count} services)
                        </option>
                      ))}
                  </select>
                </>
              ) : (
                <p className="text-gray-300">
                  Are you sure you want to delete this category? It has no services.
                </p>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setDeletingCategory(null);
                    setReassignTo('');
                  }}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={
                    ((categories.find(c => c.name === deletingCategory)?.count ?? 0) > 0 && !reassignTo) ||
                    isProcessing
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Deleting...' : 'Delete Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryManagerModal;
