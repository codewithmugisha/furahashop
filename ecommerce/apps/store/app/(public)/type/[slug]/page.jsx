import Link from 'next/link';
import ProductListWithLoadMore from '@/components/ProductListWithLoadMore';
import prisma from '@/lib/prisma';

// Disable static generation since we need database access
export const dynamic = 'force-dynamic';

async function getData(slug, tierSlug, sort, page) {
  const type = await prisma.productType.findUnique({ where: { slug } });
  if (!type) return null;

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

  const [products, total, tiers] = await Promise.all([
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
    prisma.priceTier.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
  ]);

  return { type, products, total, tiers, page, pages: Math.ceil(total / limit) };
}

export default async function TypePage({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const tierSlug = resolvedSearchParams?.tier || '';
  const sort = resolvedSearchParams?.sort || 'newest';
  const page = parseInt(resolvedSearchParams?.page || '1', 10);

  const data = await getData(slug, tierSlug, sort, page);

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="font-serif text-2xl text-ink mb-4">Category not found</p>
        <Link href="/products" className="text-forest font-sans hover:underline">Browse all products &rarr;</Link>
      </div>
    );
  }

  const { type, products, total, tiers } = data;

  return (
    <div className="store-container py-8">
      <div className="flex items-center gap-2 text-sm text-ink-secondary font-sans mb-6">
        <Link href="/" className="hover:text-forest">Home</Link>
        <span>/</span>
        <span className="text-ink">{type.name}</span>
      </div>

      <h1 className="font-serif text-3xl sm:text-4xl text-ink mb-2">{type.name}</h1>
      {type.description && (
        <p className="text-ink-secondary font-sans mb-1">{type.description}</p>
      )}
      <p className="text-ink-secondary text-sm font-sans mb-8">{total} product{total !== 1 ? 's' : ''}</p>

      <div className="sticky top-20 z-20 bg-cream py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Link
            href={`/type/${slug}?sort=${sort}`}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-sans font-medium transition-all min-h-[40px] ${!tierSlug ? 'bg-forest text-white' : 'bg-white text-ink border border-border hover:bg-forest-light'
              }`}
          >
            All
          </Link>
          {tiers.map((tier) => (
            <Link
              key={tier.id}
              href={`/type/${slug}?tier=${tier.slug}&sort=${sort}`}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-sans font-medium transition-all min-h-[40px] ${tierSlug === tier.slug ? 'bg-forest text-white' : 'bg-white text-ink border border-border hover:bg-forest-light'
                }`}
            >
              {tier.name}
            </Link>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          {['newest', 'price_asc', 'price_desc', 'popular'].map((s) => {
            const labels = { newest: 'Newest', price_asc: 'Price: Low to High', price_desc: 'Price: High to Low', popular: 'Most Popular' };
            return (
              <Link
                key={s}
                href={`/type/${slug}${tierSlug ? `?tier=${tierSlug}&` : '?'}sort=${s}`}
                className={`text-xs font-sans px-3 py-1.5 rounded-full transition-colors ${sort === s ? 'bg-forest-light text-forest font-medium' : 'text-ink-secondary hover:text-forest'
                  }`}
              >
                {labels[s]}
              </Link>
            );
          })}
        </div>
      </div>

      {products.length > 0 ? (
        <ProductListWithLoadMore
          initialProducts={products}
          slug={slug}
          apiEndpoint="type"
          tierSlug={tierSlug}
          sort={sort}
          totalPages={data.pages}
        />
      ) : (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-ink-light mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-serif text-xl text-ink mb-2">No products in this category yet</p>
          <p className="text-ink-secondary text-sm mb-4">Check back soon.</p>
          <Link href="/products" className="text-forest font-sans font-medium hover:underline">Browse all products &rarr;</Link>
        </div>
      )}
    </div>
  );
}
