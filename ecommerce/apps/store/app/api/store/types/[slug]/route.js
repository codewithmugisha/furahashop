import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { slug } = params;

    const type = await prisma.productType.findUnique({
      where: { slug },
    });

    if (!type || !type.isActive) {
      return Response.json({ error: 'Type not found' }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: { productTypeId: type.id, isActive: true },
      include: {
        images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }], take: 1 },
        productType: true,
        priceTier: true,
      },
      take: 12,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.product.count({
      where: { productTypeId: type.id, isActive: true },
    });

    return Response.json({
      data: {
        type,
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
