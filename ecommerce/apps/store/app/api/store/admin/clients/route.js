import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      prisma.storeClient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.storeClient.count({ where }),
    ]);

    const currencyFormatter = new Intl.NumberFormat('en-RW', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const clientPhones = clients.map(c => c.phone?.slice(-9)).filter(Boolean);
    const phoneOrders = clientPhones.length
      ? await prisma.storeOrder.findMany({
          where: {
            OR: clientPhones.map(p => ({ clientPhone: { contains: p } })),
            storeClientId: null,
          },
          select: { id: true, totalPrice: true, createdAt: true, status: true, paymentStatus: true, orderNumber: true, productId: true, clientPhone: true, storeClientId: true },
        })
      : [];

    const ordersByPhone = {};
    for (const o of phoneOrders) {
      for (const c of clients) {
        if (o.storeClientId === c.id || o.clientPhone?.includes(c.phone.slice(-9))) {
          if (!ordersByPhone[c.id]) ordersByPhone[c.id] = [];
          ordersByPhone[c.id].push(o);
        }
      }
    }

    const data = clients.map(c => {
      const linkedOrders = ordersByPhone[c.id] || [];
      const totalSpent = linkedOrders.reduce((s, o) => s + o.totalPrice, 0);
      linkedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const lastOrder = linkedOrders.length > 0 ? linkedOrders[0].createdAt : null;
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        notes: c.notes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        orderCount: linkedOrders.length,
        totalSpent,
        totalSpentFormatted: currencyFormatter.format(totalSpent),
        lastOrderDate: lastOrder,
        orders: linkedOrders,
      };
    });

    return Response.json({
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { name, phone, notes } = await request.json();
    if (!name || !phone) {
      return Response.json({ error: 'Name and phone are required' }, { status: 400 });
    }
    const client = await prisma.storeClient.create({
      data: { name, phone, notes },
    });
    return Response.json({ data: client }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
