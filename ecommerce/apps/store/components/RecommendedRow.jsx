import ProductCard from '@/components/ProductCard'

export default function RecommendedRow({ products }) {
  if (!products || products.length === 0) return null

  return (
    <section className="py-8 store-container">
      <h2 className="font-serif text-xl sm:text-2xl text-ink mb-6">Recommended for you</h2>
      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {products.map((product) => (
          <div key={product.id} className="flex-shrink-0 w-56 sm:w-72">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
