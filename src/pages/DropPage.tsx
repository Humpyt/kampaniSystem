import React, { useState, useEffect } from 'react';
import { Search, Plus, X, User } from 'lucide-react';
import { useOperation } from '../contexts/OperationContext';
import { useCustomer } from '../contexts/CustomerContext';
import type { Customer, CartItem, DropFormState } from '../types';
import CascadeSelect from '../components/drop/CascadeSelect';
import MemoSelect from '../components/drop/MemoSelect';
import PriceInput from '../components/drop/PriceInput';
import TicketBadge from '../components/drop/TicketBadge';
import CartSummary from '../components/drop/CartSummary';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

// Fixed data from design spec
const CATEGORIES = [
  "Women's High Heel", "Men's Dress Shoe", "Men's Casual", "Women's Flat",
  "Children's", "Sandal", "Boot", "Loafer", "Slipper"
];

const COLORS = [
  "Black", "Brown", "White", "Red", "Blue", "Navy", "Tan", "Grey",
  "Pink", "Purple", "Gold", "Silver", "Beige", "Green", "Orange"
];

const BRANDS = [
  "Adidas", "AFS", "Air Jordan", "Albert Ferretti", "Albertino", "Alberto Fermani",
  "Alberto Ferriti", "Aldo", "Alejandro Ingelmo", "Allen Edmunds", "ANAX",
  "Andrew Marc", "Anne Klein", "Anyi Lu", "Aquatalia by Marvin K", "Armani",
  "Armani Exchange", "Ash", "Australia Love Collective", "Bally", "Barney's",
  "BASEMEN", "Bass", "BCBG Maxazria", "Bench", "Betsey Johnson", "Bettye Muller",
  "Beverly Hills", "Boss", "Boutique 9", "Brooks", "Bruno Magli", "BRUNO MARC",
  "BRUSQUE", "Burberry", "Bvlgari", "Byblos", "Calvin Klein", "Carlos Falchi"
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
  "Elastic", "Glue", "Hardware", "Heel", "Heel Fix", "Insoles", "Misc",
  "Pad", "Patches", "Rips", "Sling", "Stitch", "Straps", "Stretch",
  "Tassels", "Zipper"
];

const SERVICE_VARIATIONS = [
  "New Left", "New Pair", "New Right", "Shorten Left", "Shorten Pair", "Shorten Right"
];

const initialFormState: DropFormState = {
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
};

