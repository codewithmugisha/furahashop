import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export async function PATCH(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = params;
    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images)) {
      return Response.json({ error: 'images array is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    for (const img of images) {
      await prisma.productImage.update({
        where: { id: img.id },
        data: { order: img.order },
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
