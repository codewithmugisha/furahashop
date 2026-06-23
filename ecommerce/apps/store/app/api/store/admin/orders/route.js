import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

const WORKER_URL = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3002';
const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001';

function generateOrderNumber() {
  const ts = Date.now().toString();
  const suffix = ts.slice(-6);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 3; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
  return 'FQ-' + suffix + rand;
}

export async function POST(request) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { productId, clientName, clientPhone, quantity, status, paymentStatus, depositAmount, orderType, storeClientId } = await request.json();
    if (!productId || !clientName || !clientPhone) {
      return Response.json({ error: 'productId, clientName, clientPhone are required' }, { status: 400 });
    }
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) return Response.json({ error: 'Product not found' }, { status: 404 });
    const qty = quantity || 1;
    const totalPrice = product.price * qty;
    const type = orderType || 'DAILY_SALE';

    let resolvedClientId = storeClientId || null;
    if (!resolvedClientId) {
      const normalizedPhone = clientPhone.replace(/[^0-9]/g, '');
      const existingClient = await prisma.storeClient.findFirst({
        where: { phone: { contains: normalizedPhone.slice(-9) } },
      });
      if (existingClient) {
        resolvedClientId = existingClient.id;
      } else {
        const newClient = await prisma.storeClient.create({
          data: { name: clientName, phone: clientPhone },
        });
        resolvedClientId = newClient.id;
      }
    } else {
      const client = await prisma.storeClient.findUnique({ where: { id: resolvedClientId } });
      if (!client) return Response.json({ error: 'Store client not found' }, { status: 404 });
    }

    const order = await prisma.storeOrder.create({
      data: {
        orderNumber: generateOrderNumber(),
        productId: product.id,
        clientName,
        clientPhone,
        storeClientId: resolvedClientId,
        quantity: qty,
        unitPrice: product.price,
        totalPrice,
        orderType: type,
        status: status || (type === 'ORDER' ? 'PENDING' : 'DELIVERED'),
        paymentStatus: paymentStatus || (type === 'ORDER' ? 'UNPAID' : 'PAID'),
        depositAmount: (paymentStatus || (type === 'ORDER' ? 'UNPAID' : 'PAID')) === 'DEPOSIT' ? (depositAmount || 0) : null,
        paidAt: (paymentStatus || (type === 'ORDER' ? 'UNPAID' : 'PAID')) === 'PAID' ? new Date() : null,
      },
    });
    try {
      const msg = type === 'DAILY_SALE'
        ? [
            `Muraho ${clientName},`,
            '',
            'Ikirangijwe kuri Furaha Furniture Shop!',
            '',
            `📦 Nimero: ${order.orderNumber}`,
            `🪑 Igicuruzwa: ${product.name} x ${qty}`,
            `💰 Igiteranyo: ${order.totalPrice.toLocaleString()} RWF`,
            `💳 Ubwishyu: ${order.paymentStatus === 'PAID' ? 'Cyishuwe' : order.paymentStatus === 'DEPOSIT' ? `Amafaranga y'imbere: ${depositAmount || 0} RWF` : 'Ntacyishuwe'}`,
            '',
            `*Furaha Furniture Shop* 🏪`,
          ].join('\n')
        : [
            `Muraho ${clientName},`,
            '',
            'Ikomande yanyu yakiriwe kuri Furaha Furniture Shop!',
            '',
            `📦 Nimero ya Komande: ${order.orderNumber}`,
            `🪑 Igicuruzwa: ${product.name} x ${qty}`,
            `💰 Igiteranyo: ${order.totalPrice.toLocaleString()} RWF`,
            `📅 Itaragereranyo: ${product.estimatedDays || '2-5'} iminsi`,
            '',
            `Kurikirana: ${STORE_URL}/track?orderNumber=${order.orderNumber}`,
            '',
            `*Furaha Furniture Shop* 🏪`,
          ].join('\n');

      const phone = clientPhone.replace(/[^0-9]/g, '');
      await fetch(`${WORKER_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: msg }),
      });
    } catch (waErr) {
      console.error('Admin order WhatsApp notification failed:', waErr);
    }

    return Response.json({ data: order }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search');

    const where = {};

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.storeOrder.findMany({
        where,
        include: {
          product: {
            include: {
              images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }], take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.storeOrder.count({ where }),
    ]);

    return Response.json({
      data: {
        orders: orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          clientName: o.clientName,
          clientPhone: o.clientPhone,
          clientEmail: o.clientEmail,
          quantity: o.quantity,
          unitPrice: o.unitPrice,
          totalPrice: o.totalPrice,
          customNotes: o.customNotes,
          deliveryMethod: o.deliveryMethod,
          deliveryAddress: o.deliveryAddress,
          status: o.status,
          paymentStatus: o.paymentStatus,
          depositAmount: o.depositAmount,
          paidAt: o.paidAt,
          cancelReason: o.cancelReason,
          jobId: o.jobId,
          clientId: o.clientId,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
          product: {
            id: o.product.id,
            name: o.product.name,
            slug: o.product.slug,
            price: o.product.price,
            primaryImage: o.product.images[0] || null,
          },
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
