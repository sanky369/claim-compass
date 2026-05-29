export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 shadow-sm shadow-brand-900/20">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4 text-white"
          aria-hidden
        >
          <path
            d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <span className="text-base font-semibold tracking-tight text-stone-900">
        ClaimCompass
      </span>
    </div>
  );
}
