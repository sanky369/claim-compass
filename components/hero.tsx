import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-radial" aria-hidden />
      <div className="absolute inset-0 grain opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 pulse-dot" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Built for solo & small-group therapists
          </div>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-stone-900 sm:text-6xl md:text-7xl">
            Denied therapy claim?{" "}
            <span className="text-brand-700">Know exactly what to do next.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-600 sm:text-xl">
            Upload a denial, EOB, or claim rejection and get therapist-specific
            next steps:{" "}
            <span className="text-stone-900">resubmit, correct, appeal,
            call the payer, fix credentialing, or bill the client</span> —
            without switching EHRs or hiring a full billing team.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signin?next=/demo/denials/new"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-stone-900 px-7 text-sm font-semibold text-white shadow-lg shadow-stone-900/10 transition-all hover:bg-stone-800 hover:shadow-xl hover:shadow-stone-900/20"
            >
              Decode my first denial — free
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              >
                <path
                  d="M5 12h14m0 0-5-5m5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-stone-500">
            No credit card. Works with SimplePractice, TherapyNotes, Tebra,
            Sessions, Jane & more.
          </p>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="pointer-events-none absolute -inset-x-8 -top-8 -bottom-8 rounded-[2rem] bg-gradient-to-b from-brand-100/40 via-transparent to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/10 ring-1 ring-stone-900/5">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="rounded-md border border-stone-200 bg-white px-3 py-1 text-xs text-stone-500">
            app.claimcompass.com / denials / #C0-45-BCBS
          </div>
          <div className="text-xs text-stone-400">v1.0</div>
        </div>
        {/* App content */}
        <div className="grid grid-cols-12 gap-0">
          {/* Sidebar */}
          <aside className="col-span-3 hidden border-r border-stone-200 bg-stone-50/50 p-4 md:block">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Command center
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {[
                ["Inbox", "12", true],
                ["Open denials", "18", false],
                ["At-risk AR", "$3,270", false],
                ["Credentialing", "2", false],
                ["Resolved", "94", false],
              ].map(([label, count, active]) => (
                <li key={label as string}>
                  <div
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 ${
                      active
                        ? "bg-white text-stone-900 shadow-sm ring-1 ring-stone-200"
                        : "text-stone-600"
                    }`}
                  >
                    <span>{label}</span>
                    <span className="text-xs text-stone-400">{count}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 px-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Payers
            </p>
            <ul className="mt-2 space-y-1 px-2 text-xs text-stone-500">
              <li>Blue Cross Blue Shield</li>
              <li>Aetna</li>
              <li>UnitedHealthcare</li>
              <li>Cigna</li>
            </ul>
          </aside>
          {/* Main panel */}
          <div className="col-span-12 p-6 md:col-span-9">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-700 ring-1 ring-rose-200">
                    Denied · CO-45
                  </span>
                  <span className="text-xs text-stone-400">
                    BCBS · 90837 · Telehealth
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-stone-900">
                  Claim for J. Patel · DOS 2026-05-12
                </h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-400">At risk</p>
                <p className="font-semibold text-stone-900">$184.00</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                  <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm.75 4.25a.75.75 0 0 0-1.5 0V11a.75.75 0 0 0 .22.53l2.5 2.5a.75.75 0 0 0 1.06-1.06l-2.28-2.28V6.25Z" />
                </svg>
                Next best action
              </div>
              <p className="mt-2 text-[15px] font-medium text-stone-900">
                Submit a <span className="underline decoration-brand-300">corrected claim</span> —
                not an appeal. Telehealth modifier missing on 90837.
              </p>
              <p className="mt-1 text-sm text-stone-600">
                For BCBS in TX, Place of Service <code className="rounded bg-white px-1 py-0.5 text-xs">10</code> requires
                modifier <code className="rounded bg-white px-1 py-0.5 text-xs">95</code>.
                Add modifier and resubmit via clearinghouse — typical turnaround 7–10 days.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white">
                  Generate corrected claim
                </button>
                <button className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700">
                  Save as billing rule
                </button>
                <button className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700">
                  Open payer playbook
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                ["Bucket", "Fix & resubmit"],
                ["Confidence", "97%"],
                ["Repeat in 30d", "3x"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-lg border border-stone-200 bg-white p-3"
                >
                  <p className="text-[10px] uppercase tracking-wider text-stone-400">
                    {k}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    {v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
