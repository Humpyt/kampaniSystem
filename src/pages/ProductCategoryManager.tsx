import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Edit2, Trash2, ArrowLeft, Image as ImageIcon, DollarSign, Tag, Box, AlertCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { categoryService, productService, Category, Product } from '../services/productService';
import { uploadImage } from '../services/imageService';
import debounce from 'lodash/debounce';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
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

  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    return products
      .map(product => ({
        ...product,
        ...optimisticUpdates[product.id]
      }))
      .filter(product => 
        searchTerm 
          ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase())
          : true
      );
  }, [products, optimisticUpdates, searchTerm]);

  const debouncedSearch = useCallback(
    debounce((term: string) => setSearchTerm(term), 300),
    []
  );

  const handleOptimisticUpdate = useCallback((id: string, updates: any) => {
    setOptimisticUpdates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  }, []);

  const clearOptimisticUpdate = useCallback((id: string) => {
    setOptimisticUpdates(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleToggleFeature = async (productId: string, featured: boolean) => {
    handleOptimisticUpdate(productId, { featured });
    try {
      await productService.updateProduct(productId, { featured });
    } catch (err) {
      handleApiError(err);
      clearOptimisticUpdate(productId);
    }
  };

  const handleToggleStock = async (productId: string, inStock: boolean) => {
    handleOptimisticUpdate(productId, { inStock });
    try {
      await productService.updateProduct(productId, { inStock });
    } catch (err) {
      handleApiError(err);
      clearOptimisticUpdate(productId);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setLoading(true);
      const imageUrl = await uploadImage(
        file, 
        isAddingCategory ? 'categories' : 'products'
      );
      
      if (isAddingCategory) {
        setNewCategory(prev => ({ ...prev, imageUrl }));
      } else if (isAddingProduct || editingProduct) {
        setNewProduct(prev => ({ ...prev, imageUrl }));
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (err: any) => {
    const errorMessage = err.response?.data?.error || err.message || 'An unexpected error occurred';
    setError(errorMessage);
    toast.error(errorMessage);
  };

  useEffect(() => {
    if (editingProduct) {
      setNewProduct({
        name: editingProduct.name,
        price: editingProduct.price,
        description: editingProduct.description,
        imageUrl: editingProduct.imageUrl,
        categoryId: editingProduct.categoryId,
        inStock: editingProduct.inStock,
        featured: editingProduct.featured
      });
      setIsAddingProduct(true);
    }
  }, [editingProduct]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await categoryService.getAllCategories();
        setCategories(data);
      } catch (err) {
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (selectedCategory) {
        try {
          setLoading(true);
          const data = await productService.getProductsByCategory(selectedCategory);
          setProducts(data);
        } catch (err) {
          handleApiError(err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProducts();
  }, [selectedCategory]);

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setLoading(true);
      const createdCategory = await categoryService.createCategory(newCategory);
      setCategories(prev => [...prev, createdCategory]);
      toast.success('Category added successfully');
      setNewCategory({ name: '', description: '', imageUrl: '' });
      setIsAddingCategory(false);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || newProduct.price <= 0 || !selectedCategory) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (editingProduct) {
        const updatedProduct = await productService.updateProduct(editingProduct.id, {
          ...newProduct,
          categoryId: selectedCategory
        });
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        toast.success('Product updated successfully');
      } else {
        const createdProduct = await productService.createProduct({
          ...newProduct,
          categoryId: selectedCategory
        });
        setProducts(prev => [...prev, createdProduct]);
        toast.success('Product added successfully');
      }

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
      setEditingProduct(null);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && window.confirm(
      `Are you sure you want to delete "${product.name}"?\nThis action cannot be undone.`
    )) {
      try {
        setLoading(true);
        await productService.deleteProduct(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
        
        if (editingProduct?.id === productId) {
          setEditingProduct(null);
          setIsAddingProduct(false);
        }
        
        toast.success('Product deleted successfully');
      } catch (err) {
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-4 text-red-400 hover:text-red-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Add loading overlay for operations
  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      )}
      
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
                  {isAddingCategory ? 'Add New Category' : editingProduct ? 'Edit Product' : 'Add New Product'}
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
                        {editingProduct ? 'Update Product' : 'Save Product'}
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
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search size={20} className="text-indigo-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    onChange={(e) => debouncedSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-indigo-900/30 border border-indigo-800/50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder-indigo-400"
                  />
                </div>
                {searchTerm && (
                  <p className="text-indigo-400">
                    Found {filteredProducts.length} results
                  </p>
                )}
              </div>
            )}

            {selectedCategory && (
              <div className="grid grid-cols-3 gap-6">
                {filteredProducts.map(product => (
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleStock(product.id, !product.inStock)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              product.inStock
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                          >
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </button>
                          <button
                            onClick={() => handleToggleFeature(product.id, !product.featured)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              product.featured
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                            }`}
                          >
                            {product.featured ? 'Featured' : 'Not Featured'}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="relative p-2 text-indigo-300 hover:text-blue-400 hover:bg-blue-900/20 rounded-full overflow-hidden transition-all duration-300 group active:scale-95 transform focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-indigo-900"
                            aria-label="Edit product"
                          >
                            <span className="absolute inset-0 bg-blue-500/10 scale-0 group-hover:scale-100 transition-transform duration-200 rounded-full"></span>
                            <span className="absolute inset-0 bg-blue-400/20 scale-0 group-active:scale-100 transition-transform duration-200 rounded-full origin-center"></span>
                            <Edit2 
                              size={20} 
                              className="relative z-10 transform group-hover:scale-110 group-active:rotate-12 transition-transform duration-200" 
                            />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                              Edit "{product.name}"
                            </span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="relative p-2 text-indigo-300 hover:text-red-400 hover:bg-red-900/20 rounded-full overflow-hidden transition-all duration-300 group active:scale-95 transform focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-indigo-900"
                            aria-label="Delete product"
                            data-tooltip="Delete this product"
                          >
                            <span className="absolute inset-0 bg-red-500/10 scale-0 group-hover:scale-100 transition-transform duration-200 rounded-full"></span>
                            <span className="absolute inset-0 bg-red-400/20 scale-0 group-active:scale-100 transition-transform duration-200 rounded-full origin-center"></span>
                            <Trash2 
                              size={20} 
                              className="relative z-10 transform group-hover:rotate-12 group-active:rotate-45 transition-transform duration-200" 
                            />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                              Delete "{product.name}"
                            </span>
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
    </div>
  );
};

export default ProductCategoryManager;