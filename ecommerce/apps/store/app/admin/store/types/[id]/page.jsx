'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';
import StoreButton from '@/components/StoreButton';

export default function TypeDetailPage({ params }) {
  const [typeData, setTypeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    fetch(`/api/store/admin/types/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(res => {
        if (res.data) {
          setTypeData(res.data);
          setForm({ name: res.data.name, description: res.data.description || '' });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/store/admin/types/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setTypeData(prev => ({ ...prev, ...data.data }));
      }
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleImageUpload = async (result) => {
    const imageUrl = result.info.secure_url;
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/store/admin/types/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setTypeData(prev => ({ ...prev, ...data.data }));
      }
    } catch (err) { console.error(err); }
  };

  const handleRemoveImage = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/store/admin/types/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageUrl: null }),
      });
      if (res.ok) {
        const data = await res.json();
        setTypeData(prev => ({ ...prev, ...data.data }));
      }
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" /></div>;
  }

  if (!typeData) {
    return (
      <div className="text-center py-20">
        <p className="font-serif text-xl text-ink mb-4">Type not found</p>
        <Link href="/admin/store/types" className="text-forest font-sans hover:underline">Back to types</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/store/types" className="text-xs text-forest font-sans hover:underline mb-1 block">&larr; Back to types</Link>
      <h1 className="font-serif text-2xl text-ink mb-6">{typeData.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info & Edit */}
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-lg text-ink">Type Info</h2>
            <div>
              <label className="block text-sm font-sans text-ink-secondary mb-1">Name</label>
              <input type="text" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" required />
            </div>
            <div>
              <label className="block text-sm font-sans text-ink-secondary mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
            </div>
            <div>
              <p className="text-xs text-ink-secondary font-sans">Slug</p>
              <p className="text-sm font-mono text-ink">/{typeData.slug}</p>
            </div>
            <div>
              <p className="text-xs text-ink-secondary font-sans">Products</p>
              <p className="text-sm font-sans text-ink">{typeData.productCount || 0} products</p>
            </div>
            <StoreButton type="submit" variant="primary" fullWidth disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </StoreButton>
          </div>
        </form>

        {/* Image Upload */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-serif text-lg text-ink">Type Image</h2>

          {typeData.imageUrl ? (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-warm">
                <img src={typeData.imageUrl} alt={typeData.name} className="w-full h-full object-cover" />
              </div>
              <button onClick={handleRemoveImage}
                className="w-full px-4 py-2.5 border border-danger/30 text-danger rounded-xl text-sm font-sans hover:bg-danger/5 transition-colors">
                Remove Image
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <svg className="w-10 h-10 text-ink-light mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-sans text-ink-secondary text-sm mb-1">No image yet</p>
              <p className="font-sans text-ink-light text-xs mb-4">Upload a photo to represent this product type</p>
            </div>
          )}

          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'forwardiq-products'}
            onSuccess={handleImageUpload}
            options={{
              maxFiles: 1,
              multiple: false,
              resourceType: 'image',
              clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
              maxFileSize: 10485760,
              cropping: false,
              showSkipCropButton: true,
              sources: ['local', 'camera'],
            }}
          >
            {({ open }) => (
              <button onClick={() => open()}
                className="w-full px-4 py-3 border-2 border-dashed border-border hover:border-forest hover:bg-forest-light/30 rounded-xl text-sm font-sans text-ink-secondary hover:text-forest transition-colors">
                {typeData.imageUrl ? 'Change Image' : 'Upload Image'}
              </button>
            )}
          </CldUploadWidget>
        </div>
      </div>
    </div>
  );
}
