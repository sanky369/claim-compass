const features = [
  {
    title: "Denial Decoder",
    desc: "Upload an EOB, ERA, or denial. Get plain-language explanation in seconds.",
    icon: (
      <path d="M11 4a7 7 0 1 0 4.546 12.32l4.317 4.317a1 1 0 0 0 1.414-1.414l-4.317-4.317A7 7 0 0 0 11 4Zm-5 7a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z" />
    ),
  },
  {
    title: "Next-Best-Action Triage",
    desc: "Resubmit, correct, appeal, call, fix credentialing, or bill the client.",
    icon: (
      <path d="M12 2 2 7l10 5 10-5-10-5Zm0 11.18L4.21 9.32 2 10.5l10 5 10-5-2.21-1.18L12 13.18ZM2 14.5l10 5 10-5-2.21-1.18L12 17.18l-7.79-3.86L2 14.5Z" />
    ),
  },
  {
    title: "Credentialing Health Monitor",
    desc: "CAQH, license, panel, NPI, taxonomy — green/yellow/red status at a glance.",
    icon: (
      <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm-1 14-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6Z" />
    ),
  },
  {
    title: "Payer Call Scripts",
    desc: "Know exactly what to ask, which reference number to record, what to screenshot.",
    icon: (
      <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2a15.05 15.05 0 0 1-6.59-6.58l2.2-2.21c.28-.27.36-.66.25-1.01A11.36 11.36 0 0 1 8.5 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1c0 9.39 7.61 17 17 17a1 1 0 0 0 1-1v-3.5a1 1 0 0 0-1-1Z" />
    ),
  },
  {
    title: "Appeal Generator",
    desc: "Behavioral-health-specific language, payer-tuned, with the right attachments listed.",
    icon: (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 7V3.5L19.5 9H14Z" />
    ),
  },
  {
    title: "Repeat-Denial Prevention",
    desc: "Every denial becomes a billing rule — so the same mistake never happens twice.",
    icon: (
      <path d="M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.74 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35Z" />
    ),
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="border-y border-stone-200 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            One copilot. Six superpowers.
          </p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">
            Not just appeals. The full insurance revenue workflow.
          </h2>
          <p className="mt-5 text-lg text-stone-600">
            Before a denial. During a denial. After a denial. ClaimCompass
            covers the entire arc so you spend less time playing detective and
            more time with clients.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-stone-200 bg-stone-50/50 p-6 transition-all hover:border-brand-300 hover:bg-white hover:shadow-lg hover:shadow-brand-900/5"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-900/20">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  {f.icon}
                </svg>
              </div>
              <h3 className="mt-5 text-base font-semibold text-stone-900">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
