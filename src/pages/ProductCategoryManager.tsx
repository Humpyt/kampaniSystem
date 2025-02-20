import React, { useState, useRef } from 'react';
import { PlusCircle, Edit2, Trash2, ArrowLeft, Image as ImageIcon, DollarSign, Tag, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProducts, Category, Product } from '../contexts/ProductContext';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  currentImageUrl?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, currentImageUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div
      onClick={handleImageClick}
      className="relative w-full h-48 bg-indigo-900/50 rounded-lg cursor-pointer hover:bg-indigo-800/50 transition-colors"
    >
      {currentImageUrl ? (
        <img
          src={currentImageUrl}
          alt="Product"
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <ImageIcon size={40} className="text-indigo-300 mb-2" />
          <span className="text-indigo-300">Click to upload image</span>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

const ProductCategoryManager: React.FC = () => {
  const {
    categories,
    products,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory
  } = useProducts();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    imageUrl: ''
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    description: '',
    imageUrl: '',
    categoryId: '',
    inStock: true,
    featured: false
  });

  const handleImageUpload = async (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    if (isAddingCategory || editingCategory) {
      setNewCategory(prev => ({ ...prev, imageUrl }));
    } else if (isAddingProduct || editingProduct) {
      setNewProduct(prev => ({ ...prev, imageUrl }));
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    addCategory(newCategory);
    setNewCategory({ name: '', description: '', imageUrl: '' });
    setIsAddingCategory(false);
  };

  const handleAddProduct = () => {
    if (!newProduct.name.trim() || newProduct.price <= 0 || !selectedCategory) {
      toast.error('Please fill in all required fields');
      return;
    }

    addProduct({ ...newProduct, categoryId: selectedCategory });
    setNewProduct({
      name: '',
      price: 0,
      description: '',
      imageUrl: '',
      categoryId: '',
      inStock: true,
      featured: false
    });
    setIsAddingProduct(false);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(productId);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/sales-items" className="text-indigo-300 hover:text-indigo-200 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-white">Product & Category Management</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsAddingCategory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Tag size={20} />
            Add Category
          </button>
          <button
            onClick={() => {
              if (!selectedCategory) {
                toast.error('Please select a category first');
                return;
              }
              setIsAddingProduct(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            <Box size={20} />
            Add Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Categories Sidebar */}
        <div className="col-span-3 bg-indigo-900/30 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-indigo-200">Categories</h2>
          <div className="space-y-2">
            {categories.map(category => (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-800/50 text-indigo-200 hover:bg-indigo-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <span className="text-sm opacity-75">{category.productCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-span-9 space-y-6">
          {/* Add/Edit Forms */}
          {(isAddingCategory || isAddingProduct) && (
            <div className="bg-indigo-900/30 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-indigo-200">
                {isAddingCategory ? 'Add New Category' : 'Add New Product'}
              </h2>
              
              {isAddingCategory ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-indigo-200">Name</label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="w-full px-3 py-2 bg-indigo-800/50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                        placeholder="Enter category name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-indigo-200">Description</label>
                      <input
                        type="text"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        className="w-full px-3 py-2 bg-indigo-800/50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                        placeholder="Enter category description"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-indigo-200">Category Image</label>
                    <ImageUpload
                      onImageSelect={handleImageUpload}
                      currentImageUrl={newCategory.imageUrl}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Save Category
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategory({ name: '', description: '', imageUrl: '' });
                      }}
                      className="px-4 py-2 bg-indigo-800/50 text-white rounded-lg hover:bg-indigo-700/50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-indigo-200">Name</label>
                      <input
                        type="text"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="w-full px-3 py-2 bg-indigo-800/50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-indigo-200">Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-indigo-400">
                          <DollarSign size={20} />
                        </span>
                        <input
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                          className="w-full pl-10 pr-3 py-2 bg-indigo-800/50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-indigo-200">Description</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full px-3 py-2 bg-indigo-800/50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-indigo-200">Product Image</label>
                    <ImageUpload
                      onImageSelect={handleImageUpload}
                      currentImageUrl={newProduct.imageUrl}
                    />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newProduct.inStock}
                        onChange={(e) => setNewProduct({ ...newProduct, inStock: e.target.checked })}
                        className="mr-2 bg-indigo-800/50 border-indigo-500"
                      />
                      <span className="text-indigo-200">In Stock</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newProduct.featured}
                        onChange={(e) => setNewProduct({ ...newProduct, featured: e.target.checked })}
                        className="mr-2 bg-indigo-800/50 border-indigo-500"
                      />
                      <span className="text-indigo-200">Featured</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddProduct}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Save Product
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingProduct(false);
                        setNewProduct({
                          name: '',
                          price: 0,
                          description: '',
                          imageUrl: '',
                          categoryId: '',
                          inStock: true,
                          featured: false
                        });
                      }}
                      className="px-4 py-2 bg-indigo-800/50 text-white rounded-lg hover:bg-indigo-700/50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products Grid */}
          {selectedCategory && (
            <div className="grid grid-cols-3 gap-6">
              {getProductsByCategory(selectedCategory).map(product => (
                <div
                  key={product.id}
                  className="bg-indigo-900/30 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-48">
                    <img
                      src={product.imageUrl || 'https://via.placeholder.com/300x200'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.featured && (
                      <span className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-sm font-medium">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                      <span className="text-xl font-bold text-indigo-300">${product.price.toFixed(2)}</span>
                    </div>
                    <p className="text-indigo-200 text-sm mb-4">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${product.inStock ? 'text-green-400' : 'text-red-400'}`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 text-indigo-300 hover:text-white transition-colors"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-indigo-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCategoryManager;