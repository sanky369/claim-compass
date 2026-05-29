const quotes = [
  {
    q: "I stopped reading every BCBS denial as a personal failure. ClaimCompass tells me in 30 seconds whether it's an appeal, a corrected claim, or a CAQH problem.",
    name: "Maya R.",
    role: "LMFT · Solo practice, Austin",
  },
  {
    q: "I almost wrote off $1,800 in 90837 denials. The triage flagged them as POS/modifier fixes — same-day corrected claims, paid within two weeks.",
    name: "Jordan K.",
    role: "LCSW · 3-clinician group, Portland",
  },
  {
    q: "The credentialing health score caught a CAQH attestation I'd missed. That alone is worth the subscription — would've cost me a quarter of claims.",
    name: "Dr. Priya N.",
    role: "PsyD · Outpatient practice, NJ",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            What therapists are saying
          </p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">
            Less hold music. More paid claims.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {quotes.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-7 shadow-sm"
            >
              <svg
                viewBox="0 0 32 32"
                fill="currentColor"
                className="h-7 w-7 text-brand-200"
                aria-hidden
              >
                <path d="M9.4 24H4l3.4-8H4V8h8v8l-2.6 8Zm14 0H18l3.4-8H18V8h8v8l-2.6 8Z" />
              </svg>
              <blockquote className="mt-4 font-serif text-lg leading-snug text-stone-800">
                &ldquo;{t.q}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-stone-100 pt-5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-amber-100 font-serif text-stone-700">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-stone-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
