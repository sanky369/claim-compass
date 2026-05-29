export function CTASection() {
  return (
    <section id="cta" className="relative overflow-hidden py-24 sm:py-32">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(800px 400px at 50% 0%, rgba(15,132,235,0.25), transparent), linear-gradient(180deg, #0c1018 0%, #0c1018 100%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 opacity-20" aria-hidden>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            <pattern
              id="grid"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 6 0 L 0 0 0 6"
                fill="none"
                stroke="white"
                strokeWidth="0.15"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="font-serif text-4xl tracking-tight text-white sm:text-6xl">
          Stop guessing what to do with denied therapy claims.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-stone-300">
          Decode your first denial in under a minute. No credit card. No EHR
          migration. No enterprise RCM contracts.
        </p>

        <form className="mx-auto mt-9 flex max-w-md flex-col gap-2 sm:flex-row">
          <label htmlFor="email" className="sr-only">
            Work email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@yourpractice.com"
            className="h-12 flex-1 rounded-full border border-white/10 bg-white/5 px-5 text-sm text-white placeholder:text-stone-500 outline-none ring-0 focus:border-brand-400 focus:bg-white/10"
          />
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-stone-900 transition-colors hover:bg-stone-100"
          >
            Decode my denial
          </button>
        </form>
        <p className="mt-4 text-xs text-stone-400">
          14-day free trial · HIPAA-compliant · BAA available
        </p>

        <div className="mt-12 grid grid-cols-2 gap-6 border-t border-white/10 pt-10 text-left sm:grid-cols-4">
          {[
            ["6", "denial buckets"],
            ["< 30s", "to first answer"],
            ["97%", "decode confidence"],
            ["$0", "to try it"],
          ].map(([num, label]) => (
            <div key={label}>
              <p className="font-serif text-3xl text-white">{num}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-stone-400">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
