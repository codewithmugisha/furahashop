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
    const types = await prisma.productType.findMany({
      include: {
        _count: {
          select: { products: true },
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
      isActive: t.isActive,
      productCount: t._count.products,
    }));

    return Response.json({ data });
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
    const { name, description, imageUrl } = body;

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    let slug = generateSlug(name);

    const existing = await prisma.productType.findUnique({ where: { slug } });
    if (existing) {
      const rand = Math.random().toString(36).substring(2, 6);
      slug = slug + '-' + rand;
    }

    const type = await prisma.productType.create({
      data: {
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
      },
    });

    return Response.json({ data: type }, { status: 201 });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
