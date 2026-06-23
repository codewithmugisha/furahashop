'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const PAYMENT_COLORS = { UNPAID: 'bg-red-100 text-danger', DEPOSIT: 'bg-amber-light text-amber-dark', PAID: 'bg-green-100 text-green-800' };
const PAYMENT_LABELS = { UNPAID: 'Unpaid', DEPOSIT: 'Deposit', PAID: 'Paid' };

const STATUS_COLORS = {
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-danger',
  PENDING: 'bg-amber-light text-amber-dark',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  READY: 'bg-gray-100 text-gray-800',
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editNotes, setEditNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch(`/api/store/admin/clients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(res => {
        if (res.data) {
          setClient(res.data);
          setNotesValue(res.data.notes || '');
        } else setError(res.error || 'Failed to load');
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [id]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/store/admin/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: notesValue }),
      });
      if (res.ok) {
        setClient(prev => ({ ...prev, notes: notesValue }));
        setEditNotes(false);
      }
    } catch (err) { console.error(err); }
    setSavingNotes(false);
  };

  const formatPrice = (n) => new Intl.NumberFormat('en-RW', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" /></div>;
  if (error) return <div className="text-center py-20"><p className="text-ink-secondary font-sans">{error}</p></div>;
  if (!client) return null;

  return (
    <div className="max-w-4xl">
      <Link href="/admin/store/clients" className="text-xs text-forest font-sans hover:underline mb-2 block">&larr; Back to clients</Link>
      <h1 className="font-serif text-2xl text-ink mb-6">{client.name}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Phone</p>
          <p className="text-sm font-sans font-medium text-ink">{client.phone}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Orders</p>
          <p className="text-xl font-bold text-ink">{client.orderCount}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Total Spent</p>
          <p className="text-xl font-bold text-forest">{client.totalSpentFormatted} RWF</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Client Since</p>
          <p className="text-sm font-sans font-medium text-ink">{new Date(client.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg text-ink">Notes</h2>
          {!editNotes && (
            <button onClick={() => setEditNotes(true)} className="text-xs font-medium text-forest hover:text-forest-dark transition-colors">
              {client.notes ? 'Edit' : 'Add Notes'}
            </button>
          )}
        </div>
        {editNotes ? (
          <div className="space-y-3">
            <textarea value={notesValue} onChange={e => setNotesValue(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[100px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none" />
            <div className="flex gap-2">
              <button onClick={handleSaveNotes} disabled={savingNotes}
                className="px-4 py-2 rounded-xl text-xs font-sans font-medium bg-forest text-white hover:bg-forest-dark transition-colors disabled:opacity-50">
                {savingNotes ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => { setEditNotes(false); setNotesValue(client.notes || ''); }}
                className="px-4 py-2 rounded-xl text-xs font-sans font-medium bg-white text-ink-secondary border border-border hover:bg-warm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-sans text-ink-secondary">{client.notes || 'No notes added yet.'}</p>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-serif text-lg text-ink">Order History ({client.orderCount})</h2>
        </div>
        {client.orders.length === 0 ? (
          <p className="text-center text-sm text-ink-light font-sans py-8">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="bg-warm border-b border-border">
                  <th className="text-left px-5 py-3.5 text-ink-secondary font-medium">Order</th>
                  <th className="text-left px-5 py-3.5 text-ink-secondary font-medium">Product</th>
                  <th className="text-center px-5 py-3.5 text-ink-secondary font-medium">Qty</th>
                  <th className="text-right px-5 py-3.5 text-ink-secondary font-medium">Total</th>
                  <th className="text-center px-5 py-3.5 text-ink-secondary font-medium">Status</th>
                  <th className="text-center px-5 py-3.5 text-ink-secondary font-medium">Payment</th>
                  <th className="text-right px-5 py-3.5 text-ink-secondary font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {client.orders.map(o => (
                  <tr key={o.id} className="border-b border-border/50 last:border-0 hover:bg-warm/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/store/orders/${o.id}`} className="font-mono text-xs font-bold text-ink hover:text-forest">{o.orderNumber}</Link>
                    </td>
                    <td className="px-5 py-3.5 text-ink truncate max-w-[200px]">{o.product?.name || 'Unknown'}</td>
                    <td className="px-5 py-3.5 text-center text-ink-secondary">{o.quantity || 1}</td>
                    <td className="px-5 py-3.5 text-right text-forest font-medium">{formatPrice(o.totalPrice)} RWF</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-sans font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-800'}`}>{o.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-sans font-medium ${PAYMENT_COLORS[o.paymentStatus]}`}>{PAYMENT_LABELS[o.paymentStatus]}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink-secondary text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={() => {
          const phone = client.phone.replace(/[^0-9]/g, '');
          const msg = [
            `Muraho neza ${client.name},`,
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
          className="px-4 py-2.5 rounded-xl text-sm font-sans font-medium bg-[#25D366] text-white hover:bg-[#1da851] transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          Send WhatsApp
        </button>

      </div>
    </div>
  );
}
