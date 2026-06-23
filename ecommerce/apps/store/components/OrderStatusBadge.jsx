const statusStyles = {
  PENDING: 'bg-amber-light text-amber-dark',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-forest-light text-forest',
  READY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-danger',
};

const statusLabels = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  READY: 'Ready',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-sans font-medium rounded-full ${statusStyles[status] || ''}`}>
      {statusLabels[status] || status}
    </span>
  );
}
