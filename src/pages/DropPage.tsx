import React, { useState, useEffect } from 'react';
import { Search, Plus, X, User, Pencil, Check, ShoppingBag } from 'lucide-react';
import { useOperation } from '../contexts/OperationContext';
import { useCustomer } from '../contexts/CustomerContext';
import { useRetailProducts, type RetailProduct } from '../contexts/RetailProductContext';
import { useAuthStore } from '../store/authStore';
import type { Customer, CartItem, DropFormState } from '../types';
import PillChip from '../components/drop/PillChip';
import StepSection from '../components/drop/StepSection';
import EditItemModal from '../components/drop/EditItemModal';
import CartSummary from '../components/drop/CartSummary';
import TicketBadge from '../components/drop/TicketBadge';
import ProductSalesSection from '../components/drop/ProductSalesSection';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

// Item categories with icons
interface ItemCategory {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: ItemCategory[] = [
  { id: 'womens-high-heel', name: "Women's High Heel", icon: '👠' },
  { id: 'womens-flat', name: "Women's Flat", icon: '🥿' },
  { id: 'womens-dress-boot', name: "Women's Dress Boot", icon: '👢' },
  { id: 'womens-sneaker', name: "Women's Sneaker", icon: '👟' },
  { id: 'mens-dress', name: "Men's Dress", icon: '👞' },
  { id: 'mens-half-boot', name: "Men's Half Boot", icon: '🥾' },
  { id: 'mens-sneaker', name: "Men's Sneaker", icon: '👟' },
  { id: 'mens-work', name: "Men's Work", icon: '🥾' },
  { id: 'mens-western', name: "Men's Western", icon: '👢' },
  { id: 'mens-riding', name: "Men's Riding", icon: '🥾' },
  { id: 'bag', name: "Bag", icon: '👜' },
  { id: 'other', name: "Other", icon: '🔧' }
];

// Color option interface
interface ColorOption {
  id: string;
  name: string;
  hexCode: string;
  isRainbow?: boolean;
}

const BRANDS = [
  "Carolina Herrera", "Celine", "Chanel", "Chloé", "Christian Dior", "Christian Louboutin",
  "Church's", "Clarks", "Cole Haan", "Columbia", "Converse", "Crocs", "Dansko", "DC Shoes",
  "Diesel", "DKNY", "Dolce & Gabbana", "Dr. Martens", "Dune London", "ECCO",
  "Eileen Fisher", "Emilio Pucci", "Emporio Armani", "Etnies", "Fendi", "Fila",
  "Florsheim", "Franco Sarto", "Frye", "GANT", "Geox", "Giorgio Armani", "Giuseppe Zanotti",
  "Givenchy", "Golden Goose", "Gucci", "Guess", "Hermès", "HOKA", "Hogan", "Hunter",
  "Hush Puppies", "Isaac Mizrahi", "Isabel Marant", "Jack Rogers", "J.Crew",
  "Jessica Simpson", "Jimmy Choo", "Johnston & Murphy", "Juicy Couture", "Karl Lagerfeld",
  "Kate Spade", "Keds", "Kenneth Cole", "K-Swiss", "Lacoste", "Lanvin", "L.L. Bean",
  "Loewe", "Louis Vuitton", "Madden Girl", "Maison Margiela", "Manolo Blahnik",
  "Marc Jacobs", "Marni", "Merrell", "Michael Kors", "Minnetonka", "Miu Miu",
  "Mizuno", "Moschino", "Naturalizer", "New Balance", "Nike", "Nine West", "Oakley",
  "Off-White", "On Running", "Oscar de la Renta", "Paco Rabanne", "Paul Smith",
  "Prada", "Puma", "Ralph Lauren", "Reebok", "Rick Owens", "Roberto Cavalli",
  "Rockport", "Saint Laurent", "Salvatore Ferragamo", "Saucony", "Skechers",
  "Sperry", "Stella McCartney", "Steve Madden", "Stuart Weitzman", "Superga",
  "Ted Baker", "Teva", "Timberland", "Tod's", "Tommy Hilfiger", "TOMS", "Tory Burch",
  "UGG", "Under Armour", "Valentino", "Vans", "Veja", "Versace", "Vince Camuto",
  "Wolverine", "Y-3", "Zegna"
];

const MATERIALS = [
  "Canvas", "Fabric", "Nubuck", "Leather", "Patent Leather", "Satin", "Suede"
];

const MEMOS = [
  "Broken Button", "Damaged Hardware", "Damaged Material", "Damaged Ornament",
  "Missing Button", "Missing Hardware", "Missing Ornament", "Delicate",
  "Broken Zipper", "Discolored", "Faded Color", "Faded/Removed Plate",
  "ASAP", "Rush", "Special Attention"
];

const SERVICES = [
  { name: "Elastic", estimatedPrice: 15000 },
  { name: "Glue", estimatedPrice: 10000 },
  { name: "Hardware", estimatedPrice: 20000 },
  { name: "Heel", estimatedPrice: 25000 },
  { name: "Heel Fix", estimatedPrice: 30000 },
  { name: "Insoles", estimatedPrice: 20000 },
  { name: "Misc", estimatedPrice: 15000 },
  { name: "Pad", estimatedPrice: 12000 },
  { name: "Patches", estimatedPrice: 25000 },
  { name: "Rips", estimatedPrice: 20000 },
  { name: "Sling", estimatedPrice: 15000 },
  { name: "Stitch", estimatedPrice: 20000 },
  { name: "Straps", estimatedPrice: 18000 },
  { name: "Stretch", estimatedPrice: 20000 },
  { name: "Tassels", estimatedPrice: 15000 },
  { name: "Zipper", estimatedPrice: 25000 }
];

const SERVICE_VARIATIONS = [
  "New Left", "New Pair", "New Right", "Shorten Left", "Shorten Pair", "Shorten Right"
];

type StepName = 'customer' | 'category' | 'color' | 'brand' | 'material' | 'description' | 'memos' | 'service' | 'variation';

const STEPS_ORDER: StepName[] = ['customer', 'category', 'color', 'brand', 'material', 'description', 'memos', 'service', 'variation'];

// Helper to get initial form state
const getInitialFormState = (): DropFormState => ({
  customerId: '',
  category: '',
  color: '',
  brand: '',
  material: '',
  shortDescription: '',
  memos: [],
  service: '',
  variation: '',
  price: '',
});

export default function DropPage() {
  const { cartItems, addToCart, removeFromCart, clearCart, updateCartItem, ticketNumber, fetchTicketNumber } = useOperation();
  const { customers, addCustomer } = useCustomer();

  const [form, setForm] = useState<DropFormState>(getInitialFormState());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [activeStep, setActiveStep] = useState<StepName>('customer');
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [showProducts, setShowProducts] = useState(false);
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [brandPage, setBrandPage] = useState(0);
  const [customBrand, setCustomBrand] = useState('');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  // Product handlers
  const handleProductSelect = (product: RetailProduct, customPrice?: number) => {
    const item: CartItem = {
      id: crypto.randomUUID(),
      category: 'Product',
      color: '',
      brand: product.category,
      material: '',
      shortDescription: product.name,
      memos: [],
      services: [],
      price: customPrice || product.price,
    };
    addToCart(item);
    toast.success(`Added ${product.name} to cart`);
  };

  const handleEditProduct = (product: RetailProduct) => {
    toast.info('Product editing coming soon');
  };

  const handleDeleteProduct = (id: string) => {
    toast.info('Product deletion coming soon');
  };

  const handleAddProduct = () => {
    toast.info('Product creation coming soon');
  };

  // Fetch ticket number and colors on mount
  useEffect(() => {
    setTicketLoading(true);
    fetchTicketNumber().finally(() => setTicketLoading(false));
  }, [fetchTicketNumber]);

  // Fetch colors from API
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch('/api/colors');
        if (response.ok) {
          const data = await response.json();
          setColors(data);
        }
      } catch (error) {
        console.error('Failed to fetch colors:', error);
      }
    };
    fetchColors();
  }, []);

  // Build preview item from current form state
  const previewItem: CartItem | null = form.category ? {
    id: 'preview',
    category: form.category,
    color: form.color,
    brand: form.brand,
    material: form.material,
    shortDescription: form.shortDescription,
    memos: form.memos,
    services: form.service && form.variation ? [{ service: form.service, variation: form.variation }] : [],
    price: parseInt(form.price, 10) || 0,
  } : null;

  const handlePreviewPriceChange = (price: number) => {
    setForm(prev => ({ ...prev, price: price.toString() }));
  };

  const handlePreviewDone = (item: CartItem) => {
    const finalItem: CartItem = {
      ...item,
      id: crypto.randomUUID(),
    };
    handleDone(finalItem);
  };

  // Advance to next step, auto-skipping completed steps
  const advanceStep = (currentStep: StepName) => {
    const currentIndex = STEPS_ORDER.indexOf(currentStep);
    for (let i = currentIndex + 1; i < STEPS_ORDER.length; i++) {
      const nextStep = STEPS_ORDER[i];
      if (!isStepCompleted(nextStep)) {
        setActiveStep(nextStep);
        return;
      }
    }
    // All remaining steps completed - stay on current
  };

  // Edit a collapsed step - just navigate, keep form values intact
  const editStep = (step: StepName) => {
    setActiveStep(step);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setForm(prev => ({ ...prev, customerId: customer.id }));
    setShowCustomerSearch(false);
    setCustomerSearchTerm('');
    advanceStep('customer');
  };

  const handleCategorySelect = (category: string) => {
    setCustomCategory('');
    setForm(prev => ({ ...prev, category }));
    if (category !== 'Other') {
      advanceStep('category');
    }
  };

  const handleColorSelect = (color: string) => {
    setForm(prev => ({ ...prev, color }));
    advanceStep('color');
  };

  const handleBrandSelect = (brand: string) => {
    setForm(prev => ({ ...prev, brand }));
    advanceStep('brand');
  };

  const handleMaterialSelect = (material: string) => {
    setForm(prev => ({ ...prev, material }));
    advanceStep('material');
  };

  const handleDescriptionChange = (value: string) => {
    setForm(prev => ({ ...prev, shortDescription: value }));
  };

  const handleMemoToggle = (memo: string) => {
    setForm(prev => {
      const newMemos = prev.memos.includes(memo)
        ? prev.memos.filter(m => m !== memo)
        : [...prev.memos, memo];
      return { ...prev, memos: newMemos };
    });
  };

  const handleMemoContinue = () => {
    advanceStep('memos');
  };

  const handleServiceSelect = (service: string) => {
    setForm(prev => ({ ...prev, service }));
    advanceStep('service');
  };

  const handleVariationSelect = (variation: string) => {
    setForm(prev => ({ ...prev, variation }));
    advanceStep('variation');
  };

  const handlePriceChange = (value: string) => {
    setForm(prev => ({ ...prev, price: value }));
  };

  const handleAddToCart = () => {
    if (!form.category || !form.price) return;
    const item: CartItem = {
      id: crypto.randomUUID(),
      category: form.category,
      color: form.color,
      brand: form.brand,
      material: form.material,
      shortDescription: form.shortDescription,
      memos: form.memos,
      services: [{ service: form.service, variation: form.variation }],
      price: parseInt(form.price, 10) || 0,
    };
    addToCart(item);
    setForm(prev => ({
      ...prev,
      category: '',
      color: '',
      brand: '',
      material: '',
      shortDescription: '',
      memos: [],
      service: '',
      variation: '',
      price: '',
    }));
    setActiveStep('category');
    toast.success('Item added to cart');
  };

  const handleDone = (item: CartItem) => {
    addToCart(item);
    setForm(prev => ({
      ...prev,
      category: '',
      color: '',
      brand: '',
      material: '',
      shortDescription: '',
      memos: [],
      service: '',
      variation: '',
      price: '',
    }));
    setActiveStep('category');
    toast.success('Item added to cart');
  };

  const handleEditCartItem = (item: CartItem) => {
    setEditingItem(item);
  };

  const handleSaveCartItem = (updatedItem: CartItem) => {
    updateCartItem?.(updatedItem.id, updatedItem);
    setEditingItem(null);
  };

  const handleDeleteCartItem = (id: string) => {
    removeFromCart(id);
    setEditingItem(null);
  };

  const handleCartItemPriceChange = (id: string, price: number) => {
    const item = cartItems.find(i => i.id === id);
    if (item) {
      updateCartItem?.(id, { ...item, price });
    }
  };

  const handleComplete = () => {
    toast.success('Drop completed!');
    clearCart();
    setSelectedCustomer(null);
    setForm(getInitialFormState());
    setActiveStep('customer');
    fetchTicketNumber();
  };

  const handleAddNewCustomer = async (name: string, phone: string) => {
    try {
      const newCustomer = await addCustomer({
        name,
        phone,
        email: '',
        address: '',
        notes: '',
        status: 'active',
        totalOrders: 0,
        totalSpent: 0,
        lastVisit: new Date().toISOString().split('T')[0],
        loyaltyPoints: 0,
      });
      handleCustomerSelect(newCustomer);
    } catch (err) {
      toast.error('Failed to add customer');
    }
  };

  // Check if step is completed
  const isStepCompleted = (step: StepName): boolean => {
    switch (step) {
      case 'customer': return Boolean(selectedCustomer);
      case 'category': return Boolean(form.category);
      case 'color': return Boolean(form.color);
      case 'brand': return Boolean(form.brand);
      case 'material': return Boolean(form.material);
      case 'description': return Boolean(form.shortDescription);
      case 'memos': return form.memos.length > 0;
      case 'service': return Boolean(form.service);
      case 'variation': return Boolean(form.variation);
      default: return false;
    }
  };

  // Get step value for display in collapsed bar
  const getStepValue = (step: StepName): string => {
    switch (step) {
      case 'customer': return selectedCustomer?.name || '';
      case 'category': return form.category;
      case 'color': return form.color;
      case 'brand': return form.brand;
      case 'material': return form.material;
      case 'description': return form.shortDescription || '(none)';
      case 'memos': return form.memos.length > 0 ? form.memos.join(', ') : '(none)';
      case 'service': return form.service;
      case 'variation': return form.variation;
      default: return '';
    }
  };

  // Get step icon
  const getStepIcon = (step: StepName): string => {
    const icons: Record<StepName, string> = {
      customer: '👤',
      category: CATEGORIES.find(c => c.name === form.category)?.icon || '👠',
      color: '🎨',
      brand: '🏷️',
      material: '🧵',
      description: '📝',
      memos: '📋',
      service: '🔧',
      variation: '⚙️',
    };
    return icons[step];
  };

  // Render form for each step
  const renderStepForm = () => {
    switch (activeStep) {
      case 'customer':
        return (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customer..."
                value={customerSearchTerm}
                onChange={(e) => {
                  setCustomerSearchTerm(e.target.value);
                  setShowCustomerSearch(true);
                }}
                onFocus={() => setShowCustomerSearch(true)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 rounded-xl text-white placeholder-gray-400 border border-gray-600 focus:border-indigo-500 outline-none"
              />
            </div>
            {showCustomerSearch && customerSearchTerm && (
              <div className="bg-gray-700 rounded-xl border border-gray-600 overflow-hidden">
                {customers
                  .filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()))
                  .slice(0, 5)
                  .map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-600 transition-colors text-gray-200"
                    >
                      {customer.name}
                    </button>
                  ))}
              </div>
            )}
            {customerSearchTerm && !customers.some(c => c.name.toLowerCase() === customerSearchTerm.toLowerCase()) && (
              <button
                onClick={() => handleAddNewCustomer(customerSearchTerm, '')}
                className="w-full flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add &quot;{customerSearchTerm}&quot; as new customer
              </button>
            )}
            <button
              onClick={() => advanceStep('customer')}
              className="text-sm text-gray-400 hover:text-white"
            >
              Skip - No Customer
            </button>
          </div>
        );

      case 'category':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    form.category === cat.name
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  <span className="text-lg mr-1">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
            {form.category === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom category..."
                autoFocus
                value={customCategory}
                className="w-full px-4 py-3 bg-gray-700 rounded-xl text-white placeholder-gray-400 border border-gray-600 focus:border-indigo-500 outline-none"
                onChange={(e) => setCustomCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customCategory) {
                    setForm(prev => ({ ...prev, category: customCategory }));
                    advanceStep('category');
                  }
                }}
              />
            )}
            {form.category === 'Other' && customCategory && (
              <button
                onClick={() => {
                  setForm(prev => ({ ...prev, category: customCategory }));
                  advanceStep('category');
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        );

      case 'color':
        return (
          <div className="grid grid-cols-4 gap-2">
            {colors.map(color => (
              <button
                key={color.name}
                onClick={() => handleColorSelect(color.name)}
                className={`p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                  form.color === color.name
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full border-2 border-white/30"
                  style={color.isRainbow ? {
                    background: 'linear-gradient(135deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff)',
                  } : {
                    backgroundColor: color.hexCode,
                  }}
                />
                {color.name}
              </button>
            ))}
          </div>
        );

      case 'brand': {
        const filteredBrands = BRANDS.filter(b =>
          b.toLowerCase().includes(brandSearchTerm.toLowerCase())
        );
        const BRANDS_PER_PAGE = 56; // 8 cols x 7 rows
        const totalPages = Math.ceil(filteredBrands.length / BRANDS_PER_PAGE);
        const paginatedBrands = filteredBrands.slice(brandPage * BRANDS_PER_PAGE, (brandPage + 1) * BRANDS_PER_PAGE);

        const handleCustomBrandSubmit = () => {
          if (customBrand.trim()) {
            handleBrandSelect(customBrand.trim());
            setCustomBrand('');
          }
        };

        return (
          <div className="h-full flex flex-col min-h-0">
            {/* Search bar */}
            <div className="relative mb-2 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={brandSearchTerm}
                onChange={(e) => { setBrandSearchTerm(e.target.value); setBrandPage(0); }}
                placeholder="Search or enter custom brand..."
                className="w-full pl-10 pr-10 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-gray-200 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {brandSearchTerm && (
                <button
                  onClick={() => { setBrandSearchTerm(''); setBrandPage(0); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Custom brand input row */}
            <div className="flex gap-2 mb-2 flex-shrink-0">
              <input
                type="text"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomBrandSubmit()}
                placeholder="Enter custom brand..."
                className="flex-1 px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button
                onClick={handleCustomBrandSubmit}
                disabled={!customBrand.trim()}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-gray-900 text-xs font-semibold rounded-lg transition-all"
              >
                Add
              </button>
            </div>

            {/* Brand count and pagination */}
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <span className="text-xs text-gray-400">
                {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''}
                {totalPages > 1 && ` (${brandPage + 1}/${totalPages})`}
              </span>
              {totalPages > 1 && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setBrandPage(p => Math.max(0, p - 1))}
                    disabled={brandPage === 0}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-gray-300 text-xs rounded-md transition-colors"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setBrandPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={brandPage >= totalPages - 1}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-gray-300 text-xs rounded-md transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* Fixed 8-col grid */}
            <div className="flex-1 min-h-0">
              <div className="h-full grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
                {paginatedBrands.map(brand => (
                  <button
                    key={brand}
                    onClick={() => handleBrandSelect(brand)}
                    className={`group relative px-1 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center ${
                      form.brand === brand
                        ? 'bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-500 text-gray-900 shadow-lg shadow-amber-500/30'
                        : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-gray-100 border border-gray-700/50 hover:border-gray-600'
                    }`}
                  >
                    <span className="relative z-10 truncate px-1">{brand}</span>
                    {form.brand === brand && (
                      <span className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-xl" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'material':
        return (
          <div className="grid grid-cols-3 gap-2">
            {MATERIALS.map(material => (
              <button
                key={material}
                onClick={() => handleMaterialSelect(material)}
                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                  form.material === material
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                {material}
              </button>
            ))}
          </div>
        );

      case 'description':
        return (
          <div className="space-y-3">
            <textarea
              value={form.shortDescription}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Add description (optional)..."
              className="w-full px-4 py-3 bg-gray-700 rounded-xl text-white placeholder-gray-400 border border-gray-600 focus:border-indigo-500 outline-none resize-none"
              rows={3}
            />
            <button
              onClick={() => advanceStep('description')}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        );

      case 'memos':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {MEMOS.map(memo => (
                <button
                  key={memo}
                  onClick={() => handleMemoToggle(memo)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    form.memos.includes(memo)
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  {memo}
                </button>
              ))}
            </div>
            <button
              onClick={handleMemoContinue}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        );

      case 'service':
        return (
          <div className="grid grid-cols-2 gap-2">
            {SERVICES.map(svc => (
              <button
                key={svc.name}
                onClick={() => handleServiceSelect(svc.name)}
                className={`p-4 rounded-xl text-sm font-medium transition-all flex flex-col items-start ${
                  form.service === svc.name
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                <span>{svc.name}</span>
                <span className="text-xs opacity-70">USh 0</span>
              </button>
            ))}
          </div>
        );

      case 'variation':
        return (
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-2">What needs fixing?</div>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_VARIATIONS.map(v => (
                <button
                  key={v}
                  onClick={() => handleVariationSelect(v)}
                  className={`p-4 rounded-xl text-sm font-medium transition-all ${
                    form.variation === v
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            {form.variation && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-center">
                <span className="text-amber-400 text-xs">💰 Enter price in the cart →</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">NEW DROP</h1>
        {ticketLoading ? (
          <span className="text-gray-400 text-sm">Loading...</span>
        ) : ticketNumber ? (
          <TicketBadge ticketNumber={ticketNumber} />
        ) : null}
        {selectedCustomer && (
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-200 text-sm">{selectedCustomer.name}</span>
            <button
              onClick={() => {
                setSelectedCustomer(null);
                setForm(prev => ({ ...prev, customerId: '' }));
                setActiveStep('customer');
              }}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {cartItems.length > 0 && (
          <button
            onClick={() => {
              clearCart();
              setForm(getInitialFormState());
              setActiveStep('category');
            }}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Left side */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {!showProducts && (
            <>
              {/* Stepper pills for completed steps */}
              {STEPS_ORDER.filter(step => isStepCompleted(step) && step !== activeStep).length > 0 && (
                <div className="flex flex-wrap gap-2 pb-1">
                  {STEPS_ORDER.filter(step => isStepCompleted(step) && step !== activeStep).map(step => (
                    <PillChip
                      key={step}
                      icon={getStepIcon(step)}
                      value={getStepValue(step)}
                      onEdit={() => editStep(step)}
                    />
                  ))}
                </div>
              )}

              {/* Active form section */}
              <div className="flex-1 overflow-y-auto">
                <StepSection
                  title={activeStep.charAt(0).toUpperCase() + activeStep.slice(1)}
                  icon={getStepIcon(activeStep)}
                  color="border-t-indigo-500"
                  isActive={true}
                >
                  {renderStepForm()}
                </StepSection>
              </div>
            </>
          )}

          {/* Products Toggle */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowProducts(!showProducts)}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              {showProducts ? 'Hide Products' : 'Show Products'}
            </button>

            {showProducts && (
              <div className="mt-2">
                <ProductSalesSection
                  isAdmin={isAdmin}
                  onProductSelect={handleProductSelect}
                  onEditProduct={handleEditProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onAddProduct={handleAddProduct}
                />
              </div>
            )}
          </div>

          {/* Service shortcuts - fixed at bottom */}
          {activeStep !== 'customer' && !showProducts && (
            <div className="flex-shrink-0 py-3 space-y-2 border-t border-gray-700">
              <div className="grid grid-cols-4 gap-2">
                {['Clean', 'Dye', 'Waterproof', 'Shine'].map(service => (
                  <button
                    key={service}
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        service,
                        variation: 'New Pair'
                      }));
                      // Navigate to first incomplete required step
                      if (!form.category) {
                        setActiveStep('category');
                      } else if (!form.color) {
                        setActiveStep('color');
                      } else if (!form.brand) {
                        setActiveStep('brand');
                      } else {
                        advanceStep('category');
                      }
                    }}
                    className="px-3 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {service}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['Heels', 'Half Soles', 'Sole Guard', 'Others'].map(service => (
                  <button
                    key={service}
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        service,
                        variation: 'New Pair'
                      }));
                      // Navigate to first incomplete required step
                      if (!form.category) {
                        setActiveStep('category');
                      } else if (!form.color) {
                        setActiveStep('color');
                      } else if (!form.brand) {
                        setActiveStep('brand');
                      } else {
                        advanceStep('category');
                      }
                    }}
                    className="px-3 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - Cart Summary */}
        <div className="w-[35%] flex-shrink-0">
          <CartSummary
            items={cartItems}
            ticketNumber={ticketNumber}
            onRemoveItem={removeFromCart}
            onComplete={handleComplete}
            disabled={cartItems.length === 0}
            previewItem={previewItem}
            onPriceChange={handlePreviewPriceChange}
            onDone={handlePreviewDone}
            onCartItemPriceChange={handleCartItemPriceChange}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onSave={handleSaveCartItem}
          onDelete={handleDeleteCartItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}