import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export async function POST(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = params;
    const body = await request.json();
    const { imageUrl, altText, isPrimary } = body;

    if (!imageUrl) {
      return Response.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const count = await prisma.productImage.count({ where: { productId: id } });
    if (count >= 8) {
      return Response.json({ error: 'Maximum 8 images per product' }, { status: 400 });
    }

    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId: id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const image = await prisma.productImage.create({
      data: {
        productId: id,
        imageUrl,
        altText: altText || null,
        isPrimary: isPrimary || count === 0,
        order: count,
      },
    });

    return Response.json({ data: image }, { status: 201 });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
