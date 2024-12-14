import React, { useState, useEffect } from 'react';
import { X, Plus, User, Search, Star, Percent, Scissors, Phone, Mail } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import type { Customer } from '../types';
import { useCustomer } from '../contexts/CustomerContext';
import { useOperation } from '../contexts/OperationContext';

interface ItemCategory {
  id: string;
  name: string;
  icon: string;
}

interface ColorOption {
  id: string;
  name: string;
  bgClass: string;
}

interface RepairService {
  id: string;
  name: string;
  price: number;
}

interface ShoeItem {
  id: string;
  category: string;
  color: string;
  services: {
    service_id: string;
    name: string;
    price: number;
    quantity: number;
    notes: string | null;
  }[];
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'lastVisit' | 'loyaltyPoints'>) => void;
  initialData?: Customer;
}

const categories: ItemCategory[] = [
  { id: 'womens-high-heel', name: "Women's High Heel", icon: '👠' },
  { id: 'womens-flat', name: "Women's Flat", icon: '🥿' },
  { id: 'womens-dress-boot', name: "Women's Dress Boot", icon: '👢' },
  { id: 'womens-sneaker', name: "Women's Sneaker", icon: '👟' },
  { id: 'mens-dress', name: "Men's Dress", icon: '👞' },
  { id: 'mens-half-boot', name: "Men's Half Boot", icon: '🥾' },
  { id: 'mens-sneaker', name: "Men's Sneaker", icon: '👟' },
  { id: 'mens-work', name: "Men's Work", icon: '🥾' },
  { id: 'mens-western', name: "Men's Western", icon: '👢' },
  { id: 'mens-riding', name: "Men's Riding", icon: '🥾' }
];

