'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const StoreAuthContext = createContext(null)

export function StoreAuthProvider({ children }) {
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/store/client/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setClient(data.client))
      .catch(() => setClient(null))
      .finally(() => setLoading(false))
  }, [])

  const requestOtp = useCallback(async (phone) => {
    const res = await fetch(`${API}/api/store/client/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone })
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to send OTP')
    }
    return res.json()
  }, [])

  const verifyOtp = useCallback(async (phone, otp, name) => {
    const res = await fetch(`${API}/api/store/client/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone, otp, name })
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to verify OTP')
    }
    const data = await res.json()
    setClient(data.client)
    return data
  }, [])

  const logout = useCallback(async () => {
    await fetch(`${API}/api/store/client/logout`, {
      method: 'POST',
      credentials: 'include'
    })
    setClient(null)
  }, [])

  const updateProfile = useCallback(async (updates) => {
    const res = await fetch(`${API}/api/store/client/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates)
    })
    if (!res.ok) throw new Error('Failed to update profile')
    const data = await res.json()
    setClient(data.client)
    return data.client
  }, [])

  return (
    <StoreAuthContext.Provider value={{ client, loading, setClient, requestOtp, verifyOtp, logout, updateProfile }}>
      {children}
    </StoreAuthContext.Provider>
  )
}

export function useStoreAuth() {
  const ctx = useContext(StoreAuthContext)
  if (typeof window === 'undefined') {
    // During server-side rendering, return a safe default
    return {
      client: null,
      loading: true,
      setClient: () => { },
      requestOtp: async () => { },
      verifyOtp: async () => { },
      logout: async () => { },
      updateProfile: async () => { }
    }
  }
  if (!ctx) throw new Error('useStoreAuth must be used within StoreAuthProvider')
  return ctx
}
