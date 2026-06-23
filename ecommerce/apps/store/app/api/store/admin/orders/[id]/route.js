import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = params;
    const order = await prisma.storeOrder.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }] },
            productType: true,
            priceTier: true,
          },
        },
      },
    });
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    return Response.json({ data: order });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
