'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StoreButton from '@/components/StoreButton';


export default function TypesPage() {
  const router = useRouter();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchTypes = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/store/admin/types`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.data) setTypes(data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    try {
      const res = await fetch(`/api/store/admin/types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setShowAdd(false);
        setForm({ name: '', description: '' });
        router.push(`/admin/store/types/${data.data.id}`);
      }
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (id, isActive) => {
    const token = localStorage.getItem('admin_token');
    try {
      await fetch(`/api/store/admin/types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive }),
      });
      fetchTypes();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/store/admin/types/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        fetchTypes();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-ink">Product Types</h1>
        <button onClick={() => { setShowAdd(true); setForm({ name: '', description: '' }); }}>
          <StoreButton variant="primary" size="sm">Add Type</StoreButton>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-3">
          {types.map(type => (
            <div key={type.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warm flex items-center justify-center text-ink-light flex-shrink-0">
                {type.imageUrl ? (
                  <img src={type.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/admin/store/products?typeId=${type.id}`} className="text-sm font-sans font-medium text-ink hover:text-forest transition-colors">{type.name}</Link>
                <p className="text-xs text-ink-secondary font-sans">/{type.slug} &middot; {type.productCount || 0} products</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={type.isActive} onChange={() => handleToggle(type.id, !type.isActive)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-forest/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest" />
                </label>
                <Link href={`/admin/store/types/${type.id}`} className="text-xs text-forest font-sans hover:underline">Edit</Link>
                <button onClick={() => handleDelete(type.id)} className="text-xs text-danger font-sans hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Type modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md sm:mx-4">
            <h3 className="font-serif text-lg text-ink mb-4">Add Type</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-sans text-ink-secondary mb-1">Name</label>
                <input type="text" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" required />
              </div>
              <div>
                <label className="block text-sm font-sans text-ink-secondary mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
              </div>
              <div className="flex gap-3 mt-6">
                <StoreButton variant="ghost" onClick={() => setShowAdd(false)}>Cancel</StoreButton>
                <StoreButton type="submit" variant="primary">Create</StoreButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
