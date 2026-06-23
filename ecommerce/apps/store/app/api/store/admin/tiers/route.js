import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const tiers = await prisma.priceTier.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    const data = tiers.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      order: t.order,
      isActive: t.isActive,
      productCount: t._count.products,
    }));

    return Response.json({ data });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
