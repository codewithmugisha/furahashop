import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const types = await prisma.productType.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { order: 'asc' },
    });

    const data = types.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      imageUrl: t.imageUrl,
      order: t.order,
      productCount: t._count.products,
    }));

    return Response.json({ data });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
