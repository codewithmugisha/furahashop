import prisma from '@/lib/prisma';

function normalizePhone(phone) {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('250')) return '+' + cleaned;
  if (cleaned.startsWith('+250')) return '+' + cleaned.slice(4);
  return '+250' + cleaned;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const orderNumber = searchParams.get('orderNumber');

    if (!phone && !orderNumber) {
      return Response.json({ error: 'Phone number or order number is required' }, { status: 400 });
    }

    const where = orderNumber
      ? { orderNumber: orderNumber.toUpperCase() }
      : { clientPhone: normalizePhone(phone) };

    const orders = await prisma.storeOrder.findMany({
      where,
      include: {
        product: {
          include: {
            images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }], take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({
      data: {
        orders: orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          clientName: o.clientName,
          clientPhone: o.clientPhone,
          quantity: o.quantity,
          unitPrice: o.unitPrice,
          totalPrice: o.totalPrice,
          deliveryMethod: o.deliveryMethod,
          deliveryAddress: o.deliveryAddress,
          status: o.status,
          customNotes: o.customNotes,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
          product: {
            id: o.product.id,
            name: o.product.name,
            slug: o.product.slug,
            primaryImage: o.product.images[0] || null,
          },
        })),
      },
    });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
