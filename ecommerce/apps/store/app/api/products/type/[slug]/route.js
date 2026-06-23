import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const tierSlug = searchParams.get('tier') || '';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);

    try {
        const type = await prisma.productType.findUnique({ where: { slug } });
        if (!type) {
            return NextResponse.json({ error: 'Type not found' }, { status: 404 });
        }

        const where = { isActive: true, productTypeId: type.id };
        if (tierSlug) {
            const tier = await prisma.priceTier.findUnique({ where: { slug: tierSlug } });
            if (tier) where.priceTierId = tier.id;
        }

        let orderBy;
        switch (sort) {
            case 'price_asc': orderBy = { price: 'asc' }; break;
            case 'price_desc': orderBy = { price: 'desc' }; break;
            case 'popular': orderBy = { viewCount: 'desc' }; break;
            default: orderBy = { createdAt: 'desc' };
        }

        const limit = 12;
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }], take: 1 },
                    productType: { select: { id: true, name: true, slug: true } },
                    priceTier: { select: { id: true, name: true, slug: true } },
                },
                orderBy,
                skip,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json({
            products,
            total,
            page,
            pages: Math.ceil(total / limit),
            hasMore: page < Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
