import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const tiers = await prisma.priceTier.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return Response.json({ data: tiers });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
