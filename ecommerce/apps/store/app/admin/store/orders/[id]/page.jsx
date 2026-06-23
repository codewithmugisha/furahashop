'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import StoreButton from '@/components/StoreButton';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { formatPrice } from '@/lib/api';

const PAYMENT_COLORS = { UNPAID: 'bg-red-100 text-danger', DEPOSIT: 'bg-amber-light text-amber-dark', PAID: 'bg-green-100 text-green-800' };
const PAYMENT_LABELS = { UNPAID: 'Unpaid', DEPOSIT: 'Deposit', PAID: 'Paid' };

const statusTransitions = {
  PENDING: [{ label: 'Confirm', status: 'CONFIRMED', variant: 'bg-amber text-white' }, { label: 'Cancel', status: 'CANCELLED', variant: 'bg-red-50 text-danger' }],
  CONFIRMED: [{ label: 'Mark In Progress', status: 'IN_PROGRESS', variant: 'bg-forest text-white' }, { label: 'Cancel', status: 'CANCELLED', variant: 'bg-red-50 text-danger' }],
  IN_PROGRESS: [{ label: 'Mark Ready', status: 'READY', variant: 'bg-purple-600 text-white' }],
  READY: [{ label: 'Mark Delivered', status: 'DELIVERED', variant: 'bg-green-600 text-white' }],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrderDetailPage({ params }) {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [resendConfirm, setResendConfirm] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    fetch(`/api/store/admin/orders/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(res => {
        if (res.data) {
          setOrder(res.data);
        } else {
          setError(res.error || 'Failed to load order');
        }
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [params.id]);

  const handleStatusChange = async (newStatus) => {
    const token = localStorage.getItem('admin_token');
    const body = { status: newStatus };
    if (newStatus === 'CANCELLED') body.cancelReason = cancelReason || 'No reason provided';
    try {
      const res = await fetch(`/api/store/admin/orders/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const result = await res.json();
        setOrder(result.data);
        setConfirmModal(null);
        setCancelModal(false);
        setCancelReason('');
      }
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" /></div>;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="font-serif text-xl text-ink mb-4">{error}</p>
        <Link href="/admin/store/orders" className="text-forest font-sans hover:underline">Back to orders</Link>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={order.orderType === 'DAILY_SALE' ? '/admin/store/sales' : '/admin/store/orders'} className="text-xs text-forest font-sans hover:underline mb-1 block">&larr; Back to {order.orderType === 'DAILY_SALE' ? 'daily sales' : 'orders'}</Link>
          <h1 className="font-serif text-2xl text-ink">{order.orderType === 'DAILY_SALE' ? 'Daily Sale' : 'Order'} {order.orderNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          {statusTransitions[order.status]?.length > 0 && (
            <div className="relative group">
              <button className="px-3 py-1.5 rounded-xl text-xs font-sans font-medium min-h-[36px] bg-warm text-ink-secondary border border-border hover:bg-forest-light transition-colors">
                Change Status &#9662;
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg z-20 min-w-[160px] hidden group-hover:block">
                {statusTransitions[order.status].map(action => (
                  <button key={action.status} onClick={() => {
                    if (action.status === 'CANCELLED') setCancelModal(true);
                    else setConfirmModal(action);
                  }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-sans hover:bg-warm first:rounded-t-xl last:rounded-b-xl transition-colors ${action.variant?.includes('red') ? 'text-danger' : 'text-ink'}`}>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client info */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-serif text-lg text-ink">Client Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-ink-secondary font-sans">Name</p>
              <p className="text-sm font-sans text-ink">{order.clientName}</p>
            </div>
            <div>
              <p className="text-xs text-ink-secondary font-sans">Phone</p>
              <p className="text-sm font-sans text-ink">{order.clientPhone}</p>
            </div>
            {order.clientEmail && (
              <div>
                <p className="text-xs text-ink-secondary font-sans">Email</p>
                <p className="text-sm font-sans text-ink">{order.clientEmail}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-ink-secondary font-sans">Delivery Method</p>
              <p className="text-sm font-sans text-ink capitalize">{order.deliveryMethod?.toLowerCase()}</p>
            </div>
            {order.deliveryAddress && (
              <div>
                <p className="text-xs text-ink-secondary font-sans">Delivery Address</p>
                <p className="text-sm font-sans text-ink">{order.deliveryAddress}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order info */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-serif text-lg text-ink">Order Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-ink-secondary font-sans">Order Number</p>
              <p className="text-sm font-mono text-ink">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-ink-secondary font-sans">Quantity</p>
              <p className="text-sm font-sans text-ink">{order.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-ink-secondary font-sans">Unit Price</p>
              <p className="text-sm font-sans text-ink">{formatPrice(order.unitPrice)} RWF</p>
            </div>
            <div>
              <p className="text-xs text-ink-secondary font-sans">Total Price</p>
              <p className="text-lg font-bold font-sans text-forest">{formatPrice(order.totalPrice)} RWF</p>
            </div>
            <div>
              <p className="text-xs text-ink-secondary font-sans">Placed On</p>
              <p className="text-sm font-sans text-ink">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            {order.updatedAt !== order.createdAt && (
              <div>
                <p className="text-xs text-ink-secondary font-sans">Last Updated</p>
                <p className="text-sm font-sans text-ink">{new Date(order.updatedAt).toLocaleString()}</p>
              </div>
            )}
            {order.cancelReason && (
              <div>
                <p className="text-xs text-danger font-sans">Cancel Reason</p>
                <p className="text-sm font-sans text-ink">{order.cancelReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-serif text-lg text-ink">Payment Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-ink-secondary font-sans mb-1">Transaction Type</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-sans font-medium ${
                order.orderType === 'DAILY_SALE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
              }`}>{order.orderType === 'DAILY_SALE' ? 'Daily Sale' : 'Order'}</span>
            </div>
            <div>
              <p className="text-xs text-ink-secondary font-sans mb-1">Payment Status</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-sans font-medium ${PAYMENT_COLORS[order.paymentStatus]}`}>
                {PAYMENT_LABELS[order.paymentStatus]}
              </span>
            </div>
            {order.paymentStatus === 'DEPOSIT' && order.depositAmount != null && (
              <>
                <div>
                  <p className="text-xs text-ink-secondary font-sans">Deposit Paid</p>
                  <p className="text-sm font-sans text-ink">{formatPrice(order.depositAmount)} RWF</p>
                </div>
                <div>
                  <p className="text-xs text-ink-secondary font-sans">Outstanding Balance</p>
                  <p className="text-sm font-sans font-bold text-danger">{formatPrice(order.totalPrice - order.depositAmount)} RWF</p>
                </div>
              </>
            )}
            {order.paymentStatus === 'UNPAID' && (
              <div>
                <p className="text-xs text-ink-secondary font-sans">Outstanding Balance</p>
                <p className="text-sm font-sans font-bold text-danger">{formatPrice(order.totalPrice)} RWF</p>
              </div>
            )}
            {order.paymentStatus === 'PAID' && order.paidAt && (
              <div>
                <p className="text-xs text-ink-secondary font-sans">Paid On</p>
                <p className="text-sm font-sans text-ink">{new Date(order.paidAt).toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-ink-secondary font-sans">Total Amount</p>
              <p className="text-base font-bold font-sans text-forest">{formatPrice(order.totalPrice)} RWF</p>
            </div>
          </div>
        </div>

        {/* Product info */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-serif text-lg text-ink">Ordered Product</h2>
          <div className="flex gap-4 sm:gap-6">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden bg-warm flex-shrink-0">
              {order.product?.images?.[0] ? (
                <Image src={order.product.images[0].imageUrl} alt={order.product.name} fill className="object-cover" sizes="144px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-light text-sm font-sans">No image</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-xl text-ink mb-1">{order.product?.name || 'Unknown product'}</p>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {order.product?.productType?.name && (
                  <span className="text-xs bg-forest-light text-forest px-2 py-0.5 rounded-full font-sans">{order.product.productType.name}</span>
                )}
                {order.product?.priceTier?.name && (
                  <span className="text-xs bg-amber-light text-amber-dark px-2 py-0.5 rounded-full font-sans">{order.product.priceTier.name}</span>
                )}
              </div>
              <p className="text-lg font-bold text-forest font-sans">{formatPrice(order.product?.price || order.unitPrice)} RWF</p>
              <div className="mt-2 space-y-1">
                {order.product?.material && (
                  <p className="text-xs text-ink-secondary font-sans">Material: {order.product.material}</p>
                )}
                {order.product?.dimensions && (
                  <p className="text-xs text-ink-secondary font-sans">Dimensions: {order.product.dimensions}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Custom notes */}
        {order.customNotes && (
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-lg text-ink">Custom Notes</h2>
            <p className="text-sm font-sans text-ink whitespace-pre-line">{order.customNotes}</p>
          </div>
        )}

        {/* Share Invoice */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-serif text-lg text-ink">Share Invoice</h2>
          <div className="flex gap-3 flex-wrap">
            <button onClick={async () => {
              const msg = [
                `Muraho neza ${order.clientName},`,
                '',
                'Murakoze kuba umwe mu bakiliya bacu b\'ingenzi.',
                '',
                'Twabyoherereje inyemezabwishyu y\'ibyo mwaguze. Turashimira icyizere mudufitiye kandi twizeye ko mwanyuzwe na serivisi twabahaye.',
                '',
                '**Ibyo mwaguze:**',
                '',
                `📅 Itariki: ${new Date(order.createdAt).toLocaleDateString()}`,
                '',
                `📦 Ibyaguzwe:\n${order.product?.name || ''} x${order.quantity}`,
                '',
                `💰 Igiteranyo Cyose: ${formatPrice(order.totalPrice)} Frw`,
                '',
                `🧾 Nimero ya Reçu: ${order.orderNumber}`,
                '',
                'Duhora twiyemeje kubagezaho serivisi nziza kandi zihuse. Murakaza neza igihe cyose mukeneye ubufasha cyangwa izindi serivisi.',
                '',
                'Murakoze kubana natwe.',
                '',
                `*Furaha Furniture Shop* 🏪\n${process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001'}\nKurikirana: ${(process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001')}/track`,
              ].join('\n');
              const token = localStorage.getItem('admin_token');
              const res = await fetch(`/api/store/admin/orders/${order.id}/send-invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ message: msg }),
              });
              const json = await res.json();
              if (json.alreadySent) {
                setResendConfirm({ message: msg, lastSentAt: json.lastSentAt });
              }
            }}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-sans font-medium bg-[#25D366] text-white hover:bg-[#1da851] transition-colors text-center min-h-[44px] flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Share via WhatsApp
            </button>

          </div>
        </div>
      </div>

      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-serif text-lg text-ink mb-2">Confirm Update</h3>
            <p className="text-sm text-ink-secondary font-sans mb-4">
              Mark order {order.orderNumber} as <strong>{confirmModal.label.toLowerCase()}</strong>?
            </p>
            <div className="flex gap-3">
              <StoreButton variant="ghost" onClick={() => setConfirmModal(null)}>Cancel</StoreButton>
              <StoreButton variant="primary" onClick={() => handleStatusChange(confirmModal.status)}>
                {confirmModal.label}
              </StoreButton>
            </div>
          </div>
        </div>
      )}

      {cancelModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-serif text-lg text-ink mb-2">Cancel Order</h3>
            <p className="text-sm text-ink-secondary font-sans mb-4">Reason for cancellation:</p>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full px-4 py-3 border border-border rounded-xl text-sm font-sans text-ink bg-white min-h-[80px] focus:outline-none focus:ring-2 focus:ring-forest/20 resize-none mb-4"
            />
            <div className="flex gap-3">
              <StoreButton variant="ghost" onClick={() => { setCancelModal(false); setCancelReason(''); }}>Go Back</StoreButton>
              <StoreButton variant="primary" className="bg-danger hover:bg-red-700" onClick={() => handleStatusChange('CANCELLED')}>
                Cancel Order
              </StoreButton>
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
                await fetch(`/api/store/admin/orders/${order.id}/send-invoice`, {
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
