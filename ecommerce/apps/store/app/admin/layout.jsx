'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import AdminAgentChat from '@/components/AdminAgentChat';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminLayout({ children }) {
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      if (pathname !== '/admin') {
        router.push('/admin');
      }
      setLoading(false);
      return;
    }
    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(res => {
        if (res.data?.owner) {
          setOwner(res.data.owner);
        } else {
          localStorage.removeItem('admin_token');
          router.push('/admin');
        }
      })
      .catch(() => {
        localStorage.removeItem('admin_token');
        router.push('/admin');
      })
      .finally(() => setLoading(false));
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin');
  };

  if (pathname === '/admin') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-2 border-forest-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!owner) {
    return <>{children}</>;
  }

  const navItems = [
    { label: 'Overview', href: '/admin/store', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'Sales', href: '/admin/store/sales', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Orders', href: '/admin/store/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Products', href: '/admin/store/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label: 'Types', href: '/admin/store/types', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { label: 'Clients', href: '/admin/store/clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
    { label: 'Tiers', href: '/admin/store/tiers', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-border fixed left-0 top-0">
          <div className="p-6 border-b border-border">
            <Link href="/admin/store" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-forest-500 text-white flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="font-serif text-xl text-gray-900">Admin</span>
            </Link>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-sans font-medium transition-colors ${pathname === item.href || (item.href !== '/admin/store' && pathname.startsWith(item.href))
                    ? 'bg-forest-50 text-forest-600 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-forest-500 text-white flex items-center justify-center text-sm font-semibold">
                {owner.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans font-semibold text-gray-900 truncate">{owner.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full text-sm text-danger-500 hover:text-danger-600 font-sans font-medium py-2 hover:bg-danger-50 rounded-lg transition-colors">
              Sign Out
            </button>
          </div>
        </aside>

        <div className="flex-1 md:ml-64">
          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-white sticky top-0 z-40">
            <Link href="/admin/store" className="font-serif text-lg text-gray-900">Admin</Link>
            <button onClick={handleLogout} className="text-sm text-danger-500 font-sans font-medium">Sign Out</button>
          </div>

          {/* Main content */}
          <div className="p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
            {children}
          </div>

          {/* Mobile bottom nav */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
            <div className="flex justify-around py-2">
              {navItems.slice(0, 5).map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 min-w-[60px] ${pathname === item.href || (item.href !== '/admin/store' && pathname.startsWith(item.href))
                      ? 'text-forest-600'
                      : 'text-gray-500'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span className="text-[10px] font-sans font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
      <AdminAgentChat />
    </div>
  );
}
