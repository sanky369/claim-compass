const faqs = [
  {
    q: "Do I have to switch EHRs to use ClaimCompass?",
    a: "No. ClaimCompass is EHR-agnostic. Keep using SimplePractice, TherapyNotes, Tebra, Sessions, Jane, Office Ally, or anything else. Just upload a denial, EOB, ERA, or clearinghouse rejection and we take it from there.",
  },
  {
    q: "Is this HIPAA-compliant?",
    a: "Yes. We sign BAAs with all paid plans, encrypt data in transit and at rest, and minimize PHI processing. You can also redact patient identifiers before uploading — the triage still works on the codes and payer logic.",
  },
  {
    q: "How is this different from AppealGenius or Authsnap?",
    a: "Those tools are appeal-focused. We start one step earlier — most behavioral health denials aren't appeals, they're corrected claims, modifier fixes, credentialing problems, or eligibility issues. We tell you which one before you waste an appeal.",
  },
  {
    q: "Will this replace my biller?",
    a: "No. ClaimCompass is the copilot a solo therapist or small group uses when they don't have a full RCM team — or the second pair of eyes a biller uses to catch repeat patterns and credentialing risk before they snowball.",
  },
  {
    q: "What payers do you support?",
    a: "All major commercial payers (BCBS, UHC, Aetna, Cigna, Humana), Medicare, Medicaid (state-specific rules included), Tricare, and most regional behavioral health carve-outs. Payer playbooks are updated weekly.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. 14 days free on every plan. No credit card required. You can decode your first denial without even signing up.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Frequently asked
          </p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">
            The questions therapists ask first.
          </h2>
        </div>

        <div className="mt-12 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                <span className="text-base font-semibold text-stone-900">
                  {f.q}
                </span>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-stone-200 text-stone-500 transition-transform group-open:rotate-45">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
