'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import StoreButton from '@/components/StoreButton'
import { useStoreAuth } from '@/lib/storeAuth'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { requestOtp, verifyOtp, client } = useStoreAuth()
  const redirect = searchParams.get('redirect') || '/'

  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)

  if (client) {
    router.push(redirect)
    return null
  }

  const handlePhoneSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await requestOtp(phone)
      setIsNew(data.isNew)
      setName(data.client.name === 'Customer' ? '' : data.client.name)
      setStep('otp')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyOtp(phone, otp, name || undefined)
      if (marketingOptIn) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/store/client/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ marketingOptIn: true })
        })
      }
      if (isNew && !name) {
        setStep('name')
        return
      }
      router.push(redirect)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleNameSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/store/client/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() })
      })
      router.push(redirect)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-8">
          <span className="font-serif text-2xl text-forest">Furaha Furniture</span>
        </Link>

        {step === 'phone' && (
          <>
            <h1 className="font-serif text-2xl text-ink text-center mb-2">Sign in or Create Account</h1>
            <p className="text-ink-secondary font-sans text-sm text-center mb-8">Enter your WhatsApp number to receive a verification code</p>
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-sans text-ink-secondary mb-1">WhatsApp number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-border rounded-l-xl bg-warm text-ink-secondary text-sm font-sans min-h-[48px]">+250</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="7XXXXXXXX"
                    className="flex-1 px-4 py-3 border border-border rounded-r-xl text-base font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                    required
                  />
                </div>
              </div>
              {error && <p className="text-sm text-danger font-sans text-center">{error}</p>}
              <StoreButton type="submit" variant="primary" fullWidth size="lg" disabled={loading || phone.replace(/[^0-9]/g, '').length < 9}>
                {loading ? 'Sending...' : 'Send Code'}
              </StoreButton>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <h1 className="font-serif text-2xl text-ink text-center mb-2">Enter Verification Code</h1>
            <p className="text-ink-secondary font-sans text-sm text-center mb-8">We sent a 6-digit code to +250{phone}</p>
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-border rounded-xl text-center text-2xl tracking-widest font-mono text-ink bg-white min-h-[56px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                  required
                  maxLength={6}
                  autoFocus
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-sans text-ink-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={e => setMarketingOptIn(e.target.checked)}
                  className="w-4 h-4 text-forest rounded"
                />
                I want to receive WhatsApp updates about new products and offers
              </label>
              {error && <p className="text-sm text-danger font-sans text-center">{error}</p>}
              <StoreButton type="submit" variant="primary" fullWidth size="lg" disabled={loading || otp.length < 6}>
                {loading ? 'Verifying...' : 'Verify'}
              </StoreButton>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-center text-sm text-ink-secondary font-sans hover:text-forest mt-2"
              >
                Change phone number
              </button>
            </form>
          </>
        )}

        {step === 'name' && (
          <>
            <h1 className="font-serif text-2xl text-ink text-center mb-2">What&apos;s your name?</h1>
            <p className="text-ink-secondary font-sans text-sm text-center mb-8">Help us personalize your experience</p>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 border border-border rounded-xl text-base font-sans text-ink bg-white min-h-[48px] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-danger font-sans text-center">{error}</p>}
              <StoreButton type="submit" variant="primary" fullWidth size="lg" disabled={loading || !name.trim()}>
                {loading ? 'Saving...' : 'Continue'}
              </StoreButton>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full mx-auto" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
