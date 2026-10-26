import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { type Merchant } from '../db/models';
import { Plus, Search, Star, Trash2, Edit2, Building2, Store, Users } from 'lucide-react';
import { MerchantIcon } from '../components/ui/MerchantIcon';
import { MerchantFormModal } from '../components/forms/MerchantFormModal';

const Merchants: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'merchant' | 'client' | 'featured'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);

  const merchants = useLiveQuery(
    () => db.merchants.toArray(),
    []
  );

  const filtered = merchants?.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.defaultCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.domain && m.domain.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'merchant') return m.type === 'merchant' || m.type === 'both';
    if (filterType === 'client') return m.type === 'client' || m.type === 'both';
    if (filterType === 'featured') return m.isFeatured;
    return true;
  });

  const toggleFeatured = async (id: string, current: boolean) => {
    await db.merchants.update(id, {
      isFeatured: !current,
      updatedAt: Date.now()
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete "${name}" from your brands directory?`)) {
      await db.merchants.delete(id);
    }
  };

  const merchantCount = merchants?.filter(m => m.type === 'merchant' || m.type === 'both').length || 0;
  const clientCount = merchants?.filter(m => m.type === 'client' || m.type === 'both').length || 0;

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-1">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs shadow-xs">
            <Building2 size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
              Merchants & Clients
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage custom brands, clients, domains, and logos
            </p>
          </div>
        </div>

        <button
          onClick={() => { setEditingMerchant(null); setShowModal(true); }}
          className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl flex items-center space-x-1.5 text-xs font-semibold transition-all active:scale-95 shadow-md shadow-indigo-500/20 self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Add Merchant / Client</span>
        </button>
      </header>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="modern-card p-5 rounded-2xl flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Store size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Merchants</span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">{merchantCount}</span>
          </div>
        </div>

        <div className="modern-card p-5 rounded-2xl flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Users size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clients (Income)</span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">{clientCount}</span>
          </div>
        </div>

        <div className="modern-card p-5 rounded-2xl flex items-center space-x-3.5 col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Star size={18} className="fill-amber-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Featured on Home</span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">
              {merchants?.filter(m => m.isFeatured).length || 0} Pinned
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="bg-white border border-slate-200 h-12 rounded-xl flex items-center px-4 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-xs transition">
          <Search size={16} className="text-slate-400 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Search by brand name, domain, category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex space-x-2 overflow-x-auto scrollbar-none text-xs font-medium pb-1">
          {[
            { id: 'all', label: 'All Entities' },
            { id: 'merchant', label: 'Merchants (Vendors)' },
            { id: 'client', label: 'Clients (Income)' },
            { id: 'featured', label: 'Dashboard Pinned' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`h-10 px-4 rounded-xl transition-all shrink-0 active:scale-95 ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Merchants Grid */}
      {filtered && filtered.length === 0 ? (
        <div className="modern-card rounded-2xl p-12 text-center space-y-3">
          <Building2 size={28} className="mx-auto text-slate-400" />
          <p className="text-slate-800 font-bold text-sm">No merchants or clients match your filter</p>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            Add your preferred shopping apps, food delivery brands, subscription services, or freelance clients.
          </p>
          <button
            onClick={() => { setEditingMerchant(null); setShowModal(true); }}
            className="mt-2 h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-md shadow-indigo-500/20"
          >
            Create New Entity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map(m => (
            <div
              key={m.id}
              className="modern-card p-4.5 rounded-2xl flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <MerchantIcon
                    name={m.name}
                    domain={m.domain}
                    logoUrl={m.logoUrl}
                    size="md"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-slate-900 truncate">
                      {m.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {m.domain || (m.logoUrl?.startsWith('data:') ? 'Custom Logo Uploaded' : 'Default Logo')}
                    </p>
                  </div>
                </div>

                {/* 1-Tap Pin/Unpin from Dashboard */}
                <button
                  onClick={() => toggleFeatured(m.id, m.isFeatured)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition active:scale-90 ${
                    m.isFeatured
                      ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                      : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                  title={m.isFeatured ? 'Pinned to Dashboard (Click to unpin)' : 'Click to pin to Dashboard'}
                >
                  <Star size={16} className={m.isFeatured ? 'fill-amber-500' : ''} />
                </button>
              </div>

              {/* Tags & Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    m.type === 'client' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : m.type === 'both' 
                      ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {m.type === 'both' ? 'Both' : m.type}
                  </span>
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {m.defaultCategory}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => { setEditingMerchant(m); setShowModal(true); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition active:scale-90"
                    title="Edit brand"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(m.id, m.name)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition active:scale-90"
                    title="Delete brand"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <MerchantFormModal
          onClose={() => setShowModal(false)}
          editMerchant={editingMerchant}
        />
      )}
    </div>
  );
};

export default Merchants;
