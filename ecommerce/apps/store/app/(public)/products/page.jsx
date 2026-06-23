'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { formatPrice } from '@/lib/formatters'

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [productTypes, setProductTypes] = useState([])
  const [priceTiers, setPriceTiers] = useState([])
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedTiers, setSelectedTiers] = useState([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [availability, setAvailability] = useState('both')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch('/api/store/types')
      .then(r => r.json())
      .then(d => { if (d.data) setProductTypes(d.data) })
    fetch('/api/store/tiers')
      .then(r => r.json())
      .then(d => { if (d.data) setPriceTiers(d.data) })
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedTypes.length) params.set('type', selectedTypes.join(','))
    if (selectedTiers.length) params.set('tier', selectedTiers.join(','))
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (availability !== 'both') params.set('availability', availability)
    params.set('sort', sort)
    params.set('page', String(page))
    params.set('limit', '12')

    try {
      const res = await fetch(`/api/store/products?${params.toString()}`)
      const data = await res.json()
      if (data.data) {
        setProducts(data.data.products || [])
        setTotal(data.data.pagination?.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    }
    setLoading(false)
  }, [selectedTypes, selectedTiers, minPrice, maxPrice, availability, sort, page])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  function toggleType(slug) {
    setSelectedTypes(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
    setPage(1)
  }

  function toggleTier(slug) {
    setSelectedTiers(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
    setPage(1)
  }

  function applyPriceFilter() {
    setPage(1)
  }

  function clearAllFilters() {
    setSelectedTypes([])
    setSelectedTiers([])
    setMinPrice('')
    setMaxPrice('')
    setAvailability('both')
    setSort('newest')
    setPage(1)
  }

  const hasActiveFilters = selectedTypes.length > 0 || selectedTiers.length > 0 || minPrice || maxPrice || availability !== 'both'

  const pages = Math.ceil(total / 12)

  return (
    <div className="store-container py-8">
      <div className="flex items-center gap-2 text-sm text-ink-secondary font-sans mb-6 lg:-ml-8">
        <Link href="/" className="hover:text-forest">Home</Link>
        <span>/</span>
        <span className="text-ink">All Products</span>
      </div>

      {/* Sort bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6 lg:-ml-8">
        <span className="text-sm font-sans text-ink-secondary whitespace-nowrap flex-shrink-0">
          Sort by:
        </span>
        {[
          { value: 'newest', label: 'Newest' },
          { value: 'price_asc', label: 'Price: Low to High' },
          { value: 'price_desc', label: 'Price: High to Low' },
          { value: 'popular', label: 'Most Popular' },
        ].map(option => (
          <button
            key={option.value}
            onClick={() => { setSort(option.value); setPage(1) }}
            className={`whitespace-nowrap flex-shrink-0 text-sm font-sans px-3 py-1.5 rounded-full transition-colors ${sort === option.value
              ? 'bg-forest text-white'
              : 'bg-white border border-border text-ink hover:border-forest hover:text-forest'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-ink-secondary font-sans mb-6 lg:-ml-8">{total} product{total !== 1 ? 's' : ''}</p>

      <div className="flex flex-col lg:flex-row">
        {/* Filter sidebar — desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0 -ml-4 sm:-ml-6 lg:-ml-8 mr-4 sm:mr-6 lg:mr-8">
          <div className="sticky top-24 space-y-6">

            <div>
              <h4 className="font-sans font-semibold text-ink text-sm mb-3">Product Type</h4>
              <div className="space-y-2">
                {productTypes.map(type => (
                  <label key={type.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type.slug)}
                      onChange={() => toggleType(type.slug)}
                      className="w-4 h-4 rounded border-border text-forest focus:ring-forest accent-forest"
                    />
                    <span className="text-sm font-sans text-ink group-hover:text-forest transition-colors">
                      {type.name}
                    </span>
                    <span className="text-xs text-ink-light ml-auto">
                      {type._count?.products || ''}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            <div>
              <h4 className="font-sans font-semibold text-ink text-sm mb-3">Price Tier</h4>
              <div className="space-y-2">
                {priceTiers.map(tier => (
                  <label key={tier.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedTiers.includes(tier.slug)}
                      onChange={() => toggleTier(tier.slug)}
                      className="w-4 h-4 rounded border-border text-forest focus:ring-forest accent-forest"
                    />
                    <span className="text-sm font-sans text-ink group-hover:text-forest transition-colors">
                      {tier.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            <div>
              <h4 className="font-sans font-semibold text-ink text-sm mb-3">Price Range (RWF)</h4>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-forest"
                />
                <span className="text-ink-secondary text-sm">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>
              <button onClick={applyPriceFilter}
                className="mt-2 w-full bg-forest-light text-forest font-sans font-medium text-sm rounded-lg py-2 hover:bg-forest hover:text-white transition-colors">
                Apply
              </button>
            </div>

            <div className="border-t border-border" />

            <div>
              <h4 className="font-sans font-semibold text-ink text-sm mb-3">Availability</h4>
              <div className="space-y-2">
                {[
                  { value: 'both', label: 'Both' },
                  { value: 'IN_STOCK', label: 'In Stock' },
                  { value: 'MADE_TO_ORDER', label: 'Made to Order' },
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="availability"
                      value={option.value}
                      checked={availability === option.value}
                      onChange={() => { setAvailability(option.value); setPage(1) }}
                      className="w-4 h-4 border-border text-forest focus:ring-forest accent-forest"
                    />
                    <span className="text-sm font-sans text-ink group-hover:text-forest transition-colors">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <>
                <div className="border-t border-border" />
                <button onClick={clearAllFilters}
                  className="w-full text-sm font-sans text-danger hover:text-danger/80 transition-colors">
                  Clear all filters
                </button>
              </>
            )}

          </div>
        </aside>

        {/* Mobile filter chips */}
        <div className="lg:hidden flex flex-wrap gap-2 mb-4">
          {productTypes.map(type => (
            <button key={type.id} onClick={() => toggleType(type.slug)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-sans transition-colors ${selectedTypes.includes(type.slug) ? 'bg-forest text-white' : 'bg-white border border-border text-ink'
                }`}>
              {type.name}
            </button>
          ))}
          {priceTiers.map(tier => (
            <button key={tier.id} onClick={() => toggleTier(tier.slug)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-sans transition-colors ${selectedTiers.includes(tier.slug) ? 'bg-forest text-white' : 'bg-white border border-border text-ink'
                }`}>
              {tier.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" />
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {pages > 1 && (
                <div className="flex justify-center gap-3 mt-10">
                  {page > 1 && (
                    <button onClick={() => setPage(page - 1)}
                      className="px-4 py-2 bg-white border border-border rounded-xl text-sm font-sans text-ink hover:bg-forest-light transition-colors">
                      Previous
                    </button>
                  )}
                  {page < pages && (
                    <button onClick={() => setPage(page + 1)}
                      className="px-4 py-2 bg-forest text-white rounded-xl text-sm font-sans hover:bg-forest-mid transition-colors">
                      Load More
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <svg className="w-16 h-16 mx-auto text-ink-light mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-serif text-xl text-ink mb-2">No products match your filters</p>
              <button onClick={clearAllFilters} className="text-forest font-sans font-medium hover:underline">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full mx-auto" /></div>}>
      <ProductsContent />
    </Suspense>
  )
}
