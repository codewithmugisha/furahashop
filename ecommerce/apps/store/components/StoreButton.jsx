export default function StoreButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-forest-500 text-white hover:bg-forest-600 shadow-sm hover:shadow-md active:scale-[0.98] border border-forest-600',
    secondary: 'bg-white text-forest-600 hover:bg-forest-50 shadow-sm hover:shadow-md active:scale-[0.98] border border-border',
    outline: 'border-2 border-forest-500 text-forest-600 hover:bg-forest-500 hover:text-white active:scale-[0.98] bg-white',
    ghost: 'text-ink hover:bg-forest-50 active:bg-forest-100',
    danger: 'bg-danger-500 text-white hover:bg-danger-600 shadow-sm hover:shadow-md active:scale-[0.98] border border-danger-600',
    success: 'bg-success-500 text-white hover:bg-success-600 shadow-sm hover:shadow-md active:scale-[0.98] border border-success-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`font-sans font-medium rounded-lg transition-all duration-200 ease-out inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
  
