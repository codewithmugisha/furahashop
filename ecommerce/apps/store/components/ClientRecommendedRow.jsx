'use client'

import { useState, useEffect } from 'react'
import { useStoreAuth } from '@/lib/storeAuth'
import ProductCard from '@/components/ProductCard'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function ClientRecommendedRow() {
  const { client, loading: authLoading } = useStoreAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!client) {
      setLoading(false)
      return
    }

    fetch(`${API}/api/store/recommendations?limit=6`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.recommendations) setProducts(data.recommendations)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [client, authLoading])

  if (loading || !client || products.length === 0) return null

  return (
    <section className="py-8 store-container">
      <h2 className="font-serif text-xl sm:text-2xl text-ink mb-6">Recommended for you</h2>
      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {products.map((product) => (
          <div key={product.id} className="flex-shrink-0 w-56 sm:w-72">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
