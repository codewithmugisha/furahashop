import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = params;
    const type = await prisma.productType.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!type) return Response.json({ error: 'Type not found' }, { status: 404 });
    return Response.json({ data: { ...type, productCount: type._count.products } });
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
    const { name, description, imageUrl, isActive, order } = body;

    const existing = await prisma.productType.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Type not found' }, { status: 404 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;

    const type = await prisma.productType.update({
      where: { id },
      data: updateData,
    });

    return Response.json({ data: type });
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

    const existing = await prisma.productType.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Type not found' }, { status: 404 });
    }

    const activeProductCount = await prisma.product.count({
      where: { productTypeId: id, isActive: true },
    });

    if (activeProductCount > 0) {
      return Response.json(
        { error: `Cannot delete type: ${activeProductCount} active product(s) exist in this type` },
        { status: 409 }
      );
    }

    await prisma.productType.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
