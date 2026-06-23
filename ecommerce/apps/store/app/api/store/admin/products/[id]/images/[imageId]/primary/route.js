import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export async function PATCH(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id, imageId } = params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });

    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) return Response.json({ error: 'Image not found' }, { status: 404 });

    await prisma.$transaction([
      prisma.productImage.updateMany({
        where: { productId: id, isPrimary: true },
        data: { isPrimary: false },
      }),
      prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    return Response.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
