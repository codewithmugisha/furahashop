export default function PriceTierBadge({ tier, size = 'sm' }) {
  const styles = {
    'low-price': 'bg-amber-light text-amber-dark',
    'medium-price': 'bg-forest-light text-forest',
    'master': 'bg-forest text-white',
  };

  const labels = {
    'low-price': 'Low Price',
    'medium-price': 'Medium Price',
    'master': 'Master \u2726',
  };

  const sizeClasses = size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-block font-sans font-medium rounded-full ${styles[tier] || styles['low-price']} ${sizeClasses}`}>
      {labels[tier] || tier}
    </span>
  );
}
