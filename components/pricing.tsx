const tiers = [
  {
    name: "Solo",
    price: "$29",
    cadence: "/ month",
    blurb: "For solo therapists with 1–60 claims per month.",
    cta: "Start free 14-day trial",
    features: [
      "Up to 60 claims / month",
      "Denial Decoder + triage",
      "Appeal letter generator",
      "Credentialing health for 1 NPI",
      "Email support",
    ],
    highlight: false,
  },
  {
    name: "Practice",
    price: "$79",
    cadence: "/ month",
    blurb: "For growing practices that bill independently.",
    cta: "Start free 14-day trial",
    features: [
      "Up to 250 claims / month",
      "Everything in Solo",
      "Payer call scripts library",
      "Credentialing for up to 3 NPIs",
      "Repeat-denial billing rules",
      "Priority email + chat",
    ],
    highlight: true,
  },
  {
    name: "Group",
    price: "$149",
    cadence: "/ month",
    blurb: "Small group practices, supervisors, billers.",
    cta: "Book a 20-min walkthrough",
    features: [
      "Up to 800 claims / month",
      "Everything in Practice",
      "Up to 10 NPIs + group setup",
      "Aging AR + write-off risk dashboard",
      "Multi-user roles",
      "Phone support",
    ],
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="border-y border-stone-200 bg-white py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Pricing built for independent practices
          </p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">
            Solo-therapist pricing. Enterprise-grade thinking.
          </h2>
          <p className="mt-5 text-lg text-stone-600">
            No $2,500 setup fees. No $1,000/month minimums. No annual lock-in
            on the Solo plan. Cancel any time.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                t.highlight
                  ? "border-stone-900 bg-stone-900 text-stone-100 shadow-xl"
                  : "border-stone-200 bg-stone-50/40 text-stone-900"
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-amber-400 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-stone-900">
                  Most popular
                </span>
              )}
              <h3 className="font-serif text-2xl">{t.name}</h3>
              <p
                className={`mt-1 text-sm ${
                  t.highlight ? "text-stone-300" : "text-stone-500"
                }`}
              >
                {t.blurb}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-serif text-5xl">{t.price}</span>
                <span
                  className={`text-sm ${
                    t.highlight ? "text-stone-400" : "text-stone-500"
                  }`}
                >
                  {t.cadence}
                </span>
              </div>
              <ul
                className={`mt-6 space-y-2.5 text-sm ${
                  t.highlight ? "text-stone-200" : "text-stone-700"
                }`}
              >
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <svg
                      viewBox="0 0 20 20"
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        t.highlight ? "text-amber-300" : "text-emerald-600"
                      }`}
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.296a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.296-7.29a1 1 0 0 1 1.408 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#cta"
                className={`mt-8 inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  t.highlight
                    ? "bg-white text-stone-900 hover:bg-stone-100"
                    : "bg-stone-900 text-white hover:bg-stone-800"
                }`}
              >
                {t.cta}
              </a>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-stone-500">
          Need higher volume or supervisory rollups?{" "}
          <a href="#cta" className="font-semibold text-stone-900 underline">
            Talk to us
          </a>{" "}
          about a custom plan.
        </p>
      </div>
    </section>
  );
}
