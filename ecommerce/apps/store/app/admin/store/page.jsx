'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/api';

function Chart({ data }) {
  const [tooltip, setTooltip] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [sideOffset, setSideOffset] = useState(0);

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const maxOrders = Math.max(...data.map(d => d.delivered), 1);

  const w = 800;
  const h = 320;
  const pad = { top: 10, right: 20, bottom: 50, left: 10 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const revPoints = data.map((d, i) => {
    const x = pad.left + ((i + 0.5) / data.length) * cw;
    const y = pad.top + ch - (d.revenue / maxRevenue) * ch * 0.85 - ch * 0.075;
    return { x, y, month: d.month, label: d.revenue.toLocaleString(), raw: d.revenue };
  });

  const ordPoints = data.map((d, i) => {
    const x = pad.left + ((i + 0.5) / data.length) * cw;
    const y = pad.top + ch - (d.delivered / maxOrders) * ch * 0.85 - ch * 0.075;
    return { x, y, month: d.month, label: d.delivered.toString(), raw: d.delivered };
  });

  function bezier(points) {
    if (points.length < 2) return '';
    const d = points.map((p, i) => {
      if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      const prev = points[i - 1];
      const cp1x = prev.x + (p.x - prev.x) / 2;
      const cp2x = prev.x + (p.x - prev.x) / 2;
      return `C${cp1x.toFixed(1)},${prev.y.toFixed(1)} ${cp2x.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    });
    return d.join(' ');
  }

  const revPath = bezier(revPoints);
  const ordPath = bezier(ordPoints);

  const totalRev = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrd = data.reduce((s, d) => s + d.orders, 0);
  const totalDel = data.reduce((s, d) => s + d.delivered, 0);
  const deliveryRate = totalOrd > 0 ? Math.round((totalDel / totalOrd) * 100) : 0;

  const months = data.map(d => d.month);
  const shortMonths = months.map(m => {
    const parts = m.split('-');
    return monthNames[parseInt(parts[1]) - 1] || m;
  });

  const sideStep = data.length > 6 ? 2 : 1;
  const sideMonths = shortMonths.filter((_, i) => i % sideStep === 0);
  const visibleCount = 5;
  const maxOffset = Math.max(0, sideMonths.length - visibleCount);

  const handleSideHover = (dataIndex) => {
    setHoveredIndex(dataIndex);
    setTooltip({ x: revPoints[dataIndex].x, y: Math.min(revPoints[dataIndex].y, ordPoints[dataIndex].y) - 10, idx: dataIndex });
  };

  const handleSideLeave = () => {
    setTooltip(null);
    setHoveredIndex(null);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * w;
    let minDist = Infinity;
    let idx = -1;
    revPoints.forEach((p, i) => {
      const dist = Math.abs(p.x - mx);
      if (dist < minDist) { minDist = dist; idx = i; }
    });
    if (idx >= 0) {
      setHoveredIndex(idx);
      setTooltip({ x: revPoints[idx].x, y: Math.min(revPoints[idx].y, ordPoints[idx].y) - 10, idx });
      const sideIdx = Math.floor(idx / sideStep);
      if (sideIdx < sideOffset || sideIdx >= sideOffset + visibleCount) {
        setSideOffset(Math.max(0, Math.min(maxOffset, sideIdx - Math.floor(visibleCount / 2))));
      }
    }
  };

  const handleMouseLeave = () => { setTooltip(null); setHoveredIndex(null); };

  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center gap-1.5 pt-2 select-none">
        <button onClick={() => setSideOffset(Math.max(0, sideOffset - 1))} disabled={sideOffset === 0}
          className="disabled:opacity-30 transition-opacity">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="#c7c7cc"><path d="M6 2l4 5H2z"/></svg>
        </button>
        {sideMonths.slice(sideOffset, sideOffset + visibleCount).map((m, i) => {
          const dataIndex = (i + sideOffset) * sideStep;
          const isActive = hoveredIndex !== null && hoveredIndex === dataIndex;
          return (
            <div key={i} onMouseEnter={() => handleSideHover(dataIndex)} onMouseLeave={handleSideLeave}
              className={`text-xs font-sans px-2 py-0.5 rounded-full transition-colors cursor-pointer ${isActive ? 'bg-[#1A66FF] text-white font-semibold' : 'text-[#8e8e93] hover:text-[#1a1a1a]'}`}>
              {m}
            </div>
          );
        })}
        <button onClick={() => setSideOffset(Math.min(maxOffset, sideOffset + 1))} disabled={sideOffset >= maxOffset}
          className="disabled:opacity-30 transition-opacity">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="#c7c7cc"><path d="M6 10l4-5H2z"/></svg>
        </button>
      </div>

      <div className="flex-1 relative" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="1" fill="#d4d4d8" />
            </pattern>
          </defs>

          <rect x="0" y="0" width={w} height={h} fill="url(#dots)" rx="0" />

          <g>
            {shortMonths.map((m, i) => {
              const x = pad.left + ((i + 0.5) / data.length) * cw;
              return (
                <text key={i} x={x} y={pad.top + ch + 30} textAnchor="middle" className="text-[12px]" fill="#8e8e93" fontFamily="sans-serif">
                  {m}
                </text>
              );
            })}
          </g>

          {revPath && <path d={revPath} fill="none" stroke="#1A66FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {ordPath && <path d={ordPath} fill="none" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {hoveredIndex !== null && (
            <>
              <circle cx={revPoints[hoveredIndex].x} cy={revPoints[hoveredIndex].y} r="4" fill="white" stroke="#1A66FF" strokeWidth="2" />
              <circle cx={ordPoints[hoveredIndex].x} cy={ordPoints[hoveredIndex].y} r="4" fill="white" stroke="#FF6B6B" strokeWidth="2" />
            </>
          )}
        </svg>

        {tooltip && (
          <div className="absolute pointer-events-none" style={{
            left: `${(tooltip.x / w) * 100}%`,
            top: `${(tooltip.y / h) * 100}%`,
            transform: 'translate(-50%, -100%)',
          }}>
            <div className="bg-white rounded-lg px-3 py-2 shadow-lg border border-gray-100 text-center whitespace-nowrap">
              <p className="text-xs font-bold text-[#1a1a1a]">{shortMonths[tooltip.idx]}</p>
              <p className="text-[10px] text-[#8e8e93]">{data[tooltip.idx].revenue.toLocaleString()} RWF &middot; {data[tooltip.idx].delivered} orders</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-end pb-2 select-none">
        <p className="text-3xl font-light text-[#1a1a1a] leading-none">{deliveryRate}%</p>
        <p className="text-[11px] text-[#8e8e93] font-sans">Fulfillment Rate</p>
      </div>
    </div>
  );
}

export default function StoreOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(12);
  const [rangeOpen, setRangeOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch(`/api/store/admin/overview?months=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-ink-secondary font-sans">Failed to load overview</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink mb-6">Store Overview</h1>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-8">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Today</p>
          <p className="text-lg sm:text-xl font-bold text-forest">{data.today.revenueFormatted} RWF</p>
          <p className="text-xs font-sans mt-1">{data.today.orders} orders</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">This Month</p>
          <p className="text-lg sm:text-xl font-bold text-ink">{formatPrice(data.thisMonthRevenue)} RWF</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">vs Last Month</p>
          <p className={`text-lg sm:text-xl font-bold ${data.growth >= 0 ? 'text-green-700' : 'text-danger'}`}>
            {data.growth >= 0 ? '+' : ''}{data.growth}%
          </p>
          <p className="text-xs font-sans mt-1">{formatPrice(data.lastMonthRevenue)} RWF</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Total Orders</p>
          <p className="text-xl sm:text-2xl font-bold text-ink">{data.totalOrders}</p>
          <p className="text-xs font-sans mt-1">{data.deliveredOrders} delivered</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink-secondary font-sans mb-1">Revenue</p>
          <p className="text-lg sm:text-xl font-bold text-forest">{formatPrice(data.totalRevenue)} RWF</p>
        </div>
        {data.unaccountedProducts?.length > 0 && (
          <div className="bg-card border border-amber-200 rounded-2xl p-4">
            <p className="text-xs text-ink-secondary font-sans mb-1">Unaccounted Stock</p>
            <p className="text-lg sm:text-xl font-bold text-amber-700">{data.unaccountedProducts.length} item{data.unaccountedProducts.length > 1 ? 's' : ''}</p>
            <p className="text-xs font-sans mt-1">
              <Link href="/admin/store/products" className="text-amber-600 hover:underline font-medium">Add info &rarr;</Link>
            </p>
          </div>
        )}
      </div>

      {data.unaccountedProducts?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-sans font-medium text-amber-900">
                {data.unaccountedProducts.length} product{data.unaccountedProducts.length > 1 ? 's' : ''} added during sale{data.unaccountedProducts.length > 1 ? 's' : ''} — no description or images
              </p>
              <p className="text-xs text-amber-700 font-sans">Visit the Products page to complete stock details for proper inventory tracking.</p>
            </div>
          </div>
          <Link href="/admin/store/products"
            className="px-4 py-2 rounded-xl text-sm font-sans font-medium bg-amber-600 text-white hover:bg-amber-700 min-h-[40px] flex-shrink-0">
            Review &amp; Fix
          </Link>
        </div>
      )}

      {data.unpaidDelivered > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between mb-8">
          <p className="text-sm font-sans font-medium text-danger">{data.unpaidDelivered} delivered order{data.unpaidDelivered > 1 ? 's' : ''} pending payment</p>
          <Link href="/admin/store/sales" className="px-3 py-1.5 rounded-xl text-xs font-sans font-medium bg-danger text-white hover:bg-red-700 min-h-[36px]">
            Go to Sales
          </Link>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-ink">Business Analytics</h2>
          <div className="relative">
            <button onClick={() => setRangeOpen(!rangeOpen)} onBlur={() => setTimeout(() => setRangeOpen(false), 150)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-sans text-ink-secondary hover:bg-warm transition-colors select-none">
              <span>Range:</span>
              <span className="font-semibold text-ink">Last {range} months</span>
              <svg className="w-3 h-3 ml-0.5" viewBox="0 0 12 12" fill="currentColor"><path d="M3 4l3 4 3-4z"/></svg>
            </button>
            {rangeOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg z-20 min-w-[140px] overflow-hidden">
                {[3, 6, 12].map(m => (
                  <button key={m} onMouseDown={() => { setRange(m); setRangeOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-sans hover:bg-warm transition-colors ${range === m ? 'text-forest font-semibold' : 'text-ink'}`}>
                    Last {m} months
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {data.monthlyHistory?.length > 0 ? (
          <Chart data={data.monthlyHistory} />
        ) : (
          <p className="text-sm text-ink-light font-sans text-center py-12">No data yet</p>
        )}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1A66FF] flex-shrink-0" />
              <span className="text-[11px] text-[#8e8e93] font-sans">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FF6B6B] flex-shrink-0" />
              <span className="text-[11px] text-[#8e8e93] font-sans">Orders delivered</span>
            </div>
          </div>
          <p className="text-[11px] text-[#8e8e93] font-sans">
            <span className="font-semibold text-[#1a1a1a]">{data.monthlyHistory.reduce((s, d) => s + d.revenue, 0).toLocaleString()} RWF</span> total revenue
          </p>
        </div>
      </div>
    </div>
  );
}
