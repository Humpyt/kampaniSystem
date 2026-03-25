import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useServices } from '../contexts/ServiceContext';
import type { Service } from '../contexts/ServiceContext';

interface ServiceCRUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: ServiceFormData) => Promise<void>;
  service?: Service | null;
  mode: 'add' | 'edit';
}

export interface ServiceFormData {
  name: string;
  price: number;
  category: string;
  estimated_days?: number;
  description?: string;
}

const ServiceCRUDModal: React.FC<ServiceCRUDModalProps> = ({
  isOpen,
  onClose,
  onSave,
  service,
  mode
}) => {
  const { services } = useServices();

  // Get unique categories
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(
      services.map(s => s.category || 'other')
    );
    return Array.from(uniqueCategories).sort();
  }, [services]);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    price: 0,
    category: 'other',
    estimated_days: 3,
    description: ''
  });

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens or service changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && service) {
        setFormData({
          name: service.name || '',
          price: service.price || 0,
          category: service.category || 'other',
          estimated_days: service.estimated_days || 3,
          description: service.description || ''
        });
      } else {
        setFormData({
          name: '',
          price: 0,
          category: 'other',
          estimated_days: 3,
          description: ''
        });
      }
      setIsCreatingCategory(false);
      setNewCategoryName('');
    }
  }, [isOpen, mode, service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      alert('Service name is required');
      return;
    }

    if (formData.price <= 0) {
      alert('Price must be greater than 0');
      return;
    }

    if (!formData.category.trim()) {
      alert('Category is required');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      // Reset form after successful save
      setFormData({
        name: '',
        price: 0,
        category: 'other',
        estimated_days: 3,
        description: ''
      });
      setIsCreatingCategory(false);
      setNewCategoryName('');
    } catch (error) {
      console.error('Failed to save service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ServiceFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">
            {mode === 'edit' ? 'Edit Service' : 'Add New Service'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Service Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="e.g., Leather Sole Replacement"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Price (UGX) *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="e.g., 50000"
              min="0"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Category *
            </label>
            {!isCreatingCategory ? (
              <div className="flex space-x-2">
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm"
                >
                  + New
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="New category name"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCategoryName.trim()) {
                      handleInputChange('category', newCategoryName.trim().toLowerCase());
                      setIsCreatingCategory(false);
                    }
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setNewCategoryName('');
                  }}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Estimated Days */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Estimated Days
            </label>
            <input
              type="number"
              value={formData.estimated_days}
              onChange={(e) => handleInputChange('estimated_days', parseInt(e.target.value) || 3)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="e.g., 3"
              min="1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Optional description"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors
                disabled:bg-gray-600 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : mode === 'edit' ? 'Update Service' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceCRUDModal;
