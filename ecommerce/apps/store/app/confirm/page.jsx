'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useEffect, useCallback } from 'react'

function ConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [step, setStep] = useState('form')
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState(null)

  const confirmOrder = useCallback(async (confirmCode, confirmOrderNum) => {
    setStep('loading')
    setError('')
    try {
      const res = await fetch('/api/store/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: confirmCode.toUpperCase(), orderNumber: confirmOrderNum.toUpperCase() }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccessData(data)
        setStep('success')
      } else {
        setError(data.error || 'Kode yanditse si yo')
        setStep('form')
      }
    } catch {
      setError('Habayemo ikibazo. Ongera ugerageze.')
      setStep('form')
    }
  }, [])

  useEffect(() => {
    const urlCode = searchParams.get('code')
    const urlOrder = searchParams.get('order')
    if (urlCode && urlOrder) {
      setCode(urlCode)
      setOrderNumber(urlOrder)
      confirmOrder(urlCode, urlOrder)
    }
  }, [searchParams, confirmOrder])

  function handleCodeChange(value) {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setCode(upper)
    setError('')
  }

  function handleCodeBlur() {
    if (code.length >= 4 && orderNumber.length >= 5) {
      confirmOrder(code, orderNumber)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (code.length >= 4 && orderNumber.length >= 5) {
      confirmOrder(code, orderNumber)
    }
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 border-4 border-forest-mid border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink-secondary font-sans text-lg">Tugiye kwemeza ikomande yanyu...</p>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream p-4">
        <div className="bg-card rounded-2xl shadow-lg p-8 max-w-md w-full text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-forest-light flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl text-ink mb-2">Ikomande Yemejwe!</h1>
          <p className="text-ink-secondary font-sans mb-8">Murakoze cyane! Ikomande yanyu yemejwe neza.</p>
          <div className="bg-warm rounded-2xl p-6 mb-8 text-left">
            <p className="text-xs text-ink-secondary font-sans mb-1">Nimero y'Ikomande</p>
            <p className="text-lg font-mono font-bold text-ink">{successData?.orderNumber}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push(`/track?orderNumber=${successData?.orderNumber}`)}
              className="w-full py-3 bg-forest text-card rounded-xl font-sans font-semibold hover:bg-forest-deep transition">
              Kurikirana Ikomande
            </button>
            <button onClick={() => router.push('/')}
              className="w-full py-3 bg-warm text-ink rounded-xl font-sans font-semibold hover:bg-border transition">
              Subira ku Rupapuro
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="bg-card rounded-2xl shadow-lg p-8 max-w-md w-full animate-fade-in-up">
        <h1 className="font-serif text-3xl text-ink mb-2 text-center">Kwemeza Ikomande</h1>
        <p className="text-ink-secondary font-sans text-center mb-8">Injiza kode waherewe muri WhatsApp</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-sans font-medium text-ink-secondary mb-2">Nimero y'Ikomande</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="FQ-XXXXXX"
              className="w-full px-4 py-3 bg-warm border border-border rounded-xl text-center text-lg font-sans font-medium text-ink focus:outline-none focus:ring-2 focus:ring-forest-mid/30 focus:border-forest-mid"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-sans font-medium text-ink-secondary mb-2">Kode yo Kwemeza</label>
            <input
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onBlur={handleCodeBlur}
              placeholder="A3X9K2"
              maxLength={8}
              className="w-full px-4 py-3 bg-warm border border-border rounded-xl text-center text-2xl font-mono font-bold text-ink tracking-widest focus:outline-none focus:ring-2 focus:ring-forest-mid/30 focus:border-forest-mid"
            />
          </div>

          {error && (
            <p className="text-danger text-sm font-sans text-center mb-4 bg-danger/5 p-3 rounded-xl">{error}</p>
          )}

          <button type="submit"
            disabled={code.length < 4 || orderNumber.length < 5}
            className="w-full py-3 bg-forest text-card rounded-xl font-sans font-semibold hover:bg-forest-deep transition disabled:opacity-50 disabled:cursor-not-allowed">
            Kwemeza
          </button>
        </form>

        <p className="text-sm text-ink-light text-center font-sans mt-6">
          Kode waherewe muri WhatsApp. Subiza ubutumwa ukode cyangwa wandike hano.
        </p>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-cream"><div className="w-12 h-12 border-4 border-forest-mid border-t-transparent rounded-full animate-spin"></div></div>}>
      <ConfirmContent />
    </Suspense>
  )
}
