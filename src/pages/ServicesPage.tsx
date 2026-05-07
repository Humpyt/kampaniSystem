import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Edit3, Package, Plus, RefreshCw, Save, Search, Trash2, Wrench, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatCurrency';

type PricingMode = 'fixed' | 'range' | 'per_unit';
type Status = 'active' | 'inactive';

interface ServiceRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  pricingMode: PricingMode;
  minPrice: number | null;
  maxPrice: number | null;
  unitLabel: string;
  priceNote: string;
  estimatedDays: number;
  category: string;
  status: Status;
}

interface ServiceFormState {
  name: string;
  description: string;
  price: string;
  pricingMode: PricingMode;
  minPrice: string;
  maxPrice: string;
  unitLabel: string;
  priceNote: string;
  estimatedDays: string;
  category: string;
  status: Status;
}

const emptyForm = (): ServiceFormState => ({
  name: '',
  description: '',
  price: '',
  pricingMode: 'fixed',
  minPrice: '',
  maxPrice: '',
  unitLabel: '',
  priceNote: '',
  estimatedDays: '1',
  category: '',
  status: 'active',
});

const renderPrice = (service: ServiceRecord) => {
  if (service.pricingMode === 'range') {
    return `${formatCurrency(service.minPrice)} - ${formatCurrency(service.maxPrice)}`;
  }
  if (service.pricingMode === 'per_unit') {
    return `${formatCurrency(service.price)} / ${service.unitLabel || 'unit'}`;
  }
  return formatCurrency(service.price);
};

