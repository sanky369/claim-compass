const buckets = [
  {
    label: "Fix & resubmit",
    color: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    desc: "Wrong CPT, modifier, diagnosis, POS, NPI, taxonomy, or payer ID.",
  },
  {
    label: "Corrected claim",
    color: "bg-sky-100 text-sky-800 ring-sky-200",
    desc: "Claim was processed but needs a replacement, not an appeal.",
  },
  {
    label: "Payer follow-up",
    color: "bg-indigo-100 text-indigo-800 ring-indigo-200",
    desc: "Claim stuck, pending, COB, provider-not-found, enrollment mismatch.",
  },
  {
    label: "Credentialing fix",
    color: "bg-amber-100 text-amber-800 ring-amber-200",
    desc: "CAQH, panel effective date, tax ID, specialty, group vs individual.",
  },
  {
    label: "True appeal",
    color: "bg-violet-100 text-violet-800 ring-violet-200",
    desc: "Medical necessity, timely-filing exception, retro-auth dispute.",
  },
  {
    label: "Bill the client",
    color: "bg-rose-100 text-rose-800 ring-rose-200",
    desc: "Deductible, coinsurance, inactive coverage, wrong insurance, COB.",
  },
];

export function Differentiation() {
  return (
    <section className="relative overflow-hidden bg-stone-900 py-24 text-stone-100 sm:py-32">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(56,160,250,0.5), transparent 40%), radial-gradient(circle at 80% 80%, rgba(245,158,11,0.3), transparent 40%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
            Triage, not just appeals
          </p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight text-white sm:text-5xl">
            Six buckets. One clear next step.
          </h2>
          <p className="mt-5 text-lg text-stone-300">
            Most denials don&apos;t need a polished appeal letter. They need
            triage. ClaimCompass classifies every denial into one of six
            therapist-specific buckets — then tells you exactly what to do.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buckets.map((b, i) => (
            <div
              key={b.label}
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${b.color}`}
                >
                  Bucket {i + 1}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 text-stone-500 transition-transform group-hover:translate-x-1 group-hover:text-stone-300"
                >
                  <path
                    d="M5 12h14m0 0-5-5m5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="mt-4 font-serif text-2xl text-white">{b.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">
                {b.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="font-serif text-xl italic text-stone-300">
            From <span className="text-white">confusion</span> → clarity →
            action → <span className="text-brand-300">payment.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
