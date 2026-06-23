'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PriceRangeFilter({ minPlaceholder, maxPlaceholder }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [min, setMin] = useState(searchParams?.get('minPrice') || '');
  const [max, setMax] = useState(searchParams?.get('maxPrice') || '');

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    if (min) params.set('minPrice', min); else params.delete('minPrice');
    if (max) params.set('maxPrice', max); else params.delete('maxPrice');
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') apply();
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder={minPlaceholder || 'Min'}
          value={min}
          onChange={(e) => setMin(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-border rounded-xl text-sm font-sans bg-white"
        />
        <input
          type="number"
          placeholder={maxPlaceholder || 'Max'}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-border rounded-xl text-sm font-sans bg-white"
        />
      </div>
      <button
        onClick={apply}
        className="mt-2 text-xs text-forest font-sans font-medium hover:underline"
      >
        Apply
      </button>
    </div>
  );
}
