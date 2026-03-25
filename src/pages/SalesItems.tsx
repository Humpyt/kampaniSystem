import React, { useState } from 'react';
import { ShoppingCart, Minus, Plus, Printer, X, Scan, Search, Tag, Package, DollarSign, Plus as PlusIcon, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddProductModal from '../components/AddProductModal';
import { useProducts } from '../contexts/ProductContext';
import { formatCurrency } from '../utils/formatCurrency';

interface CartItem {
  item: {
    id: string;
    name: string;
    price: number;
    categoryId: string;
    imageUrl?: string;
  };
  quantity: number;
}

const SalesItems: React.FC = () => {
  const { products, categories } = useProducts();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [discountOrUpcharge, setDiscountOrUpcharge] = useState(0);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [isTaxable, setIsTaxable] = useState(false);
  const [isReceipt, setIsReceipt] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryUsage, setCategoryUsage] = useState({});

  const handleAddToCart = (item: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.item.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { item, quantity: 1 }];
    });
    updateTotals();
  };

  const updateTotals = () => {
    const newSubtotal = cart.reduce((sum, item) => sum + (item.quantity * item.item.price), 0);
    const newTax = isTaxable ? newSubtotal * 0.07 : 0; // 7% tax rate
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newSubtotal + newTax + discountOrUpcharge);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = products.find(item => item.id === barcodeInput);
    if (item) {
      handleAddToCart(item);
      setBarcodeInput('');
    }
  };

  const filteredItems = selectedCategory
    ? products.filter(item => item.categoryId === selectedCategory)
    : products;

  const handleAddCategory = (categoryName: string) => {
    // Implement add category logic
  };

  const handleRemoveCategory = (categoryId: string) => {
    setDeleteCategoryId(categoryId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteCategory = () => {
    if (deleteCategoryId) {
      const categoryUsageCount = categoryUsage[deleteCategoryId];
      if (categoryUsageCount > 0) {
        alert(`Cannot delete category with ${categoryUsageCount} items assigned`);
      } else {
        // Implement delete category logic
        setIsDeleteModalOpen(false);
        setDeleteCategoryId(null);
      }
    }
  };

  const handleUpdateCategory = (categoryId: string, categoryName: string) => {
    // Implement update category logic
  };

  const handleTaxableClick = () => {
    setIsTaxable(!isTaxable);
    updateTotals();
  };

  const handleReceiptClick = () => {
    setIsReceipt(!isReceipt);
  };

  const updateCategoryUsage = () => {
    const usage: { [categoryId: string]: number } = {};
    products.forEach(item => {
      if (usage[item.categoryId]) {
        usage[item.categoryId]++;
      } else {
        usage[item.categoryId] = 1;
      }
    });
    setCategoryUsage(usage);
  };

  React.useEffect(() => {
    updateCategoryUsage();
  }, [products]);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="card-bevel p-6 mb-6 bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center space-x-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/manage-categories"
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Tag size={18} />
              <span>Manage Categories</span>
            </Link>

            <button
              onClick={() => setShowCart(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <DollarSign size={18} />
              <span>Discount</span>
            </button>

            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ShoppingCart size={18} />
              <span>Cart ({cart.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="card-bevel p-6 mb-6 bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="flex justify-between items-center">
          <div className="flex space-x-8">
            <div>
              <span className="text-gray-400">Subtotal</span>
              <div className="text-white">{formatCurrency(subtotal)}</div>
            </div>
            <div>
              <span className="text-gray-400">Discount/Upcharge</span>
              <div className="text-white">{formatCurrency(discountOrUpcharge)}</div>
            </div>
            <div>
              <span className="text-gray-400">Tax</span>
              <div className="text-white">{formatCurrency(tax)}</div>
            </div>
            <div>
              <span className="text-gray-400">Total</span>
              <div className="text-green-500 font-bold">{formatCurrency(total)}</div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleTaxableClick}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isTaxable
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>Taxable</span>
            </button>
            <button
              onClick={handleReceiptClick}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isReceipt
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="p-4 grid grid-cols-10 gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`p-3 text-gray-200 rounded-lg transition-colors ${
              selectedCategory === category.id
                ? 'bg-indigo-600'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-5 gap-4">
          {filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleAddToCart(item)}
              className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
            >
              <div className="aspect-square bg-gray-700 relative overflow-hidden">
                <img
                  src={item.imageUrl || '/placeholder.png'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-white font-medium text-lg mb-2">{item.name}</h3>
                <p className="text-green-500 font-bold">
                  {formatCurrency(item.price)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div
        className={`fixed right-0 top-0 h-screen w-96 bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl transform transition-transform duration-300 ${
          showCart ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-200">Shopping Cart</h2>
            <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-4 mb-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-4">
                  <img
                    src={item.item.imageUrl || '/placeholder.png'}
                    alt={item.item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <div className="font-medium text-gray-200">{item.item.name}</div>
                    <div className="text-sm text-gray-400">
                      {formatCurrency(item.item.price)} x {item.quantity}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setCart(prevCart =>
                        prevCart.map((cartItem, i) =>
                          i === index
                            ? { ...cartItem, quantity: Math.max(1, cartItem.quantity - 1) }
                            : cartItem
                        )
                      );
                      updateTotals();
                    }}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-medium text-gray-200">{item.quantity}</span>
                  <button
                    onClick={() => {
                      setCart(prevCart =>
                        prevCart.map((cartItem, i) =>
                          i === index
                            ? { ...cartItem, quantity: cartItem.quantity + 1 }
                            : cartItem
                        )
                      );
                      updateTotals();
                    }}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-700">
            <button
              onClick={() => console.log('Checkout button clicked')}
              disabled={cart.length === 0}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ShoppingCart size={20} />
              <span>Complete Purchase</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Category Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 w-96 border border-gray-700">
            <h2 className="text-lg font-bold text-gray-200 mb-2">Confirm Delete Category</h2>
            <p className="text-gray-400 mb-4">Are you sure you want to delete this category?</p>
            {categoryUsage[deleteCategoryId] > 0 && (
              <p className="text-red-400 mb-4">
                Warning: This category has {categoryUsage[deleteCategoryId]} items assigned.
              </p>
            )}
            <div className="flex justify-between">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-700 text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteCategory}
                className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        categories={categories.map(category => category.name)}
        onSave={(product) => {
          // Add the new product to the items list
          const newItem = {
            id: String(products.length + 1),
            name: product.name,
            price: product.price,
            categoryId: product.category,
            imageUrl: product.image || undefined
          };
          // Implement add product logic
          setIsAddProductModalOpen(false);
        }}
      />
    </div>
  );
};

export default SalesItems;
