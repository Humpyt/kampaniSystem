import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useProducts } from '../contexts/ProductContext';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose }) => {
  const { categories, addProduct } = useProducts();
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [product, setProduct] = useState({
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    category: categories[0].id,
    type: 'product',
    price: 0,
    stock: 0,
    description: '',
    image: '',
    sku: '',
    barcode: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setProduct({ ...product, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateBarcode = () => {
    // Generate a random 12-digit number for demonstration
    const barcode = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    setProduct({ ...product, barcode });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      name: product.name,
      price: product.price,
      categoryId: product.category,
      imageUrl: product.image,
      inStock: true,
      featured: false,
      description: product.description
    });
    onClose();
    // Reset form
    setCurrentStep(1);
    setImagePreview(null);
    setProduct({
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      category: categories[0].id,
      type: 'product',
      price: 0,
      stock: 0,
      description: '',
      image: '',
      sku: '',
      barcode: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Add New Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-600 text-5xl">
                      <X size={48} />
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <X size={24} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) =>
                      setProduct({ ...product, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select
                    value={product.category}
                    onChange={(e) =>
                      setProduct({ ...product, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price</label>
                  <div className="relative">
                    <X size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={product.price}
                      onChange={(e) =>
                        setProduct({
                          ...product,
                          price: parseFloat(e.target.value)
                        })
                      }
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Stock</label>
                  <div className="relative">
                    <X size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) =>
                        setProduct({
                          ...product,
                          stock: parseInt(e.target.value)
                        })
                      }
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={product.description}
                    onChange={(e) =>
                      setProduct({ ...product, description: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">SKU</label>
                  <div className="relative">
                    <X size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={product.sku}
                      onChange={(e) =>
                        setProduct({ ...product, sku: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Barcode</label>
                  <div className="relative">
                    <X size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={product.barcode}
                      onChange={(e) =>
                        setProduct({ ...product, barcode: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={generateBarcode}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-indigo-500 hover:text-indigo-400"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">Preview</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white ml-2">{product.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white ml-2">{categories.find((category) => category.id === product.category)?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white ml-2">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Stock:</span>
                    <span className="text-white ml-2">{product.stock}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
          )}
          <div className="ml-auto">
            <button
              onClick={
                currentStep === 3
                  ? handleSubmit
                  : () => setCurrentStep(currentStep + 1)
              }
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
            >
              {currentStep === 3 ? 'Add Product' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
