import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { slug } = params;

    const tier = await prisma.priceTier.findUnique({
      where: { slug },
    });

    if (!tier || !tier.isActive) {
      return Response.json({ error: 'Tier not found' }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: { priceTierId: tier.id, isActive: true },
      include: {
        images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }], take: 1 },
        productType: true,
        priceTier: true,
      },
      take: 12,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.product.count({
      where: { priceTierId: tier.id, isActive: true },
    });

    return Response.json({
      data: {
        tier,
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          material: p.material,
          dimensions: p.dimensions,
          availability: p.availability,
          estimatedDays: p.estimatedDays,
          primaryImage: p.images[0] || null,
          type: p.productType,
          tier: p.priceTier,
        })),
        total,
      },
    });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
