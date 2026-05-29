export function DenialDecoder() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Paste it in. Get answers.
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">
              The Denial Decoder reads what payers actually mean.
            </h2>
            <p className="mt-5 text-lg text-stone-600">
              Upload an EOB, ERA, paste a denial code, or screenshot a
              clearinghouse rejection. ClaimCompass translates payer-ese into
              plain language, identifies the bucket, and writes the next step
              in your voice.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Reads CO/PR/OA/PI ANSI reason codes + remark codes",
                "Decodes payer-specific reject reasons (BCBS, UHC, Aetna, Cigna)",
                "Knows behavioral health CPTs: 90791, 90832/34/37, 90846/47",
                "Catches telehealth modifier & POS errors automatically",
                "Surfaces credentialing root causes before you appeal",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-3 text-stone-700"
                >
                  <svg
                    viewBox="0 0 20 20"
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
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
          </div>

          {/* Decoder UI mock */}
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-brand-100 via-stone-50 to-amber-100 blur-2xl opacity-60" />
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
              <div className="border-b border-stone-200 bg-stone-50 px-5 py-3 text-xs font-medium text-stone-500">
                Denial Decoder
              </div>
              <div className="p-5">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Paste denial text
                </label>
                <div className="mt-2 rounded-lg border border-stone-200 bg-stone-50 p-3 font-mono text-xs leading-relaxed text-stone-700">
                  <span className="text-rose-600">CO-45</span> Charge exceeds
                  fee schedule/maximum allowable. <br />
                  <span className="text-rose-600">N179</span> Additional
                  information required. <br />
                  Remark: Modifier inconsistent with POS for distant-site
                  telehealth.
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    Auto-detected payer: <b>BCBS TX</b>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Decoded
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Plain English
                  </p>
                  <p className="mt-1.5 text-sm text-stone-900">
                    Your 90837 telehealth claim was denied because the POS code
                    (10 — patient&apos;s home) requires modifier <b>95</b>, but
                    your claim was missing it.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button className="rounded-full bg-stone-900 px-3 py-2 text-xs font-medium text-white">
                    Generate fix
                  </button>
                  <button className="rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700">
                    Add to rules
                  </button>
                  <button className="rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700">
                    Payer script
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
