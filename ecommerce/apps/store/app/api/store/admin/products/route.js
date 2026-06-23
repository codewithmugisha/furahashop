import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(request) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get('typeId');
    const tierId = searchParams.get('tierId');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where = {};
    if (typeId) where.productTypeId = typeId;
    if (tierId) where.priceTierId = tierId;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }], take: 1 },
          productType: true,
          priceTier: true,
          _count: { select: { storeOrders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return Response.json({
      data: {
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          material: p.material,
          dimensions: p.dimensions,
          availability: p.availability,
          estimatedDays: p.estimatedDays,
          allowCustomNotes: p.allowCustomNotes,
          isActive: p.isActive,
          isFeatured: p.isFeatured,
          viewCount: p.viewCount,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          primaryImage: p.images[0] || null,
          type: p.productType,
          tier: p.priceTier,
          orderCount: p._count.storeOrders,
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

export async function POST(request) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await request.json();
    const { name, description, price, productTypeId, priceTierId, material, dimensions, availability, estimatedDays, allowCustomNotes, isActive, isFeatured } = body;

    if (!name || price === undefined || !productTypeId || !priceTierId) {
      return Response.json({ error: 'Missing required fields: name, price, productTypeId, priceTierId' }, { status: 400 });
    }

    let slug = generateSlug(name);

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      const rand = Math.random().toString(36).substring(2, 6);
      slug = slug + '-' + rand;
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || '',
        price: parseFloat(price),
        productTypeId,
        priceTierId,
        material: material || null,
        dimensions: dimensions || null,
        availability: availability || 'MADE_TO_ORDER',
        estimatedDays: estimatedDays ? parseInt(estimatedDays, 10) : null,
        allowCustomNotes: allowCustomNotes !== undefined ? allowCustomNotes : true,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured || false,
      },
    });

    return Response.json({ data: product }, { status: 201 });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