export default function ServicesPage() {
  const user = useAuthStore(state => state.user);
  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<ServiceFormState>(emptyForm());

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await api.services.getAll();
      setServices(data as ServiceRecord[]);
    } catch (error) {
      console.error('Failed to load services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const filteredServices = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return services;
    return services.filter(service =>
      service.name.toLowerCase().includes(needle) ||
      service.category.toLowerCase().includes(needle) ||
      service.pricingMode.toLowerCase().includes(needle)
    );
  }, [search, services]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const startEdit = (service: ServiceRecord) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || '',
      price: service.price ? String(service.price) : '',
      pricingMode: service.pricingMode || 'fixed',
      minPrice: service.minPrice !== null && service.minPrice !== undefined ? String(service.minPrice) : '',
      maxPrice: service.maxPrice !== null && service.maxPrice !== undefined ? String(service.maxPrice) : '',
      unitLabel: service.unitLabel || '',
      priceNote: service.priceNote || '',
      estimatedDays: String(service.estimatedDays || 1),
      category: service.category || '',
      status: service.status || 'active',
    });
  };

  const handleSubmit = async () => {
    if (!canEdit) return;
    if (!form.name.trim()) {
      toast.error('Service name is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        pricingMode: form.pricingMode,
        minPrice: form.minPrice ? Number(form.minPrice) : null,
        maxPrice: form.maxPrice ? Number(form.maxPrice) : null,
        unitLabel: form.unitLabel.trim(),
        priceNote: form.priceNote.trim(),
        estimatedDays: Number(form.estimatedDays) || 1,
        category: form.category.trim(),
        status: form.status,
      };

      if (editingId) {
        await api.services.update(editingId, payload as any);
        toast.success('Service updated');
      } else {
        await api.services.create(payload as any);
        toast.success('Service created');
      }

      await loadServices();
      resetForm();
    } catch (error) {
      console.error('Failed to save service:', error);
      toast.error('Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    if (!window.confirm('Delete this service?')) return;

    try {
      setDeletingId(id);
      await api.services.delete(id);
      toast.success('Service deleted');
      if (editingId === id) resetForm();
      await loadServices();
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast.error('Failed to delete service');
    } finally {
      setDeletingId(null);
    }
  };

  const fixedCount = services.filter(s => s.pricingMode === 'fixed').length;
  const rangeCount = services.filter(s => s.pricingMode === 'range').length;
  const perUnitCount = services.filter(s => s.pricingMode === 'per_unit').length;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Services</h1>
          <p className="text-gray-400 text-sm">Manage service catalog and pricing rules</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 text-gray-400 bg-gray-800 px-3 py-2 rounded-lg">
            <Wrench className="h-4 w-4" />
            <span className="text-sm">{services.length}</span>
            <DollarSign className="h-4 w-4 ml-2" />
            <span className="text-sm">{formatCurrency(services.reduce((sum, s) => sum + (s.price || 0), 0))}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 rounded-xl p-4 border border-indigo-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-indigo-300 text-xs font-medium">FIXED PRICING</span>
            <Wrench size={16} className="text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">{fixedCount}</p>
          <span className="text-indigo-300/60 text-xs">Single-price services</span>
        </div>
        <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 rounded-xl p-4 border border-orange-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-300 text-xs font-medium">RANGE PRICING</span>
            <Wrench size={16} className="text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">{rangeCount}</p>
          <span className="text-orange-300/60 text-xs">Min-max estimate services</span>
        </div>
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-4 border border-purple-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-300 text-xs font-medium">PER-UNIT PRICING</span>
            <Wrench size={16} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">{perUnitCount}</p>
          <span className="text-purple-300/60 text-xs">Charged-by-unit services</span>
        </div>
      </div>

      {/* Search */}
      <div className="card-bevel p-4 mb-4">
        <div className="flex space-x-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={loadServices}
            className="btn-bevel accent-secondary px-4 py-2 rounded-lg flex items-center text-sm"
          >
            <RefreshCw size={14} className="mr-2" />
            Refresh
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="btn-bevel accent-secondary px-4 py-2 rounded-lg flex items-center text-sm"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form */}
        <div className="lg:col-span-5">
          <div className="card-bevel p-6">
            <h2 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Service' : 'New Service'}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!canEdit}
                  className="w-full bg-gray-700 rounded-lg border border-gray-600 px-3 py-2 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="Dyeing Bags"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  disabled={!canEdit}
                  rows={2}
                  className="w-full bg-gray-700 rounded-lg border border-gray-600 px-3 py-2 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="Short note about the service"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Pricing Mode</label>
                  <select
                    value={form.pricingMode}
                    onChange={e => setForm(prev => ({ ...prev, pricingMode: e.target.value as PricingMode }))}
                    disabled={!canEdit}
                    className="w-full bg-gray-700 rounded-lg border border-gray-600 px-3 py-2 text-white text-sm focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="range">Range</option>
                    <option value="per_unit">Per Unit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value as Status }))}
                    disabled={!canEdit}
                    className="w-full bg-gray-700 rounded-lg border border-gray-600 px-3 py-2 text-white text-sm focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Base Price</label>
                  <input
                    value={form.price}
                    onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                    disabled={!canEdit || form.pricingMode === 'range'}
                    className="w-full bg-gray-700 rounded-lg border border-gray-600 px-3 py-2 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    placeholder="30000"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Est. Days</label>
                  <input
                    value={form.estimatedDays}
                    onChange={e => setForm(prev => ({ ...prev, estimatedDays: e.target.value }))}
                    disabled={!canEdit}
                    className="w-full bg-gray-700 rounded-lg border border-gray-600 px-3 py-2 text-white text-sm focus:border-indigo-500 disabled:opacity-50"
                    placeholder="1"
                    inputMode="numeric"
                  />
                </div>
              </div>

              {form.pricingMode === 'range' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Min Price</label>
                    <input
                      value={form.minPrice}
                      onChange={e => setForm(prev => ({ ...prev, minPrice: e.target.value }))}
                      disabled={!canEdit}
                      className="w-full bg-gray-700 rounded-lg border border-gray-600 px-3 py-2 text-white text-sm focus:border-indigo-500 disabled:opacity-50"
                      placeholder="50000"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Max Price</label>
                    <input
                      value={form.maxPrice}
                      onChange={e => setForm(prev => ({ ...prev, maxPrice: e.target.value }))}
                      disabled={!canEdit}
                      className="w-full bg-gray-700 rounded-lg border border-gray-600 px-3 py-2 text-white text-sm focus:border-indigo-500 disabled:opacity-50"
                      placeholder="80000"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              )}

              {form.pricingMode === 'per_unit' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Unit Label</label>
                    <input
                      value={form.unitLabel}
                      onChange={e => setForm(prev => ({ ...prev, unitLabel: e.target.value }))}
                      disabled={!canEdit}
                      className="w-full bg-gray-700 rounded-lg border border-gray-600 px-3 py-2 text-white text-sm focus:border-indigo-500 disabled:opacity-50"
                      placeholder="wheel"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Price Note</label>
                    <input
                      value={form.priceNote}
                      onChange={e => setForm(prev => ({ ...prev, priceNote: e.target.value }))}
                      disabled={!canEdit}
                      className="w-full bg-gray-700 rounded-lg border border-gray-600 px-3 py-2 text-white text-sm focus:border-indigo-500 disabled:opacity-50"
                      placeholder="optional"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
                <input
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  disabled={!canEdit}
                  className="w-full bg-gray-700 rounded-lg border border-gray-600 px-3 py-2 text-white text-sm focus:border-indigo-500 disabled:opacity-50"
                  placeholder="cleaning, repair, adjustment"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canEdit || saving}
                className="flex w-full items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingId ? <Save size={16} /> : <Plus size={16} />}
                {saving ? 'Saving...' : editingId ? 'Update Service' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>

        {/* Catalog Table */}
        <div className="lg:col-span-7">
          <div className="card-bevel overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              <table className="w-full">
                <thead className="bg-gray-800/80 backdrop-blur-sm sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Pricing</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Price</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">Loading...</td>
                    </tr>
                  ) : filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <Package size={32} className="mx-auto mb-2 text-gray-600" />
                        <p className="text-gray-400 text-sm">No services found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service, index) => (
                      <tr
                        key={service.id}
                        className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700 transition-colors`}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-white">{service.name}</div>
                          {service.description && (
                            <div className="text-xs text-gray-500 mt-0.5">{service.description.slice(0, 60)}{service.description.length > 60 ? '...' : ''}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {service.category || 'uncategorized'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            service.pricingMode === 'fixed' ? 'bg-indigo-100 text-indigo-800' :
                            service.pricingMode === 'range' ? 'bg-orange-100 text-orange-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {service.pricingMode.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold text-white">{renderPrice(service)}</span>
                          {service.estimatedDays > 0 && (
                            <div className="text-xs text-gray-500">~{service.estimatedDays}d</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            service.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {service.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEdit(service)}
                              disabled={!canEdit}
                              className="p-1.5 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-white transition-colors disabled:opacity-30"
                              title="Edit"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(service.id)}
                              disabled={!canEdit || deletingId === service.id}
                              className="p-1.5 rounded-lg hover:bg-rose-900/50 text-gray-400 hover:text-rose-400 transition-colors disabled:opacity-30"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
