const ehrs = [
  "SimplePractice",
  "TherapyNotes",
  "Tebra",
  "Sessions",
  "Jane",
  "Headway",
  "Alma",
  "Office Ally",
];

export function LogoStrip() {
  return (
    <section className="border-y border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
          Works alongside your existing EHR & clearinghouse
        </p>
        <div className="mt-6 overflow-hidden">
          <div className="flex animate-ticker gap-12 whitespace-nowrap">
            {[...ehrs, ...ehrs, ...ehrs].map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-stone-400"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <path d="M3 9h18M9 4v16" />
                </svg>
                <span className="font-serif text-xl text-stone-600">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
