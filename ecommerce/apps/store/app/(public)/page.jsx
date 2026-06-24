import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import WhatsAppButton from '@/components/WhatsAppButton';
import StoreButton from '@/components/StoreButton';
import ClientRecommendedRow from '@/components/ClientRecommendedRow';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }], take: 1 },
      productType: { select: { id: true, name: true, slug: true } },
      priceTier: { select: { id: true, name: true, slug: true } },
    },
    take: 6,
    orderBy: { createdAt: 'desc' },
  });
}

async function getProductTypes() {
  return prisma.productType.findMany({
    where: { isActive: true },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
    orderBy: { order: 'asc' },
  });
}

export default async function HomePage() {
  const [featuredProducts, productTypes] = await Promise.all([
    getFeaturedProducts(),
    getProductTypes(),
  ]);

  return (
    <>
      <WhatsAppButton />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&q=80"
            alt="Handcrafted furniture"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="relative z-20 max-w-4xl mx-auto px-6 text-center">
          <p className="text-amber-400 text-sm font-sans font-semibold mb-4">🇷🇼 Handcrafted in Rwanda</p>
          <h1 className="font-serif text-5xl md:text-7xl text-white leading-tight mb-6">
            Furniture Built to<br />Last a Lifetime
          </h1>
          <p className="text-white/90 text-lg font-sans max-w-2xl mx-auto mb-10">
            Browse our collection of handcrafted beds, sofas, cupboards, and more.<br />Made to order. Built for your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#products">
              <StoreButton variant="primary" size="lg">Browse Collection</StoreButton>
            </Link>
            <Link href="#how-it-works">
              <StoreButton variant="secondary" size="lg">How to Order</StoreButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Personalized recommendations for logged-in users */}
      <ClientRecommendedRow />

      {/* Section 2 - Browse by Type */}
      <section className="py-16 sm:py-24 store-container" id="products">
        <h2 className="font-serif text-2xl sm:text-4xl text-ink mb-10">What are you looking for?</h2>
        <div className="flex gap-4 overflow-x-auto lg:grid lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 pb-4 lg:pb-0 scrollbar-hide">
          {productTypes.map((type) => (
            <Link
              key={type.id}
              href={`/type/${type.slug}`}
              className="group flex-shrink-0 w-40 lg:w-full"
            >
              <div className="aspect-square rounded-2xl overflow-hidden bg-warm mb-3 relative">
                {type.imageUrl ? (
                  <Image src={type.imageUrl} alt={type.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="160px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-light">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="font-serif text-lg text-ink group-hover:text-forest-mid transition-colors">{type.name}</h3>
              <p className="text-ink-secondary text-sm font-sans">{type._count.products} products</p>
            </Link>
          ))}
        </div>
      </section >

      {/* Section 3 - Browse by Budget */}
      < section className="py-16 sm:py-24 bg-warm" >
        <div className="store-container">
          <h2 className="font-serif text-2xl sm:text-4xl text-ink mb-10">Find your perfect match</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link href="/tier/low-price" className="group bg-amber-light/50 rounded-3xl p-8 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center mb-4 text-amber">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-ink mb-2">Low Price</h3>
              <p className="text-ink-secondary text-sm font-sans mb-4">Quality furniture at accessible prices</p>
              <span className="text-amber font-sans font-medium text-sm group-hover:underline">Browse &rarr;</span>
            </Link>

            <Link href="/tier/medium-price" className="group bg-forest-light rounded-3xl p-8 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-forest/10 flex items-center justify-center mb-4 text-forest">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-ink mb-2">Medium Price</h3>
              <p className="text-ink-secondary text-sm font-sans mb-4">Premium craftsmanship at fair value</p>
              <span className="text-forest font-sans font-medium text-sm group-hover:underline">Browse &rarr;</span>
            </Link>

            <Link href="/tier/master" className="group bg-forest text-white rounded-3xl p-8 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 text-amber">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-white mb-2">Master &nbsp;</h3>
              <p className="text-white/70 text-sm font-sans mb-4">Exceptional pieces for discerning homes</p>
              <span className="text-amber font-sans font-medium text-sm group-hover:underline">Browse &rarr;</span>
            </Link>
          </div>
        </div>
      </section >

      {/* Section 4 - Featured Products */}
      {
        featuredProducts.length > 0 && (
          <section className="py-16 sm:py-24 store-container">
            <div className="text-center mb-12">
              <h2 className="font-serif text-2xl sm:text-4xl text-ink mb-3">Our best work</h2>
              <p className="text-ink-secondary font-sans">Handpicked pieces our clients love most</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/products" className="text-forest font-sans font-medium hover:underline text-sm">
                View all products &rarr;
              </Link>
            </div>
          </section>
        )
      }

      {/* Section 5 - How It Works */}
      <section className="py-16 sm:py-24 bg-warm" id="how-it-works">
        <div className="store-container">
          <h2 className="font-serif text-2xl sm:text-4xl text-ink text-center mb-14">Simple as 1, 2, 3</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-forest-light flex items-center justify-center mx-auto mb-4 text-forest">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-lg text-ink mb-2">Browse &amp; Choose</h3>
              <p className="text-ink-secondary text-sm font-sans">Explore our catalogue and find the piece you love.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-forest-light flex items-center justify-center mx-auto mb-4 text-forest">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-serif text-lg text-ink mb-2">Place Your Order</h3>
              <p className="text-ink-secondary text-sm font-sans">Fill in your details and submit. No account needed.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-forest-light flex items-center justify-center mx-auto mb-4 text-forest">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
              <h3 className="font-serif text-lg text-ink mb-2">We Build &amp; Deliver</h3>
              <p className="text-ink-secondary text-sm font-sans">We craft your piece and notify you via WhatsApp when ready.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 - Testimonials */}
      <section className="py-16 sm:py-24 store-container">
        <h2 className="font-serif text-2xl sm:text-4xl text-ink text-center mb-12">What our clients say</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { quote: 'The quality of the bed frame exceeded my expectations. Solid mahogany, beautiful finish. Highly recommend!', name: 'Patrick Mugabo', product: 'Custom Bed Frame', rating: 5 },
            { quote: 'We ordered a full living room set and it transformed our space. The team was communicative every step of the way.', name: 'Diane Uwimana', product: 'Living Room Set', rating: 5 },
            { quote: 'I was nervous about ordering furniture online but the WhatsApp updates made it stress-free. Will order again.', name: 'Eric Nshimiye', product: 'Office Desk', rating: 5 },
          ].map((t, i) => (
            <div key={i} className="bg-warm rounded-3xl p-6 sm:p-8 relative">
              <div className="text-amber text-5xl font-serif leading-none mb-4">&ldquo;</div>
              <p className="text-ink font-sans text-sm leading-relaxed mb-4">{t.quote}</p>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-amber" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-ink font-sans font-medium text-sm">{t.name}</p>
              <p className="text-ink-secondary text-xs font-sans">{t.product}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
