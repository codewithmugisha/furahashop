'use client'

import { useState, useEffect } from 'react'
import { useStoreAuth } from '@/lib/storeAuth'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function LikeButton({ productId, initialLiked = false, size = 'md' }) {
  const { client } = useStoreAuth()
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (client) {
      fetch(`${API}/api/store/track/likes`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.likes) {
            const liked = data.likes.some(l => l.productId === productId)
            setIsLiked(liked)
          }
        })
        .catch(() => {})
    }
  }, [client, productId])

  const handleClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!client) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setLoading(true)
    setIsLiked(prev => !prev)

    try {
      const res = await fetch(`${API}/api/store/track/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId })
      })
      const data = await res.json()
      setIsLiked(data.liked)
    } catch {
      setIsLiked(prev => !prev)
    }
    setLoading(false)
  }

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${sizes[size]} flex items-center justify-center rounded-full transition-all duration-200 ${
        isLiked ? 'bg-danger/10 text-danger' : 'bg-white/80 text-ink-light hover:text-danger hover:bg-danger/5'
      }`}
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      <svg
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 24 24"
        fill={isLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  )
}
