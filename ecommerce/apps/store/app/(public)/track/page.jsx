'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import StoreButton from '@/components/StoreButton';
import { formatPrice } from '@/lib/api';
import { useStoreAuth } from '@/lib/storeAuth';

const API = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001';
const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const statusMessages = {
  PENDING: 'Twakiriye komande yawe kandi tuzayimena ikindi gihe',
  CONFIRMED: 'Komande yawe yemejwe turi gutegura kuyitangira',
  IN_PROGRESS: 'Turi gukora ibicuruzwa byawe',
  READY: 'Komande yawe irateze! Nyamuneka tegura gusura cyangwa kuyohereza',
  DELIVERED: 'Komande yujujwe. Murakoze guhitana *Furaha Furniture Shop*!',
  CANCELLED: 'Komande yahagaritswe. Mwande mwishakisha ibindi.',
};

const allStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'DELIVERED'];

function TrackContent() {
  const searchParams = useSearchParams();
  const queryOrderNumber = searchParams.get('orderNumber') || '';
  const { client } = useStoreAuth();
  const [phone, setPhone] = useState('');
  const [orderNumber, setOrderNumber] = useState(queryOrderNumber);
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [mode, setMode] = useState(queryOrderNumber ? 'order' : 'phone');
  const [clientOrders, setClientOrders] = useState(null);

  useEffect(() => {
    if (queryOrderNumber) {
      setOrderNumber(queryOrderNumber);
      handleSearch(queryOrderNumber, 'order');
    }
  }, []);

  useEffect(() => {
    if (client) {
      fetch(`${API_BACKEND}/api/store/client/orders`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.orders) setClientOrders(data.orders);
        })
        .catch(() => {});
    } else {
      setClientOrders(null);
    }
  }, [client]);

  const handleSearch = async (value, searchMode) => {
    const sm = searchMode || mode;
    setLoading(true);
    setSearched(true);

    try {
      const params = sm === 'order'
        ? `orderNumber=${encodeURIComponent(value || orderNumber)}`
        : `phone=${(value || phone).replace(/[^0-9]/g, '')}`;
      const res = await fetch(`${API}/api/store/orders/track?${params}`);
      const data = await res.json();
      setOrders(data.data?.orders || []);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
      <h1 className="font-serif text-3xl sm:text-4xl text-ink mb-2">Kurikirana Komande Yawe</h1>
      <p className="text-ink-secondary font-sans mb-8">Shyiramo numero ya WhatsApp cyangwa numero ya komande kugira ngo urebe aho igeze</p>

      {/* Logged-in: show my orders section */}
      {clientOrders && clientOrders.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-xl text-ink mb-4">My Orders</h2>
          <div className="space-y-3">
            {clientOrders.map(order => (
              <Link key={order.id} href={`/track?orderNumber=${order.orderNumber}`}
                className="block bg-forest-light/50 rounded-xl p-4 hover:bg-forest-light transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm font-bold text-ink">{order.orderNumber}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-sm text-ink-secondary font-sans">{order.product?.name}</p>
                <div className="flex justify-between text-xs text-ink-secondary font-sans mt-1">
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span>{formatPrice(order.totalPrice)} RWF</span>
                </div>
              </Link>
            ))}
          </div>
          <hr className="border-border my-6" />
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button onClick={() => { setMode('phone'); setSearched(false); setOrders(null); }}
          className={`flex-1 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors min-h-[40px] ${
            mode === 'phone' ? 'bg-forest text-white' : 'bg-white text-ink-secondary border border-border'
          }`}>
          Numero ya WhatsApp
        </button>
        <button onClick={() => { setMode('order'); setSearched(false); setOrders(null); }}
          className={`flex-1 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors min-h-[40px] ${
            mode === 'order' ? 'bg-forest text-white' : 'bg-white text-ink-secondary border border-border'
          }`}>
          Numero ya Komande
        </button>
      </div>

      <form onSubmit={onSubmit} className="mb-10">
        <div className="flex gap-2">
          <div className="flex-1">
            {mode === 'phone' ? (
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-border rounded-l-xl bg-warm text-ink-secondary text-sm font-sans min-h-[48px]">
                  +250
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="7XXXXXXXX"
                  className="flex-1 px-4 py-3 border border-border rounded-r-xl text-base font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                  required
                />
              </div>
            ) : (
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="ORD-XXXXX"
                className="w-full px-4 py-3 border border-border rounded-xl text-base font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                required
              />
            )}
          </div>
          <StoreButton type="submit" variant="primary" disabled={loading}>
            {loading ? 'Ura...' : 'Shaka'}
          </StoreButton>
        </div>
      </form>

      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full mx-auto" />
        </div>
      )}

      {!loading && searched && orders?.length === 0 && (
        <div className="text-center py-10">
          <svg className="w-16 h-16 mx-auto text-ink-light mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-serif text-xl text-ink mb-3">Nta komande zibonetse</p>
          <Link href="/products">
            <StoreButton variant="primary">Tanga komande ya mbere &rarr;</StoreButton>
          </Link>
        </div>
      )}

      {!loading && orders?.length > 0 && (
        <div className="space-y-6">
          {orders.map((order) => {
            const currentIdx = allStatuses.indexOf(order.status);
            const isCancelled = order.status === 'CANCELLED';

            return (
              <div key={order.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  {order.product?.images?.[0] && (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-warm flex-shrink-0">
                      <Image
                        src={order.product.images[0].imageUrl}
                        alt={order.product.name || ''}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-bold text-ink">{order.orderNumber}</p>
                    <p className="text-sm text-ink-secondary font-sans truncate">{order.product?.name || 'Product'}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="flex justify-between text-sm font-sans mb-4">
                  <span className="text-ink-secondary">{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className="text-ink font-medium">{formatPrice(order.totalPrice)} RWF</span>
                </div>

                {isCancelled ? (
                  <div className="bg-red-50 text-danger text-sm font-sans rounded-xl p-3">
                    {order.cancelReason ? `Yahagaritswe: ${order.cancelReason}` : statusMessages.CANCELLED}
                  </div>
                ) : (
                  <>
                    <div className="relative flex items-center justify-between mb-4">
                      {allStatuses.map((s, i) => {
                        const isCompleted = i <= currentIdx;
                        const isCurrent = i === currentIdx;
                        return (
                          <div key={s} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-sans transition-all ${
                              isCompleted ? 'bg-forest text-white' : 'bg-warm text-ink-light'
                            } ${isCurrent ? 'ring-2 ring-forest ring-offset-2' : ''}`}>
                              {isCompleted && i < currentIdx ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                i + 1
                              )}
                            </div>
                            <p className={`text-[10px] font-sans mt-1 ${isCompleted ? 'text-forest font-medium' : 'text-ink-light'}`}>
                              {s === 'PENDING' ? 'Iratege' : s === 'CONFIRMED' ? 'Yemejwe' : s === 'IN_PROGRESS' ? 'Irakorwa' : s === 'READY' ? 'Irateze' : 'Yujujwe'}
                            </p>
                          </div>
                        );
                      })}
                      <div className="absolute top-4 left-0 right-0 h-0.5 bg-warm -z-10">
                        <div className="h-full bg-forest transition-all" style={{ width: `${(currentIdx / (allStatuses.length - 1)) * 100}%` }} />
                      </div>
                    </div>

                    <p className="text-sm text-ink-secondary font-sans">
                      {statusMessages[order.status] || ''}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-20 text-center"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full mx-auto" /></div>}>
      <TrackContent />
    </Suspense>
  );
}
