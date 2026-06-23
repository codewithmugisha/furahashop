'use client';

import { useState } from 'react';
import Link from 'next/link';
import StoreButton from '@/components/StoreButton';
import { formatPrice } from '@/lib/api';

export default function OrderFormSectionClient({ product }) {
  const [quantity, setQuantity] = useState(1);
  const total = product.price * quantity;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-sans text-ink-secondary">Quantity:</label>
        <div className="flex items-center border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-2 min-h-[48px] flex items-center justify-center text-ink hover:bg-warm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="px-4 py-2 font-sans font-medium text-ink min-w-[48px] text-center border-x border-border">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(10, quantity + 1))}
            className="px-4 py-2 min-h-[48px] flex items-center justify-center text-ink hover:bg-warm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-lg font-bold text-forest font-sans mb-4">
        Total: {formatPrice(total)} RWF
      </p>

      <Link href={`/order/${product.slug}?qty=${quantity}`}>
        <StoreButton variant="primary" fullWidth size="lg">
          Order Now
        </StoreButton>
      </Link>
    </div>
  );
}
