import Image from 'next/image'
import Link from 'next/link'
import { getProductImage } from '@/lib/placeholders'
import { formatPrice } from '@/lib/formatters'

export default function ProductCard({ product }) {
  const imageUrl = getProductImage(product)

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <div className="bg-white rounded-3xl overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg h-full flex flex-col">

        {/* IMAGE CONTAINER - Clean and Minimal */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-gradient-to-br from-warm via-gray-50 to-amber-50/30">
          {/* Product Image */}
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-all duration-700 ease-out group-hover:scale-110"
            priority={false}
          />

          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Only In Stock Badge - Small and Minimal */}
          {product.availability === 'IN_STOCK' && (
            <div className="absolute top-4 right-4 z-10">
              <span className="bg-emerald-500 text-white text-xs font-sans font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                In Stock
              </span>
            </div>
          )}

          {/* Hover CTA - Simple */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-10 p-5 hidden sm:block">
            <div className="bg-white text-forest-600 font-sans font-bold text-base rounded-xl py-3 px-5 text-center flex items-center justify-center gap-2 hover:bg-forest-500 hover:text-white transition-colors shadow-md">
              <span>View Details</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* MINIMAL INFO SECTION */}
        <div className="p-5 flex flex-col flex-1 bg-white">

          {/* Product Name - Small */}
          <h3 className="font-sans font-semibold text-gray-900 text-base leading-tight mb-2 group-hover:text-forest-600 transition-colors duration-300">
            {product.name}
          </h3>

          {/* Price - Prominent but not overwhelming */}
          <div className="flex items-baseline gap-2">
            <p className="font-sans font-bold text-gray-900 text-xl">
              {formatPrice(product.price)}
            </p>
            <span className="text-sm font-sans font-medium text-gray-500">RWF</span>
          </div>

          {/* Optional: Small delivery time indicator */}
          {product.availability === 'MADE_TO_ORDER' && product.estimatedDays && (
            <p className="text-xs font-sans text-gray-500 mt-2">
              ~{product.estimatedDays} days
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
