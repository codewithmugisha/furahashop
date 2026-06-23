'use client';

export default function CategoryPill({ name, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-sans font-medium transition-all duration-200 min-h-[40px] ${
        isActive
          ? 'bg-forest text-white shadow-sm'
          : 'bg-white text-ink border border-border hover:bg-forest-light hover:border-forest-mid'
      }`}
    >
      {name}
    </button>
  );
}
