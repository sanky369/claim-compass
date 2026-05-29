const stages = [
  {
    n: "01",
    title: "Credentialing & paneling",
    text: "CAQH, NPI, taxonomy, panel effective dates.",
  },
  {
    n: "02",
    title: "Eligibility & benefits",
    text: "Wrong plan, deductibles, inactive coverage, COB.",
  },
  {
    n: "03",
    title: "Claim submission",
    text: "CPT, diagnosis, POS, modifiers, billing mismatch.",
  },
  {
    n: "04",
    title: "Denials & rejections",
    text: "Unclear denial codes, inconsistent payer responses.",
  },
  {
    n: "05",
    title: "Appeals & follow-up",
    text: "Phone calls, portal follow-up, appeal letters.",
  },
  {
    n: "06",
    title: "Cash flow risk",
    text: "Unpaid claims, aging AR, clawbacks, therapist anxiety.",
  },
];

const quotes = [
  "Why was this claim denied?",
  "Everything looked correct.",
  "I don't have time to sit on hold.",
  "Am I even credentialed correctly?",
  "I'm scared I won't get paid.",
  "I wish I hadn't learned this the hard way.",
];

export function ProblemSection() {
  return (
    <section id="problem" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            The therapist insurance revenue maze
          </p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">
            Therapists don&apos;t need more admin chaos —
            <br className="hidden sm:block" />
            they need clarity on what to do next.
          </h2>
          <p className="mt-5 text-lg text-stone-600">
            A denial isn&apos;t always an appeal. It might be a corrected claim,
            a missing modifier, a CAQH lapse, a COB issue, or a credentialing
            gap. Six places to lose money — and one can loop back to any other.
          </p>
        </div>

        {/* Process map */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {stages.map((s, i) => (
            <div
              key={s.n}
              className="group relative rounded-2xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className="font-serif text-lg text-stone-400">{s.n}</span>
                {i < stages.length - 1 && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="hidden h-5 w-5 text-stone-300 lg:block"
                  >
                    <path
                      d="M5 12h14m0 0-5-5m5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-stone-900">
                {s.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                {s.text}
              </p>
            </div>
          ))}
        </div>

        {/* Voices */}
        <div className="mt-16 rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-50 to-amber-50/40 p-8 sm:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                What therapists actually say
              </p>
              <h3 className="mt-3 font-serif text-3xl tracking-tight text-stone-900 sm:text-4xl">
                The quiet stress of a denied claim isn&apos;t about clinical
                work — it&apos;s about not knowing the rules.
              </h3>
              <p className="mt-4 text-stone-600">
                We listened on therapist forums, in private practice
                communities, and to billers who left agency life. The same six
                sentences come up over and over.
              </p>
            </div>
            <ul className="space-y-3">
              {quotes.map((q, i) => (
                <li
                  key={q}
                  className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
                >
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stone-100 text-[11px] font-semibold text-stone-600">
                    {i + 1}
                  </span>
                  <p className="font-serif text-lg italic text-stone-700">
                    &ldquo;{q}&rdquo;
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
