const steps = [
  {
    n: "1",
    title: "Upload denial, EOB, or rejection",
    desc: "Paste text, drop a PDF, or forward your clearinghouse email. No EHR migration.",
  },
  {
    n: "2",
    title: "Decode the real issue",
    desc: "Plain-English explanation of what the payer actually said — and didn't say.",
  },
  {
    n: "3",
    title: "Triage the next best action",
    desc: "One of six buckets, with confidence scoring and expected turnaround.",
  },
  {
    n: "4",
    title: "Fix or appeal correctly",
    desc: "Generate corrected claim, appeal letter, call script, or client invoice.",
  },
  {
    n: "5",
    title: "Prevent repeat denials",
    desc: "Save the pattern as a billing rule and a credentialing check.",
  },
  {
    n: "6",
    title: "Protect revenue",
    desc: "Aging AR, write-off risk, and credentialing risk on one dashboard.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-end justify-between gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              How it works
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">
              From a single denial to a defensible revenue process.
            </h2>
          </div>
          <p className="text-lg text-stone-600 lg:max-w-md">
            Designed around how solo and small-group therapists actually work —
            on the side of seeing clients, often without a full billing team.
          </p>
        </div>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-stone-200 bg-stone-200 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="group relative bg-white p-7 transition-colors hover:bg-stone-50"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-stone-900 font-serif text-base text-white">
                  {s.n}
                </span>
                <div className="h-px flex-1 bg-stone-200" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-stone-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {s.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
