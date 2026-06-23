'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StoreButton from '@/components/StoreButton';
import ProductImageManager from '@/components/ProductImageManager';


export default function EditProductPage({ params }) {
  const router = useRouter();
  const [types, setTypes] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    productTypeId: '',
    priceTierId: '',
    material: '',
    dimensions: '',
    availability: 'MADE_TO_ORDER',
    estimatedDays: '',
    allowCustomNotes: true,
    isActive: true,
    isFeatured: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    Promise.all([
      fetch(`/api/store/admin/products/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`/api/store/admin/types`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`/api/store/admin/tiers`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([productData, typesData, tiersData]) => {
      const p = productData.data;
      if (p) {
        setForm({
          name: p.name || '',
          description: p.description || '',
          price: p.price?.toString() || '',
          productTypeId: p.productTypeId || '',
          priceTierId: p.priceTierId || '',
          material: p.material || '',
          dimensions: p.dimensions || '',
          availability: p.availability || 'MADE_TO_ORDER',
          estimatedDays: p.estimatedDays?.toString() || '',
          allowCustomNotes: p.allowCustomNotes ?? true,
          isActive: p.isActive ?? true,
          isFeatured: p.isFeatured ?? false,
        });
        setImages(p.images || []);
      } else {
        setError(productData.error || 'Failed to load product');
      }
      if (typesData.data) setTypes(typesData.data);
      if (tiersData.data) setTiers(tiersData.data);
      setLoading(false);
    }).catch((err) => { setError(err.message); setLoading(false); });
  }, [params.id]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/store/admin/products/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          estimatedDays: form.estimatedDays ? parseInt(form.estimatedDays) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-ink">Edit Product</h1>
        <Link href={`/products/${form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`} target="_blank" className="text-xs text-forest font-sans hover:underline">
          Preview on Store &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left - Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-lg text-ink">Basic Info</h2>
            <div>
              <label className="block text-sm font-sans text-ink-secondary mb-1">Product Name *</label>
              <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-sans text-ink-secondary mb-1">Type</label>
                <select value={form.productTypeId} onChange={e => handleChange('productTypeId', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest">
                  <option value="">Select</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-sans text-ink-secondary mb-1">Tier</label>
                <select value={form.priceTierId} onChange={e => handleChange('priceTierId', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest">
                  <option value="">Select</option>
                  {tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-sans text-ink-secondary mb-1">Price (RWF)</label>
              <input type="number" value={form.price} onChange={e => handleChange('price', e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-lg text-ink">Description</h2>
            <textarea value={form.description} onChange={e => handleChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[120px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none" />
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-lg text-ink">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-sans text-ink-secondary mb-1">Material</label>
                <input type="text" value={form.material} onChange={e => handleChange('material', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
              </div>
              <div>
                <label className="block text-sm font-sans text-ink-secondary mb-1">Dimensions</label>
                <input type="text" value={form.dimensions} onChange={e => handleChange('dimensions', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-sans text-ink-secondary mb-1">Availability</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="avail" value="IN_STOCK" checked={form.availability === 'IN_STOCK'} onChange={e => handleChange('availability', e.target.value)} />
                  <span className="text-sm font-sans">In Stock</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="avail" value="MADE_TO_ORDER" checked={form.availability === 'MADE_TO_ORDER'} onChange={e => handleChange('availability', e.target.value)} />
                  <span className="text-sm font-sans">Made to Order</span>
                </label>
              </div>
            </div>
            {form.availability === 'MADE_TO_ORDER' && (
              <div>
                <label className="block text-sm font-sans text-ink-secondary mb-1">Est. Days</label>
                <input type="number" value={form.estimatedDays} onChange={e => handleChange('estimatedDays', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-lg text-ink">Settings</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm font-sans text-ink">Custom notes</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.allowCustomNotes} onChange={e => handleChange('allowCustomNotes', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-forest/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest" />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-sans text-ink">Active</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => handleChange('isActive', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-forest/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest" />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-sans text-ink">Featured</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={e => handleChange('isFeatured', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-forest/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest" />
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-danger font-sans">{error}</p>}

          <StoreButton type="submit" variant="primary" fullWidth disabled={saving}>
            {saving ? 'Saving...' : 'Save Product'}
          </StoreButton>
        </form>

        {/* Right - Images */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <ProductImageManager
            productId={params.id}
            initialImages={images}
            onChange={setImages}
          />
        </div>
      </div>
    </div>
  );
}
