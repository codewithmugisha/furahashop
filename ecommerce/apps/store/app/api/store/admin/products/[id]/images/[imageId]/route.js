import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function deleteCloudinaryImage(imageUrl) {
  try {
    const parts = imageUrl.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${filename}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
}

export async function DELETE(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id, imageId } = params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) {
      return Response.json({ error: 'Image not found' }, { status: 404 });
    }

    const wasPrimary = image.isPrimary;

    await deleteCloudinaryImage(image.imageUrl);

    await prisma.productImage.delete({ where: { id: imageId } });

    if (wasPrimary) {
      const firstRemaining = await prisma.productImage.findFirst({
        where: { productId: id },
        orderBy: { order: 'asc' },
      });

      if (firstRemaining) {
        await prisma.productImage.update({
          where: { id: firstRemaining.id },
          data: { isPrimary: true },
        });
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
