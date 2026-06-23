'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useStoreAuth } from '@/lib/storeAuth'
import { X, Sparkles } from 'lucide-react'

export default function LoginNudgeBanner() {
  const { client, loading } = useStoreAuth()
  const [dismissed, setDismissed] = useState(false)

  if (loading || client || dismissed) return null

  return (
    <div className="bg-gradient-to-r from-forest via-forest-mid to-forest text-white py-3 px-4 animate-slide-down relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={16} className="text-amber flex-shrink-0" />
          <p className="text-sm font-sans truncate">
            Sign in to save favorites and get personalized recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/auth/login?redirect=/"
            className="bg-white text-forest font-sans font-medium text-sm px-4 py-1.5 rounded-lg hover:bg-amber hover:text-white transition-all duration-300"
          >
            Sign In
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
