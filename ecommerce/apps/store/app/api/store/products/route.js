import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const typeSlug = searchParams.get('typeSlug');
    const tierSlug = searchParams.get('tierSlug');
    const type = searchParams.get('type');
    const tier = searchParams.get('tier');
    const typeId = searchParams.get('typeId');
    const tierId = searchParams.get('tierId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const availability = searchParams.get('availability');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const exclude = searchParams.get('exclude');

    const where = { isActive: true };

    if (featured === 'true') where.isFeatured = true;

    if (type) {
      const slugs = type.split(',').filter(Boolean);
      const types = await prisma.productType.findMany({ where: { slug: { in: slugs } } });
      if (types.length > 0) where.productTypeId = { in: types.map(t => t.id) };
    } else if (typeSlug) {
      const t = await prisma.productType.findUnique({ where: { slug: typeSlug } });
      if (t) where.productTypeId = t.id;
    } else if (typeId) {
      where.productTypeId = typeId;
    }

    if (tier) {
      const slugs = tier.split(',').filter(Boolean);
      const tiers = await prisma.priceTier.findMany({ where: { slug: { in: slugs } } });
      if (tiers.length > 0) where.priceTierId = { in: tiers.map(t => t.id) };
    } else if (tierSlug) {
      const t = await prisma.priceTier.findUnique({ where: { slug: tierSlug } });
      if (t) where.priceTierId = t.id;
    } else if (tierId) {
      where.priceTierId = tierId;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (availability && availability !== 'both') where.availability = availability;
    if (exclude) where.id = { not: exclude };

    let orderBy;
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }], take: 1 },
          productType: { select: { id: true, name: true, slug: true } },
          priceTier: { select: { id: true, name: true, slug: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return Response.json({
      data: {
        products: products.map((p) => ({
          ...p,
          images: p.images,
          productType: p.productType,
          priceTier: p.priceTier,
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
