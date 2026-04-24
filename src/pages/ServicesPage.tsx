import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  AlertCircle,
  Edit3,
  Package,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Wrench,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

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

const currency = (value: number | null | undefined) =>
  `UGX ${(Number(value) || 0).toLocaleString('en-US')}`;

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const renderPrice = (service: ServiceRecord) => {
    if (service.pricingMode === 'range') {
      return `${currency(service.minPrice)} - ${currency(service.maxPrice)}`;
    }
    if (service.pricingMode === 'per_unit') {
      return `${currency(service.price)} / ${service.unitLabel || 'unit'}`;
    }
    return currency(service.price);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-8">
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gray-800/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl"></div>
        <div className="pointer-events-none absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.25em] text-gray-300">
              <Wrench size={14} />
              Service Pricing
            </div>
            <h1 className="mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-4xl font-extrabold text-transparent">
              Services Dashboard
            </h1>
            <p className="max-w-3xl text-sm text-gray-400 md:text-base">
              Keep the catalog price-aware and ready for receipts. Fixed services use one amount, range services store a floor and ceiling,
              and per-unit services show the unit you charge by.
            </p>
          </div>

          <div className="flex flex-col items-end rounded-xl border border-white/5 bg-black/30 px-6 py-4 shadow-inner backdrop-blur-md">
            <span className="font-mono text-3xl font-light tracking-wider text-indigo-300 md:text-4xl">
              {services.length.toLocaleString()}
            </span>
            <span className="mt-1 text-xs font-medium uppercase tracking-widest text-gray-500 md:text-sm">
              Active service rules
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            ['Total services', services.length, 'from-indigo-500/10 to-indigo-500/20'],
            ['Fixed pricing', services.filter(s => s.pricingMode === 'fixed').length, 'from-emerald-500/10 to-emerald-500/20'],
            ['Range pricing', services.filter(s => s.pricingMode === 'range').length, 'from-orange-500/10 to-orange-500/20'],
            ['Per-unit pricing', services.filter(s => s.pricingMode === 'per_unit').length, 'from-purple-500/10 to-purple-500/20'],
          ].map(([label, value, gradient]) => (
            <div
              key={String(label)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-gray-900/40 p-6 shadow-xl transition-all duration-500 hover:bg-gray-800/50"
            >
              <div className={`absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} blur-2xl transition-all duration-500 group-hover:opacity-80`}></div>
              <div className="relative z-10 flex flex-col gap-2">
                <p className="border-b border-white/5 pb-3 text-sm font-medium text-gray-300">{label as string}</p>
                <p className="text-3xl font-bold text-white">{Number(value).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-5 rounded-3xl border border-white/5 bg-gray-800/40 p-6 shadow-xl backdrop-blur-xl lg:col-span-5 md:p-8">
          <div className="px-1 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-wide text-white">{editingId ? 'Edit Service' : 'New Service'}</h2>
            <div className="ml-6 h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
          </div>

          <p className="text-sm text-gray-400">
            {canEdit
              ? 'Set the default rule once. The sale flow will still store the final charged amount on each transaction.'
              : 'You can view the catalog only.'}
          </p>

          {editingId && (
            <button
              onClick={resetForm}
              className="self-start rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10"
            >
              Cancel edit
            </button>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Name</label>
              <input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                disabled={!canEdit}
                className="w-full rounded-2xl border border-white/10 bg-gray-900/60 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                placeholder="Dyeing Bags"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                disabled={!canEdit}
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-gray-900/60 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                placeholder="Short note about the service"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Pricing Mode</label>
                <select
                  value={form.pricingMode}
                  onChange={e => setForm(prev => ({ ...prev, pricingMode: e.target.value as PricingMode }))}
                  disabled={!canEdit}
                  className="w-full rounded-2xl border border-white/10 bg-gray-900/60 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="fixed">Fixed</option>
                  <option value="range">Range</option>
                  <option value="per_unit">Per Unit</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value as Status }))}
                  disabled={!canEdit}
                  className="w-full rounded-2xl border border-white/10 bg-gray-900/60 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Base Price</label>
                <input
                  value={form.price}
                  onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                  disabled={!canEdit || form.pricingMode === 'range'}
                  className="w-full rounded-2xl border border-white/10 bg-gray-900/60 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                  placeholder="30000"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Estimated Days</label>
                <input
                  value={form.estimatedDays}
                  onChange={e => setForm(prev => ({ ...prev, estimatedDays: e.target.value }))}
                  disabled={!canEdit}
                  className="w-full rounded-2xl border border-white/10 bg-gray-900/60 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                  placeholder="1"
                  inputMode="numeric"
                />
              </div>
            </div>

            {form.pricingMode === 'range' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Minimum Price</label>
                  <input
                    value={form.minPrice}
                    onChange={e => setForm(prev => ({ ...prev, minPrice: e.target.value }))}
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-white/10 bg-gray-900/60 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                    placeholder="50000"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Maximum Price</label>
                  <input
                    value={form.maxPrice}
                    onChange={e => setForm(prev => ({ ...prev, maxPrice: e.target.value }))}
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-white/10 bg-gray-900/60 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                    placeholder="80000"
                    inputMode="numeric"
                  />
                </div>
              </div>
            )}

            {form.pricingMode === 'per_unit' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Unit Label</label>
                  <input
                    value={form.unitLabel}
                    onChange={e => setForm(prev => ({ ...prev, unitLabel: e.target.value }))}
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-white/10 bg-gray-900/60 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                    placeholder="wheel"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Per-Unit Note</label>
                  <input
                    value={form.priceNote}
                    onChange={e => setForm(prev => ({ ...prev, priceNote: e.target.value }))}
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-white/10 bg-gray-900/60 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                    placeholder="optional note"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Category</label>
              <input
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                disabled={!canEdit}
                className="w-full rounded-2xl border border-white/10 bg-gray-900/60 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                placeholder="cleaning, repair, adjustment"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canEdit || saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingId ? <Save size={18} /> : <Plus size={18} />}
              {saving ? 'Saving...' : editingId ? 'Update Service' : 'Create Service'}
            </button>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                Fixed services use one number. Range services show a low and high estimate. Per-unit services use the unit label you enter here.
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-3xl border border-white/5 bg-gray-800/40 p-6 shadow-xl backdrop-blur-xl lg:col-span-7 md:p-8">
          <div className="px-1 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-wide text-white">Catalog</h2>
            <div className="ml-6 h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-gray-400">
              Search the catalog and open any item to edit its pricing rule.
            </p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-72 max-w-full rounded-2xl border border-white/10 bg-gray-900/60 py-3 pl-9 pr-4 text-sm text-white outline-none focus:border-indigo-500"
                  placeholder="Search services"
                />
              </div>
              <button
                onClick={loadServices}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/5 bg-gray-900/40 p-8 text-center text-gray-400">
              Loading services...
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-gray-900/40 p-8 text-center text-gray-400">
              No services found.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredServices.map(service => (
                <div key={service.id} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gray-900/50 p-5 transition-all duration-300 hover:border-white/10 hover:bg-gray-800/60">
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                  <div className="ml-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] ${service.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-500/15 text-gray-300'}`}>
                          {service.status}
                        </span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-300">
                          {service.pricingMode.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                        <span className="rounded-full border border-white/10 px-3 py-1">{service.category || 'uncategorized'}</span>
                        <span className="rounded-full border border-white/10 px-3 py-1">ETA {service.estimatedDays || 1} days</span>
                        {service.priceNote && <span className="rounded-full border border-white/10 px-3 py-1">{service.priceNote}</span>}
                      </div>

                      <p className="max-w-3xl text-sm text-gray-300">{service.description || 'No description provided.'}</p>
                    </div>

                    <div className="min-w-[220px] rounded-2xl border border-white/5 bg-black/30 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Pricing</div>
                      <div className="mt-2 text-lg font-semibold text-white">{renderPrice(service)}</div>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="ml-2 mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => startEdit(service)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                      >
                        <Edit3 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        disabled={deletingId === service.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/20 disabled:opacity-60"
                      >
                        <Trash2 size={16} />
                        {deletingId === service.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/5 bg-gray-800/40 p-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-indigo-300" />
          <div>
            <div className="font-semibold text-white">How to edit pricing</div>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">
              <li>- Fixed: type the one price and save.</li>
              <li>- Range: switch to range, enter minimum and maximum, then save.</li>
              <li>- Per unit: enter the unit price and a unit label such as wheel, piece, or strap.</li>
              <li>- Change the category or note only if it helps staff identify the service faster at drop time.</li>
              <li>- The final price used on a receipt is still stored on the sale, so these catalog values act as defaults and quotes.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
