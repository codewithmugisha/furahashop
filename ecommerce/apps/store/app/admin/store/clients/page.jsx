'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

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

  return { search, setSearch, sortKey, sortDir, toggleSort, page: safePage, setPage, pageSize, setPageSize, totalPages, paged, total: filtered.length };
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
            placeholder="Search clients..."
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
              <tr key={row.id} className="border-b border-border/50 last:border-0 hover:bg-warm/30 transition-colors">
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
      {total === 0 && <p className="text-center text-ink-light font-sans py-8">No clients found</p>}
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

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch('/api/store/admin/clients?limit=200', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(res => {
        if (res.data) setClients(res.data);
        else setError(res.error || 'Failed to load');
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const formatPrice = (n) => new Intl.NumberFormat('en-RW', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formName || !formPhone) return;
    setSaving(true);
    setSaved(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/store/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: formName, phone: formPhone, notes: formNotes }),
      });
      const result = await res.json();
      if (res.ok) {
        setSaved('Client added successfully');
        setFormName('');
        setFormPhone('');
        setFormNotes('');
        const refresh = await fetch('/api/store/admin/clients?limit=200', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const refreshData = await refresh.json();
        if (refreshData.data) setClients(refreshData.data);
        setTimeout(() => setShowForm(false), 800);
      } else {
        setSaved(result.error || 'Failed to add');
      }
    } catch (err) {
      setSaved(err.message);
    }
    setSaving(false);
  };

  const cols = [
    { key: 'name', label: 'Client', sortable: true,
      render: r => (
        <div>
          <Link href={`/admin/store/clients/${r.id}`} className="font-medium text-ink hover:text-forest transition-colors">{r.name}</Link>
          <span className="text-ink-light ml-2 text-xs">{r.phone}</span>
        </div>
      ),
    },
    { key: 'orderCount', label: 'Orders', sortable: true, align: 'text-center',
      render: r => <span className="font-medium">{r.orderCount}</span> },
    { key: 'totalSpent', label: 'Total Spent', sortable: true, align: 'text-right',
      render: r => <span className="text-forest font-medium">{r.totalSpentFormatted} RWF</span> },
    { key: 'lastOrderDate', label: 'Last Order', sortable: true, align: 'text-right',
      render: r => <span className="text-ink-secondary">{r.lastOrderDate ? new Date(r.lastOrderDate).toLocaleDateString() : 'Never'}</span> },
    { key: 'createdAt', label: 'Client Since', sortable: true, align: 'text-right',
      render: r => <span className="text-ink-secondary text-xs">{new Date(r.createdAt).toLocaleDateString()}</span> },
    { key: '_actions', label: '', align: 'text-right',
      render: r => (
        <Link href={`/admin/store/clients/${r.id}`}
          className="text-xs font-medium text-forest hover:text-forest-dark transition-colors">
          View
        </Link>
      ),
    },
  ];

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" /></div>;
  if (error) return <div className="text-center py-20"><p className="text-ink-secondary font-sans">{error}</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-ink">Clients</h1>
        <button onClick={() => { setShowForm(!showForm); setSaved(null); }}
          className="px-4 py-2 rounded-xl text-sm font-sans font-medium bg-forest text-white hover:bg-forest-dark transition-colors min-h-[40px]">
          + Add Client
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={handleAdd} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-serif text-lg text-ink">New Client</h3>
            <div className="space-y-4">
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Client name" required autoFocus
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest" />
              <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="Phone number" required
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest" />
              <input type="text" value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Notes (optional)"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm font-sans text-ink bg-white outline-none focus:border-forest" />
            </div>
            <div className="flex gap-3 items-center pt-2">
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
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Total Clients</p>
          <p className="text-xl font-bold text-ink">{clients.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Total Orders</p>
          <p className="text-xl font-bold text-ink">{clients.reduce((s, c) => s + c.orderCount, 0)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-forest">{formatPrice(clients.reduce((s, c) => s + c.totalSpent, 0))} RWF</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <DataTable columns={cols} data={clients} searchable searchKeys={['name', 'phone']} defaultSort={{ key: 'totalSpent', dir: 'desc' }} pageSize={10} />
      </div>
    </div>
  );
}
