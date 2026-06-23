'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import StoreButton from '@/components/StoreButton'
import { useStoreAuth } from '@/lib/storeAuth'
import { formatPrice } from '@/lib/api'

const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function ProfilePage() {
  const router = useRouter()
  const { client, loading: authLoading, logout, updateProfile } = useStoreAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [orders, setOrders] = useState([])
  const [likes, setLikes] = useState([])
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (!authLoading && !client) {
      router.push('/auth/login?redirect=/profile')
      return
    }
    if (client) {
      setName(client.name || '')
      setEmail(client.email || '')
      setMarketingOptIn(client.marketingOptIn || false)
    }
  }, [client, authLoading, router])

  useEffect(() => {
    if (!client) return
    fetch(`${API_BACKEND}/api/store/client/orders`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.orders) setOrders(data.orders) })
      .catch(() => { })
    fetch(`${API_BACKEND}/api/store/track/likes`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.likes) setLikes(data.likes) })
      .catch(() => { })
  }, [client])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await updateProfile({ name: name.trim(), email: email || null, marketingOptIn })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (authLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full mx-auto" />
      </div>
    )
  }

  if (!client) return null

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'orders', label: `Orders (${orders.length})` },
    { id: 'favorites', label: `Favorites (${likes.length})` },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-10">
        <h1 className="font-serif text-4xl text-gray-900 mb-2">My Account</h1>
        <p className="text-gray-600 font-sans">Manage your profile, orders, and favorites</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1">
          <nav className="space-y-2 bg-white rounded-2xl border-2 border-gray-200 p-3">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-sans font-semibold transition-all ${activeTab === tab.id
                  ? 'bg-forest-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                {tab.label}
              </button>
            ))}
            <div className="pt-4 mt-4 border-t-2 border-gray-200">
              <button onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-sans font-semibold text-danger-500 hover:bg-danger-50 transition-all">
                Sign Out
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 sm:p-8">

            {activeTab === 'profile' && (
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-sans text-ink-secondary mb-1">Phone</label>
                  <input type="text" value={`+250${client.phone}`} disabled
                    className="w-full px-4 py-3 border border-border rounded-xl text-base font-sans text-ink bg-warm/50 min-h-[48px]" />
                </div>
                <div>
                  <label className="block text-sm font-sans text-ink-secondary mb-1">Full name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl text-base font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                    required />
                </div>
                <div>
                  <label className="block text-sm font-sans text-ink-secondary mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-border rounded-xl text-base font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all" />
                </div>
                <label className="flex items-center gap-2 text-sm font-sans text-ink cursor-pointer pt-2">
                  <input type="checkbox" checked={marketingOptIn} onChange={e => setMarketingOptIn(e.target.checked)}
                    className="w-4 h-4 text-forest rounded" />
                  Send me WhatsApp updates about new products and offers
                </label>
                <div className="pt-2">
                  <StoreButton type="submit" variant="primary" disabled={saving || !name.trim()}>
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                  </StoreButton>
                </div>
              </form>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-ink-secondary font-sans mb-4">No orders yet</p>
                    <Link href="/products"><StoreButton variant="primary">Browse Products</StoreButton></Link>
                  </div>
                ) : (
                  orders.map(order => (
                    <Link key={order.id} href={`/track?orderNumber=${order.orderNumber}`}
                      className="block bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm font-bold text-ink">{order.orderNumber}</span>
                        <span className={`text-xs font-sans font-medium px-2 py-0.5 rounded-full ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700'
                          : order.status === 'CANCELLED' ? 'bg-red-100 text-red-600'
                            : 'bg-amber-light text-amber-dark'
                          }`}>{order.status}</span>
                      </div>
                      <p className="text-sm text-ink-secondary font-sans">{order.product?.name}</p>
                      <div className="flex justify-between text-xs text-ink-secondary font-sans mt-1">
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="font-medium text-ink">{formatPrice(order.totalPrice)} RWF</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="space-y-3">
                {likes.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-ink-secondary font-sans mb-4">No favorites yet</p>
                    <Link href="/products"><StoreButton variant="primary">Browse Products</StoreButton></Link>
                  </div>
                ) : (
                  likes.map(like => (
                    <Link key={like.id} href={`/products/${like.product?.slug}`}
                      className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
                      {like.product?.images?.[0] && (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-warm flex-shrink-0">
                          <Image src={like.product.images[0].imageUrl} alt={like.product.name} fill className="object-cover" sizes="56px" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-medium text-ink truncate">{like.product?.name}</p>
                        <p className="text-sm text-ink-secondary font-sans">{formatPrice(like.product?.price)} RWF</p>
                      </div>
                      <svg className="w-5 h-5 text-danger" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </Link>
                  ))
                )}
              </div>
            )}

          </div>
        </main>

      </div>
    </div>
  )
}

