'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PriceTierBadge from '@/components/PriceTierBadge';
import StoreButton from '@/components/StoreButton';
import { formatPrice } from '@/lib/api';
import { useStoreAuth } from '@/lib/storeAuth';

const API = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001';

function OrderFormContent({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { client } = useStoreAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [quantity, setQuantity] = useState(parseInt(searchParams.get('qty') || '1', 10));
  const [name, setName] = useState(client?.name || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [email, setEmail] = useState(client?.email || '');
  const [customNotes, setCustomNotes] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('PICKUP');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  useEffect(() => {
    fetch(`${API}/api/store/products/${params.productSlug}`)
      .then(r => r.json())
      .then(res => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Product not found');
        setLoading(false);
      });
  }, [params.productSlug]);

  const phoneValid = phone.replace(/[^0-9]/g, '').length >= 9;
  const nameValid = name.trim().length > 0;
  const canSubmit = nameValid && phoneValid && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/store/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          clientName: name.trim(),
          clientPhone: phone,
          clientEmail: email || undefined,
          quantity,
          customNotes: customNotes || undefined,
          deliveryMethod,
          deliveryAddress: deliveryMethod === 'DELIVERY' ? deliveryAddress : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      router.push(`/confirm?order=${data.data.orderNumber}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="font-serif text-xl text-ink mb-4">{error}</p>
        <Link href="/products" className="text-forest font-sans hover:underline">Browse products</Link>
      </div>
    );
  }

  const total = product.price * quantity;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href={`/products/${params.productSlug}`} className="inline-flex items-center gap-2 text-sm text-ink-secondary font-sans hover:text-forest mb-6 min-h-[48px]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to product
      </Link>

      <h1 className="font-serif text-2xl sm:text-3xl text-ink mb-6">Complete your order</h1>

      {/* Product summary */}
      <div className="bg-warm rounded-2xl p-4 flex items-center gap-4 mb-8">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white">
          {product.images?.[0] && (
            <Image
              src={product.images[0].imageUrl}
              alt={product.images[0].altText || product.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <PriceTierBadge tier={product.priceTier?.slug || ''} />
          <h2 className="font-serif text-lg text-ink mt-1 truncate">{product.name}</h2>
          <p className="text-forest font-bold font-sans">{formatPrice(product.price)} RWF</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-ink-secondary font-sans">Qty:</p>
          <p className="font-sans font-medium text-ink">{quantity}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal details */}
        <div>
          <h2 className="font-serif text-lg text-ink mb-4">Personal details</h2>
          <div className="space-y-4">
            {client ? (
              <div className="bg-forest-light/50 rounded-xl p-4">
                <p className="text-sm font-sans text-forest font-medium">Signed in as {client.name}</p>
                <p className="text-xs font-sans text-ink-secondary mt-1">+250{client.phone}</p>
                {client.email && <p className="text-xs font-sans text-ink-secondary">{client.email}</p>}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-sans text-ink-secondary mb-1">Full name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 border border-border rounded-xl text-base font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-sans text-ink-secondary mb-1">WhatsApp number *</label>
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
                  {phone.length > 0 && !phoneValid && (
                    <p className="text-xs text-danger mt-1 font-sans">Must be at least 9 digits</p>
                  )}
                  <p className="text-xs text-ink-light mt-1 font-sans">We will send order updates to this number</p>
                </div>
                <div>
                  <label className="block text-sm font-sans text-ink-secondary mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-border rounded-xl text-base font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <h2 className="font-serif text-lg text-ink mb-4">Quantity</h2>
          <div className="flex items-center border border-border rounded-xl overflow-hidden w-fit">
            <button type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-3 min-h-[48px] flex items-center justify-center text-ink hover:bg-warm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <span className="px-4 py-3 font-sans font-medium text-ink min-w-[48px] text-center border-x border-border">
              {quantity}
            </span>
            <button type="button"
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              className="px-4 py-3 min-h-[48px] flex items-center justify-center text-ink hover:bg-warm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        </div>

        {/* Delivery */}
        <div>
          <h2 className="font-serif text-lg text-ink mb-4">Delivery</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-warm transition-colors min-h-[48px]">
              <input
                type="radio"
                name="delivery"
                value="PICKUP"
                checked={deliveryMethod === 'PICKUP'}
                onChange={e => setDeliveryMethod(e.target.value)}
                className="w-4 h-4 text-forest"
              />
              <span className="text-sm font-sans text-ink">I will pick it up</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-warm transition-colors min-h-[48px]">
              <input
                type="radio"
                name="delivery"
                value="DELIVERY"
                checked={deliveryMethod === 'DELIVERY'}
                onChange={e => setDeliveryMethod(e.target.value)}
                className="w-4 h-4 text-forest"
              />
              <span className="text-sm font-sans text-ink">I need delivery</span>
            </label>
          </div>
          {deliveryMethod === 'DELIVERY' && (
            <textarea
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              placeholder="Your delivery address in Kigali"
              className="w-full mt-3 px-4 py-3 border border-border rounded-xl text-base font-sans text-ink bg-white min-h-[80px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all resize-none"
            />
          )}
        </div>

        {/* Custom notes */}
        {product.allowCustomNotes && (
          <div>
            <h2 className="font-serif text-lg text-ink mb-4">Special requirements (optional)</h2>
            <textarea
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value.slice(0, 500))}
              placeholder="Describe any customizations — color, size variations, special materials..."
              className="w-full px-4 py-3 border border-border rounded-xl text-base font-sans text-ink bg-white min-h-[100px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all resize-none"
            />
            <p className="text-xs text-ink-light text-right mt-1 font-sans">{customNotes.length}/500</p>
          </div>
        )}

        {/* Order summary */}
        <div className="bg-warm rounded-2xl p-5">
          <h2 className="font-serif text-lg text-ink mb-3">Order summary</h2>
          <div className="space-y-2 text-sm font-sans">
            <div className="flex justify-between">
              <span className="text-ink-secondary">Product</span>
              <span className="text-ink">{product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Quantity</span>
              <span className="text-ink">{quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Unit price</span>
              <span className="text-ink">{formatPrice(product.price)} RWF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Delivery</span>
              <span className="text-ink">{deliveryMethod === 'PICKUP' ? 'Free pickup' : 'To be confirmed'}</span>
            </div>
            <hr className="border-border my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span className="text-ink">Total</span>
              <span className="text-forest">{formatPrice(total)} RWF</span>
            </div>
          </div>
          <p className="text-xs text-ink-light mt-3 font-sans text-center">
            Payment on delivery or pickup. No advance payment required.
          </p>
        </div>

        {error && (
          <p className="text-sm text-danger font-sans text-center">{error}</p>
        )}

        <StoreButton type="submit" variant="primary" fullWidth size="lg" disabled={!canSubmit}>
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Placing Order...
            </span>
          ) : (
            'Place My Order'
          )}
        </StoreButton>
      </form>
    </div>
  );
}

export default function OrderFormPage({ params }) {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-20 text-center"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full mx-auto" /></div>}>
      <OrderFormContent params={params} />
    </Suspense>
  );
}
