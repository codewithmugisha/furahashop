import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = params;
    const tier = await prisma.priceTier.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!tier) return Response.json({ error: 'Tier not found' }, { status: 404 });
    return Response.json({ data: { ...tier, productCount: tier._count.products } });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, isActive } = body;

    const existing = await prisma.priceTier.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Tier not found' }, { status: 404 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const tier = await prisma.priceTier.update({
      where: { id },
      data: updateData,
    });

    return Response.json({ data: tier });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
