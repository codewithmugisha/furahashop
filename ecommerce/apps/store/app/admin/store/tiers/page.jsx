'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';


export default function TiersPage() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editDesc, setEditDesc] = useState('');

  const fetchTiers = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/store/admin/tiers`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.data) setTiers(data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTiers(); }, [fetchTiers]);

  const handleSave = async (id) => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/store/admin/tiers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description: editDesc }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchTiers();
      }
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (id, isActive) => {
    const token = localStorage.getItem('admin_token');
    try {
      await fetch(`/api/store/admin/tiers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive }),
      });
      fetchTiers();
    } catch (err) { console.error(err); }
  };

  const tierStyles = {
    'low-price': { bg: 'bg-amber-light', text: 'text-amber-dark' },
    'medium-price': { bg: 'bg-forest-light', text: 'text-forest' },
    'master': { bg: 'bg-forest', text: 'text-white' },
  };

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink mb-6">Price Tiers</h1>
      <p className="text-sm text-ink-secondary font-sans mb-6">Tiers cannot be added or deleted. You can edit descriptions and toggle visibility.</p>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-4">
          {tiers.map(tier => {
            const style = tierStyles[tier.slug] || { bg: 'bg-warm', text: 'text-ink' };
            return (
              <div key={tier.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className={`${style.bg} px-5 py-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/admin/store/products?tierId=${tier.id}`} className={`font-serif text-lg ${style.text} hover:underline`}>{tier.name}</Link>
                      <p className={`text-xs font-sans ${style.text} opacity-70`}>/{tier.slug} &middot; {tier.productCount || 0} products</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={tier.isActive} onChange={() => handleToggle(tier.id, !tier.isActive)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-forest/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest" />
                    </label>
                  </div>
                </div>
                <div className="p-5">
                  {editingId === tier.id ? (
                    <div>
                      <textarea
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[80px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none mb-3"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm font-sans text-ink-secondary hover:text-ink">Cancel</button>
                        <button onClick={() => handleSave(tier.id)} className="px-4 py-2 bg-forest text-white rounded-xl text-sm font-sans hover:bg-forest-mid">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-ink-secondary font-sans mb-2">{tier.description || 'No description'}</p>
                      <button onClick={() => { setEditingId(tier.id); setEditDesc(tier.description || ''); }} className="text-xs text-forest font-sans hover:underline">
                        Edit description
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
