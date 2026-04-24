import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, X, User, ShoppingBag } from 'lucide-react';
import { useOperation } from '../contexts/OperationContext';
import { useCustomer } from '../contexts/CustomerContext';
import { useServices } from '../contexts/ServiceContext';
import { useAuthStore } from '../store/authStore';
import type { RetailProduct } from '../contexts/RetailProductContext';
import type { Customer, CartItem, DropFormState } from '../types';
import PillChip from '../components/drop/PillChip';
import StepSection from '../components/drop/StepSection';
import EditItemModal from '../components/drop/EditItemModal';
import CartSummary from '../components/drop/CartSummary';
import TicketBadge from '../components/drop/TicketBadge';
import ProductSalesSection from '../components/drop/ProductSalesSection';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';
import { printerService } from '../services/printer';

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

const SERVICE_VARIATIONS = [
  "New Left", "New Pair", "New Right", "Shorten Left", "Shorten Pair", "Shorten Right"
];

const SHOE_CATEGORY_NAMES = new Set(
  CATEGORIES.filter(category => !['bag', 'other'].includes(category.id)).map(category => category.name)
);

const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

  const formatServicePrice = (service: any) => {
    if (!service) return 'Set in catalog';
  const mode = service.pricingMode || 'fixed';
  const price = Number(service.price) || 0;
  const minPrice = service.minPrice !== null && service.minPrice !== undefined ? Number(service.minPrice) : null;
  const maxPrice = service.maxPrice !== null && service.maxPrice !== undefined ? Number(service.maxPrice) : null;
  if (mode === 'range' && minPrice !== null && maxPrice !== null) {
    return `UGX ${minPrice.toLocaleString('en-US')} - ${maxPrice.toLocaleString('en-US')}`;
  }
  if (mode === 'per_unit') {
    return `UGX ${price.toLocaleString('en-US')} / ${service.unitLabel || 'unit'}`;
  }
  return `UGX ${price.toLocaleString('en-US')}`;
};

const getServicePriceValue = (service: any) => {
  if (!service) return 0;
  const mode = service.pricingMode || 'fixed';
  if (mode === 'range') {
    const minPrice = Number(service.minPrice);
    return Number.isFinite(minPrice) && minPrice > 0 ? minPrice : Number(service.price) || 0;
  }
  return Number(service.price) || 0;
};

type StepName = 'customer' | 'category' | 'size' | 'color' | 'brand' | 'material' | 'description' | 'memos' | 'service' | 'variation' | 'readyBy';

const STEPS_ORDER: StepName[] = ['customer', 'category', 'size', 'color', 'brand', 'material', 'description', 'memos', 'service', 'variation', 'readyBy'];

// Helper to get initial form state
const getInitialFormState = (): DropFormState => ({
  customerId: '',
  category: '',
  size: '',
  color: '',
  brand: '',
  material: '',
  shortDescription: '',
  memos: [],
  service: '',
  variation: '',
  price: '',
  readyByDate: '',
});

