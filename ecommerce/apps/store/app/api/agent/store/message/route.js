import { verifyAdmin } from '@/lib/adminAuth';

const PROVIDERS = [
  {
    name: 'Groq',
    key: process.env.GROQ_API_KEY,
    url: process.env.GROQ_API_URL,
    model: process.env.GROQ_MODEL,
    getUrl: () => `${process.env.GROQ_API_URL}/v1/chat/completions`,
    buildHeaders: () => ({
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    }),
    buildBody: (sysPrompt, msgs) => ({
      model: process.env.GROQ_MODEL,
      messages: [{ role: 'system', content: sysPrompt }, ...msgs.slice(-10)],
      max_tokens: 800, temperature: 0.1
    }),
    parseResponse: (data) => {
      if (data.error) throw new Error(data.error.message || data.error);
      return data.choices?.[0]?.message?.content;
    }
  },
  {
    name: 'OpenRouter',
    key: process.env.AI_API_KEY,
    url: process.env.AI_API_URL,
    model: process.env.AI_MODEL,
    buildHeaders: () => ({
      'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.AI_HTTP_REFERER || 'http://localhost:3001'
    }),
    buildBody: (sysPrompt, msgs) => ({
      model: process.env.AI_MODEL,
      messages: [{ role: 'system', content: sysPrompt }, ...msgs.slice(-10)],
      max_tokens: 800, temperature: 0.1
    }),
    parseResponse: (data) => {
      if (data.error) throw new Error(data.error.message || data.error);
      const content = data.choices?.[0]?.message?.content;
      if (content && content.toLowerCase().includes('user safety:')) throw new Error('Safety filter triggered');
      return content;
    }
  },
  {
    name: 'Gemini',
    key: process.env.GEMINI_API_KEY,
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash',
    model: 'gemini-2.0-flash',
    buildHeaders: () => ({ 'Content-Type': 'application/json' }),
    buildBody: (sysPrompt, msgs) => {
      const contents = [];
      for (const m of msgs.slice(-10)) {
        contents.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        });
      }
      if (contents.length > 0 && contents[0].role === 'user') {
        contents[0].parts[0].text = `${sysPrompt}\n\n${contents[0].parts[0].text}`;
      } else {
        contents.unshift({ role: 'user', parts: [{ text: sysPrompt }] });
      }
      return { contents, generationConfig: { maxOutputTokens: 800, temperature: 0.1 } };
    },
    parseResponse: (data) => {
      if (data.error) throw new Error(data.error.message || data.error);
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    },
    getUrl: () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
  }
];

function extractNavigation(text) {
  const match = text.match(/NAVIGATE:\s*(\{[\s\S]*?\})/);
  if (!match) return null;
  try { const nav = JSON.parse(match[1]); if (nav.page) return nav; } catch {}
  return null;
}

function extractFillForm(text) {
  const m = text.match(/FILL_FORM:\s*(\{[\s\S]*?\})/);
  if (!m) return null;
  try { const p = JSON.parse(m[1]); if (p.name) return p; } catch {}
  return null;
}

function stripActions(text) {
  return text.replace(/FILL_FORM:\s*\{[\s\S]*?\}\s*/g, '').replace(/NAVIGATE:\s*\{[\s\S]*?\}\s*/g, '').trim();
}

async function buildStoreContext() {
  const { default: prisma } = await import('@/lib/prisma');
  const currencyFormatter = new Intl.NumberFormat('en-RW', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const [types, tiers, productCount, recentProducts, orderStats, revenueResult] = await Promise.all([
    prisma.productType.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
    prisma.priceTier.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 10,
      include: { productType: { select: { name: true } }, priceTier: { select: { name: true } } }
    }),
    prisma.storeOrder.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.storeOrder.aggregate({
      _sum: { totalPrice: true },
      where: { status: 'DELIVERED' },
    }),
  ]);
  const totalRevenue = revenueResult._sum.totalPrice || 0;
  const pendingOrders = orderStats.find(s => s.status === 'PENDING');
  const confirmedOrders = orderStats.find(s => s.status === 'CONFIRMED');
  const inProgressOrders = orderStats.find(s => s.status === 'IN_PROGRESS');
  const deliveredOrders = orderStats.find(s => s.status === 'DELIVERED');
  return {
    shopName: process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Furaha Furniture Shop',
    today: new Date().toISOString().split('T')[0],
    types: types.map(t => ({ id: t.id, name: t.name, slug: t.slug, description: t.description })),
    tiers: tiers.map(t => ({ id: t.id, name: t.name, slug: t.slug })),
    productCount,
    recentProducts: recentProducts.map(p => ({
      name: p.name, slug: p.slug, price: p.price,
      type: p.productType.name, tier: p.priceTier.name, isFeatured: p.isFeatured
    })),
    orderStats: {
      pending: pendingOrders?._count?.id || 0,
      confirmed: confirmedOrders?._count?.id || 0,
      inProgress: inProgressOrders?._count?.id || 0,
      delivered: deliveredOrders?._count?.id || 0,
      total: orderStats.reduce((sum, s) => sum + s._count.id, 0),
    },
    totalRevenue,
    totalRevenueFormatted: currencyFormatter.format(totalRevenue),
  };
}

