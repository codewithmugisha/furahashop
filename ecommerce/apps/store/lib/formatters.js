export function formatPrice(price) {
  if (!price && price !== 0) return '—'
  return new Intl.NumberFormat('en-RW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}
