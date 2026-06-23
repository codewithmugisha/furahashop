import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import PriceTierBadge from '@/components/PriceTierBadge';
import prisma from '@/lib/prisma';

export async function generateStaticParams() {
  const tiers = await prisma.priceTier.findMany({ where: { isActive: true } });
  return tiers.map((t) => ({ slug: t.slug }));
}

async function getData(slug, typeSlug, sort, page) {
  const tier = await prisma.priceTier.findUnique({ where: { slug } });
  if (!tier) return null;

  const where = { isActive: true, priceTierId: tier.id };
  if (typeSlug) {
    const type = await prisma.productType.findUnique({ where: { slug: typeSlug } });
    if (type) where.productTypeId = type.id;
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

  const [products, total, types] = await Promise.all([
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
    prisma.productType.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
  ]);

  return { tier, products, total, types, page, pages: Math.ceil(total / limit) };
}

export default async function TierPage({ params, searchParams }) {
  const { slug } = params;
  const typeSlug = searchParams?.type || '';
  const sort = searchParams?.sort || 'newest';
  const page = parseInt(searchParams?.page || '1', 10);

  const data = await getData(slug, typeSlug, sort, page);

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="font-serif text-2xl text-ink mb-4">Price tier not found</p>
        <Link href="/products" className="text-forest font-sans hover:underline">Browse all products &rarr;</Link>
      </div>
    );
  }

  const { tier, products, total, types } = data;

  return (
    <div className="store-container py-8">
      <div className="flex items-center gap-2 text-sm text-ink-secondary font-sans mb-6">
        <Link href="/" className="hover:text-forest">Home</Link>
        <span>/</span>
        <span className="text-ink">{tier.name}</span>
      </div>

      <PriceTierBadge tier={tier.slug} size="lg" />
      <h1 className="font-serif text-3xl sm:text-4xl text-ink mt-3 mb-2">{tier.name}</h1>
      {tier.description && (
        <p className="text-ink-secondary font-sans mb-1">{tier.description}</p>
      )}
      <p className="text-ink-secondary text-sm font-sans mb-8">{total} product{total !== 1 ? 's' : ''}</p>

      <div className="sticky top-20 z-20 bg-cream py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Link
            href={`/tier/${slug}?sort=${sort}`}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-sans font-medium transition-all min-h-[40px] ${!typeSlug ? 'bg-forest text-white' : 'bg-white text-ink border border-border hover:bg-forest-light'
              }`}
          >
            All
          </Link>
          {types.map((type) => (
            <Link
              key={type.id}
              href={`/tier/${slug}?type=${type.slug}&sort=${sort}`}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-sans font-medium transition-all min-h-[40px] ${typeSlug === type.slug ? 'bg-forest text-white' : 'bg-white text-ink border border-border hover:bg-forest-light'
                }`}
            >
              {type.name}
            </Link>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          {['newest', 'price_asc', 'price_desc', 'popular'].map((s) => {
            const labels = { newest: 'Newest', price_asc: 'Price: Low to High', price_desc: 'Price: High to Low', popular: 'Most Popular' };
            return (
              <Link
                key={s}
                href={`/tier/${slug}${typeSlug ? `?type=${typeSlug}&` : '?'}sort=${s}`}
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 mt-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {data.pages > 1 && (
            <div className="flex justify-center gap-3 mt-10">
              {page > 1 && (
                <Link href={`/tier/${slug}?type=${typeSlug}&sort=${sort}&page=${page - 1}`}
                  className="px-4 py-2 bg-white border border-border rounded-xl text-sm font-sans text-ink hover:bg-forest-light transition-colors">
                  Previous
                </Link>
              )}
              {page < data.pages && (
                <Link href={`/tier/${slug}?type=${typeSlug}&sort=${sort}&page=${page + 1}`}
                  className="px-4 py-2 bg-forest text-white rounded-xl text-sm font-sans hover:bg-forest-mid transition-colors">
                  Load More
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-ink-light mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-serif text-xl text-ink mb-2">No products in this budget range yet</p>
          <Link href="/products" className="text-forest font-sans font-medium hover:underline">Browse all products &rarr;</Link>
        </div>
      )}
    </div>
  );
}
