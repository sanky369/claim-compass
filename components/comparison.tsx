type Row = { label: string; cc: boolean | string; others: (boolean | string)[] };

const headers = ["ClaimCompass", "AppealGenius", "Blueprint", "Anomaly", "Authsnap"];

const rows: Row[] = [
  { label: "Denial triage across 6 buckets", cc: true, others: [false, false, false, false] },
  { label: "EHR-agnostic (no migration)", cc: true, others: [true, false, true, true] },
  { label: "Credentialing health monitor", cc: true, others: [false, false, false, false] },
  { label: "Behavioral-health-specific", cc: true, others: ["partial", true, false, false] },
  { label: "Built for solo / small group pricing", cc: true, others: [false, true, false, false] },
  { label: "Repeat-denial prevention loop", cc: true, others: [false, false, "partial", "partial"] },
  { label: "Appeal generator", cc: true, others: [true, true, false, true] },
  { label: "Predictive denial scoring", cc: "roadmap", others: [false, false, true, false] },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true)
    return (
      <span className="inline-flex items-center justify-center">
        <svg
          viewBox="0 0 20 20"
          className="h-5 w-5 text-emerald-600"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.704 5.296a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.296-7.29a1 1 0 0 1 1.408 0Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  if (v === false)
    return (
      <span className="inline-block h-1 w-3 rounded bg-stone-300 align-middle" />
    );
  return (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
      {v}
    </span>
  );
}

export function Comparison() {
  return (
    <section className="border-y border-stone-200 bg-stone-100/60 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Why therapists choose ClaimCompass
          </p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">
            Appeals tools fix appeals. We fix the whole revenue arc.
          </h2>
          <p className="mt-5 text-lg text-stone-600">
            Most tools cover only one slice of the workflow. ClaimCompass owns
            triage, credentialing health, and prevention — not just letters.
          </p>
        </div>

        <div className="mt-12 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Capability
                </th>
                {headers.map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                      i === 0 ? "bg-brand-50 text-brand-800" : "text-stone-500"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr
                  key={r.label}
                  className={ri % 2 === 0 ? "bg-white" : "bg-stone-50/40"}
                >
                  <td className="px-5 py-4 font-medium text-stone-800">
                    {r.label}
                  </td>
                  <td className="bg-brand-50/40 px-5 py-4 text-center">
                    <Cell v={r.cc} />
                  </td>
                  {r.others.map((v, i) => (
                    <td key={i} className="px-5 py-4 text-center">
                      <Cell v={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-xs text-stone-500">
          Based on each competitor&apos;s publicly stated positioning. We
          respect them all — they solve real problems for different segments.
        </p>
      </div>
    </section>
  );
}
