'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import StoreButton from '@/components/StoreButton';
import { formatPrice } from '@/lib/api';


export default function ProductsPage() {
  const searchParams = useSearchParams();
  const urlTierId = searchParams.get('tierId');
  const urlTypeId = searchParams.get('typeId');

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [types, setTypes] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [selectedType, setSelectedType] = useState(urlTypeId || '');
  const [selectedTier, setSelectedTier] = useState(urlTierId || '');

  const tierId = selectedTier || (urlTierId || null);
  const typeId = selectedType || (urlTypeId || null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    const params = new URLSearchParams({ page, limit: '20' });
    if (tierId) params.set('tierId', tierId);
    if (typeId) params.set('typeId', typeId);
    try {
      const res = await fetch(`/api/store/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.data) {
        setProducts(data.data.products || []);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [page, tierId, typeId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    Promise.all([
      fetch('/api/store/admin/types', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/store/admin/tiers', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([typesData, tiersData]) => {
      if (typesData.data) setTypes(typesData.data);
      if (tiersData.data) setTiers(tiersData.data);
    }).catch(() => {});
  }, []);

  const handleToggle = async (id, field, value) => {
    setTogglingId(id);
    const token = localStorage.getItem('admin_token');
    try {
      await fetch(`/api/store/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: value }),
      });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
    setTogglingId(null);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/store/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteModal(null);
        fetchProducts();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-serif text-2xl text-ink">Products</h1>
        <Link href={`/admin/store/products/new${typeId || tierId ? `?${new URLSearchParams({ ...(typeId && { typeId }), ...(tierId && { tierId }) }).toString()}` : ''}`}>
          <StoreButton variant="primary" size="sm">Add Product</StoreButton>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={selectedType} onChange={e => { setSelectedType(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest">
          <option value="">All Types</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.productCount || 0})</option>)}
        </select>
        <select value={selectedTier} onChange={e => { setSelectedTier(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest">
          <option value="">All Tiers</option>
          {tiers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.productCount || 0})</option>)}
        </select>
        {(selectedType || selectedTier) && (
          <button onClick={() => { setSelectedType(''); setSelectedTier(''); setPage(1); }}
            className="px-4 py-2.5 border border-border rounded-xl text-sm font-sans text-ink-secondary bg-white min-h-[44px] hover:bg-forest-light hover:border-forest transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" />
        </div>
      ) : products.length > 0 ? (
        <div className="space-y-3">
          {products.map(product => (
            <div key={product.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-warm flex-shrink-0">
                {product.images?.[0] ? (
                  <Image src={product.images[0].imageUrl} alt="" fill className="object-cover" sizes="56px" />
                ) : product.description === '' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/admin/store/products/${product.id}`} className="text-sm font-sans font-medium text-ink hover:text-forest transition-colors truncate block">
                  {product.name}
                </Link>
                <p className="text-xs text-ink-secondary font-sans">/{product.slug}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-forest-light text-forest px-2 py-0.5 rounded-full font-sans">{product.productType?.name}</span>
                  <span className="text-xs bg-amber-light text-amber-dark px-2 py-0.5 rounded-full font-sans">{product.priceTier?.name}</span>
                  <span className="text-xs text-ink-secondary font-sans">{formatPrice(product.price)} RWF</span>
                </div>
                <p className="text-xs text-ink-light font-sans mt-0.5">
                  {product._count?.storeOrders || 0} orders &middot; {product.viewCount || 0} views
                  {product.description === '' && !product.images?.[0] && (
                    <span className="ml-2 text-amber-600 font-medium">&middot; Needs info</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Active toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={product.isActive}
                    onChange={() => handleToggle(product.id, 'isActive', !product.isActive)}
                    disabled={togglingId === product.id}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-forest/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest" />
                </label>
                <Link href={`/admin/store/products/${product.id}`} className="text-xs text-ink-secondary font-sans hover:underline">View</Link>
                <Link href={`/admin/store/products/${product.id}/edit`} className="text-xs text-forest font-sans hover:underline">Edit</Link>
                <button onClick={() => setDeleteModal(product.id)} className="text-xs text-danger font-sans hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="font-serif text-xl text-ink mb-2">You haven&apos;t added any products yet.</p>
          <Link href={`/admin/store/products/new${typeId || tierId ? `?${new URLSearchParams({ ...(typeId && { typeId }), ...(tierId && { tierId }) }).toString()}` : ''}`}>
            <StoreButton variant="primary">Add your first product</StoreButton>
          </Link>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-3 mt-6">
          {page > 1 && <button onClick={() => setPage(page - 1)} className="px-4 py-2 bg-white border border-border rounded-xl text-sm font-sans">Previous</button>}
          {page < pagination.pages && <button onClick={() => setPage(page + 1)} className="px-4 py-2 bg-forest text-white rounded-xl text-sm font-sans">Next</button>}
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-serif text-lg text-ink mb-2">Delete Product?</h3>
            <p className="text-sm text-ink-secondary font-sans mb-4">This will hide the product from the store. Active orders will prevent deletion.</p>
            <div className="flex gap-3">
              <StoreButton variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</StoreButton>
              <StoreButton variant="primary" className="bg-danger hover:bg-red-700" onClick={() => handleDelete(deleteModal)}>Delete</StoreButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
