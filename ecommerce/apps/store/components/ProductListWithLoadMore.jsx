'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import StoreButton from './StoreButton';

export default function ProductListWithLoadMore({ initialProducts, slug, apiEndpoint, tierSlug = '', typeSlug = '', sort = 'newest', totalPages }) {
    const [products, setProducts] = useState(initialProducts);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(totalPages > 1);

    const loadMore = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page + 1),
                sort,
            });

            if (tierSlug) params.append('tier', tierSlug);
            if (typeSlug) params.append('type', typeSlug);

            const response = await fetch(`/api/products/${apiEndpoint}/${slug}?${params.toString()}`);
            const data = await response.json();

            if (response.ok && data.products) {
                setProducts([...products, ...data.products]);
                setPage(page + 1);
                setHasMore(data.hasMore);
            }
        } catch (error) {
            console.error('Error loading more products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 mt-4">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center mt-10">
                    <StoreButton
                        variant="secondary"
                        size="lg"
                        onClick={loadMore}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                Loading...
                            </span>
                        ) : (
                            'Load More'
                        )}
                    </StoreButton>
                </div>
            )}
        </>
    );
}
