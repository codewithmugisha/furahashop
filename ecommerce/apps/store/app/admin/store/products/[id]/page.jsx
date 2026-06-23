'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import StoreButton from '@/components/StoreButton';
import { formatPrice } from '@/lib/api';

export default function ProductDetailPage({ params }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    fetch(`/api/store/admin/products/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(res => {
        if (res.data) {
          setProduct(res.data);
        } else {
          setError(res.error || 'Failed to load product');
        }
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [params.id]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" /></div>;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="font-serif text-xl text-ink mb-4">{error}</p>
        <Link href="/admin/store/products" className="text-forest font-sans hover:underline">Back to products</Link>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images || [];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/store/products" className="text-xs text-forest font-sans hover:underline mb-1 block">&larr; Back to products</Link>
          <h1 className="font-serif text-2xl text-ink">{product.name}</h1>
        </div>
        <Link href={`/admin/store/products/${product.id}/edit`}>
          <StoreButton variant="primary" size="sm">Edit Product</StoreButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Images */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-serif text-lg text-ink mb-4">Images</h2>
          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setLightboxIndex(i)} className="relative aspect-square rounded-xl overflow-hidden bg-warm group cursor-pointer">
                  <Image src={img.imageUrl} alt={img.altText || ''} fill className="object-cover transition-transform duration-200 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  {img.isPrimary && (
                    <span className="absolute top-2 left-2 bg-forest text-white text-[10px] font-sans px-2 py-0.5 rounded-full">Primary</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-light font-sans text-center py-8">No images</p>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-lg text-ink">Basic Info</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-ink-secondary font-sans">Name</p>
                <p className="text-sm font-sans text-ink">{product.name}</p>
              </div>
              <div>
                <p className="text-xs text-ink-secondary font-sans">Slug</p>
                <p className="text-sm font-mono text-ink">/{product.slug}</p>
              </div>
              <div>
                <p className="text-xs text-ink-secondary font-sans">Type</p>
                <p className="text-sm font-sans text-ink">{product.productType?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-ink-secondary font-sans">Tier</p>
                <p className="text-sm font-sans text-ink">{product.priceTier?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-ink-secondary font-sans">Price</p>
                <p className="text-lg font-bold font-sans text-forest">{formatPrice(product.price)} RWF</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-lg text-ink">Description</h2>
            <p className="text-sm font-sans text-ink whitespace-pre-line">{product.description || 'No description'}</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-lg text-ink">Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-ink-secondary font-sans">Material</p>
                <p className="text-sm font-sans text-ink">{product.material || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-ink-secondary font-sans">Dimensions</p>
                <p className="text-sm font-sans text-ink">{product.dimensions || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-ink-secondary font-sans">Availability</p>
                <p className="text-sm font-sans text-ink">{product.availability === 'IN_STOCK' ? 'In Stock' : 'Made to Order'}</p>
              </div>
              {product.estimatedDays && (
                <div>
                  <p className="text-xs text-ink-secondary font-sans">Est. Days</p>
                  <p className="text-sm font-sans text-ink">{product.estimatedDays}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-lg text-ink">Settings</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-sm font-sans text-ink">Custom Notes</p>
                <p className="text-sm font-sans text-ink">{product.allowCustomNotes ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm font-sans text-ink">Active</p>
                <p className="text-sm font-sans text-ink">{product.isActive ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm font-sans text-ink">Featured</p>
                <p className="text-sm font-sans text-ink">{product.isFeatured ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm font-sans text-ink">Views</p>
                <p className="text-sm font-sans text-ink">{product.viewCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white p-2 min-h-[48px] min-w-[48px] flex items-center justify-center z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + images.length) % images.length); }}
                className="absolute left-4 text-white p-2 min-h-[48px] min-w-[48px] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % images.length); }}
                className="absolute right-4 text-white p-2 min-h-[48px] min-w-[48px] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <div className="relative w-full max-w-4xl aspect-square mx-4"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex].imageUrl}
              alt={images[lightboxIndex].altText || ''}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>
          <div className="absolute bottom-4 text-white text-sm font-sans">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
