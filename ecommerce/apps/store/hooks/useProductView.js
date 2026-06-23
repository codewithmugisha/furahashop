'use client'

import { useEffect, useRef } from 'react'
import { useStoreAuth } from '@/lib/storeAuth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function useProductView(productId) {
  const { client } = useStoreAuth()
  const tracked = useRef(false)

  useEffect(() => {
    if (!client || !productId || tracked.current) return
    tracked.current = true

    fetch(`${API}/api/store/track/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId })
    }).catch(() => {})
  }, [client, productId])
}
