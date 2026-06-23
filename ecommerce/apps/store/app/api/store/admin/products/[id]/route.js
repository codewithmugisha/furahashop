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

export async function GET(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }] },
        productType: true,
        priceTier: true,
      },
    });
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }
    return Response.json({ data: product });
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
    const { name, description, price, productTypeId, priceTierId, material, dimensions, availability, estimatedDays, allowCustomNotes, isActive, isFeatured } = body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
      let slug = generateSlug(name);
      const slugConflict = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugConflict) {
        const rand = Math.random().toString(36).substring(2, 6);
        slug = slug + '-' + rand;
      }
      updateData.slug = slug;
    }
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (productTypeId !== undefined) updateData.productTypeId = productTypeId;
    if (priceTierId !== undefined) updateData.priceTierId = priceTierId;
    if (material !== undefined) updateData.material = material;
    if (dimensions !== undefined) updateData.dimensions = dimensions;
    if (availability !== undefined) updateData.availability = availability;
    if (estimatedDays !== undefined) updateData.estimatedDays = estimatedDays ? parseInt(estimatedDays, 10) : null;
    if (allowCustomNotes !== undefined) updateData.allowCustomNotes = allowCustomNotes;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return Response.json({ data: product });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const activeOrderCount = await prisma.storeOrder.count({
      where: {
        productId: id,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      },
    });

    if (activeOrderCount > 0) {
      return Response.json(
        { error: `Cannot delete product: ${activeOrderCount} active order(s) exist` },
        { status: 409 }
      );
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
