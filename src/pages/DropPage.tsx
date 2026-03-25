import React, { useState, useEffect } from 'react';
import { X, Plus, User, Search, Star, Percent, Phone, Mail, Palette, Scissors, Settings, Edit2, Trash2, FolderOpen, CheckCircle, DollarSign, CreditCard } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import type { Customer } from '../types';
import { useCustomer } from '../contexts/CustomerContext';
import { useOperation } from '../contexts/OperationContext';
import { useServices, type Service } from '../contexts/ServiceContext';
import { useAuthStore } from '../store/authStore';
import ServiceCRUDModal, { ServiceFormData } from '../components/ServiceCRUDModal';
import CategoryManagerModal from '../components/CategoryManagerModal';
import { PaymentModal } from '../components/PaymentModal';

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

interface ShoeItem {
  id: string;
  category: string;
  description: string;
  color: string;
  services: {
    service_id: string;
    name: string;
    price: number;
    quantity: number;
    notes: string | null;
  }[];
  manualPrice?: number;
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
  { id: 'mens-riding', name: "Men's Riding", icon: '🥾' },
  { id: 'bag', name: "Bag", icon: '👜' },
  { id: 'other', name: "Other", icon: '🔧' }
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
  const { addOperation, refreshOperations } = useOperation();
  const { services, loading: servicesLoading } = useServices();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [shoes, setShoes] = useState<ShoeItem[]>([]);
  const [operationStatus, setOperationStatus] = useState<'none' | 'hold' | 'save'>('none');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [activeCartButtons, setActiveCartButtons] = useState<string[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [manualPrice, setManualPrice] = useState<string>('');
  const [useManualPrice, setUseManualPrice] = useState<boolean>(false);

  // Admin mode state
  const [adminMode, setAdminMode] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone.includes(customerSearchTerm) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'lastVisit' | 'loyaltyPoints'>) => {
    try {
      // Don't generate ID here - let the API generate it
      const customerToSave = {
        ...customerData,
        totalOrders: 0,
        totalSpent: 0,
        lastVisit: new Date().toISOString().split('T')[0],
        loyaltyPoints: 0,
      };

      // The CustomerContext.addCustomer will return the created customer with the DB-generated ID
      // But we need to work around the current API structure
      const response = await fetch('http://localhost:3000/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      const newCustomer = await response.json();
      setSelectedCustomer(newCustomer);
      setIsCustomerModalOpen(false);

      // Refresh the customer list
      fetch('http://localhost:3000/api/customers')
        .then(r => r.json())
        .then(data => {
          // Update context by re-fetching
          setCustomerSearchTerm('');
        })
        .catch(console.error);

    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer. Please try again.');
    }
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
    // Validate category
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    // For "Other" category, validate custom name
    if (selectedCategory === 'other' && !customCategoryName.trim()) {
      alert('Please specify the service type when "Other" is selected');
      return;
    }

    // Handle manual price entry for "Other" category
    if (selectedCategory === 'other' && useManualPrice) {
      const price = parseInt(manualPrice);
      if (!manualPrice || isNaN(price) || price <= 0) {
        alert('Please enter a valid price');
        return;
      }

      const newShoe = {
        id: Date.now().toString(),
        category: `other-${customCategoryName.trim().toLowerCase().replace(/\s+/g, '-')}`,
        description: customCategoryName.trim(),
        color: selectedColor || 'none',
        services: [{
          service_id: 'custom-manual-price',
          name: customCategoryName.trim(),
          price: price,
          quantity: 1,
          notes: 'Manual price entry'
        }],
        manualPrice: price
      };

      setShoes([...shoes, newShoe]);
      setSelectedCategory(null);
      setCustomCategoryName('');
      setManualPrice('');
      setUseManualPrice(false);
      setSelectedColor(null);
      return;
    }

    // Handle service selection
    if (selectedServices.length === 0) {
      alert('Please select at least one service');
      return;
    }

    const shoeServices = selectedServices.map(serviceId => {
      const service = Array.isArray(services) ? services.find(s => s.id === serviceId) : null;
      if (!service) return null;
      return {
        service_id: service.id,
        name: service.name,
        price: service.price,
        quantity: 1,
        notes: null
      };
    }).filter(Boolean);

    // Generate description from category and service names
    const serviceNames = shoeServices.map(s => s.name).join(', ');
    const categoryInfo = categories.find(c => c.id === selectedCategory);
    const categoryName = selectedCategory === 'other'
      ? customCategoryName.trim()
      : (categoryInfo?.name || 'Unknown');
    const description = selectedServices.length > 1
      ? `${categoryName}: ${serviceNames}`
      : `${categoryName} - ${serviceNames}`;

    const newShoe = {
      id: Date.now().toString(),
      category: selectedCategory === 'other' ? `other-${customCategoryName.trim().toLowerCase().replace(/\s+/g, '-')}` : selectedCategory,
      description: description,
      color: selectedColor || 'none',
      services: shoeServices,
    };

    setShoes([...shoes, newShoe]);
    setSelectedCategory(null);
    setCustomCategoryName('');
    setSelectedColor(null);
    setSelectedServices([]);
  };

  const handleQuickAddToCart = () => {
    // Validate inputs
    if (!selectedCategory || selectedCategory !== 'other') {
      alert('Please select "Other" category first');
      return;
    }

    if (!customCategoryName.trim()) {
      alert('Please specify the service type');
      return;
    }

    const price = parseInt(manualPrice);
    if (!manualPrice || isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    // Create shoe with manual price
    const newShoe = {
      id: Date.now().toString(),
      category: `other-${customCategoryName.trim().toLowerCase().replace(/\s+/g, '-')}`,
      description: customCategoryName.trim(),
      color: selectedColor || 'none',
      services: [{
        service_id: 'custom-manual-price',
        name: customCategoryName.trim(),
        price: price,
        quantity: 1,
        notes: 'Manual price entry - Quick Add'
      }],
      manualPrice: price
    };

    // Add to cart
    setShoes([...shoes, newShoe]);

    // Clear form for next entry
    setCustomCategoryName('');
    setManualPrice('');
    setUseManualPrice(false);
    setSelectedColor(null);

    // Optional: Scroll to cart
    document.getElementById('cart-summary')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRemoveShoe = (shoeId: string) => {
    setShoes(shoes.filter(shoe => shoe.id !== shoeId));
  };

  const calculateTotal = () => {
    const subtotal = shoes.reduce((total, shoe) => {
      // Use manual price if available, otherwise sum service prices
      if (shoe.manualPrice) {
        return total + shoe.manualPrice;
      }
      const shoeTotal = shoe.services.reduce((sum, service) => {
        return sum + (service.price || 0) * (service.quantity || 1);
      }, 0);
      return total + shoeTotal;
    }, 0);
    return Math.max(0, subtotal - discountAmount);
  };

  const currentSelectionTotal = selectedServices.reduce((sum, serviceId) => {
    const service = Array.isArray(services) ? services.find(s => s.id === serviceId) : null;
    return sum + (service?.price || 0);
  }, 0);

  // Admin helper functions
  const isAdmin = useAuthStore(state => state.user?.role === 'admin');
  const { addService, updateService, deleteService, refreshServices } = useServices();

  const handleAddService = () => {
    setEditingService(null);
    setServiceModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceModalOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    const service = Array.isArray(services) ? services.find(s => s.id === serviceId) : null;
    if (service && window.confirm(`Are you sure you want to delete "${service.name}"?`)) {
      try {
        await deleteService(serviceId);
        // Remove from selected services if present
        setSelectedServices(prev => prev.filter(id => id !== serviceId));
      } catch (error) {
        console.error('Failed to delete service:', error);
      }
    }
  };

  const handleSaveService = async (serviceData: ServiceFormData) => {
    try {
      if (editingService) {
        await updateService(editingService.id, serviceData);
      } else {
        await addService(serviceData);
      }
      setServiceModalOpen(false);
      setEditingService(null);
    } catch (error) {
      console.error('Failed to save service:', error);
    }
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    try {
      // Bulk update all services with this category
      const servicesToUpdate = Array.isArray(services) ? services.filter(s => s.category === oldName) : [];
      await Promise.all(
        servicesToUpdate.map(service =>
          updateService(service.id, { category: newName })
        )
      );
      await refreshServices();
    } catch (error) {
      console.error('Failed to rename category:', error);
    }
  };

  const handleDeleteCategory = async (categoryName: string, reassignTo?: string) => {
    try {
      const servicesInCategory = Array.isArray(services) ? services.filter(s => s.category === categoryName) : [];

      if (servicesInCategory.length > 0 && !reassignTo) {
        alert('Please select a category to reassign services to');
        return;
      }

      // Reassign services to new category
      await Promise.all(
        servicesInCategory.map(service =>
          updateService(service.id, { category: reassignTo || 'other' })
        )
      );
      await refreshServices();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

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
      const operationData = {
        customer: selectedCustomer,
        shoes: shoes,
        status: 'pending' as const,
        totalAmount: calculateTotal(),
        discount: discountAmount,
        isNoCharge: false,
        isDoOver: false,
        isDelivery: activeCartButtons.includes('delivery'),
        isPickup: activeCartButtons.includes('pickup'),
        notes: '',
      };

      await addOperation(operationData);

      // Refresh operations to update other pages
      await refreshOperations();

      // Clear form after successful submission
      setSelectedCategory(null);
      setCustomCategoryName('');
      setSelectedColor(null);
      setSelectedServices([]);
      setShoes([]);
      setSelectedCustomer(null);
      setOperationStatus('none');
      setDiscountAmount(0);
      setActiveCartButtons([]);
      setOperationPayments([]);
      setHasPayments(false);

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

  const handlePaymentCompletion = async (payments: Array<{method: string; amount: number}>) => {
    try {
      // First create the operation
      if (!selectedCustomer) {
        alert('Please select a customer');
        return;
      }

      if (shoes.length === 0) {
        alert('Please add at least one shoe');
        return;
      }

      const operationData = {
        customer: selectedCustomer,
        shoes: shoes,
        status: 'pending' as const,
        totalAmount: calculateTotal(),
        discount: discountAmount,
        isNoCharge: false,
        isDoOver: false,
        isDelivery: activeCartButtons.includes('delivery'),
        isPickup: activeCartButtons.includes('pickup'),
        notes: '',
      };

      const operation = await addOperation(operationData);

      // Process payments
      const response = await fetch(`http://localhost:3000/api/operations/${operation.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payments }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment failed');
      }

      const updatedOperation = await response.json();

      // Store payments for display in payment summary
      setOperationPayments(payments.map(p => ({
        payment_method: p.method,
        amount: p.amount
      })));

      // Set flag to hide "I Finished" button
      setHasPayments(true);

      // If store credit was used, deduct from customer account
      const storeCreditPayment = payments.find(p => p.method === 'store_credit');
      if (storeCreditPayment && selectedCustomer) {
        await fetch(`http://localhost:3000/api/customers/${selectedCustomer.id}/credits/deduct`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: storeCreditPayment.amount,
            description: `Payment for operation #${updatedOperation.id.slice(-6)}`
          }),
        });
      }

      // Refresh operations
      await refreshOperations();

      // Clear form
      setSelectedCategory(null);
      setCustomCategoryName('');
      setSelectedColor(null);
      setSelectedServices([]);
      setShoes([]);
      setSelectedCustomer(null);
      setOperationStatus('none');
      setDiscountAmount(0);
      setActiveCartButtons([]);
      setOperationPayments([]);
      setHasPayments(false);

      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error processing payment:', error);
      if (error instanceof Error) {
        alert(error.message || 'Failed to process payment');
      } else {
        alert('Failed to process payment');
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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [operationPayments, setOperationPayments] = useState<any[]>([]);
  const [hasPayments, setHasPayments] = useState(false);

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

  const toggleCartButton = (buttonName: string) => {
    setActiveCartButtons(prevState => {
      if (buttonName === 'pickup' && prevState.includes('delivery')) {
        return prevState.filter(name => name !== 'delivery').concat(buttonName);
      } else if (buttonName === 'delivery' && prevState.includes('pickup')) {
        return prevState.filter(name => name !== 'pickup').concat(buttonName);
      } else if (prevState.includes(buttonName)) {
        return prevState.filter(name => name !== buttonName);
      } else {
        return [...prevState, buttonName];
      }
    });
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
              Category
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    if (category.id === 'other') {
                      setCustomCategoryName('');
                    } else {
                      setCustomCategoryName('');
                    }
                  }}
                  className={`bg-gray-900 hover:bg-gray-700 p-3 rounded-xl transition-all duration-300 group
                    ${selectedCategory === category.id ? 'ring-2 ring-indigo-500 bg-gray-700' : 'border border-gray-700 hover:border-indigo-500'}
                  `}
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{category.icon}</div>
                  <div className="text-xs text-gray-300 group-hover:text-white transition-colors truncate">{category.name}</div>
                </button>
              ))}
            </div>