export default function DropPage() {
  const { cartItems, addToCart, removeFromCart, clearCart, ticketNumber, fetchTicketNumber } = useOperation();
  const { customers, addCustomer } = useCustomer();

  const [form, setForm] = useState<DropFormState>(initialFormState);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  // Fetch ticket number on mount
  useEffect(() => {
    fetchTicketNumber();
  }, [fetchTicketNumber]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    c.phone.includes(customerSearchTerm) ||
    c.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  // Cascade field enable/disable logic
  const customerLocked = Boolean(form.customerId);
  const categoryLocked = Boolean(form.category);
  const colorLocked = Boolean(form.color);
  const brandLocked = Boolean(form.brand);
  const materialLocked = Boolean(form.material);
  const memosLocked = false; // memos don't lock
  const serviceLocked = Boolean(form.service);
  const variationLocked = Boolean(form.variation);
  const priceLocked = false; // price doesn't lock

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setForm(prev => ({ ...prev, customerId: customer.id }));
    setShowCustomerSearch(false);
    setCustomerSearchTerm('');
  };

  const handleCustomerClear = () => {
    setSelectedCustomer(null);
    setForm(prev => ({ ...prev, customerId: '' }));
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

    // Reset form below brand: keep customerId, category, color, brand, clear rest
    setForm(prev => ({
      ...prev,
      material: '',
      shortDescription: '',
      memos: [],
      service: '',
      variation: '',
      price: '',
    }));

    toast.success('Item added to cart');
  };

  const handleComplete = async () => {
    if (!ticketNumber) return;

    try {
      const { api } = await import('../services/api');
      await api.operations.create({
        ticket_number: ticketNumber,
        customer_id: selectedCustomer?.id,
        items: cartItems,
      });

      clearCart();
      setSelectedCustomer(null);
      setForm(initialFormState);
      await fetchTicketNumber();
      toast.success('Drop completed successfully!');
    } catch (err) {
      console.error('Failed to complete drop:', err);
      toast.error('Failed to complete drop');
    }
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

  const canAddToCart = Boolean(form.category && form.price);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">NEW DROP</h1>
        {ticketNumber && <TicketBadge ticketNumber={ticketNumber} />}
        {selectedCustomer && (
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-200 text-sm">{selectedCustomer.name}</span>
            <button
              onClick={handleCustomerClear}
              className="text-gray-400 hover:text-white ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* LEFT: Cascade Form */}
        <div className="space-y-4">
          {/* Customer Section */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 border-t-4 border-t-indigo-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-200">Customer</span>
              {customerLocked ? (
                <span className="text-xs text-amber-400">Locked</span>
              ) : (
                <span className="text-xs text-gray-400">Select customer</span>
              )}
            </div>

            {!customerLocked ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-700 rounded-lg text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={customerSearchTerm}
                      onChange={e => setCustomerSearchTerm(e.target.value)}
                      onFocus={() => setShowCustomerSearch(true)}
                    />
                  </div>
                  <button
                    onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
                  >
                    Search
                  </button>
                </div>

                {showCustomerSearch && (
                  <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-2">No customers found</p>
                    ) : (
                      filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleCustomerSelect(c)}
                          className="w-full text-left p-2 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <div className="text-white text-sm">{c.name}</div>
                          <div className="text-gray-400 text-xs">{c.phone}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Quick add customer */}
                {customerSearchTerm && !showCustomerSearch && (
                  <button
                    onClick={() => handleAddNewCustomer(customerSearchTerm, '')}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add &quot;{customerSearchTerm}&quot; as new customer
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* Category */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 border-t-4 border-t-indigo-400">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-200">Category</span>
              {categoryLocked ? (
                <span className="text-xs text-amber-400">Locked</span>
              ) : (
                <span className="text-xs text-gray-400">Select category</span>
              )}
            </div>
            <CascadeSelect
              label="Category"
              options={CATEGORIES}
              value={form.category}
              onChange={val => setForm(prev => ({ ...prev, category: val }))}
              onClear={() => setForm(prev => ({ ...prev, category: '' }))}
              disabled={customerLocked || categoryLocked}
              placeholder="Select category..."
            />
          </div>

          {/* Color */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 border-t-4 border-t-cyan-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-200">Color</span>
              {colorLocked ? (
                <span className="text-xs text-amber-400">Locked</span>
              ) : (
                <span className="text-xs text-gray-400">Select color</span>
              )}
            </div>
            <CascadeSelect
              label="Color"
              options={COLORS}
              value={form.color}
              onChange={val => setForm(prev => ({ ...prev, color: val }))}
              onClear={() => setForm(prev => ({ ...prev, color: '' }))}
              disabled={!customerLocked || categoryLocked || colorLocked}
              placeholder="Select color..."
            />
          </div>

          {/* Brand */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 border-t-4 border-t-emerald-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-200">Brand</span>
              {brandLocked ? (
                <span className="text-xs text-amber-400">Locked</span>
              ) : (
                <span className="text-xs text-gray-400">Select brand</span>
              )}
            </div>
            <CascadeSelect
              label="Brand"
              options={BRANDS}
              value={form.brand}
              onChange={val => setForm(prev => ({ ...prev, brand: val }))}
              onClear={() => setForm(prev => ({ ...prev, brand: '' }))}
              disabled={!customerLocked || !categoryLocked || !colorLocked || brandLocked}
              placeholder="Select brand..."
            />
          </div>

          {/* Material */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 border-t-4 border-t-amber-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-200">Material</span>
              {materialLocked ? (
                <span className="text-xs text-amber-400">Locked</span>
              ) : (
                <span className="text-xs text-gray-400">Select material</span>
              )}
            </div>
            <CascadeSelect
              label="Material"
              options={MATERIALS}
              value={form.material}
              onChange={val => setForm(prev => ({ ...prev, material: val }))}
              onClear={() => setForm(prev => ({ ...prev, material: '' }))}
              disabled={!customerLocked || !categoryLocked || !colorLocked || !brandLocked || materialLocked}
              placeholder="Select material..."
            />
          </div>

          {/* Short Description */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 border-t-4 border-t-violet-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-200">Short Description</span>
              <span className="text-xs text-gray-400">Optional</span>
            </div>
            <input
              type="text"
              placeholder="Enter brief description..."
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={form.shortDescription}
              onChange={e => setForm(prev => ({ ...prev, shortDescription: e.target.value }))}
              disabled={!customerLocked || !categoryLocked || !colorLocked || !brandLocked || !materialLocked}
            />
          </div>

          {/* Memos */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 border-t-4 border-t-blue-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-200">Memos</span>
              <span className="text-xs text-gray-400">Multi-select</span>
            </div>
            <MemoSelect
              options={MEMOS}
              value={form.memos}
              onChange={memos => setForm(prev => ({ ...prev, memos }))}
              disabled={!customerLocked || !categoryLocked || !colorLocked || !brandLocked || !materialLocked}
            />
          </div>

          {/* Service */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 border-t-4 border-t-rose-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-200">Service</span>
              {serviceLocked ? (
                <span className="text-xs text-amber-400">Locked</span>
              ) : (
                <span className="text-xs text-gray-400">Select service</span>
              )}
            </div>
            <CascadeSelect
              label="Service"
              options={SERVICES}
              value={form.service}
              onChange={val => setForm(prev => ({ ...prev, service: val }))}
              onClear={() => setForm(prev => ({ ...prev, service: '' }))}
              disabled={!customerLocked || !categoryLocked || !colorLocked || !brandLocked || !materialLocked || serviceLocked}
              placeholder="Select service..."
            />
          </div>

          {/* Service Variation */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 border-t-4 border-t-pink-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-200">Service Variation</span>
              {variationLocked ? (
                <span className="text-xs text-amber-400">Locked</span>
              ) : (
                <span className="text-xs text-gray-400">Select variation</span>
              )}
            </div>
            <CascadeSelect
              label="Variation"
              options={SERVICE_VARIATIONS}
              value={form.variation}
              onChange={val => setForm(prev => ({ ...prev, variation: val }))}
              onClear={() => setForm(prev => ({ ...prev, variation: '' }))}
              disabled={!customerLocked || !categoryLocked || !colorLocked || !brandLocked || !materialLocked || !serviceLocked || variationLocked}
              placeholder="Select variation..."
            />
          </div>

          {/* Price */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 border-t-4 border-t-green-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-200">Price</span>
              <span className="text-xs text-gray-400">Enter price</span>
            </div>
            <PriceInput
              value={form.price}
              onChange={val => setForm(prev => ({ ...prev, price: val }))}
              disabled={!customerLocked || !categoryLocked || !colorLocked || !brandLocked || !materialLocked || !serviceLocked || !variationLocked}
            />
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              canAddToCart
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-5 h-5" />
            ADD TO CART
          </button>
        </div>

        {/* RIGHT: Cart Summary */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <CartSummary
            items={cartItems}
            ticketNumber={ticketNumber}
            onRemoveItem={removeFromCart}
            onComplete={handleComplete}
            disabled={cartItems.length === 0}
          />
        </div>
      </div>
    </div>
  );
}