'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle, Package, X, Menu, User, LogOut, ChevronRight, Armchair } from 'lucide-react'
import { useStoreAuth } from '@/lib/storeAuth'

export default function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef(null)
  const { client, logout } = useStoreAuth()

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '/products', label: 'Products' },
    { href: '/type/beds', label: 'Categories' },
    { href: '/tier/low-price', label: 'Pricing' },
  ]

  return (
    <>
      {/* Pill-style Premium Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
        <div className={`transition-all duration-500 ${scrolled
            ? 'w-full max-w-5xl'
            : 'w-full max-w-6xl'
          }`}>
          <nav className={`
            bg-white/95 backdrop-blur-2xl 
            rounded-full 
            border border-gray-200/60
            shadow-lg shadow-gray-900/10
            transition-all duration-500
            ${scrolled ? 'shadow-xl shadow-gray-900/20' : ''}
          `}>
            <div className="flex items-center justify-between px-4 sm:px-6 h-16 sm:h-[72px]">

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-forest-500 to-forest-600 text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-md">
                  <Armchair size={20} strokeWidth={2.5} />
                </div>
                <span className="font-serif text-xl sm:text-2xl text-gray-900 hidden sm:block">
                  Furaha
                </span>
              </Link>

              {/* Pill Navigation Links - Desktop */}
              <div className="hidden lg:flex items-center gap-2 bg-gray-50/80 rounded-full px-2 py-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-5 py-2 text-sm font-sans font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded-full transition-all duration-300 hover:shadow-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Right Actions - Pill Group */}
              <div className="flex items-center gap-2">

                {/* Track Order - Pill */}
                <Link href="/track"
                  className="hidden md:flex items-center gap-2 px-4 py-2 sm:py-2.5 text-sm font-sans font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all duration-300">
                  <Package size={16} />
                  <span className="hidden lg:inline">Track</span>
                </Link>

                {/* User Menu or Sign In - Pill */}
                {client ? (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setUserMenuOpen(prev => !prev)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-sans font-semibold text-sm transition-all duration-300 bg-gradient-to-br from-forest-500 to-forest-600 text-white hover:from-forest-600 hover:to-forest-700 shadow-md hover:shadow-lg"
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/25 text-white flex items-center justify-center font-bold text-xs border border-white/40">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden sm:inline max-w-[80px] truncate">{client.name.split(' ')[0]}</span>
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 py-2 z-50 animate-scale-in origin-top-right overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                          <p className="font-sans font-bold text-gray-900 text-sm truncate">{client.name}</p>
                          <p className="font-sans text-xs text-gray-500 truncate">{client.phone}</p>
                        </div>
                        <div className="py-2">
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-5 py-2.5 text-sm font-sans font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <User size={16} />
                            My Profile
                          </Link>
                          <Link
                            href="/track"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-5 py-2.5 text-sm font-sans font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Package size={16} />
                            My Orders
                          </Link>
                        </div>
                        <div className="border-t border-gray-100 pt-2">
                          <button
                            onClick={() => { logout(); setUserMenuOpen(false) }}
                            className="flex items-center gap-3 px-5 py-2.5 text-sm font-sans font-medium text-danger-500 hover:bg-danger-50 transition-colors w-full text-left"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/auth/login"
                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full font-sans font-semibold text-sm transition-all duration-300 bg-gradient-to-br from-forest-500 to-forest-600 text-white hover:from-forest-600 hover:to-forest-700 shadow-md hover:shadow-lg">
                    <User size={16} />
                    <span>Sign In</span>
                  </Link>
                )}

                {/* WhatsApp - Pill */}
                <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '250793100072'}`}
                  target="_blank" rel="noopener noreferrer"
                  className="hidden sm:flex items-center justify-center w-10 h-10 bg-[#25D366] hover:bg-[#1da851] rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105">
                  <MessageCircle size={18} className="text-white" strokeWidth={2.5} />
                </a>

                {/* Mobile Menu Button - Pill */}
                <button onClick={() => setMenuOpen(true)}
                  className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full transition-colors text-gray-700 hover:bg-gray-100">
                  <Menu size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-20 sm:h-24"></div>

      {/* Mobile menu - Slide in from right */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-sm bg-white shadow-2xl animate-slide-in-right lg:hidden flex flex-col rounded-l-3xl">
            <div className="flex items-center justify-between px-6 h-20 border-b border-gray-100">
              <span className="font-serif text-2xl text-gray-900">Furaha</span>
              <button onClick={() => setMenuOpen(false)} className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
                <X size={22} />
              </button>
            </div>

            <nav className="flex-1 flex flex-col px-4 pt-6 gap-2 overflow-y-auto">
              {client && (
                <div className="px-5 py-4 mb-4 bg-gradient-to-br from-forest-500 to-forest-600 rounded-3xl text-white shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-white/25 text-white flex items-center justify-center font-bold text-lg border-2 border-white/40">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-sans font-bold text-white text-base">{client.name}</p>
                      <p className="font-sans text-sm text-white/80">{client.phone}</p>
                    </div>
                  </div>
                </div>
              )}
              {[
                { href: '/', label: 'Home' },
                { href: '/products', label: 'Browse All' },
                { href: '/type/beds', label: 'Categories' },
                { href: '/tier/low-price', label: 'Pricing' },
                { href: '/track', label: 'Track Order' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-base font-sans font-semibold text-gray-700 py-4 px-5 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  {link.label}
                  <ChevronRight size={18} className="text-gray-400" />
                </Link>
              ))}

              {client && (
                <>
                  <div className="border-t border-gray-100 my-3" />
                  <Link href="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between text-base font-sans font-semibold text-gray-700 py-4 px-5 rounded-2xl hover:bg-gray-50 transition-colors">
                    My Profile
                    <ChevronRight size={18} className="text-gray-400" />
                  </Link>
                  <button onClick={() => { logout(); setMenuOpen(false) }}
                    className="flex items-center text-base font-sans font-semibold text-danger-500 py-4 px-5 rounded-2xl hover:bg-danger-50 transition-colors text-left">
                    Sign Out
                  </button>
                </>
              )}
              {!client && (
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-base font-sans font-semibold text-white bg-gradient-to-br from-forest-500 to-forest-600 py-4 px-5 rounded-2xl hover:from-forest-600 hover:to-forest-700 transition-colors shadow-lg mt-2">
                  Sign In
                  <ChevronRight size={18} />
                </Link>
              )}
            </nav>

            <div className="px-6 py-6 border-t border-gray-100">
              <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '250793100072'}`}
                target="_blank" rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1da851] text-white font-sans font-bold text-base py-4 rounded-2xl transition-colors shadow-lg">
                <MessageCircle size={20} />
                WhatsApp Us
              </a>
            </div>
          </div>
        </>
      )}
    </>
  )
}
