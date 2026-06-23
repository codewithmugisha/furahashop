'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/api';

function useTable({ data, defaultSort, searchKeys }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(defaultSort?.key || null);
  const [sortDir, setSortDir] = useState(defaultSort?.dir || 'asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const getVal = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);

  const filtered = useMemo(() => {
    let items = data || [];
    if (search && searchKeys) {
      const q = search.toLowerCase();
      items = items.filter(item => searchKeys.some(k => String(getVal(item, k) || '').toLowerCase().includes(q)));
    }
    if (sortKey) {
      items = [...items].sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return items;
  }, [data, search, sortKey, sortDir, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  };

  const setSort = (key, dir) => {
    setSortKey(key);
    setSortDir(dir);
    setPage(0);
  };

  return { search, setSearch, sortKey, sortDir, toggleSort, setSort, page: safePage, setPage, pageSize, setPageSize, totalPages, paged, total: filtered.length };
}

function DataTable({ columns, data, searchable, searchKeys, defaultSort, pageSize: ps }) {
  const { search, setSearch, sortKey, sortDir, toggleSort, page, setPage, pageSize, setPageSize, totalPages, paged, total } = useTable({ data, defaultSort, searchKeys, pageSize: ps });

  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);

  return (
    <div>
      {searchable && (
        <div className="px-5 pt-4 pb-3">
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search..."
            className="w-full max-w-xs px-3 py-2 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest" />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="bg-warm border-b border-border">
              {columns.map(col => (
                <th key={col.key} className={`px-5 py-3.5 ${col.sortable ? 'cursor-pointer select-none hover:bg-forest-light/50' : ''} ${col.align || 'text-left'} text-ink-secondary font-medium`}
                  onClick={() => col.sortable && toggleSort(col.key)}>
                  <div className={`flex items-center gap-1 ${col.align === 'text-right' ? 'justify-end' : col.align === 'text-center' ? 'justify-center' : ''}`}>
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <svg className="w-3 h-3 text-ink-light flex-shrink-0" viewBox="0 0 12 12" fill="currentColor">
                        {sortDir === 'asc' ? <path d="M6 2l4 5H2z"/> : <path d="M6 10l4-5H2z"/>}
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={row._key || i} className="border-b border-border/50 last:border-0 hover:bg-warm/30 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className={`px-5 py-3.5 ${col.align || 'text-left'} ${col.className || ''}`}>
                    {col.render ? col.render(row, i) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total === 0 && <p className="text-center text-ink-light font-sans py-8">No data</p>}
      {total > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 text-xs font-sans text-ink-secondary">
          <div className="flex items-center gap-2">
            <span>Rows:</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="border border-border rounded-lg px-2 py-1 text-xs bg-white outline-none focus:border-forest">
              {[5, 10, 15, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span>{start}-{end} of {total}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-warm disabled:opacity-30 transition-colors">Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const startPage = Math.max(0, Math.min(page - 2, totalPages - 5));
              const p = startPage + i;
              if (p >= totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-forest text-white' : 'border border-border hover:bg-warm'}`}>{p + 1}</button>
              );
            })}
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-warm disabled:opacity-30 transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Pagination({ page, setPage, totalPages, pageSize, setPageSize, total }) {
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 text-xs font-sans text-ink-secondary">
      <div className="flex items-center gap-2">
        <span>Rows:</span>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
          className="border border-border rounded-lg px-2 py-1 text-xs bg-white outline-none focus:border-forest">
          {[5, 10, 15, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <span>{start}-{end} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
          className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-warm disabled:opacity-30 transition-colors">Prev</button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const startPage = Math.max(0, Math.min(page - 2, totalPages - 5));
          const p = startPage + i;
          if (p >= totalPages) return null;
          return (
            <button key={p} onClick={() => setPage(p)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-forest text-white' : 'border border-border hover:bg-warm'}`}>{p + 1}</button>
          );
        })}
        <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
          className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-warm disabled:opacity-30 transition-colors">Next</button>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'dailySales', label: 'Daily Sales' },
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
  { id: 'history', label: 'History' },
  { id: 'products', label: 'Products' },
  { id: 'clients', label: 'Clients' },
];

const PAYMENT_COLORS = { UNPAID: 'bg-red-100 text-danger', DEPOSIT: 'bg-amber-light text-amber-dark', PAID: 'bg-green-100 text-green-800' };
const PAYMENT_LABELS = { UNPAID: 'Unpaid', DEPOSIT: 'Deposit', PAID: 'Paid' };

export default function SalesPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [payFilter, setPayFilter] = useState('');
  const [saleModal, setSaleModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [saleForm, setSaleForm] = useState({ productId: '', clientName: '', clientPhone: '', quantity: 1, orderType: 'DAILY_SALE', paymentStatus: 'PAID', depositAmount: '' });
  const [saleSaving, setSaleSaving] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState({ name: '', price: '', productTypeId: '', priceTierId: '' });
  const [quickProductSaving, setQuickProductSaving] = useState(false);
  const [productTypes, setProductTypes] = useState([]);
  const [priceTiers, setPriceTiers] = useState([]);
  const [storeClients, setStoreClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [resendConfirm, setResendConfirm] = useState(null);

  const SHOP = 'Furaha Furniture Shop';
  const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001';
  const SHOP_FOOTER = `*${SHOP}* 🏪\n${STORE_URL}\nKurikirana: ${STORE_URL}/track`;

  const buildDate = (d) => new Date(d).toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' });

  const buildWhatsAppText = (o, qty) => {
    const prodName = products.find(p => p.id === o.productId)?.name || '';
    const lines = [
      `Muraho neza ${o.clientName},`,
      '',
      'Murakoze kuba umwe mu bakiliya bacu b\'ingenzi.',
      '',
      'Twabyoherereje inyemezabwishyu y\'ibyo mwaguze uyu munsi. Turashimira icyizere mudufitiye kandi twizeye ko mwanyuzwe na serivisi twabahaye.',
      '',
      '**Ibyo mwaguze:**',
      '',
      `📅 Itariki: ${buildDate(o.createdAt)}`,
      '',
      `📦 Ibyaguzwe:\n${prodName} x${qty || o.quantity || 1}`,
      '',
      `💰 Igiteranyo Cyose: ${formatPrice(o.totalPrice)} Frw`,
      '',
      `🧾 Nimero ya Reçu: ${o.orderNumber}`,
      '',
      'Duhora twiyemeje kubagezaho serivisi nziza kandi zihuse. Murakaza neza igihe cyose mukeneye ubufasha cyangwa izindi serivisi.',
      '',
      'Murakoze kubana natwe.',
      '',
      SHOP_FOOTER,
    ];
    return encodeURIComponent(lines.join('\n'));
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch('/api/store/admin/sales?months=12', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(res => {
        if (res.data) setData(res.data);
        else setError(res.error || 'Failed to load');
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setSaleModal(false);
        setReceiptOrder(null);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!receiptOrder) return;
    const prodName = products.find(p => p.id === receiptOrder.productId)?.name || '';
    const msg = [
      `Muraho neza ${receiptOrder.clientName},`,
      '',
      'Murakoze kuba umwe mu bakiliya bacu b\'ingenzi.',
      '',
      'Twabyoherereje inyemezabwishyu y\'ibyo mwaguze uyu munsi. Turashimira icyizere mudufitiye kandi twizeye ko mwanyuzwe na serivisi twabahaye.',
      '',
      '**Ibyo mwaguze:**',
      '',
      `📅 Itariki: ${new Date(receiptOrder.createdAt).toLocaleDateString()}`,
      '',
      `📦 Ibyaguzwe:\n${prodName} x${receiptOrder.quantity}`,
      '',
      `💰 Igiteranyo Cyose: ${formatPrice(receiptOrder.totalPrice)} Frw`,
      '',
      `🧾 Nimero ya Reçu: ${receiptOrder.orderNumber}`,
      '',
      'Duhora twiyemeje kubagezaho serivisi nziza kandi zihuse. Murakaza neza igihe cyose mukeneye ubufasha cyangwa izindi serivisi.',
      '',
      'Murakoze kubana natwe.',
      '',
      `*${SHOP}* 🏪\n${STORE_URL}\nKurikirana: ${STORE_URL}/track`,
    ].join('\n');
    const token = localStorage.getItem('admin_token');
    fetch(`/api/store/admin/orders/${receiptOrder.id}/send-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: msg, force: true }),
    }).catch(() => {});
    const timer = setTimeout(() => setReceiptOrder(null), 2500);
    return () => clearTimeout(timer);
  }, [receiptOrder]);

  const openSaleModal = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const [productsRes, typesRes, tiersRes, clientsRes] = await Promise.all([
        fetch('/api/store/admin/products?limit=200', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/store/admin/types', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/store/admin/tiers', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/store/admin/clients', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const productsResult = await productsRes.json();
      if (productsResult.data?.products) setProducts(productsResult.data.products);
      const typesResult = await typesRes.json();
      if (typesResult.data) setProductTypes(typesResult.data);
      const tiersResult = await tiersRes.json();
      if (tiersResult.data) setPriceTiers(tiersResult.data);
      const clientsResult = await clientsRes.json();
      if (clientsResult.data) setStoreClients(clientsResult.data);
    } catch (err) { console.error(err); }
    setSaleForm({ productId: '', clientName: '', clientPhone: '', quantity: 1, orderType: 'DAILY_SALE', paymentStatus: 'PAID', depositAmount: '' });
    setProductSearch('');
    setShowQuickAdd(false);
    setClientSearch('');
    setSelectedClientId('');
    setShowClientDropdown(false);
    setSaleModal(true);
  };

  const handleQuickAddProduct = async () => {
    setQuickProductSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/store/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: quickProductForm.name,
          price: parseFloat(quickProductForm.price),
          productTypeId: quickProductForm.productTypeId,
          priceTierId: quickProductForm.priceTierId,
          description: '',
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create product');
      const newProduct = result.data;
      setProducts(prev => {
        if (prev.find(p => p.id === newProduct.id)) return prev;
        return [{ id: newProduct.id, name: newProduct.name, price: newProduct.price, slug: newProduct.slug }, ...prev];
      });
      setProductSearch(newProduct.name);
      setSaleForm(f => ({ ...f, productId: newProduct.id }));
      setShowQuickAdd(false);
    } catch (err) {
      alert(err.message);
    }
    setQuickProductSaving(false);
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    setSaleSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/store/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId: saleForm.productId,
          clientName: saleForm.clientName,
          clientPhone: saleForm.clientPhone,
          quantity: saleForm.quantity,
          orderType: saleForm.orderType,
          status: saleForm.orderType === 'ORDER' ? 'PENDING' : 'DELIVERED',
          paymentStatus: saleForm.orderType === 'ORDER' ? 'UNPAID' : saleForm.paymentStatus,
          depositAmount: saleForm.paymentStatus === 'DEPOSIT' ? parseFloat(saleForm.depositAmount) : undefined,
          storeClientId: selectedClientId || undefined,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setSaleModal(false);
        setReceiptOrder(created.data);
      }
    } catch (err) { console.error(err); }
    setSaleSaving(false);
  };

  const handlePayment = async (orderId, paymentStatus, depositAmount) => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/store/admin/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentStatus, depositAmount: depositAmount || undefined }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => {
          const next = { ...prev };
          const upd = { paymentStatus: result.data.paymentStatus, depositAmount: result.data.depositAmount };
          if (next.payments?.orders) next.payments.orders = next.payments.orders.map(o => o.id === orderId ? { ...o, ...upd } : o);
          if (next.dailySales?.items) next.dailySales.items = next.dailySales.items.map(o => o.id === orderId ? { ...o, ...upd } : o);
          if (next.orders?.items) next.orders.items = next.orders.items.map(o => o.id === orderId ? { ...o, ...upd } : o);
          return next;
        });
      }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" /></div>;
  if (error) return <div className="text-center py-20"><p className="text-ink-secondary font-sans">{error}</p></div>;
  if (!data) return null;

  const { overview, payments, dailySales = { items: [] }, orders: ordersData = { items: [] }, history, productPerformance, clientValue } = data;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-ink">Sales</h1>
        <button onClick={openSaleModal}
          className="px-4 py-2 rounded-xl text-sm font-sans font-medium bg-forest text-white hover:bg-forest-dark transition-colors min-h-[40px]">
          + New Sale
        </button>
      </div>

      <div className="flex gap-1 sm:gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-sans font-medium whitespace-nowrap transition-colors min-h-[40px] ${
              tab === t.id ? 'bg-forest text-white' : 'bg-white text-ink-secondary border border-border hover:bg-forest-light'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewSection data={overview} onTabChange={setTab} onPayFilter={setPayFilter} />}
      {tab === 'dailySales' && <DailySalesSection data={dailySales} onPayment={handlePayment} />}
      {tab === 'orders' && <OrdersSection data={ordersData} />}
      {tab === 'payments' && (
        <PaymentsSection
          data={payments}
          filter={payFilter}
          onFilter={setPayFilter}
          onPayment={handlePayment}
        />
      )}
      {tab === 'history' && <HistorySection data={history} />}
      {tab === 'products' && <ProductsSection data={productPerformance} />}
      {tab === 'clients' && <ClientsSection data={clientValue} />}

      {saleModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSaleModal(false)}>
          <form onSubmit={handleCreateSale} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h2 className="font-serif text-lg text-ink">New Sale</h2>

            <div>
              <label className="block text-xs font-sans text-ink-secondary mb-1">Type</label>
              <div className="flex gap-2">
                {['DAILY_SALE', 'ORDER'].map(t => (
                  <button key={t} type="button" onClick={() => {
                    const defaults = t === 'ORDER' ? { paymentStatus: 'UNPAID' } : { paymentStatus: 'PAID', depositAmount: '' };
                    setSaleForm(f => ({ ...f, orderType: t, ...defaults }));
                  }}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-sans font-medium transition-colors min-h-[40px] ${
                      saleForm.orderType === t
                        ? 'bg-forest text-white'
                        : 'bg-white text-ink-secondary border border-border'
                    }`}>
                    {t === 'DAILY_SALE' ? 'Daily Sale' : 'Order'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-sans text-ink-secondary mb-1">Product</label>
              <input type="text" value={productSearch}
                onChange={e => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                  setShowQuickAdd(false);
                  if (e.target.value !== (saleForm.productId ? products.find(p => p.id === saleForm.productId)?.name : '')) {
                    setSaleForm(f => ({ ...f, productId: '' }));
                  }
                }}
                onFocus={() => setShowProductDropdown(true)}
                onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                placeholder="Search or type product name..."
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest" />
              {showProductDropdown && !showQuickAdd && (
                <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-border rounded-xl shadow-lg max-h-56 overflow-y-auto">
                  {productSearch ? (
                    <>
                      {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 10).map(p => (
                        <button key={p.id} type="button" onMouseDown={() => { setProductSearch(p.name); setSaleForm(f => ({ ...f, productId: p.id })); setShowProductDropdown(false); }}
                          className="w-full text-left px-3 py-2.5 text-sm font-sans text-ink hover:bg-warm border-b border-border/50 last:border-0 flex items-center justify-between">
                          <span>{p.name}</span>
                          <span className="text-forest font-medium text-xs">{formatPrice(p.price)} RWF</span>
                        </button>
                      ))}
                      {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                        <div className="p-3 space-y-2">
                          <p className="text-xs text-ink-secondary">Product not found in your inventory</p>
                          <button type="button" onMouseDown={() => { setQuickProductForm(f => ({ ...f, name: productSearch, price: '' })); setShowQuickAdd(true); setShowProductDropdown(false); }}
                            className="text-xs font-medium text-forest hover:text-forest-dark flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Add &ldquo;{productSearch}&rdquo; to stock
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    products.slice(0, 10).map(p => (
                      <button key={p.id} type="button" onMouseDown={() => { setProductSearch(p.name); setSaleForm(f => ({ ...f, productId: p.id })); setShowProductDropdown(false); }}
                        className="w-full text-left px-3 py-2.5 text-sm font-sans text-ink hover:bg-warm border-b border-border/50 last:border-0 flex items-center justify-between">
                        <span>{p.name}</span>
                        <span className="text-forest font-medium text-xs">{formatPrice(p.price)} RWF</span>
                      </button>
                    ))
                  )}
                </div>
              )}
              {showQuickAdd && (
                <div className="bg-warm rounded-xl p-3 mt-2 space-y-3 border border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-sans font-medium text-ink">Add to Stock</p>
                    <button type="button" onClick={() => { setShowQuickAdd(false); setShowProductDropdown(true); }}
                      className="text-xs text-ink-light hover:text-ink">Back</button>
                  </div>
                  <div>
                    <label className="block text-xs font-sans text-ink-secondary mb-1">Product Name</label>
                    <input type="text" value={quickProductForm.name} onChange={e => setQuickProductForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest" />
                  </div>
                  <div>
                    <label className="block text-xs font-sans text-ink-secondary mb-1">Price (RWF)</label>
                    <input type="number" min="0" value={quickProductForm.price} onChange={e => setQuickProductForm(f => ({ ...f, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-sans text-ink-secondary mb-1">Type</label>
                      <select value={quickProductForm.productTypeId} onChange={e => setQuickProductForm(f => ({ ...f, productTypeId: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest">
                        <option value="">Select...</option>
                        {productTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-sans text-ink-secondary mb-1">Tier</label>
                      <select value={quickProductForm.priceTierId} onChange={e => setQuickProductForm(f => ({ ...f, priceTierId: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest">
                        <option value="">Select...</option>
                        {priceTiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="button" onClick={handleQuickAddProduct} disabled={quickProductSaving || !quickProductForm.name || !quickProductForm.price || !quickProductForm.productTypeId || !quickProductForm.priceTierId}
                    className="w-full px-3 py-2 rounded-xl text-sm font-sans font-medium bg-forest text-white hover:bg-forest-dark transition-colors disabled:opacity-50">
                    {quickProductSaving ? 'Adding...' : 'Save & Select'}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-sans text-ink-secondary mb-1">Client</label>
              <div className="relative">
                <input type="text" value={clientSearch}
                  onChange={e => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                    if (selectedClientId) {
                      setSelectedClientId('');
                      setSaleForm(f => ({ ...f, clientName: e.target.value, clientPhone: '' }));
                    } else {
                      setSaleForm(f => ({ ...f, clientName: e.target.value, clientPhone: f.clientPhone }));
                    }
                  }}
                  onFocus={() => { if (!selectedClientId) setShowClientDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                  placeholder={selectedClientId ? `${saleForm.clientName} — ${saleForm.clientPhone}` : "Search existing client..."}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm font-sans bg-white outline-none focus:border-forest pr-10"
                  style={selectedClientId ? { borderColor: '#16a34a', backgroundColor: '#f0fdf4', color: '#166534' } : {}} />
                {selectedClientId && (
                  <button type="button" onClick={() => { setSelectedClientId(''); setClientSearch(''); setSaleForm(f => ({ ...f, clientName: '', clientPhone: '' })); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-green-200 transition-colors">
                    <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {showClientDropdown && clientSearch && !selectedClientId && (
                  <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {storeClients
                      .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch))
                      .slice(0, 8)
                      .map(c => (
                        <button key={c.id} type="button" onMouseDown={() => {
                          setSelectedClientId(c.id);
                          setSaleForm(f => ({ ...f, clientName: c.name, clientPhone: c.phone }));
                          setClientSearch(c.name);
                          setShowClientDropdown(false);
                        }}
                          className="w-full text-left px-3 py-2.5 text-sm font-sans text-ink hover:bg-warm border-b border-border/50 last:border-0 flex items-center justify-between">
                          <div>
                            <span className="font-medium">{c.name}</span>
                            <span className="text-ink-light ml-2">{c.phone}</span>
                          </div>
                          <span className="text-[10px] text-ink-light font-sans">{c._count?.orders || 0} orders</span>
                        </button>
                      ))}
                    {storeClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch)).length === 0 && (
                      <div className="p-3">
                        <p className="text-xs text-ink-secondary">No existing client found. Fill details below to create a new client.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {!selectedClientId && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-sans text-ink-secondary mb-1">Name</label>
                    <input type="text" value={saleForm.clientName} onChange={e => setSaleForm(f => ({ ...f, clientName: e.target.value }))} required
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest" />
                  </div>
                  <div>
                    <label className="block text-xs font-sans text-ink-secondary mb-1">Phone</label>
                    <input type="text" value={saleForm.clientPhone} onChange={e => setSaleForm(f => ({ ...f, clientPhone: e.target.value }))} required
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-sans text-ink-secondary mb-1">Quantity</label>
              <input type="number" min="1" value={saleForm.quantity} onChange={e => setSaleForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest w-24" />
            </div>

            {saleForm.orderType === 'DAILY_SALE' && (
              <div>
                <label className="block text-xs font-sans text-ink-secondary mb-1">Payment</label>
                <div className="flex gap-2">
                  {['PAID', 'DEPOSIT', 'UNPAID'].map(s => (
                    <button key={s} type="button" onClick={() => setSaleForm(f => ({ ...f, paymentStatus: s }))}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-sans font-medium transition-colors min-h-[40px] ${
                        saleForm.paymentStatus === s
                          ? s === 'PAID' ? 'bg-green-100 text-green-800 ring-2 ring-green-400'
                            : s === 'DEPOSIT' ? 'bg-amber-light text-amber-dark ring-2 ring-amber'
                            : 'bg-red-100 text-danger ring-2 ring-red-300'
                          : 'bg-white text-ink-secondary border border-border'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {saleForm.orderType === 'DAILY_SALE' && saleForm.paymentStatus === 'DEPOSIT' && (
              <div>
                <label className="block text-xs font-sans text-ink-secondary mb-1">Deposit Amount (RWF)</label>
                <input type="number" min="0" value={saleForm.depositAmount} onChange={e => setSaleForm(f => ({ ...f, depositAmount: e.target.value }))} required
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest" />
              </div>
            )}

            {saleForm.orderType === 'ORDER' && (
              <div className="bg-warm rounded-xl p-3">
                <p className="text-xs font-sans text-ink-secondary">Orders are created as <strong>UNPAID</strong> by default. Manage payment in the <strong>Payments</strong> tab.</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setSaleModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-sans font-medium bg-white text-ink-secondary border border-border hover:bg-warm transition-colors min-h-[44px]">
                Cancel
              </button>
              <button type="submit" disabled={saleSaving}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-sans font-medium bg-forest text-white hover:bg-forest-dark transition-colors disabled:opacity-50 min-h-[44px]">
                {saleSaving ? 'Saving...' : 'Create Sale'}
              </button>
            </div>
          </form>
        </div>
      )}

      {receiptOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setReceiptOrder(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-serif text-lg text-ink">Sale Complete</h2>
              <p className="text-xs text-ink-secondary font-sans mt-1">Invoice #{receiptOrder.orderNumber}</p>
            </div>

            <div className="bg-warm rounded-xl p-4 space-y-2 text-sm font-sans">
              <div className="flex justify-between">
                <span className="text-ink-secondary">Client</span>
                <span className="text-ink font-medium">{receiptOrder.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Phone</span>
                <span className="text-ink">{receiptOrder.clientPhone}</span>
              </div>
              <div className="border-t border-border/50 my-2" />
              <div className="flex justify-between">
                <span className="text-ink-secondary">Product</span>
                <span className="text-ink font-medium text-right max-w-[180px] truncate">{products.find(p => p.id === receiptOrder.productId)?.name || ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Quantity</span>
                <span className="text-ink">{receiptOrder.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Unit Price</span>
                <span className="text-ink">{formatPrice(receiptOrder.unitPrice)} RWF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Total</span>
                <span className="text-forest font-bold">{formatPrice(receiptOrder.totalPrice)} RWF</span>
              </div>
              <div className="border-t border-border/50 my-2" />
              <div className="flex justify-between">
                <span className="text-ink-secondary">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-sans font-medium ${
                  receiptOrder.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                  receiptOrder.paymentStatus === 'DEPOSIT' ? 'bg-amber-light text-amber-dark' :
                  'bg-red-100 text-danger'
                }`}>{receiptOrder.paymentStatus}</span>
              </div>
              {receiptOrder.paymentStatus === 'DEPOSIT' && receiptOrder.depositAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Deposit Paid</span>
                  <span className="text-ink">{formatPrice(receiptOrder.depositAmount)} RWF</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={async () => {
                const prodName = products.find(p => p.id === receiptOrder.productId)?.name || '';
                const msg = [
                  `Muraho neza ${receiptOrder.clientName},`,
                  '',
                  'Murakoze kuba umwe mu bakiliya bacu b\'ingenzi.',
                  '',
                  'Twabyoherereje inyemezabwishyu y\'ibyo mwaguze uyu munsi. Turashimira icyizere mudufitiye kandi twizeye ko mwanyuzwe na serivisi twabahaye.',
                  '',
                  '**Ibyo mwaguze:**',
                  '',
                  `📅 Itariki: ${buildDate(receiptOrder.createdAt)}`,
                  '',
                  `📦 Ibyaguzwe:\n${prodName} x${receiptOrder.quantity}`,
                  '',
                  `💰 Igiteranyo Cyose: ${formatPrice(receiptOrder.totalPrice)} Frw`,
                  '',
                  `🧾 Nimero ya Reçu: ${receiptOrder.orderNumber}`,
                  '',
                  'Duhora twiyemeje kubagezaho serivisi nziza kandi zihuse. Murakaza neza igihe cyose mukeneye ubufasha cyangwa izindi serivisi.',
                  '',
                  'Murakoze kubana natwe.',
                  '',
                  `*${SHOP}* 🏪\n${STORE_URL}\nKurikirana: ${STORE_URL}/track`,
                ].join('\n');
                const token = localStorage.getItem('admin_token');
                const res = await fetch(`/api/store/admin/orders/${receiptOrder.id}/send-invoice`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ message: msg }),
                });
                const json = await res.json();
                if (json.alreadySent) {
                  setResendConfirm({ orderId: receiptOrder.id, message: msg, lastSentAt: json.lastSentAt });
                }
              }}
                className="w-full px-4 py-3 rounded-xl text-sm font-sans font-medium bg-[#25D366] text-white hover:bg-[#1da851] transition-colors text-center min-h-[44px] flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                Send Invoice via WhatsApp
              </button>

              <button onClick={() => { router.push(`/admin/store/orders/${receiptOrder.id}`); setReceiptOrder(null); }}
                className="w-full px-4 py-3 rounded-xl text-sm font-sans font-medium bg-forest text-white hover:bg-forest-dark transition-colors text-center min-h-[44px]">
                View Full Details
              </button>
              <button onClick={() => setReceiptOrder(null)}
                className="w-full px-4 py-3 rounded-xl text-sm font-sans font-medium bg-white text-ink-secondary border border-border hover:bg-warm transition-colors text-center min-h-[44px]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {resendConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setResendConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg text-ink mb-2">Resend Invoice?</h3>
            <p className="text-sm text-ink-secondary font-sans mb-4">
              Invoice was already sent on <strong>{new Date(resendConfirm.lastSentAt).toLocaleString()}</strong>.
              Are you sure you want to resend?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setResendConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-sans font-medium bg-white text-ink-secondary border border-border hover:bg-warm transition-colors min-h-[44px]">
                Cancel
              </button>
              <button onClick={async () => {
                const token = localStorage.getItem('admin_token');
                await fetch(`/api/store/admin/orders/${resendConfirm.orderId}/send-invoice`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ message: resendConfirm.message, force: true }),
                }).catch(() => {});
                setResendConfirm(null);
              }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-sans font-medium bg-[#25D366] text-white hover:bg-[#1da851] transition-colors min-h-[44px]">
                Resend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewSection({ data, onTabChange, onPayFilter }) {
  return (
    <div className="space-y-6">

      {data.unaccountedProducts?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-sans font-medium text-amber-900">
                {data.unaccountedProducts.length} product{data.unaccountedProducts.length > 1 ? 's' : ''} added during sale{data.unaccountedProducts.length > 1 ? 's' : ''} — no description or images
              </p>
              <p className="text-xs text-amber-700 font-sans">Go to Products page to complete stock details for proper inventory tracking.</p>
            </div>
          </div>
          <a href="/admin/store/products"
            className="px-4 py-2 rounded-xl text-sm font-sans font-medium bg-amber-600 text-white hover:bg-amber-700 min-h-[40px] flex-shrink-0">
            Review &amp; Fix
          </a>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Today</p>
          <p className="text-lg sm:text-xl font-bold text-forest">{data.today.revenueFormatted} RWF</p>
          <p className="text-xs font-sans mt-1">{data.today.orders} orders</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">This Month</p>
          <p className="text-lg sm:text-xl font-bold text-ink">{data.thisMonth.revenueFormatted} RWF</p>
          <p className="text-xs font-sans mt-1">{data.thisMonth.orders} orders</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">vs Last Month</p>
          <p className={`text-lg sm:text-xl font-bold ${data.growth >= 0 ? 'text-green-700' : 'text-danger'}`}>
            {data.growth >= 0 ? '+' : ''}{data.growth}%
          </p>
          <p className="text-xs font-sans mt-1">{data.lastMonth.revenueFormatted} RWF</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Avg Order</p>
          <p className="text-lg sm:text-xl font-bold text-ink">{data.avgOrderValue} RWF</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">All Time</p>
          <p className="text-lg sm:text-xl font-bold text-forest">{data.totalRevenue} RWF</p>
          <p className="text-xs font-sans mt-1">{data.totalOrders} total orders</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Daily Sales</p>
          <p className="text-lg sm:text-xl font-bold text-ink">{data.dailySalesCount || 0} total</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Orders</p>
          <p className="text-lg sm:text-xl font-bold text-ink">{data.ordersCount || 0} total</p>
        </div>
      </div>

      {data.unpaidDelivered > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-sans font-medium text-danger">{data.unpaidDelivered} delivered order{data.unpaidDelivered > 1 ? 's' : ''} pending payment</p>
            <p className="text-xs text-ink-secondary font-sans">Mark as paid in the Payments tab</p>
          </div>
          <button onClick={() => { onTabChange('payments'); onPayFilter('UNPAID'); }}
            className="px-3 py-1.5 rounded-xl text-xs font-sans font-medium bg-danger text-white hover:bg-red-700 min-h-[36px]">
            View
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <a href="/admin/store/products/new" className="px-4 py-2 rounded-xl text-sm font-sans font-medium bg-forest text-white hover:bg-forest-dark transition-colors min-h-[40px]">
          + New Product
        </a>
        <a href="/admin/store/types" className="px-4 py-2 rounded-xl text-sm font-sans font-medium bg-white text-ink-secondary border border-border hover:bg-warm transition-colors min-h-[40px]">
          Manage Types
        </a>
        <a href="/admin/store/tiers" className="px-4 py-2 rounded-xl text-sm font-sans font-medium bg-white text-ink-secondary border border-border hover:bg-warm transition-colors min-h-[40px]">
          Manage Tiers
        </a>
        <a href="/admin/store/orders" className="px-4 py-2 rounded-xl text-sm font-sans font-medium bg-white text-ink-secondary border border-border hover:bg-warm transition-colors min-h-[40px]">
          All Orders
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {data.revenueByTier.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-serif text-lg text-ink mb-4">Revenue by Price Tier (This Month)</h2>
            <div className="space-y-3">
              {data.revenueByTier.map(item => (
                <div key={item.name} className="flex justify-between items-center">
                  <span className="text-sm font-sans text-ink">{item.name}</span>
                  <span className="text-sm font-sans font-medium text-forest">{item.formatted} RWF</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.revenueByType.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-serif text-lg text-ink mb-4">Revenue by Product Type (This Month)</h2>
            <div className="space-y-3">
              {data.revenueByType.map(item => (
                <div key={item.name} className="flex justify-between items-center">
                  <span className="text-sm font-sans text-ink">{item.name}</span>
                  <span className="text-sm font-sans font-medium text-forest">{item.formatted} RWF</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {data.recentOrders?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-serif text-lg text-ink mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-ink-secondary font-medium">Order</th>
                  <th className="text-left py-2 pr-4 text-ink-secondary font-medium">Client</th>
                  <th className="text-left py-2 pr-4 text-ink-secondary font-medium">Product</th>
                  <th className="text-right py-2 pr-4 text-ink-secondary font-medium">Total</th>
                  <th className="text-center py-2 pr-4 text-ink-secondary font-medium">Type</th>
                  <th className="text-center py-2 text-ink-secondary font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map(o => (
                  <tr key={o.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4">
                      <Link href={`/admin/store/orders/${o.id}`} className="font-mono text-xs font-bold text-ink hover:text-forest">{o.orderNumber}</Link>
                    </td>
                    <td className="py-2.5 pr-4 text-ink truncate max-w-[120px]">{o.clientName}</td>
                    <td className="py-2.5 pr-4 text-ink-secondary truncate max-w-[140px]">{o.productName}</td>
                    <td className="py-2.5 pr-4 text-right text-forest font-medium">{o.totalPriceFormatted} RWF</td>
                    <td className="py-2.5 pr-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-sans font-medium ${
                        o.orderType === 'DAILY_SALE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>{o.orderType === 'DAILY_SALE' ? 'Daily Sale' : 'Order'}</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-sans font-medium ${
                        o.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        o.status === 'CANCELLED' ? 'bg-red-100 text-danger' :
                        o.status === 'PENDING' ? 'bg-amber-light text-amber-dark' :
                        'bg-blue-100 text-blue-800'
                      }`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentsSection({ data, filter, onFilter, onPayment }) {
  const baseFiltered = filter
    ? data.orders.filter(o => o.paymentStatus === filter)
    : data.orders;
  const tbl = useTable({ data: baseFiltered, defaultSort: { key: 'createdAt', dir: 'desc' }, searchKeys: ['orderNumber', 'clientName', 'productName'] });

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs text-ink-secondary font-sans mb-1">Outstanding Amount</p>
        <p className="text-2xl font-bold text-danger">{data.outstandingAmount} RWF</p>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {['', 'UNPAID', 'DEPOSIT', 'PAID'].map(s => (
          <button key={s} onClick={() => { onFilter(s); tbl.setPage(0); }}
            className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium transition-colors min-h-[36px] ${
              filter === s ? 'bg-forest text-white' : 'bg-white text-ink-secondary border border-border hover:bg-forest-light'
            }`}>
            {s || 'All'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <select value={tbl.sortKey || ''} onChange={e => {
            const key = e.target.value;
            if (tbl.sortKey === key) tbl.toggleSort(key);
            else tbl.setSort(key, key === 'createdAt' ? 'desc' : 'asc');
          }}
            className="px-3 py-1.5 border border-border rounded-xl text-xs font-sans text-ink bg-white outline-none focus:border-forest">
            <option value="createdAt">Newest</option>
            <option value="totalPrice">Price</option>
            <option value="clientName">Client</option>
            <option value="orderNumber">Order</option>
          </select>
          <input type="text" value={tbl.search} onChange={e => { tbl.setSearch(e.target.value); tbl.setPage(0); }}
            placeholder="Search..."
            className="px-3 py-1.5 border border-border rounded-xl text-xs font-sans text-ink bg-white outline-none focus:border-forest w-40" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-border/50">
          {tbl.paged.map(order => (
            <div key={order.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/admin/store/orders/${order.id}`} className="font-mono text-sm font-bold text-ink hover:text-forest">{order.orderNumber}</Link>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-sans font-medium ${PAYMENT_COLORS[order.paymentStatus]}`}>
                      {PAYMENT_LABELS[order.paymentStatus]}
                    </span>
                    {order.status === 'DELIVERED' && order.paymentStatus !== 'PAID' && (
                      <span className="text-xs text-danger font-sans font-medium">Payment Due</span>
                    )}
                  </div>
                  <p className="text-sm font-sans text-ink truncate">{order.productName}</p>
                  <p className="text-xs text-ink-secondary font-sans">{order.clientName} &middot; {order.totalPriceFormatted} RWF</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {order.paymentStatus !== 'PAID' && (
                    <>
                      <button onClick={() => onPayment(order.id, 'PAID')}
                        className="px-3 py-2 rounded-xl text-xs font-sans font-medium bg-green-100 text-green-800 hover:bg-green-200 min-h-[40px]">
                        Mark Paid
                      </button>
                       <button onClick={() => {
                         const phone = order.clientPhone.replace(/[^0-9]/g, '');
                         const msg = [
                           `Muraho neza ${order.clientName},`,
                           '',
                           'Twizeye ko mumeze neza.',
                           '',
                           `Tubandikiye tubibutsa mu bwubahane ko hakiri amafaranga angana na ${order.totalPriceFormatted} Frw ategerejwe kwishyurwa ajyanye na ${order.orderNumber}.`,
                           '',
                           'Niba mwaramaze kwishyura, mwirengagize ubu butumwa kandi tubashimira ubufatanye bwanyu.',
                           '',
                           'Niba hari ubufasha cyangwa ibisobanuro mukeneye, twiteguye kubibafashamo.',
                           '',
                           'Murakoze ku bufatanye bwiza.',
                           '',
                           `*Furaha Furniture Shop* 🏪\n${process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001'}`,
                         ].join('\n');
                         const token = localStorage.getItem('admin_token');
                         fetch('/api/store/admin/whatsapp/send', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                           body: JSON.stringify({ phone, message: msg }),
                         }).catch(() => {});
                       }}
                         className="px-3 py-2 rounded-xl text-xs font-sans font-medium bg-[#25D366] text-white hover:bg-[#1da851] min-h-[40px] inline-flex items-center gap-1">
                         <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                         Remind
                       </button>
                    </>
                  )}
                  {order.paymentStatus === 'UNPAID' && (
                    <button onClick={() => {
                      const amt = prompt('Deposit amount (RWF):', Math.round(order.totalPrice * 0.5).toString());
                      if (amt && !isNaN(parseFloat(amt))) onPayment(order.id, 'DEPOSIT', parseFloat(amt));
                    }}
                      className="px-3 py-2 rounded-xl text-xs font-sans font-medium bg-amber-light text-amber-dark hover:bg-amber/30 min-h-[40px]">
                      Deposit
                    </button>
                  )}
                  {order.paymentStatus === 'DEPOSIT' && (
                    <button onClick={() => onPayment(order.id, 'UNPAID')}
                      className="px-3 py-2 rounded-xl text-xs font-sans font-medium bg-red-100 text-danger hover:bg-red-200 min-h-[40px]">
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {tbl.total === 0 && (
            <p className="text-center text-sm text-ink-light font-sans py-8">No orders found</p>
          )}
        </div>
        {tbl.total > 0 && (
          <Pagination page={tbl.page} setPage={tbl.setPage} totalPages={tbl.totalPages} pageSize={tbl.pageSize} setPageSize={tbl.setPageSize} total={tbl.total} />
        )}
      </div>
    </div>
  );
}

function DailySalesSection({ data, onPayment }) {
  const [filter, setFilter] = useState('');
  const filtered = filter ? data.items.filter(o => o.paymentStatus === filter) : data.items;
  const tbl = useTable({ data: filtered, defaultSort: { key: 'createdAt', dir: 'desc' }, searchKeys: ['orderNumber', 'clientName', 'productName'] });
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs text-ink-secondary font-sans mb-1">Daily Sales</p>
        <p className="text-2xl font-bold text-ink">{data.items.length} transactions</p>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {['', 'PAID', 'DEPOSIT', 'UNPAID'].map(s => (
          <button key={s} onClick={() => { setFilter(s); tbl.setPage(0); }}
            className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium transition-colors min-h-[36px] ${
              filter === s ? 'bg-forest text-white' : 'bg-white text-ink-secondary border border-border hover:bg-forest-light'
            }`}>
            {s || 'All'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <select value={tbl.sortKey || ''} onChange={e => {
            const key = e.target.value;
            if (tbl.sortKey === key) tbl.toggleSort(key);
            else tbl.setSort(key, key === 'createdAt' ? 'desc' : 'asc');
          }}
            className="px-3 py-1.5 border border-border rounded-xl text-xs font-sans text-ink bg-white outline-none focus:border-forest">
            <option value="createdAt">Newest</option>
            <option value="totalPrice">Price</option>
            <option value="clientName">Client</option>
            <option value="orderNumber">Order</option>
          </select>
          <input type="text" value={tbl.search} onChange={e => { tbl.setSearch(e.target.value); tbl.setPage(0); }}
            placeholder="Search..."
            className="px-3 py-1.5 border border-border rounded-xl text-xs font-sans text-ink bg-white outline-none focus:border-forest w-40" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-border/50">
          {tbl.paged.map(sale => (
            <div key={sale.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/admin/store/orders/${sale.id}`} className="font-mono text-sm font-bold text-ink hover:text-forest">{sale.orderNumber}</Link>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-sans font-medium ${PAYMENT_COLORS[sale.paymentStatus]}`}>
                      {PAYMENT_LABELS[sale.paymentStatus]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-blue-100 text-blue-800">Daily Sale</span>
                  </div>
                  <p className="text-sm font-sans text-ink truncate">{sale.productName}</p>
                  <p className="text-xs text-ink-secondary font-sans">{sale.clientName} &middot; {sale.totalPriceFormatted} RWF</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/admin/store/orders/${sale.id}`}
                    className="px-3 py-2 rounded-xl text-xs font-sans font-medium bg-white text-ink-secondary border border-border hover:bg-warm transition-colors min-h-[40px]">
                    View Details
                  </Link>
                  {sale.paymentStatus !== 'PAID' && (
                    <>
                      <button onClick={() => onPayment(sale.id, 'PAID')}
                        className="px-3 py-2 rounded-xl text-xs font-sans font-medium bg-green-100 text-green-800 hover:bg-green-200 min-h-[40px]">
                        Mark Paid
                      </button>
                        <button onClick={() => {
                          const phone = sale.clientPhone.replace(/[^0-9]/g, '');
                          const msg = [
                            `Muraho neza ${sale.clientName},`,
                            '',
                            'Twizeye ko mumeze neza.',
                            '',
                            `Tubandikiye tubibutsa mu bwubahane ko hakiri amafaranga angana na ${sale.totalPriceFormatted} Frw ategerejwe kwishyurwa ajyanye na ${sale.orderNumber}.`,
                            '',
                            'Niba mwaramaze kwishyura, mwirengagize ubu butumwa kandi tubashimira ubufatanye bwanyu.',
                            '',
                            'Niba hari ubufasha cyangwa ibisobanuro mukeneye, twiteguye kubibafashamo.',
                            '',
                            'Murakoze ku bufatanye bwiza.',
                            '',
                            `*Furaha Furniture Shop* 🏪\n${process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001'}`,
                          ].join('\n');
                          const token = localStorage.getItem('admin_token');
                          fetch('/api/store/admin/whatsapp/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ phone, message: msg }),
                          }).catch(() => {});
                        }}
                          className="px-3 py-2 rounded-xl text-xs font-sans font-medium bg-[#25D366] text-white hover:bg-[#1da851] min-h-[40px] inline-flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                          Remind
                        </button>
                    </>
                  )}
                  {sale.paymentStatus === 'UNPAID' && (
                    <button onClick={() => {
                      const amt = prompt('Deposit amount (RWF):', Math.round(sale.totalPrice * 0.5).toString());
                      if (amt && !isNaN(parseFloat(amt))) onPayment(sale.id, 'DEPOSIT', parseFloat(amt));
                    }}
                      className="px-3 py-2 rounded-xl text-xs font-sans font-medium bg-amber-light text-amber-dark hover:bg-amber/30 min-h-[40px]">
                      Deposit
                    </button>
                  )}
                  {sale.paymentStatus === 'DEPOSIT' && (
                    <button onClick={() => onPayment(sale.id, 'UNPAID')}
                      className="px-3 py-2 rounded-xl text-xs font-sans font-medium bg-red-100 text-danger hover:bg-red-200 min-h-[40px]">
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {tbl.total === 0 && (
            <p className="text-center text-sm text-ink-light font-sans py-8">No daily sales found</p>
          )}
        </div>
        {tbl.total > 0 && (
          <Pagination page={tbl.page} setPage={tbl.setPage} totalPages={tbl.totalPages} pageSize={tbl.pageSize} setPageSize={tbl.setPageSize} total={tbl.total} />
        )}
      </div>
    </div>
  );
}

function OrdersSection({ data }) {
  const [filter, setFilter] = useState('');
  const filtered = filter ? data.items.filter(o => o.status === filter) : data.items;
  const tbl = useTable({ data: filtered, defaultSort: { key: 'createdAt', dir: 'desc' }, searchKeys: ['orderNumber', 'clientName', 'productName'] });
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs text-ink-secondary font-sans mb-1">Orders</p>
        <p className="text-2xl font-bold text-ink">{data.items.length} orders</p>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {['', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => { setFilter(s); tbl.setPage(0); }}
            className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium transition-colors min-h-[36px] ${
              filter === s ? 'bg-forest text-white' : 'bg-white text-ink-secondary border border-border hover:bg-forest-light'
            }`}>
            {s || 'All'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <select value={tbl.sortKey || ''} onChange={e => {
            const key = e.target.value;
            if (tbl.sortKey === key) tbl.toggleSort(key);
            else tbl.setSort(key, key === 'createdAt' ? 'desc' : 'asc');
          }}
            className="px-3 py-1.5 border border-border rounded-xl text-xs font-sans text-ink bg-white outline-none focus:border-forest">
            <option value="createdAt">Newest</option>
            <option value="totalPrice">Price</option>
            <option value="clientName">Client</option>
            <option value="orderNumber">Order</option>
          </select>
          <input type="text" value={tbl.search} onChange={e => { tbl.setSearch(e.target.value); tbl.setPage(0); }}
            placeholder="Search..."
            className="px-3 py-1.5 border border-border rounded-xl text-xs font-sans text-ink bg-white outline-none focus:border-forest w-40" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-border/50">
          {tbl.paged.map(order => (
            <div key={order.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/admin/store/orders/${order.id}`} className="font-mono text-sm font-bold text-ink hover:text-forest">{order.orderNumber}</Link>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-sans font-medium ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-danger' :
                      order.status === 'PENDING' ? 'bg-amber-light text-amber-dark' :
                      order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{order.status}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-sans font-medium ${PAYMENT_COLORS[order.paymentStatus]}`}>
                      {PAYMENT_LABELS[order.paymentStatus]}
                    </span>
                  </div>
                  <p className="text-sm font-sans text-ink truncate">{order.productName}</p>
                  <p className="text-xs text-ink-secondary font-sans">{order.clientName} &middot; {order.totalPriceFormatted} RWF</p>
                </div>
                <Link href={`/admin/store/orders/${order.id}`}
                  className="px-3 py-2 rounded-xl text-xs font-sans font-medium bg-white text-ink-secondary border border-border hover:bg-warm transition-colors min-h-[40px]">
                  View Details
                </Link>
              </div>
            </div>
          ))}
          {tbl.total === 0 && (
            <p className="text-center text-sm text-ink-light font-sans py-8">No orders found</p>
          )}
        </div>
        {tbl.total > 0 && (
          <Pagination page={tbl.page} setPage={tbl.setPage} totalPages={tbl.totalPages} pageSize={tbl.pageSize} setPageSize={tbl.setPageSize} total={tbl.total} />
        )}
      </div>
    </div>
  );
}

function HistorySection({ data }) {
  const cols = [
    { key: 'month', label: 'Month', sortable: true, render: r => <span className="font-medium text-ink">{r.month}</span> },
    { key: 'orders', label: 'Orders', sortable: true, align: 'text-center' },
    { key: 'delivered', label: 'Delivered', sortable: true, align: 'text-center',
      render: r => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
          r.delivered === r.orders ? 'bg-green-100 text-green-800' :
          r.delivered > 0 ? 'bg-amber-light text-amber-dark' :
          'bg-red-100 text-danger'
        }`}>{r.delivered}</span>
      )
    },
    { key: 'revenue', label: 'Revenue', sortable: true, align: 'text-right',
      render: r => <span className="text-forest font-medium">{formatPrice(r.revenue)} RWF</span> },
  ];
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <DataTable columns={cols} data={data.monthly.slice().reverse()} searchable searchKeys={['month']} defaultSort={{ key: 'month', dir: 'desc' }} pageSize={10} />
    </div>
  );
}

function ProductsSection({ data }) {
  const topCols = [
    { key: '_rank', label: '#', render: (_, i) => <span className="text-xs font-bold text-ink-light">{i + 1}</span> },
    { key: 'name', label: 'Product', sortable: true,
      render: r => r.product
        ? <Link href={`/admin/store/products/${r.product.id}`} className="text-ink hover:text-forest font-medium">{r.product.name}</Link>
        : <span className="text-ink-light">Deleted product</span>
    },
    { key: 'orderCount', label: 'Orders', sortable: true, align: 'text-center' },
    { key: 'totalRevenue', label: 'Revenue', sortable: true, align: 'text-right',
      render: r => <span className="text-forest font-medium">{r.totalRevenueFormatted} RWF</span> },
    { key: 'lastOrdered', label: 'Last Ordered', sortable: true, align: 'text-right',
      render: r => <span className="text-ink-secondary">{r.lastOrdered ? new Date(r.lastOrdered).toLocaleDateString() : 'N/A'}</span> },
  ];

  const neverCols = [
    { key: 'name', label: 'Product', sortable: true,
      render: p => <Link href={`/admin/store/products/${p.id}`} className="text-ink hover:text-forest">{p.name}</Link> },
    { key: 'price', label: 'Price', sortable: true, align: 'text-right',
      render: p => <span className="text-ink-secondary">{p.priceFormatted} RWF</span> },
  ];

  return (
    <div className="space-y-6">
      {data.topProducts.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <DataTable columns={topCols} data={data.topProducts} searchable searchKeys={['product.name']} defaultSort={{ key: 'orderCount', dir: 'desc' }} pageSize={10} />
        </div>
      )}
      {data.neverOrdered.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <h2 className="font-serif text-base text-ink">Products Never Ordered</h2>
            <p className="text-xs text-ink-secondary font-sans mt-1">These products have never been ordered. Consider promoting or discounting them.</p>
          </div>
          <DataTable columns={neverCols} data={data.neverOrdered} searchable searchKeys={['name']} defaultSort={{ key: 'name', dir: 'asc' }} pageSize={10} />
        </div>
      )}
    </div>
  );
}

function ClientsSection({ data }) {
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [broadcast, setBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');

  useEffect(() => {
    if (!broadcast) return;
    const handler = (e) => { if (e.key === 'Escape') setBroadcast(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [broadcast]);

  const clientsRaw = showInactiveOnly ? data.clients.filter(c => c.isInactive) : data.clients;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    setSaving(true);
    setSaved(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/store/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, phone, notes }),
      });
      const result = await res.json();
      if (res.ok) {
        setSaved('Client added successfully');
        setName('');
        setPhone('');
        setNotes('');
        setTimeout(() => setShowForm(false), 1000);
      } else {
        setSaved(result.error || 'Failed to add');
      }
    } catch (err) {
      setSaved(err.message);
    }
    setSaving(false);
  };

  const cols = [
    { key: 'name', label: 'Client', sortable: true, render: c => <span className="font-medium text-ink">{c.name || 'Unknown'}</span> },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'totalOrders', label: 'Orders', sortable: true, align: 'text-center' },
    { key: 'totalSpent', label: 'Total Spent', sortable: true, align: 'text-right',
      render: c => <span className="text-forest font-medium">{c.totalSpentFormatted} RWF</span> },
    { key: 'lastOrderDate', label: 'Last Order', sortable: true, align: 'text-right',
      render: c => <span className="text-ink-secondary">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'N/A'}</span> },
    { key: '_msg', label: '', render: c => (
      <div className="flex gap-1">
        <button onClick={() => {
          const phone = c.phone.replace(/[^0-9]/g, '');
          const msg = [
            `Muraho neza ${c.name},`,
            '',
            'Twifuje kubasuhuza no kubashimira kuba umwe mu bakiliya bacu b\'ingenzi.',
            '',
            'Turabashimira icyizere mukomeje kutugirira kandi twiyemeje gukomeza kubagezaho serivisi nziza kandi zibanyuze.',
            '',
            'Niba hari icyo mwifuza kutubaza cyangwa serivisi mukeneye, ntimuzuyaze kutwandikira.',
            '',
            'Tubifurije umunsi mwiza n\'imirimo myiza.',
            '',
            `*Furaha Furniture Shop* 🏪\n${process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001'}`,
          ].join('\n');
          const token = localStorage.getItem('admin_token');
          fetch('/api/store/admin/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ phone, message: msg }),
          }).catch(() => {});
        }}
          className="px-2 py-1 rounded-lg text-xs font-sans bg-[#25D366] text-white hover:bg-[#1da851] min-h-[32px] inline-flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        </button>

      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showInactiveOnly} onChange={() => setShowInactiveOnly(!showInactiveOnly)} className="rounded" />
          <span className="text-sm font-sans text-ink-secondary">Inactive only (no order in 3+ months)</span>
        </label>
        <div className="flex gap-2">
          <button onClick={() => { setBroadcast(true); setBroadcastMsg(''); }}
            className="px-4 py-2 rounded-xl text-sm font-sans font-medium bg-[#25D366] text-white hover:bg-[#1da851] transition-colors min-h-[40px] flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            Notify Clients
          </button>
          <button onClick={() => { setShowForm(!showForm); setSaved(null); }}
            className="px-4 py-2 rounded-xl text-sm font-sans font-medium bg-forest text-white hover:bg-forest-dark transition-colors min-h-[40px]">
            + Add Client
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-serif text-base text-ink">New Client</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Client name" required
              className="w-full px-3 py-2 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest" />
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" required
              className="w-full px-3 py-2 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest" />
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)"
              className="w-full px-3 py-2 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest" />
          </div>
          <div className="flex gap-3 items-center">
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-sans font-medium bg-forest text-white hover:bg-forest-dark transition-colors disabled:opacity-50 min-h-[40px]">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-sans font-medium bg-white text-ink-secondary border border-border hover:bg-warm transition-colors min-h-[40px]">
              Cancel
            </button>
            {saved && <span className="text-sm font-sans text-green-700">{saved}</span>}
          </div>
        </form>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <DataTable columns={cols} data={clientsRaw} searchable searchKeys={['name', 'phone']} defaultSort={{ key: 'totalSpent', dir: 'desc' }} pageSize={10} />
      </div>

      {broadcast && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setBroadcast(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="font-serif text-lg text-ink">Notify All Clients</h3>
            <p className="text-xs text-ink-secondary font-sans">Compose a message to send to {clientsRaw.length} client{clientsRaw.length !== 1 ? 's' : ''}.</p>
            <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
              placeholder="Type your message here... e.g. New products have arrived at FORWADIQ! Visit our store to see the latest collection."
              className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[120px] focus:outline-none focus:ring-2 focus:ring-forest/20 resize-none"
            />
            <div className="flex gap-2 flex-wrap">
              <button onClick={async () => {
                const token = localStorage.getItem('admin_token');
                const defaultMsg = 'Tubamenyesha ko hari ibintu bishya byageze. Murakaza neza kureba.';
                const customBody = broadcastMsg || defaultMsg;
                const messages = clientsRaw.map(c => ({
                  phone: c.phone,
                  message: [
                    'Muraho neza,',
                    '',
                    customBody,
                    '',
                    'Turabashimira kuba umwe mu bagize umuryango w\'abakiliya bacu. Dukomeje gukora ibishoboka byose kugira ngo tubagezeho serivisi nziza kandi zinoze.',
                    '',
                    'Niba hari ibibazo cyangwa ibitekerezo mufite, murisanga mwisanzuye kutwandikira.',
                    '',
                    'Murakoze ku cyizere mudufitiye.',
                    '',
                    `*Furaha Furniture Shop* 🏪\n${process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001'}`,
                  ].join('\n'),
                }));
                await fetch('/api/store/admin/whatsapp/send-bulk', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ messages }),
                }).catch(() => {});
                setBroadcast(false);
              }}
                className="px-4 py-2.5 rounded-xl text-sm font-sans font-medium bg-[#25D366] text-white hover:bg-[#1da851] transition-colors min-h-[44px] flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                Send via WhatsApp ({clientsRaw.length})
              </button>

              <button onClick={() => setBroadcast(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-sans font-medium bg-white text-ink-secondary border border-border hover:bg-warm transition-colors min-h-[44px]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
