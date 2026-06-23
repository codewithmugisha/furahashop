'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const STORAGE_KEY = 'admin_agent_chat';
const FILL_KEY = 'agent_suggested_product';

export default function AdminAgentChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [fillForm, setFillForm] = useState(null);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FILL_KEY);
      if (saved) setFillForm(JSON.parse(saved));
    } catch {}
  }, [pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((role, content, extra = {}) => {
    setMessages(prev => [...prev, { role, content, ...extra, id: Date.now() + Math.random() }]);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    addMessage('user', text);
    setSending(true);

    const token = localStorage.getItem('admin_token');
    const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/agent/store/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, history })
      });
      const data = await res.json();
      const { reply, navigation, fillForm: fill } = data.data || {};

      addMessage('assistant', reply || '...', { suggestedImage: fill?.imageUrl || null });

      if (fill && fill.name) {
        setFillForm(fill);
        try { localStorage.setItem(FILL_KEY, JSON.stringify(fill)); } catch {}
      }

      if (navigation && navigation.page) {
        setTimeout(() => {
          const routes = {
            'new-product': '/admin/store/products/new',
            'products': '/admin/store/products',
            'product-types': '/admin/store/types',
            'price-tiers': '/admin/store/tiers',
            'orders': '/admin/store/orders',
            'edit-product': navigation.params?.id ? `/admin/store/products/${navigation.params.id}/edit` : '/admin/store/products'
          };
          const path = routes[navigation.page] || navigation.page;
          router.push(path);
        }, 500);
      }
    } catch (err) {
      addMessage('assistant', 'Mbabarira, hari ikibazo. Gerageza nanone.');
    }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const dismissFillForm = () => {
    setFillForm(null);
    localStorage.removeItem(FILL_KEY);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-forest text-white shadow-lg hover:bg-forest-dark transition-colors flex items-center justify-center"
        aria-label="AI Agent"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {/* Header */}
          <div className="bg-forest text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-sans font-medium">AI Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button onClick={clearChat} className="text-white/60 hover:text-white text-xs font-sans transition-colors">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream/30">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm font-sans text-ink-secondary mb-1">Ask me anything about your store!</p>
                <p className="text-xs font-sans text-ink-light">e.g. "I want to add a new sofa"</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-sans ${
                  msg.role === 'user'
                    ? 'bg-forest text-white rounded-br-md'
                    : 'bg-white border border-border text-ink rounded-bl-md'
                }`}>
                  {msg.content}
                  {msg.suggestedImage && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-border">
                      <img
                        src={msg.suggestedImage}
                        alt="Suggested product"
                        className="w-full h-32 object-cover"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-ink-light rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-ink-light rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-1.5 h-1.5 bg-ink-light rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Fill form suggestion */}
          {fillForm && (
            <div className="px-4 py-2 bg-amber-light/50 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-ink-secondary">AI suggested product details</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (pathname !== '/admin/store/products/new') {
                        router.push('/admin/store/products/new');
                      }
                    }}
                    className="text-xs text-forest font-sans hover:underline"
                  >
                    Go to Form
                  </button>
                  <button onClick={dismissFillForm} className="text-xs text-ink-light font-sans hover:underline">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                disabled={sending}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-sans text-ink bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest placeholder:text-ink-light disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="px-4 py-2.5 bg-forest text-white rounded-xl text-sm font-sans hover:bg-forest-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
