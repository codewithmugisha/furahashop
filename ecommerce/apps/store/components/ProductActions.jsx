'use client'

import LikeButton from '@/components/LikeButton'
import useProductView from '@/hooks/useProductView'

export default function ProductActions({ productId }) {
  useProductView(productId)

  return <LikeButton productId={productId} />
}
