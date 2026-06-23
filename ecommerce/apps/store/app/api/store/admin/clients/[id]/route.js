import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = params;
    const client = await prisma.storeClient.findUnique({ where: { id } });

    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

    const linkedOrders = await prisma.storeOrder.findMany({
      where: { storeClientId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, slug: true, price: true } },
      },
    });

    const phoneOrders = await prisma.storeOrder.findMany({
      where: {
        storeClientId: null,
        clientPhone: { contains: client.phone.slice(-9) },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, slug: true, price: true } },
      },
    });

    const seen = new Set(linkedOrders.map(o => o.id));
    const allOrders = [...linkedOrders, ...phoneOrders.filter(o => !seen.has(o.id))];
    allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const currencyFormatter = new Intl.NumberFormat('en-RW', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const totalSpent = allOrders.reduce((s, o) => s + o.totalPrice, 0);

    return Response.json({
      data: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        notes: client.notes,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        orderCount: allOrders.length,
        totalSpent,
        totalSpentFormatted: currencyFormatter.format(totalSpent),
        orders: allOrders,
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = params;
    const body = await request.json();
    const client = await prisma.storeClient.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });
    return Response.json({ data: client });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
