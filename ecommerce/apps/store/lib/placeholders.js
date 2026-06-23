export const typePlaceholders = {
  beds: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
  sofas: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
  cupboards: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  chairs: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800',
  tables: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800',
  default: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
}

export function getProductImage(product) {
  const primary = product.images?.find(img => img.isPrimary)
  if (primary) return primary.imageUrl

  const first = product.images?.[0]
  if (first) return first.imageUrl

  const typeSlug = product.productType?.slug
  return typePlaceholders[typeSlug] || typePlaceholders.default
}
