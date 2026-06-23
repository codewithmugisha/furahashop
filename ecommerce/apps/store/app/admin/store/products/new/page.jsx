'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StoreButton from '@/components/StoreButton';
import ProductImageManager from '@/components/ProductImageManager';


export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTypeId = searchParams.get('typeId') || '';
  const urlTierId = searchParams.get('tierId') || '';

  const [types, setTypes] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdProduct, setCreatedProduct] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    productTypeId: urlTypeId,
    priceTierId: urlTierId,
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
    Promise.all([
      fetch(`/api/store/admin/types`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`/api/store/admin/tiers`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([typesData, tiersData]) => {
      if (typesData.data) setTypes(typesData.data);
      if (tiersData.data) setTiers(tiersData.data);
    });
    try {
      const saved = localStorage.getItem('agent_suggested_product');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) setAiSuggestion(parsed);
      }
    } catch {}
  }, []);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setForm(prev => ({
      ...prev,
      name: aiSuggestion.name || prev.name,
      description: aiSuggestion.description || prev.description,
      price: aiSuggestion.price?.toString() || prev.price,
      productTypeId: aiSuggestion.productTypeId || prev.productTypeId,
      priceTierId: aiSuggestion.priceTierId || prev.priceTierId,
      material: aiSuggestion.material || prev.material,
      dimensions: aiSuggestion.dimensions || prev.dimensions,
      availability: aiSuggestion.availability || prev.availability,
      estimatedDays: aiSuggestion.estimatedDays?.toString() || prev.estimatedDays,
    }));
    localStorage.removeItem('agent_suggested_product');
    setAiSuggestion(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/store/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          estimatedDays: form.estimatedDays ? parseInt(form.estimatedDays) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');
      setCreatedProduct(data.data);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const buildBroadcastMsg = (p) => {
    const msg = [
      'Muraho neza,',
      '',
      'Twishimiye kubamenyesha ko twongeye kwakira ibicuruzwa bishya muri serivisi zacu.',
      '',
      `📦 ${p.name}`,
      p.description ? `📝 ${p.description}` : '',
      `💰 Igiciro: ${formatPrice(p.price)} Frw`,
      '',
      'Murakaza neza kubisura cyangwa kutwandikira niba mwifuza ibisobanuro birambuye.',
      '',
      'Turabashimira icyizere mudufitiye kandi dukomeje kubagezaho serivisi nziza.',
      '',
      `*Furaha Furniture Shop* 🏪\n${process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001'}`,
    ].filter(Boolean).join('\n');
    return encodeURIComponent(msg);
  };

  const formatPrice = (n) => {
    return new Intl.NumberFormat('en-RW', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
  };

  const handleBroadcast = async (msg) => {
    setBroadcasting(true);
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/store/admin/sales?months=12', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      const clients = result.data?.clientValue?.clients || [];
      const phones = [...new Set(clients.map(c => c.phone?.replace(/[^0-9]/g, '')).filter(Boolean))];
      if (phones.length === 0) { alert('No client phone numbers found.'); setBroadcasting(false); return; }
      await fetch('/api/store/admin/whatsapp/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: phones.map(p => ({ phone: p, message: decodeURIComponent(msg) })) }),
      }).catch(() => {});
    } catch (err) { alert('Failed to fetch clients'); }
    setBroadcasting(false);
  };

  if (createdProduct) {
    return (
      <div className="max-w-2xl">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest-light flex items-center justify-center">
              <svg className="w-5 h-5 text-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="font-sans font-medium text-ink">Product created!</h2>
              <p className="text-sm text-ink-secondary font-sans">{createdProduct.name}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5 mt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-base text-ink mb-1">Notify Your Customers! 📣</h3>
              <p className="text-sm font-sans text-ink-secondary">
                Let your customers know about <strong className="text-ink">{createdProduct.name}</strong>. 
                Send a broadcast message via WhatsApp and watch the orders roll in!
              </p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => handleBroadcast(buildBroadcastMsg(createdProduct))} disabled={broadcasting}
              className="flex-1 min-w-[140px] px-4 py-3 rounded-xl text-sm font-sans font-medium bg-[#25D366] text-white hover:bg-[#1da851] transition-colors text-center min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              {broadcasting ? 'Opening tabs...' : 'Broadcast via WhatsApp'}
            </button>

            <button onClick={() => setCreatedProduct(null)}
              className="flex-1 min-w-[100px] px-4 py-3 rounded-xl text-sm font-sans font-medium bg-white text-ink-secondary border border-border hover:bg-warm transition-colors text-center min-h-[44px]">
              Skip for Now
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 mt-6">
          <ProductImageManager
            productId={createdProduct.id}
            initialImages={[]}
            onChange={() => {}}
          />
        </div>

        <div className="flex gap-4 mt-6">
          <Link href={`/admin/store/products/${createdProduct.id}/edit`}>
            <StoreButton variant="primary">Edit Full Details</StoreButton>
          </Link>
          <button onClick={() => setCreatedProduct(null)}
            className="px-6 py-3 border border-border rounded-xl text-sm font-sans text-ink hover:bg-warm transition-colors">
            Add Another Product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-ink mb-6">Add Product</h1>
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
              <label className="block text-sm font-sans text-ink-secondary mb-1">Product Type *</label>
              <select value={form.productTypeId} onChange={e => handleChange('productTypeId', e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" required>
                <option value="">Select type</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-sans text-ink-secondary mb-1">Price Tier *</label>
              <select value={form.priceTierId} onChange={e => handleChange('priceTierId', e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" required>
                <option value="">Select tier</option>
                {tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-sans text-ink-secondary mb-1">Price (RWF) *</label>
            <input type="number" value={form.price} onChange={e => handleChange('price', e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" required />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-serif text-lg text-ink">Description</h2>
          <textarea value={form.description} onChange={e => handleChange('description', e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[120px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-serif text-lg text-ink">Physical Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-sans text-ink-secondary mb-1">Material</label>
              <input type="text" value={form.material} onChange={e => handleChange('material', e.target.value)} placeholder="e.g. Mahogany, Pine"
                className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
            </div>
            <div>
              <label className="block text-sm font-sans text-ink-secondary mb-1">Dimensions</label>
              <input type="text" value={form.dimensions} onChange={e => handleChange('dimensions', e.target.value)} placeholder="e.g. 160cm x 200cm"
                className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-sans text-ink-secondary mb-1">Availability</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="availability" value="IN_STOCK" checked={form.availability === 'IN_STOCK'} onChange={e => handleChange('availability', e.target.value)} />
                <span className="text-sm font-sans">In Stock</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="availability" value="MADE_TO_ORDER" checked={form.availability === 'MADE_TO_ORDER'} onChange={e => handleChange('availability', e.target.value)} />
                <span className="text-sm font-sans">Made to Order</span>
              </label>
            </div>
          </div>
          {form.availability === 'MADE_TO_ORDER' && (
            <div>
              <label className="block text-sm font-sans text-ink-secondary mb-1">Estimated Days</label>
              <input type="number" value={form.estimatedDays} onChange={e => handleChange('estimatedDays', e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-serif text-lg text-ink">Settings</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm font-sans text-ink">Allow custom notes</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.allowCustomNotes} onChange={e => handleChange('allowCustomNotes', e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-forest/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest" />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-sans text-ink">Active (visible on store)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => handleChange('isActive', e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-forest/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest" />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-sans text-ink">Featured (shows on homepage)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => handleChange('isFeatured', e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-forest/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest" />
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-danger font-sans">{error}</p>}

        {aiSuggestion && (
          <div className="bg-amber-light/30 border border-amber/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-light flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-amber-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-sans font-medium text-ink mb-1">AI Suggestion</p>
                <p className="text-xs font-sans text-ink-secondary mb-3">
                  The AI suggested details for "{aiSuggestion.name}". Apply them to the form?
                </p>
                <div className="flex gap-2">
                  <button onClick={applyAiSuggestion}
                    className="px-4 py-2 bg-forest text-white rounded-xl text-xs font-sans hover:bg-forest-dark transition-colors">
                    Apply Suggestions
                  </button>
                  <button onClick={() => { setAiSuggestion(null); localStorage.removeItem('agent_suggested_product'); }}
                    className="px-4 py-2 border border-border rounded-xl text-xs font-sans text-ink-secondary hover:bg-warm transition-colors">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <StoreButton type="submit" variant="primary" fullWidth disabled={saving}>
          {saving ? 'Saving...' : 'Save Product'}
        </StoreButton>
      </form>
    </div>
  );
}