const colors: ColorOption[] = [
  { id: 'beige', name: 'Beige', bgClass: 'bg-[#F5F5DC]' },
  { id: 'black', name: 'Black', bgClass: 'bg-black' },
  { id: 'blue', name: 'Blue', bgClass: 'bg-blue-600' },
  { id: 'brown', name: 'Brown', bgClass: 'bg-amber-800' },
  { id: 'burgundy', name: 'Burgundy', bgClass: 'bg-red-900' },
  { id: 'gray', name: 'Gray', bgClass: 'bg-gray-500' },
  { id: 'green', name: 'Green', bgClass: 'bg-green-600' },
  { id: 'multi', name: 'Multi', bgClass: 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500' },
  { id: 'navy', name: 'Navy', bgClass: 'bg-blue-900' },
  { id: 'orange', name: 'Orange', bgClass: 'bg-orange-500' },
  { id: 'pink', name: 'Pink', bgClass: 'bg-pink-500' },
  { id: 'red', name: 'Red', bgClass: 'bg-red-600' },
  { id: 'white', name: 'White', bgClass: 'bg-white' },
  { id: 'yellow', name: 'Yellow', bgClass: 'bg-yellow-400' }
];

const services: RepairService[] = [
  { id: 'service_1', name: 'Sole Replacement', price: 80000 },
  { id: 'service_2', name: 'Heel Repair', price: 40000 },
  { id: 'service_3', name: 'Cleaning', price: 25000 },
  { id: 'service_4', name: 'Polishing', price: 15000 },
  { id: 'service_5', name: 'Waterproofing', price: 30000 },
  { id: 'service_6', name: 'Stretching', price: 20000 },
  { id: 'service_7', name: 'Elastic', price: 15000 },
  { id: 'service_8', name: 'Hardware', price: 20000 },
  { id: 'service_9', name: 'Heel Fix', price: 25000 },
  { id: 'service_10', name: 'Misc', price: 8000 }
];

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name,
        phone: initialData.phone,
        email: initialData.email,
        address: initialData.address,
        notes: initialData.notes,
      });
    } else if (isOpen) {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      });
    }
  }, [isOpen, initialData]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?\d{10,}$/.test(formData.phone.replace(/[-\s]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        status: 'active' as const,
      });
      onClose();
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      });
      setErrors({});
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleInputChange('name')}
              className={`w-full bg-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                errors.name ? 'border-red-500' : ''
              }`}
              placeholder="Enter customer name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              className={`w-full bg-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                errors.phone ? 'border-red-500' : ''
              }`}
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              className={`w-full bg-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                errors.email ? 'border-red-500' : ''
              }`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={handleInputChange('address')}
              className="w-full bg-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Enter address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={handleInputChange('notes')}
              className="w-full bg-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={3}
              placeholder="Add any additional notes"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-2"
            >
              {initialData ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function DropPage() {
  const { customers, addCustomer, updateCustomer } = useCustomer();
  const { addOperation } = useOperation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [shoes, setShoes] = useState<ShoeItem[]>([]);
  const [operationStatus, setOperationStatus] = useState<'none' | 'hold' | 'save'>('none');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone.includes(customerSearchTerm) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const handleAddCustomer = (customerData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'lastVisit' | 'loyaltyPoints'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      totalOrders: 0,
      totalSpent: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      loyaltyPoints: 0,
    };
    
    addCustomer(newCustomer);
    setSelectedCustomer(newCustomer);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSearch(false);
    setCustomerSearchTerm('');
  };

  const handleEditCustomer = () => {
    setIsEditingCustomer(true);
    setIsCustomerModalOpen(true);
  };

  const handleOpenAddCustomer = () => {
    setIsEditingCustomer(false);
    setIsCustomerModalOpen(true);
  };

  const handleCustomerModalClose = () => {
    setIsCustomerModalOpen(false);
    setIsEditingCustomer(false);
  };

  const handleAddShoe = () => {
    if (selectedCategory && selectedColor && selectedServices.length > 0) {
      const shoeServices = selectedServices.map(serviceId => {
        const service = services.find(s => s.id === serviceId);
        if (!service) return null;
        return {
          service_id: service.id,
          name: service.name,
          price: service.price,
          quantity: 1,
          notes: null
        };
      }).filter(Boolean);

      const newShoe = {
        id: Date.now().toString(),
        category: selectedCategory,
        color: selectedColor,
        services: shoeServices,
      };
      
      setShoes([...shoes, newShoe]);
      setSelectedCategory(null);
      setSelectedColor(null);
      setSelectedServices([]);
    }
  };

  const handleRemoveShoe = (shoeId: string) => {
    setShoes(shoes.filter(shoe => shoe.id !== shoeId));
  };

  const calculateTotal = () => {
    return shoes.reduce((total, shoe) => {
      const shoeTotal = shoe.services.reduce((sum, service) => {
        return sum + (service.price || 0) * (service.quantity || 1);
      }, 0);
      return total + shoeTotal;
    }, 0);
  };

  const currentSelectionTotal = selectedServices.reduce((sum, serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return sum + (service?.price || 0);
  }, 0);

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    if (shoes.length === 0) {
      alert('Please add at least one shoe');
      return;
    }

    try {
      console.log('Submitting operation with data:', {
        customer: selectedCustomer,
        shoes: shoes,
        status: 'pending',
        totalAmount: calculateTotal(),
        isNoCharge: false,
        isDoOver: false,
        isDelivery: false,
        isPickup: false,
        notes: '',
      });

      const operationData = {
        customer: selectedCustomer,
        shoes: shoes,
        status: 'pending' as const,
        totalAmount: calculateTotal(),
        isNoCharge: false,
        isDoOver: false,
        isDelivery: false,
        isPickup: false,
        notes: '',
      };

      await addOperation(operationData);

      // Clear form after successful submission
      setSelectedCategory(null);
      setSelectedColor(null);
      setSelectedServices([]);
      setShoes([]);
      setSelectedCustomer(null);
      setOperationStatus('none');

      alert('Drop-off recorded successfully');
    } catch (error) {
      console.error('Error submitting drop-off:', error);
      if (error instanceof Error) {
        alert(`Failed to record drop-off: ${error.message}`);
      } else {
        alert('Failed to record drop-off');
      }
    }
  };

  const handleHold = async () => {
    if (shoes.length === 0) return;

    try {
      await addOperation({
        customer: selectedCustomer,
        shoes,
        status: 'held',
        totalAmount: calculateTotal(),
        isNoCharge: false,
        isDoOver: false,
        isDelivery: false,
        isPickup: false,
      });

      // Clear the form
      // handleCancel();
      
      // Navigate to operations page
      // navigate('/operations');
    } catch (error) {
      console.error('Error holding operation:', error);
    }
  };

  const handleNoCharge = async () => {
    if (shoes.length === 0) return;

    try {
      await addOperation({
        customer: selectedCustomer,
        shoes,
        status: 'pending',
        totalAmount: calculateTotal(),
        isNoCharge: true,
        isDoOver: false,
        isDelivery: false,
        isPickup: false,
      });

      // handleCancel();
      // navigate('/operations');
    } catch (error) {
      console.error('Error creating no-charge operation:', error);
    }
  };

  const handleDoOver = async () => {
    if (shoes.length === 0) return;

    try {
      await addOperation({
        customer: selectedCustomer,
        shoes,
        status: 'pending',
        totalAmount: calculateTotal(),
        isNoCharge: false,
        isDoOver: true,
        isDelivery: false,
        isPickup: false,
      });

      // handleCancel();
      // navigate('/operations');
    } catch (error) {
      console.error('Error creating do-over operation:', error);
    }
  };

  const handleDelivery = async () => {
    if (shoes.length === 0) return;

    try {
      await addOperation({
        customer: selectedCustomer,
        shoes,
        status: 'pending',
        totalAmount: calculateTotal(),
        isNoCharge: false,
        isDoOver: false,
        isDelivery: true,
        isPickup: false,
      });

      // handleCancel();
      // navigate('/operations');
    } catch (error) {
      console.error('Error creating delivery operation:', error);
    }
  };

  const handlePickup = async () => {
    if (shoes.length === 0) return;

    try {
      await addOperation({
        customer: selectedCustomer,
        shoes,
        status: 'pending',
        totalAmount: calculateTotal(),
        isNoCharge: false,
        isDoOver: false,
        isDelivery: false,
        isPickup: true,
      });

      // handleCancel();
      // navigate('/operations');
    } catch (error) {
      console.error('Error creating pickup operation:', error);
    }
  };

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const handleDiscount = async () => {
    if (shoes.length === 0) return;
    setShowDiscountModal(true);
  };

  const handleApplyDiscount = async () => {
    try {
      await addOperation({
        customer: selectedCustomer,
        shoes,
        status: 'pending',
        totalAmount: calculateTotal(),
        discount: discountAmount,
        isNoCharge: false,
        isDoOver: false,
        isDelivery: false,
        isPickup: false,
      });

      setShowDiscountModal(false);
      // handleCancel();
      // navigate('/operations');
    } catch (error) {
      console.error('Error creating discounted operation:', error);
    }
  };

  const [splitCount, setSplitCount] = useState<number>(2);
  const [showSplitModal, setShowSplitModal] = useState(false);

  const handleSplitTicket = async () => {
    if (shoes.length === 0) return;
    setShowSplitModal(true);
  };

  const handleApplySplit = async () => {
    const totalAmount = calculateTotal();
    const amountPerTicket = totalAmount / splitCount;
    const shoesPerTicket = Math.ceil(shoes.length / splitCount);

    try {
      for (let i = 0; i < splitCount; i++) {
        const startIndex = i * shoesPerTicket;
        const endIndex = Math.min(startIndex + shoesPerTicket, shoes.length);
        const ticketShoes = shoes.slice(startIndex, endIndex);

        await addOperation({
          customer: selectedCustomer,
          shoes: ticketShoes,
          status: 'pending',
          totalAmount: amountPerTicket,
          isNoCharge: false,
          isDoOver: false,
          isDelivery: false,
          isPickup: false,
          notes: `Split ticket ${i + 1} of ${splitCount}`,
        });
      }

      setShowSplitModal(false);
      // handleCancel();
      // navigate('/operations');
    } catch (error) {
      console.error('Error creating split tickets:', error);
    }
  };

  const handleCancel = () => {
    setSelectedCategory(null);
    setSelectedColor(null);
    setSelectedServices([]);
    setShoes([]);
    setOperationStatus('none');
  };

  const handleClearLastEntry = () => {
    if (shoes.length > 0) {
      setShoes(prev => prev.slice(0, -1));
    }
  };

  const handleDeleteItem = () => {
    if (selectedCategory || selectedColor || selectedServices.length > 0) {
      setSelectedCategory(null);
      setSelectedColor(null);
      setSelectedServices([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Categories and Colors */}
        <div className="col-span-3 space-y-6">
          {/* Categories */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center">
              <Scissors className="text-indigo-400 mr-2" />
              Categories
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`bg-gray-900 hover:bg-gray-700 p-3 rounded-xl transition-all duration-300 group
                    ${selectedCategory === category.id ? 'ring-2 ring-indigo-500 bg-gray-700' : 'border border-gray-700 hover:border-indigo-500'}
                  `}
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{category.icon}</div>
                  <div className="text-xs text-gray-300 group-hover:text-white transition-colors truncate">{category.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-white">Colors</h2>
            <div className="grid grid-cols-4 gap-3">
              {colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.id)}
                  className={`group relative p-2 rounded-lg transition-all duration-300
                    ${selectedColor === color.id ? 'ring-2 ring-indigo-500 scale-110' : 'hover:scale-105'}
                  `}
                  title={color.name}
                >
                  <div 
                    className={`w-8 h-8 rounded-lg ${color.bgClass} shadow-lg group-hover:shadow-xl transition-shadow`}
                    style={{ 
                      boxShadow: selectedColor === color.id ? '0 0 15px rgba(99, 102, 241, 0.5)' : undefined 
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    {selectedColor === color.id && (
                      <div className="w-2 h-2 bg-white rounded-full shadow-lg"></div>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column - Customer and Current Selection */}
        <div className="col-span-6 space-y-6">
          {/* Customer Section */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-500 bg-opacity-20 rounded-xl">
                  <User className="text-2xl text-indigo-400" />
                </div>
                {selectedCustomer ? (
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedCustomer.name}</h3>
                    <div className="text-sm text-gray-400 space-y-2 mt-1">
                      <p className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        {selectedCustomer.phone}
                      </p>
                      {selectedCustomer.email && (
                        <p className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {selectedCustomer.email}
                        </p>
                      )}
                      <p className="flex items-center text-yellow-400">
                        <Star className="h-4 w-4 mr-2" />
                        {selectedCustomer.loyaltyPoints} points
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No customer selected</p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCustomerSearch(prev => !prev)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <Search size={18} className="mr-2" />
                  Find
                </button>
                <button
                  onClick={handleOpenAddCustomer}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <Plus size={18} className="mr-2" />
                  Add
                </button>
              </div>
            </div>

            {showCustomerSearch && (
              <div className="mt-4 bg-gray-900 rounded-xl p-4 border border-gray-700">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-gray-700"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 border border-transparent hover:border-gray-700"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">{customer.name}</p>
                          <p className="text-sm text-gray-400 mt-1">{customer.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-indigo-400">{customer.totalOrders} orders</p>
                          <p className="text-sm text-green-400 mt-1">{formatCurrency(customer.totalSpent)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current Selection */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-700 rounded-xl">
                  {selectedCategory ? (
                    <span className="text-2xl">{categories.find(c => c.id === selectedCategory)?.icon}</span>
                  ) : (
                    <Scissors className="text-2xl text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedCategory 
                      ? categories.find(c => c.id === selectedCategory)?.name 
                      : 'Select Category'}
                  </h3>
                  {selectedColor && (
                    <div className="flex items-center mt-2">
                      <div 
                        className={`w-4 h-4 rounded-lg ${colors.find(c => c.id === selectedColor)?.bgClass} mr-2`}
                      />
                      <span className="text-sm text-gray-400">
                        {colors.find(c => c.id === selectedColor)?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {selectedCategory && selectedColor && selectedServices.length > 0 && (
                <div className="flex items-center space-x-4">
                  <div className="text-xl font-semibold text-green-400">
                    {formatCurrency(currentSelectionTotal)}
                  </div>
                  <button
                    onClick={handleAddShoe}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                  >
                    <Plus size={18} className="mr-2" />
                    Add Item
                  </button>
                </div>
              )}
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    if (selectedServices.includes(service.id)) {
                      setSelectedServices(prev => prev.filter(id => id !== service.id));
                    } else {
                      setSelectedServices(prev => [...prev, service.id]);
                    }
                  }}
                  className={`p-4 rounded-xl transition-all duration-300 flex items-center justify-between
                    ${selectedServices.includes(service.id)
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-indigo-500'
                    }
                  `}
                >
                  <span className="text-white">{service.name}</span>
                  <span className={`font-semibold ${
                    selectedServices.includes(service.id) ? 'text-white' : 'text-indigo-400'
                  }`}>
                    {formatCurrency(service.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              <Plus size={20} className="mr-2" />
              Save
            </button>
            <button
              onClick={handleHold}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl transition-colors duration-200"
            >
              Hold
            </button>
            <button
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Right Column - Cart */}
        <div className="col-span-3">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center justify-between">
              <span>Cart Summary</span>
              <span className="text-green-400">{formatCurrency(calculateTotal())}</span>
            </h2>
            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
              {shoes.map((shoe, index) => (
                <div key={shoe.id} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {categories.find(c => c.id === shoe.category)?.icon}
                      </span>
                      <div>
                        <h3 className="font-medium text-white">
                          {categories.find(c => c.id === shoe.category)?.name}
                        </h3>
                        <div className="flex items-center mt-1">
                          <div 
                            className={`w-3 h-3 rounded-lg ${colors.find(c => c.id === shoe.color)?.bgClass} mr-2`}
                          />
                          <span className="text-sm text-gray-400">
                            {colors.find(c => c.id === shoe.color)?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveShoe(shoe.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {shoe.services.map((service) => (
                      <div key={service.service_id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">{service.name}</span>
                        <span className="text-gray-400">{formatCurrency(service.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {shoes.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleNoCharge}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    No Charge
                  </button>
                  <button
                    onClick={handleDoOver}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Do Over
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleDelivery}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Delivery
                  </button>
                  <button
                    onClick={handlePickup}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Pickup
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleDiscount}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <Percent size={18} className="mr-2" />
                    Discount
                  </button>
                  <button
                    onClick={handleSplitTicket}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Split Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={handleCustomerModalClose}
        onSave={isEditingCustomer ? updateCustomer : handleAddCustomer}
        initialData={isEditingCustomer ? selectedCustomer : undefined}
      />

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Apply Discount</h2>
            <input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              className="w-full bg-gray-700 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Enter discount amount"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDiscountModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyDiscount}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Split Ticket</h2>
            <input
              type="number"
              value={splitCount}
              onChange={(e) => setSplitCount(Number(e.target.value))}
              min="2"
              className="w-full bg-gray-700 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Enter number of splits"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSplitModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleApplySplit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200"
              >
                Split
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}