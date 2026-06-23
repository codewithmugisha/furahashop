import Link from 'next/link';
import ImageGallery from '@/components/ImageGallery';
import PriceTierBadge from '@/components/PriceTierBadge';
import ProductCard from '@/components/ProductCard';
import StoreButton from '@/components/StoreButton';
import WhatsAppButton from '@/components/WhatsAppButton';
import ProductActions from '@/components/ProductActions';
import { formatPrice } from '@/lib/api';
import prisma from '@/lib/prisma';
import OrderFormSectionClient from './OrderFormSection';

function OrderFormSection({ product }) {
  return <OrderFormSectionClient product={product} />;
}

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ where: { isActive: true }, select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true },
  });
  if (!product) return { title: 'Product Not Found' };
  return {
    title: `${product.name} — Furaha Furniture Shop`,
    description: product.description?.slice(0, 160) || '',
  };
}

async function getProduct(slug) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }] },
      productType: true,
      priceTier: true,
    },
  });
  return product;
}

async function getSimilarProducts(productTypeId, excludeId) {
  return prisma.product.findMany({
    where: { isActive: true, productTypeId, id: { not: excludeId } },
    include: {
      images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }], take: 1 },
      productType: { select: { id: true, name: true, slug: true } },
      priceTier: { select: { id: true, name: true, slug: true } },
    },
    take: 4,
    orderBy: { createdAt: 'desc' },
  });
}

export default async function ProductDetailPage({ params }) {
  const product = await getProduct(params.slug);

  if (!product || !product.isActive) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="font-serif text-2xl text-ink mb-4">Product not found</p>
        <Link href="/products" className="text-forest font-sans hover:underline">Browse all products &rarr;</Link>
      </div>
    );
  }

  // Increment view count silently
  try {
    await prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } });
  } catch { }

  const similarProducts = await getSimilarProducts(product.productTypeId, product.id);

  return (
    <>
      <WhatsAppButton productName={product.name} />

      {/* Breadcrumb */}
      <div className="store-container pt-6 pb-2">
        <div className="flex items-center gap-2 text-sm text-ink-secondary font-sans">
          <Link href="/" className="hover:text-forest">Home</Link>
          <span>/</span>
          <Link href={`/type/${product.productType?.slug}`} className="hover:text-forest">
            {product.productType?.name}
          </Link>
          <span>/</span>
          <span className="text-ink">{product.name}</span>
        </div>
      </div>

      <div className="store-container py-6 pb-28 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left column - Images */}
          <div className="lg:col-span-3">
            <ImageGallery images={product.images} />
          </div>

          {/* Right column - Details */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <PriceTierBadge tier={product.priceTier?.slug || ''} />
              <span className="text-xs text-ink-secondary font-sans bg-warm px-2 py-1 rounded-full">
                {product.productType?.name}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl text-ink mb-4">{product.name}</h1>

            <p className="text-2xl sm:text-3xl font-bold text-forest font-sans mb-1">
              {formatPrice(product.price)} RWF
            </p>
            <p className="text-xs text-ink-secondary font-sans mb-4">
              Final price may vary. Negotiation welcome on site.
            </p>

            <div className="flex items-center gap-2 mb-6">
              <ProductActions productId={product.id} />
              <span className="text-sm font-sans text-ink-secondary">Save to favorites</span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              {product.availability === 'IN_STOCK' ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2.5 py-1 rounded-full font-sans font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  In Stock — available immediately
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-dark bg-amber-light px-2.5 py-1 rounded-full font-sans font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                  Made to Order
                </span>
              )}
              {product.estimatedDays && (
                <span className="text-xs text-ink-secondary font-sans">
                  Ready in approximately {product.estimatedDays} days
                </span>
              )}
            </div>

            <hr className="border-border mb-6" />

            {/* Description */}
            <h2 className="font-serif text-lg text-ink mb-2">About this piece</h2>
            <p className="text-ink-secondary text-sm font-sans leading-relaxed mb-6 whitespace-pre-line">
              {product.description}
            </p>

            {/* Details table */}
            <div className="space-y-2 mb-6">
              {product.material && (
                <div className="flex justify-between text-sm font-sans py-2 border-b border-border/50">
                  <span className="text-ink-secondary">Material</span>
                  <span className="text-ink font-medium">{product.material}</span>
                </div>
              )}
              {product.dimensions && (
                <div className="flex justify-between text-sm font-sans py-2 border-b border-border/50">
                  <span className="text-ink-secondary">Dimensions</span>
                  <span className="text-ink font-medium">{product.dimensions}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-sans py-2 border-b border-border/50">
                <span className="text-ink-secondary">Availability</span>
                <span className="text-ink font-medium">
                  {product.availability === 'IN_STOCK' ? 'In Stock' : 'Made to Order'}
                </span>
              </div>
              {product.estimatedDays && (
                <div className="flex justify-between text-sm font-sans py-2 border-b border-border/50">
                  <span className="text-ink-secondary">Estimated delivery</span>
                  <span className="text-ink font-medium">{product.estimatedDays} days</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-sans py-2">
                <span className="text-ink-secondary">Custom orders</span>
                <span className="text-ink font-medium">{product.allowCustomNotes ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <hr className="border-border mb-6" />

            {/* Order section */}
            <div>
              <h2 className="font-serif text-lg text-ink mb-4">Order this piece</h2>
              <OrderFormSection product={product} />
            </div>

            <hr className="border-border my-6" />

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="text-ink-secondary">
                <span className="text-lg">🔨</span>
                <p className="text-xs font-sans mt-1">Handcrafted with care</p>
              </div>
              <div className="text-ink-secondary">
                <span className="text-lg">📱</span>
                <p className="text-xs font-sans mt-1">WhatsApp updates</p>
              </div>
              <div className="text-ink-secondary">
                <span className="text-lg">🚚</span>
                <p className="text-xs font-sans mt-1">Pickup or delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar products */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl text-ink mb-6">You might also like</h2>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {similarProducts.map((p) => (
                <div key={p.id} className="flex-shrink-0 w-56 sm:w-72">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky order bar - mobile only */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 flex items-center justify-between md:hidden z-50">
        <div>
          <p className="text-xs text-ink-secondary font-sans">Total</p>
          <p className="text-lg font-bold text-ink font-sans">{formatPrice(product.price)} RWF</p>
        </div>
        <Link href={`/order/${product.slug}`}>
          <StoreButton variant="primary">Order Now</StoreButton>
        </Link>
      </div>
    </>
  );
}