function buildSystemPrompt(ctx) {
  return `You are the AI assistant for ${ctx.shopName}, an ecommerce furniture store. Help the owner manage their product catalog.

Respond in a clear, well-structured way. Use the same language as the owner (English, Kinyarwanda, or French). Use RWF for prices.

AVAILABLE PRODUCT TYPES:
${ctx.types.map(t => `- ${t.name} (id: ${t.id}, slug: ${t.slug})${t.description ? ': ' + t.description : ''}`).join('\n')}

AVAILABLE PRICE TIERS:
${ctx.tiers.map(t => `- ${t.name} (id: ${t.id}, slug: ${t.slug})`).join('\n')}

STORE STATS: ${ctx.productCount} active products
ORDERS: ${ctx.orderStats.total} total (${ctx.orderStats.pending} pending, ${ctx.orderStats.confirmed} confirmed, ${ctx.orderStats.inProgress} in progress, ${ctx.orderStats.delivered} delivered)
REVENUE: ${ctx.totalRevenueFormatted} RWF from delivered orders
Today: ${ctx.today}

RECENT PRODUCTS:
${ctx.recentProducts.map(p => `- ${p.name} (${p.type}, ${p.tier}): ${p.price.toLocaleString()} RWF${p.isFeatured ? ' [Featured]' : ''}`).join('\n') || 'No products yet.'}

YOUR ROLE:
- Help the owner think through new product ideas
- Suggest names, descriptions, materials, dimensions, prices, types, and tiers
- Suggest appropriate types and tiers based on product description
- Prices in RWF: Budget 50k-200k, Premium 200k-800k, Luxury 800k-3M+
- When suggesting a new product, include FILL_FORM:{"name":"...","price":"...","productTypeId":"...","priceTierId":"...","material":"...","dimensions":"...","description":"...","availability":"IN_STOCK or MADE_TO_ORDER","estimatedDays":"...","imageUrl":"...","imageSearchTerm":"..."} with the actual type/tier IDs from the lists above
  - imageUrl: a relevant Unsplash image URL like https://images.unsplash.com/photo-XXX?w=800 (search Unsplash for the product type)
  - imageSearchTerm: keywords to search for a product image (e.g. "modern leather sofa living room")
- End with NAVIGATE:{"page":"new-product","label":"Add Product"} to take them to the form
- For viewing products: NAVIGATE:{"page":"products","label":"View Products"}
- Use the actual productTypeId and priceTierId from the IDs shown above
- If the user asks for images or pictures, include imageUrl and imageSearchTerm in FILL_FORM
- For questions about sales or revenue: use the ORDERS and REVENUE stats above to answer directly
- For detailed breakdowns: "Check your admin dashboard for order details."

RESPONSE QUALITY:
- Write 2-4 clear sentences for the reply
- Make descriptions specific and vivid (materials, style, use case)
- When suggesting a product, describe what makes it a good fit
- Keep the overall reply concise but informative

For anything outside your scope: "I can't do that here. Check your admin dashboard."`;
}

async function callProvider(provider, systemPrompt, messages) {
  const url = provider.getUrl ? provider.getUrl() : `${provider.url}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: provider.buildHeaders(),
    body: JSON.stringify(provider.buildBody(systemPrompt, messages))
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
  const content = provider.parseResponse(data);
  if (!content) throw new Error('Empty response');
  return content;
}

async function callAI(systemPrompt, messages) {
  for (const provider of PROVIDERS) {
    if (!provider.key) {
      console.log(`${provider.name}: no API key configured, skipping`);
      continue;
    }
    try {
      console.log(`Trying ${provider.name}...`);
      const result = await callProvider(provider, systemPrompt, messages);
      console.log(`${provider.name}: success`);
      return result;
    } catch (err) {
      const isQuota = /(quota|rate|limit|exhausted|insufficient|429|402|payment|token).*/i.test(err.message);
      console.log(`${provider.name}: ${isQuota ? 'QUOTA EXHAUSTED' : 'ERROR'} - ${err.message}`);
    }
  }
  throw new Error('All AI providers exhausted');
}

export async function POST(request) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  try {
    const { message, history = [] } = await request.json();
    if (!message || !message.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const ctx = await buildStoreContext();
    const systemPrompt = buildSystemPrompt(ctx);
    const aiResponse = await callAI(systemPrompt, [...history, { role: 'user', content: message }]);

    return Response.json({
      data: {
        reply: stripActions(aiResponse),
        navigation: extractNavigation(aiResponse),
        fillForm: extractFillForm(aiResponse)
      }
    });
  } catch (err) {
    console.error('Agent error:', err);
    const rateMsg = /(quota|rate|limit|exhausted|insufficient|429|402|payment).*/i.test(err.message)
      ? "Mbabarira, twanje kugera kuri AI service. Tegereza akanya gato hanyuma ugerageze nanone."
      : "Mbabarira, hari ikibazo. Gerageza nanone nyuma y'akanya gato.";
    return Response.json({
      data: { reply: rateMsg, navigation: null, fillForm: null }
    });
  }
}
