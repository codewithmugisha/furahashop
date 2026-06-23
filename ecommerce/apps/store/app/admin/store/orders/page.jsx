'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import StoreButton from '@/components/StoreButton';
import { formatPrice } from '@/lib/api';


const statusFlow = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['READY'],
  READY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const statusActions = {
  PENDING: { primary: { label: 'Confirm', status: 'CONFIRMED', variant: 'bg-amber text-white' }, danger: { label: 'Cancel', status: 'CANCELLED' } },
  CONFIRMED: { primary: { label: 'Mark In Progress', status: 'IN_PROGRESS', variant: 'bg-forest text-white' } },
  IN_PROGRESS: { primary: { label: 'Mark Ready', status: 'READY', variant: 'bg-purple-600 text-white' } },
  READY: { primary: { label: 'Mark Delivered', status: 'DELIVERED', variant: 'bg-green-600 text-white' } },
};

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    params.set('page', page);
    params.set('limit', '20');

    try {
      const res = await fetch(`/api/store/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.data) {
        setOrders(data.data.orders || []);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [statusFilter, search, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    const token = localStorage.getItem('admin_token');
    const body = { status: newStatus };
    if (newStatus === 'CANCELLED') {
      body.cancelReason = cancelReason || 'No reason provided';
    }

    try {
      const res = await fetch(`/api/store/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setConfirmModal(null);
        setCancelModal(null);
        setCancelReason('');
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const allStatuses = ['', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'];

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink mb-6">Store Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {allStatuses.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium transition-all min-h-[36px] ${
              statusFilter === s ? 'bg-forest text-white' : 'bg-white text-ink-secondary border border-border hover:bg-forest-light'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by order number or client name..."
          className="w-full max-w-md px-4 py-2.5 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" />
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => {
            const actions = statusActions[order.status];
            return (
              <div key={order.id} className="bg-card border border-border rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/admin/store/orders/${order.id}`} className="font-mono text-sm font-bold text-ink hover:text-forest transition-colors">{order.orderNumber}</Link>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm font-sans text-ink truncate">{order.product?.name || 'Unknown product'}</p>
                    <p className="text-xs text-ink-secondary font-sans">
                      {order.clientName} &middot; {order.clientPhone}
                      {order.clientPhone && (
                        <button onClick={() => {
                          const token = localStorage.getItem('admin_token');
                          const phone = order.clientPhone.replace(/[^0-9]/g, '');
                          const msg = [
                            `Muraho neza ${order.clientName},`,
                            '',
                            'Twifuje kubasuhuza no kubashimira kuba umwe mu bakiliya bacu b\'ingenzi.',
                            'Turabashimira icyizere mukomeje kutugirira kandi twiyemeje gukomeza kubagezaho serivisi nziza kandi zibanyuze.',
                            '',
                            'Niba hari icyo mwifuza kutubaza cyangwa serivisi mukeneye, ntimuzuyaze kutwandikira.',
                            '',
                            'Tubifurije umunsi mwiza n\'imirimo myiza.',
                            '',
                            `*Furaha Furniture Shop* 🏪\n${process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001'}`,
                          ].join('\n');
                          fetch('/api/store/admin/whatsapp/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ phone, message: msg }),
                          }).catch(() => {});
                        }}
                          className="text-[#25D366] ml-1 hover:underline cursor-pointer bg-transparent border-0 text-xs font-sans">
                          WhatsApp
                        </button>
                      )}
                    </p>
                    <p className="text-xs text-ink-secondary font-sans">
                      Qty: {order.quantity} &middot; Total: {formatPrice(order.totalPrice)} RWF &middot; {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {actions?.primary && (
                      <button
                        onClick={() => setConfirmModal({ id: order.id, status: actions.primary.status, label: actions.primary.label })}
                        className={`px-3 py-2 rounded-xl text-xs font-sans font-medium min-h-[40px] ${actions.primary.variant || 'bg-forest text-white'}`}
                      >
                        {actions.primary.label}
                      </button>
                    )}
                    {actions?.danger && (
                      <button
                        onClick={() => setCancelModal(order.id)}
                        className="px-3 py-2 rounded-xl text-xs font-sans font-medium min-h-[40px] bg-red-50 text-danger hover:bg-red-100"
                      >
                        {actions.danger.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <svg className="w-12 h-12 mx-auto text-ink-light mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-serif text-xl text-ink mb-2">No orders yet</p>
          <p className="text-sm text-ink-secondary font-sans mb-4">Share your store link to start receiving orders.</p>
          <button onClick={() => navigator.clipboard.writeText(window.location.origin)}
            className="text-forest font-sans text-sm font-medium hover:underline">
            Copy store link
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-3 mt-6">
          {page > 1 && (
            <button onClick={() => setPage(page - 1)}
              className="px-4 py-2 bg-white border border-border rounded-xl text-sm font-sans text-ink hover:bg-forest-light">
              Previous
            </button>
          )}
          {page < pagination.pages && (
            <button onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-forest text-white rounded-xl text-sm font-sans hover:bg-forest-mid">
              Next
            </button>
          )}
        </div>
      )}

      {/* Confirm modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-serif text-lg text-ink mb-2">Confirm Update</h3>
            <p className="text-sm text-ink-secondary font-sans mb-4">
              Mark order {confirmModal.id.slice(0, 8)} as {confirmModal.label.toLowerCase()}?
            </p>
            <div className="flex gap-3">
              <StoreButton variant="ghost" onClick={() => setConfirmModal(null)}>Cancel</StoreButton>
              <StoreButton variant="primary" onClick={() => handleStatusChange(confirmModal.id, confirmModal.status)}>
                {confirmModal.label}
              </StoreButton>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-serif text-lg text-ink mb-2">Cancel Order</h3>
            <p className="text-sm text-ink-secondary font-sans mb-4">Reason for cancellation:</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[80px] focus:outline-none focus:ring-2 focus:ring-forest/20 resize-none mb-4"
            />
            <div className="flex gap-3">
              <StoreButton variant="ghost" onClick={() => { setCancelModal(null); setCancelReason(''); }}>Go Back</StoreButton>
              <StoreButton variant="primary" className="bg-danger hover:bg-red-700" onClick={() => handleStatusChange(cancelModal, 'CANCELLED')}>
                Cancel Order
              </StoreButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