            {/* Custom Category Input - Shows when "Other" is selected */}
            {selectedCategory === 'other' && (
              <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
                <label className="block text-sm text-gray-300 mb-2">
                  Please specify the service type:
                </label>
                <input
                  type="text"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder="e.g., Bag Repair, Belt Replacement, etc."
                  className="w-full bg-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  autoFocus
                />
                {customCategoryName && (
                  <p className="text-sm text-green-400 mt-2">
                    Custom: {customCategoryName}
                  </p>
                )}

                {/* Manual Price Option */}
                {customCategoryName && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        id="useManualPrice"
                        checked={useManualPrice}
                        onChange={(e) => {
                          setUseManualPrice(e.target.checked);
                          if (e.target.checked) {
                            setSelectedServices([]);
                          } else {
                            setManualPrice('');
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <label htmlFor="useManualPrice" className="text-sm text-gray-300 cursor-pointer">
                        Set custom price instead of selecting services
                      </label>
                    </div>

                    {useManualPrice && (
                      <div className="space-y-2">
                        <label className="block text-sm text-gray-300">
                          Enter total price (UGX):
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={manualPrice}
                          onChange={(e) => setManualPrice(e.target.value)}
                          placeholder="e.g., 50000"
                          className="w-full bg-gray-600 rounded-lg px-4 py-3 text-white text-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          autoFocus
                        />
                        {manualPrice && (
                          <p className="text-sm text-green-400">
                            Custom price: {formatCurrency(parseInt(manualPrice) || 0)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Quick Add Button */}
                    {selectedCategory === 'other' && customCategoryName && useManualPrice && manualPrice && (
                      <div className="mt-4">
                        <button
                          onClick={() => handleQuickAddToCart()}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <Plus size={20} />
                          <span>Quick Add to Cart - {formatCurrency(parseInt(manualPrice) || 0)}</span>
                        </button>
                        <p className="text-xs text-gray-400 text-center mt-2">
                          Adds directly to cart and clears form for next entry
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Colors */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center">
              <Palette className="text-indigo-400 mr-2" />
              Color (Optional)
            </h2>
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

        {/* Middle Column - Customer and Services */}
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

          {/* Service Selection */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <Scissors className="text-indigo-400 mr-2" />
                  Select Services
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setAdminMode(!adminMode)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                      adminMode
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <Settings size={16} />
                    <span>{adminMode ? 'Exit Admin Mode' : 'Admin Mode'}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {selectedServices.length > 0 && (
                  <>
                    <div className="text-sm text-gray-400">
                      {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                    </div>
                    <div className="text-xl font-semibold text-green-400">
                      {formatCurrency(currentSelectionTotal)}
                    </div>
                  </>
                )}
                {adminMode && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleAddService}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Service
                    </button>
                    <button
                      onClick={() => setCategoryModalOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                    >
                      <FolderOpen size={16} className="mr-1" />
                      Manage Categories
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => {
                  setSelectedCategoryFilter('all');
                  setServiceSearchTerm('');
                }}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All ({services?.length || 0})
              </button>
              {Array.isArray(services) && Array.from(new Set(services.map(s => s.category || 'other'))).sort().map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategoryFilter(category);
                    setServiceSearchTerm('');
                  }}
                  className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors capitalize ${
                    selectedCategoryFilter === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category} ({services.filter(s => (s.category || 'other') === category).length})
                </button>
              ))}
            </div>

            {/* Service Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search services..."
                className="w-full pl-10 pr-10 py-3 bg-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-gray-700"
                value={serviceSearchTerm}
                onChange={(e) => setServiceSearchTerm(e.target.value)}
              />
              {serviceSearchTerm && (
                <button
                  onClick={() => setServiceSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  title="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Services Grid */}
            {(() => {
              const filteredServices = Array.isArray(services) ? services.filter(service => {
                // When searching, ignore category filter and search across all categories
                if (serviceSearchTerm !== '') {
                  return service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase());
                }

                // When not searching, apply category filter
                return selectedCategoryFilter === 'all' ||
                       (service.category || 'other') === selectedCategoryFilter;
              }) : [];

              return (
                <>
                  {/* Search result count */}
                  {serviceSearchTerm && filteredServices.length > 0 && (
                    <div className="text-sm text-gray-400 mb-3">
                      Found {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} matching "{serviceSearchTerm}"
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {servicesLoading ? (
                      <div className="col-span-2 text-center text-gray-400 py-8">
                        Loading services...
                      </div>
                    ) : !Array.isArray(services) || services.length === 0 ? (
                      <div className="col-span-2 text-center text-gray-400 py-8">
                        No services available. Please add services first.
                      </div>
                    ) : filteredServices.length === 0 ? (
                      <div className="col-span-2 text-center text-gray-400 py-8">
                        {serviceSearchTerm
                          ? `No services found matching "${serviceSearchTerm}"`
                          : 'No services available in this category.'
                        }
                      </div>
                    ) : (
                      filteredServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      if (!adminMode) {
                        if (selectedServices.includes(service.id)) {
                          setSelectedServices(prev => prev.filter(id => id !== service.id));
                        } else {
                          setSelectedServices(prev => [...prev, service.id]);
                        }
                      }
                    }}
                    className={`p-4 rounded-xl transition-all duration-300 relative ${
                      selectedServices.includes(service.id)
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-indigo-500'
                    } ${adminMode ? 'cursor-default' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white">{service.name}</span>
                          {service.category && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-600 text-gray-300 capitalize">
                              {service.category}
                            </span>
                          )}
                        </div>
                        <span className={`font-semibold ${
                          selectedServices.includes(service.id) ? 'text-white' : 'text-indigo-400'
                        }`}>
                          {formatCurrency(service.price)}
                        </span>
                      </div>

                      {adminMode && (
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditService(service);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit service"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteService(service.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete service"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </button>
                  ))
                )}
              </div>
            </>
          );
        })()}

            {/* Color Selection and Add Button */}
            {selectedServices.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-400">Color:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedColor(null)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          selectedColor === null
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        None
                      </button>
                      {colors.slice(0, 8).map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setSelectedColor(color.id)}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            selectedColor === color.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                          title={color.name}
                        >
                          {color.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleAddShoe}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                  >
                    <Plus size={18} className="mr-2" />
                    Add to Cart
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Cart */}
        <div className="col-span-3">
          <div id="cart-summary" className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center justify-between">
              <span>Cart Summary</span>
              <span className="text-green-400">{formatCurrency(calculateTotal())}</span>
            </h2>
            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
              {shoes.map((shoe, index) => (
                <div key={shoe.id} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {shoe.category && (
                          <span className="text-2xl mr-2">
                            {shoe.category.startsWith('other-')
                              ? '🔧'
                              : categories.find(c => c.id === shoe.category)?.icon
                            }
                          </span>
                        )}
                        <h3 className="font-medium text-white">
                          {shoe.description}
                          {shoe.manualPrice && (
                            <span className="ml-2 text-xs text-indigo-400 bg-indigo-900/50 px-2 py-1 rounded-full">
                              Custom Price
                            </span>
                          )}
                        </h3>
                      </div>
                      {shoe.color && shoe.color !== 'none' && (
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-lg ${colors.find(c => c.id === shoe.color)?.bgClass} mr-2`}
                          />
                          <span className="text-sm text-gray-400">
                            {colors.find(c => c.id === shoe.color)?.name}
                          </span>
                        </div>
                      )}
                      <div className="mt-2 text-sm text-green-400 font-semibold">
                        {shoe.manualPrice
                          ? formatCurrency(shoe.manualPrice)
                          : formatCurrency(shoe.services.reduce((sum, s) => sum + s.price, 0))
                        }
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveShoe(shoe.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors duration-200 ml-2"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {shoes.length > 0 && (
              <div className="mt-6 space-y-4">
                {/* Quick Actions Row - Delivery, Pickup, Discount */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => toggleCartButton('delivery')}
                    className={`p-3 rounded-lg ${activeCartButtons.includes('delivery') ? 'bg-orange-700 text-white' : 'bg-orange-500 text-gray-200'} hover:bg-orange-600 transition-colors font-medium`}
                  >
                    Delivery
                  </button>
                  <button
                    onClick={() => toggleCartButton('pickup')}
                    className={`p-3 rounded-lg ${activeCartButtons.includes('pickup') ? 'bg-teal-700 text-white' : 'bg-teal-500 text-gray-200'} hover:bg-teal-600 transition-colors font-medium`}
                  >
                    Pickup
                  </button>
                  <button
                    onClick={() => setShowDiscountModal(true)}
                    className="p-3 rounded-lg bg-pink-500 text-gray-200 hover:bg-pink-600 transition-colors font-medium relative"
                  >
                    % Discount
                    {discountAmount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </button>
                </div>

                {/* Discount Applied Display */}
                {discountAmount > 0 && (
                  <div className="bg-pink-900/30 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-pink-300 text-sm">Discount Applied:</span>
                    <span className="text-pink-400 font-semibold">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                {/* Payment Section - Prominent, Full Width */}
                <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-700 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <DollarSign size={18} className="text-purple-400" />
                        Payment Options
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {selectedCustomer ? `Customer: ${selectedCustomer.name}` : 'Select a customer first'}
                      </p>
                      {selectedCustomer && selectedCustomer.accountBalance && selectedCustomer.accountBalance > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <DollarSign size={14} className="text-green-400" />
                          <span className="text-xs text-green-400">
                            Available Credit: {formatCurrency(selectedCustomer.accountBalance)}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-lg"
                    >
                      <CreditCard size={18} />
                      Record Payment
                    </button>
                  </div>

                  {/* Payment Summary - Shows after payments are recorded */}
                  {operationPayments && operationPayments.length > 0 && (
                    <div className="bg-purple-900/30 rounded-lg p-3">
                      <p className="text-xs text-purple-300 mb-2">Payments Recorded:</p>
                      <div className="space-y-1">
                        {operationPayments.map((payment: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-300">{payment.payment_method.replace('_', ' ')}</span>
                            <span className="text-green-400 font-medium">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* I Finished Button */}
                {!hasPayments && (
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl transition-colors duration-200 flex items-center justify-center font-semibold text-lg shadow-lg hover:shadow-xl"
                  >
                    <CheckCircle size={24} className="mr-2" />
                    I Finished
                  </button>
                )}

                {hasPayments && (
                  <div className="text-center text-sm text-gray-400 py-4">
                    Payment recorded. Form will clear automatically.
                  </div>
                )}
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
            <h2 className="text-xl font-semibold mb-4 text-white">Apply Discount</h2>

            {/* Current Total */}
            <div className="bg-gray-700 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Current Total:</span>
                <span className="text-white font-semibold">{formatCurrency(shoes.reduce((total, shoe) => total + shoe.services.reduce((sum, s) => sum + s.price, 0), 0))}</span>
              </div>
            </div>

            {/* Discount Input */}
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Discount Amount (UGX)
            </label>
            <input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
              className="w-full bg-gray-700 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white"
              placeholder="Enter discount amount"
              min="0"
            />

            {/* New Total */}
            <div className="bg-indigo-900/30 rounded-lg p-3 mb-4 border border-indigo-700">
              <div className="flex justify-between items-center">
                <span className="text-indigo-300 font-medium">New Total:</span>
                <span className="text-indigo-400 font-bold text-lg">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDiscountModal(false);
                  setDiscountAmount(0);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service CRUD Modal */}
      {serviceModalOpen && (
        <ServiceCRUDModal
          isOpen={serviceModalOpen}
          onClose={() => {
            setServiceModalOpen(false);
            setEditingService(null);
          }}
          onSave={handleSaveService}
          service={editingService}
          mode={editingService ? 'edit' : 'add'}
        />
      )}

      {/* Category Manager Modal */}
      {categoryModalOpen && (
        <CategoryManagerModal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          services={services}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={calculateTotal()}
        customer={selectedCustomer}
        onComplete={async (payments) => {
          await handlePaymentCompletion(payments);
        }}
      />
    </div>
  );
}