export default function DropPage() {
  const { cartItems, addToCart, removeFromCart, clearCart, updateCartItem, ticketNumber, fetchTicketNumber, addOperation, updateOperation, refreshOperations } = useOperation();
  const { customers, fetchCustomers, addCustomer } = useCustomer();
  const { services } = useServices();

  const [form, setForm] = useState<DropFormState>(getInitialFormState());
  const [discount, setDiscount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [activeStep, setActiveStep] = useState<StepName>('customer');
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [brandPage, setBrandPage] = useState(0);
  const [customBrand, setCustomBrand] = useState('');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [showProducts, setShowProducts] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [serviceIdMap, setServiceIdMap] = useState<Map<string, string>>(new Map());
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const requiresShoeSize = SHOE_CATEGORY_NAMES.has(form.category);
  const liveServices = useMemo(
    () =>
      services
        .filter(service => service.status !== 'inactive')
        .slice()
        .sort((a, b) => {
          const categoryCompare = (a.category || '').localeCompare(b.category || '');
          if (categoryCompare !== 0) return categoryCompare;
          return a.name.localeCompare(b.name);
        }),
    [services]
  );
  const filteredServices = useMemo(() => {
    const query = serviceSearchTerm.trim().toLowerCase();
    if (!query) return liveServices;

    return liveServices.filter(service => {
      const searchable = [
        service.name,
        service.category,
        service.pricingMode,
        service.unitLabel,
        formatServicePrice(service),
      ]
        .map(value => String(value || '').toLowerCase())
        .join(' ');

      return searchable.includes(query);
    });
  }, [liveServices, serviceSearchTerm]);
  const displayedServices = useMemo(() => {
    if (!form.service) return filteredServices;
    const selectedService = liveServices.find(service => service.name === form.service);
    if (!selectedService || filteredServices.some(service => service.id === selectedService.id)) {
      return filteredServices;
    }
    return [selectedService, ...filteredServices];
  }, [filteredServices, form.service, liveServices]);

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

  useEffect(() => {
    if (!showCustomerSearch || customers.length > 0) return;
    fetchCustomers({ limit: 10000 });
  }, [showCustomerSearch, customers.length, fetchCustomers]);

  // Build service name-to-ID map
  useEffect(() => {
    if (services.length === 0) return;
    const map = new Map<string, string>();
    services.forEach(svc => {
      map.set(svc.name.toLowerCase(), svc.id);
      // Also map first word for partial matching
      const firstWord = svc.name.toLowerCase().split(' ')[0];
      if (firstWord && firstWord !== svc.name.toLowerCase()) {
        map.set(firstWord, svc.id);
      }
    });
    setServiceIdMap(map);
  }, [services]);

  // Build preview item from current form state
  const previewItem: CartItem | null = form.category ? {
    id: 'preview',
    category: form.category,
    size: form.size,
    color: form.color,
    brand: form.brand,
    material: form.material,
    shortDescription: form.shortDescription,
    memos: form.memos,
    services: form.service && form.variation ? [{ service: form.service, variation: form.variation }] : [],
    price: parseInt(form.price, 10) || 0,
      readyByDate: form.readyByDate || undefined,
  } : null;

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
    setNewCustomerPhone('');
    advanceStep('customer');
  };

  const handleCategorySelect = (category: string) => {
    setCustomCategory('');
    setForm(prev => ({
      ...prev,
      category,
      size: SHOE_CATEGORY_NAMES.has(category) ? prev.size : '',
    }));
    if (category !== 'Other') {
      setActiveStep(SHOE_CATEGORY_NAMES.has(category) ? 'size' : 'color');
    }
  };

  const handleSizeSelect = (size: string) => {
    setForm(prev => ({ ...prev, size }));
    advanceStep('size');
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

  const handleServiceSelect = (service: string, price?: number) => {
    setForm(prev => ({
      ...prev,
      service,
      price: Number.isFinite(price ?? NaN) && Number(price) > 0 ? String(price) : prev.price,
    }));
    advanceStep('service');
  };

  const handleVariationSelect = (variation: string) => {
    setForm(prev => ({ ...prev, variation }));
    advanceStep('variation');
  };

  const handleReadyByDateChange = (date: string) => {
    setForm(prev => ({ ...prev, readyByDate: date }));
    advanceStep('readyBy');
  };

  const handlePriceChange = (value: string) => {
    setForm(prev => ({ ...prev, price: value }));
  };

  const handleAddToCart = () => {
    if (!form.category || !form.price) return;
    const item: CartItem = {
      id: crypto.randomUUID(),
      category: form.category,
      size: form.size,
      color: form.color,
      brand: form.brand,
      material: form.material,
      shortDescription: form.shortDescription,
      memos: form.memos,
      services: [{ service: form.service, variation: form.variation }],
      price: parseInt(form.price, 10) || 0,
      readyByDate: form.readyByDate || undefined,
    };
    addToCart(item);
    setForm(prev => ({
      ...prev,
      category: '',
      size: '',
      color: '',
      brand: '',
      material: '',
      shortDescription: '',
      memos: [],
      service: '',
      variation: '',
      price: '',
  readyByDate: '',
    }));
    setActiveStep('category');
    toast.success('Item added to cart');
  };

  const handleDone = (item: CartItem) => {
    addToCart(item);
    setForm(prev => ({
      ...prev,
      category: '',
      size: '',
      color: '',
      brand: '',
      material: '',
      shortDescription: '',
      memos: [],
      service: '',
      variation: '',
      price: '',
  readyByDate: '',
    }));
    setActiveStep('category');
    toast.success('Item added to cart');
  };

  const handleProductSelect = (product: RetailProduct, customPrice?: number) => {
    const price = customPrice ?? product.default_price ?? 0;
    const item: CartItem = {
      id: crypto.randomUUID(),
      category: 'Product',
      size: '',
      color: '',
      brand: product.category || '',
      material: '',
      shortDescription: product.name,
      memos: [],
      services: [],
      price,
    };

    addToCart(item);
    toast.success(`Added ${product.name} to cart`);
  };

  const handleEditProduct = (_product: RetailProduct) => {
    toast.info('Product editing coming soon');
  };

  const handleDeleteProduct = (_id: string) => {
    toast.info('Product deletion coming soon');
  };

  const handleAddProduct = () => {
    toast.info('Product creation coming soon');
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

  const handleComplete = async (data: { payments: Array<{ method: 'cash' | 'mobile_money' | 'bank_card' | 'store_credit'; amount: number }>; discount: number }) => {
    if (cartItems.length === 0) {
      toast.error('No items in cart');
      return;
    }
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    setIsCompleting(true);
    try {
      // Transform cart items to API format
      const shoes = cartItems
        .filter(item => item.category !== 'Product')
        .map(item => {
          const notes = [item.shortDescription, ...item.memos].filter(Boolean).join(' | ');
          return {
            category: item.category,
            size: item.size || null,
            color: item.color || '',
            notes,
            services: item.services.map(s => {
              const serviceId = serviceIdMap.get(s.service.toLowerCase()) ||
                               serviceIdMap.get(s.service.toLowerCase().split(' ')[0]) ||
                               '';
              return {
                service_id: serviceId,
                service: s.service,
                quantity: 1,
                price: s.price || item.price / (item.services.length || 1),
                notes: s.variation || null,
              };
            }),
          };
        });

      const subtotalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);
      const discountAmount = Math.min(Math.max(Number(data.discount) || 0, 0), subtotalAmount);
      const totalAmount = Math.max(0, subtotalAmount - discountAmount);
      const hasPayments = data.payments && data.payments.length > 0;
      const totalPaid = hasPayments ? data.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

      const operationData = {
        customer: {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
        },
        shoes,
        retailItems: cartItems
          .filter(item => item.category === 'Product')
          .map(item => ({
            productId: null,
            productName: item.shortDescription || item.brand,
            unitPrice: item.price,
            quantity: 1,
            totalPrice: item.price,
          })),
        status: 'pending' as const,
        totalAmount,
        discount: discountAmount,
        isNoCharge: false,
        isDoOver: false,
        isDelivery: false,
        isPickup: false,
        notes: '',
        promisedDate: cartItems[0]?.readyByDate || null,
      };

      const newOperation = await addOperation(operationData);
      const operationTicketNumber = newOperation.ticketNumber || ticketNumber;

      // If payments were made, record them via the payments endpoint
      // This populates operation_payments (for receipts/analytics),
      // updates operations.paid_amount, and updates customer total_spent
      if (hasPayments) {
        try {
          const token = localStorage.getItem('auth_token');

          // Payments are already in correct format (lowercase method names)
          const formattedPayments = data.payments.map(p => ({
            method: p.method,
            amount: p.amount,
          }));

          console.log('[DropPage] Recording payment for operation:', newOperation.id, 'payments:', formattedPayments);

          // Record payments in operation_payments and update paid_amount/total_spent
          // IMPORTANT: Use the response to update context with the CORRECT paidAmount and status
          const paymentResponse = await fetch(`/api/operations/${newOperation.id}/payments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ payments: formattedPayments }),
          });

          console.log('[DropPage] Payment response status:', paymentResponse.status);

          if (paymentResponse.ok) {
            const paymentResult = await paymentResponse.json();
            console.log('[DropPage] Payment result:', paymentResult);

            // Record sale entries for analytics by sale type.
            try {
              const primaryPayment = formattedPayments[0];
              const repairSubtotal = cartItems
                .filter(item => item.category !== 'Product')
                .reduce((sum, item) => sum + item.price, 0);
              const retailSubtotal = cartItems
                .filter(item => item.category === 'Product')
                .reduce((sum, item) => sum + item.price, 0);
              const subtotal = repairSubtotal + retailSubtotal;
              const repairShare = subtotal > 0 ? repairSubtotal / subtotal : 0;
              const repairDiscountShare = Math.round(discountAmount * repairShare);
              const retailDiscountShare = discountAmount - repairDiscountShare;
              const repairNet = Math.max(0, repairSubtotal - repairDiscountShare);
              const retailNet = Math.max(0, retailSubtotal - retailDiscountShare);
              const payableTotal = repairNet + retailNet;
              const repairPaid = payableTotal > 0 ? Math.round((totalPaid * repairNet) / payableTotal) : 0;
              const retailPaid = Math.max(0, totalPaid - repairPaid);

              const salesToRecord = [
                repairNet > 0 && repairPaid > 0
                  ? {
                      customerId: selectedCustomer.id,
                      saleType: 'repair',
                      referenceId: newOperation.id,
                      totalAmount: repairPaid,
                      paymentMethod: primaryPayment?.method || 'cash',
                    }
                  : null,
                retailNet > 0 && retailPaid > 0
                  ? {
                      customerId: selectedCustomer.id,
                      saleType: 'retail',
                      referenceId: newOperation.id,
                      totalAmount: retailPaid,
                      paymentMethod: primaryPayment?.method || 'cash',
                    }
                  : null,
              ].filter(Boolean);

              await Promise.all(
                salesToRecord.map((sale) =>
                  fetch('/api/sales', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(sale),
                  })
                )
              );
              console.log('[DropPage] Sale entries recorded for operation:', newOperation.id, salesToRecord);
            } catch (saleErr) {
              console.error('[DropPage] Error recording sale:', saleErr);
              // Don't fail the drop if sale recording fails
            }

            // Re-fetch all operations from server to get correct paidAmount and status
            // The /payments endpoint updates the database; we need to sync context
            try {
              await refreshOperations();
            } catch (refreshError) {
              console.error('Error refreshing operations after payment:', refreshError);
              // Continue anyway - the event will trigger refresh in other pages
            }
          } else {
            const errorText = await paymentResponse.text();
            console.error('[DropPage] Payment failed with status:', paymentResponse.status, 'error:', errorText);
            toast.error(`Payment failed: ${errorText}`);
          }
        } catch (saleError) {
          console.error('[DropPage] Error recording payment:', saleError);
          toast.error('Failed to record payment');
          // Don't fail the operation if payment recording fails
        }
      }

      // Dispatch custom event to notify other pages
      // Pass hasPayments so PickupPage knows whether to expect a balance
      // timing: 'prepay' signals SalesPage to refresh when payment was collected at drop
      window.dispatchEvent(new CustomEvent('drop-completed', {
        detail: {
          operationId: newOperation.id,
          customerId: selectedCustomer.id,
          totalAmount,
          discount: discountAmount,
          paidAmount: totalPaid,
          hasPayments,
          timing: hasPayments ? 'prepay' : 'postpay'
        }
      }));

      toast.success('Drop completed!');
      // Auto-print receipt and policy slip after successful drop
      try {
        await printerService.printReceipt({
          orderNumber: operationTicketNumber,
          customerName: selectedCustomer?.name || 'N/A',
          customerPhone: selectedCustomer?.phone || undefined,
        });
        // Print policy slip
        await printerService.printPolicy({
          ticketNumber: operationTicketNumber,
          date: new Date().toLocaleDateString(),
          customerNumber: selectedCustomer?.id || 'N/A',
          customerName: selectedCustomer?.name || 'N/A',
        });
      } catch (printError) {
        console.error('Auto-print failed:', printError);
        // Don't block the flow - print failure is non-critical
      }
      clearCart();
      setDiscount(0);
      setNewCustomerPhone('');
      setSelectedCustomer(null);
      setForm(getInitialFormState());
      setServiceSearchTerm('');
      setActiveStep('customer');
      fetchTicketNumber();
    } catch (error) {
      console.error('Error completing drop:', error);
      toast.error('Failed to save order. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleAddNewCustomer = async (name: string, phone: string) => {
    if (!phone.trim()) {
      toast.error('Customer phone is required');
      return;
    }

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
      setNewCustomerPhone('');
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
      case 'size': return requiresShoeSize ? Boolean(form.size) : true;
      case 'color': return Boolean(form.color);
      case 'brand': return Boolean(form.brand);
      case 'material': return Boolean(form.material);
      case 'description': return Boolean(form.shortDescription);
      case 'memos': return form.memos.length > 0;
      case 'service': return Boolean(form.service);
      case 'variation': return Boolean(form.variation);
      case 'readyBy': return Boolean(form.readyByDate);
      default: return false;
    }
  };

  // Get step value for display in collapsed bar
  const getStepValue = (step: StepName): string => {
    switch (step) {
      case 'customer': return selectedCustomer?.name || '';
      case 'category': return form.category;
      case 'size': return form.size || '(none)';
      case 'color': return form.color;
      case 'brand': return form.brand;
      case 'material': return form.material;
      case 'description': return form.shortDescription || '(none)';
      case 'memos': return form.memos.length > 0 ? form.memos.join(', ') : '(none)';
      case 'service': return form.service;
      case 'variation': return form.variation;
      case 'readyBy': return form.readyByDate ? new Date(form.readyByDate).toLocaleDateString() : '';
      default: return '';
    }
  };

  // Get step icon
  const getStepIcon = (step: StepName): string => {
    const icons: Record<string, string> = {
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
    return icons[step] || 'S';
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
                  setNewCustomerPhone('');
                  setShowCustomerSearch(true);
                }}
                onFocus={() => setShowCustomerSearch(true)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 rounded-xl text-white placeholder-gray-400 border border-gray-600 focus:border-indigo-500 outline-none"
              />
            </div>
            {showCustomerSearch && customerSearchTerm && (
              <div className="bg-gray-700 rounded-xl border border-gray-600 overflow-hidden">
                {customers
                  .filter(c =>
                    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                    c.phone.includes(customerSearchTerm)
                  )
                  .slice(0, 5)
                  .map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-600 transition-colors text-gray-200"
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-gray-400">{customer.phone}</div>
                    </button>
                  ))}
              </div>
            )}
            {customerSearchTerm && !customers.some(c => c.name.toLowerCase() === customerSearchTerm.toLowerCase()) && (
              <div className="space-y-3 rounded-xl border border-gray-600 bg-gray-800/60 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Plus className="w-4 h-4" />
                  Add &quot;{customerSearchTerm}&quot; as new customer
                </div>
                <input
                  type="tel"
                  placeholder="Customer phone number"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 rounded-xl text-white placeholder-gray-400 border border-gray-600 focus:border-indigo-500 outline-none"
                />
                <button
                  onClick={() => handleAddNewCustomer(customerSearchTerm.trim(), newCustomerPhone.trim())}
                  disabled={!customerSearchTerm.trim() || !newCustomerPhone.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl text-white text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Save Customer
                </button>
              </div>
            )}
            <button
              onClick={() => {
                const walkInCustomer = { id: 'walk-in-customer', name: 'Walk-in Customer', phone: 'N/A' } as Customer;
                handleCustomerSelect(walkInCustomer);
              }}
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
                    const nextCategory = customCategory.trim();
                    setForm(prev => ({ ...prev, category: nextCategory, size: '' }));
                    setActiveStep('color');
                  }
                }}
              />
            )}
            {form.category === 'Other' && customCategory && (
              <button
                onClick={() => {
                  const nextCategory = customCategory.trim();
                  setForm(prev => ({ ...prev, category: nextCategory, size: '' }));
                  setActiveStep('color');
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        );

      case 'size':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {SHOE_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    form.size === size
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter custom shoe size"
              value={form.size}
              className="w-full px-4 py-3 bg-gray-700 rounded-xl text-white placeholder-gray-400 border border-gray-600 focus:border-indigo-500 outline-none"
              onChange={(e) => setForm(prev => ({ ...prev, size: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && form.size.trim()) {
                  handleSizeSelect(form.size.trim());
                }
              }}
            />
            {form.size.trim() && (
              <button
                onClick={() => handleSizeSelect(form.size.trim())}
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
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    value={serviceSearchTerm}
                    onChange={(event) => setServiceSearchTerm(event.target.value)}
                    placeholder="Search services by name, category, or price..."
                    className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/80 pl-10 pr-10 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-violet-500/70 focus:bg-slate-950"
                    autoFocus
                  />
                  {serviceSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setServiceSearchTerm('')}
                      className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Clear service search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {filteredServices.length} of {liveServices.length} services
                  </span>
                  {form.service && (
                    <span className="truncate text-violet-300">
                      Selected: {form.service}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
                {displayedServices.map(service => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service.name, getServicePriceValue(service))}
                    className={`rounded-xl border p-4 text-left text-sm font-medium transition-all ${
                      form.service === service.name
                        ? 'border-violet-500 bg-violet-600 text-white'
                        : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    <span className="block text-base">{service.name}</span>
                    <span className="mt-1 block text-xs opacity-80">{formatServicePrice(service)}</span>
                    {service.category && (
                      <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] opacity-60">
                        {service.category}
                      </span>
                    )}
                    <span className="mt-2 block text-[11px] uppercase tracking-[0.2em] opacity-50">
                      {service.pricingMode === 'range'
                        ? 'Range price'
                        : service.pricingMode === 'per_unit'
                          ? 'Per unit'
                          : 'Fixed price'}
                    </span>
                  </button>
                ))}
              </div>
              {displayedServices.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center">
                  <div className="text-sm font-medium text-slate-300">No services found</div>
                  <div className="mt-1 text-xs text-slate-500">Try a shorter name, category, or price.</div>
                </div>
              )}
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

      case 'readyBy': {
        // Helper to get date at specific time
        const setTime = (baseDate: Date, hours: number, mins: number = 0) => {
          const d = new Date(baseDate);
          d.setHours(hours, mins, 0, 0);
          return d;
        };

        // Quick date presets
        const today = new Date();
        today.setHours(17, 0, 0, 0); // Default to end of today
        const presets = [
          { label: 'Today', date: setTime(new Date(), 17, 0) },
          { label: 'Tomorrow', date: setTime(new Date(Date.now() + 86400000), 10, 0) },
          { label: '+2 days', date: setTime(new Date(Date.now() + 172800000), 10, 0) },
          { label: '+3 days', date: setTime(new Date(Date.now() + 259200000), 10, 0) },
          { label: '+1 week', date: setTime(new Date(Date.now() + 604800000), 10, 0) },
        ];

        // Time presets for selected day
        const selectedDate = form.readyByDate ? new Date(form.readyByDate) : null;
        const timePresets = selectedDate ? [
          { label: '10:00', date: setTime(selectedDate, 10, 0) },
          { label: '12:00', date: setTime(selectedDate, 12, 0) },
          { label: '14:00', date: setTime(selectedDate, 14, 0) },
          { label: '17:00', date: setTime(selectedDate, 17, 0) },
        ] : [];

        return (
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-2">When should this be ready?</div>
            
            {/* Quick date presets */}
            <div className="grid grid-cols-5 gap-2">
              {presets.map(p => {
                const iso = p.date.toISOString().slice(0, 16);
                const isSelected = form.readyByDate?.slice(0, 16) === iso;
                return (
                  <button
                    key={p.label}
                    onClick={() => handleReadyByDateChange(iso)}
                    className={`px-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Time presets */}
            {selectedDate && (
              <div className="flex gap-2 flex-wrap">
                {timePresets.map(t => {
                  const iso = t.date.toISOString().slice(0, 16);
                  const isSelected = form.readyByDate?.slice(0, 16) === iso;
                  return (
                    <button
                      key={t.label}
                      onClick={() => handleReadyByDateChange(iso)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Manual datetime picker (fallback) */}
            <input
              type="datetime-local"
              value={form.readyByDate}
              onChange={e => handleReadyByDateChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-center text-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              min={new Date().toISOString().slice(0, 16)}
            />

            {/* Clear button */}
            {form.readyByDate && (
              <button
                onClick={() => handleReadyByDateChange('')}
                className="w-full py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Clear date
              </button>
            )}

            {/* Preview */}
            {form.readyByDate && (() => {
              const d = new Date(form.readyByDate);
              const dateStr = d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
              const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
              return (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-3 py-2 text-center">
                  <span className="text-indigo-400 text-xs">Ready by: {dateStr} at {timeStr}</span>
                </div>
              );
            })()}
          </div>
        );
      }

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
                setNewCustomerPhone('');
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
              setDiscount(0);
              setNewCustomerPhone('');
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
              className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/25 transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              {showProducts ? 'HIDE PRODUCTS' : 'QUICK SALE'}
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
        </div>

        {/* Right sidebar - Cart Summary */}
        <div className="w-[35%] flex-shrink-0">
          <CartSummary
            items={cartItems}
            ticketNumber={ticketNumber}
            onRemoveItem={removeFromCart}
            onComplete={handleComplete}
            disabled={isCompleting || cartItems.length === 0 || !selectedCustomer}
            previewItem={previewItem}
            onDone={handlePreviewDone}
            discount={discount}
            onDiscountChange={setDiscount}
            customer={selectedCustomer}
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
