import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const { slug } = params;

    const product = await prisma.product.findUnique({ where: { slug } });

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
