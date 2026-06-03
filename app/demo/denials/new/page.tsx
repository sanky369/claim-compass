import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "New denial — ClaimCompass demo",
  description:
    "Upload or paste a synthetic EOB to start the ClaimCompass denial-resolution agent. Synthetic data only — not real PHI.",
};

export default function NewDenialPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-stone-50/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" aria-label="ClaimCompass home">
            <Logo />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Demo data · not real PHI
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          Demo workspace · Step 1 of 2
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">
          Start a denial
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
          Upload a synthetic EOB or paste denial text. ClaimCompass extracts the
          claim with Document AI, retrieves payer playbooks from MongoDB Atlas
          Vector Search, classifies the denial, and drafts a corrected-claim
          next step — all in a visible agent trace.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {/* Upload panel — placeholder for System 16 */}
          <div className="flex flex-col rounded-2xl border border-dashed border-stone-300 bg-white p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-brand-600"
                aria-hidden
              >
                <path
                  d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Upload EOB (PDF)
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Drop the synthetic BCBS-TX EOB to run the Document AI extraction
              path.
            </p>
            <div className="mt-4 grid flex-1 place-items-center rounded-xl bg-stone-50 px-4 py-8 text-center text-xs text-stone-400 ring-1 ring-inset ring-stone-200">
              Drag &amp; drop the synthetic EOB here
            </div>
          </div>

          {/* Paste panel — placeholder for System 16 */}
          <div className="flex flex-col rounded-2xl border border-dashed border-stone-300 bg-white p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-brand-600"
                aria-hidden
              >
                <path
                  d="M9 5h6m-6 0a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2m-6 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M7 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Paste denial text
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              No PDF? Paste the EOB / clearinghouse rejection text as a fallback
              for the same agent flow.
            </p>
            <div className="mt-4 flex-1 rounded-xl bg-stone-50 px-4 py-8 text-center text-xs text-stone-400 ring-1 ring-inset ring-stone-200">
              <span className="grid h-full place-items-center">
                Paste denial / EOB text here
              </span>
            </div>
          </div>
        </div>

        {/* Golden-path hint */}
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
            Synthetic golden path
          </p>
          <p className="mt-2 text-sm text-stone-700">
            The demo focuses on one claim:{" "}
            <span className="font-medium text-stone-900">CPT 90837</span>,
            telehealth modifier <code className="rounded bg-white px-1 py-0.5 text-xs">95</code>{" "}
            missing, denial codes{" "}
            <code className="rounded bg-white px-1 py-0.5 text-xs">CO-45</code> +{" "}
            <code className="rounded bg-white px-1 py-0.5 text-xs">N179</code>.
            All values are synthetic and contain no real patient data.
          </p>
        </div>

        {/* System 16 placeholder notice */}
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-900">
              System 16 builds here next
            </p>
            <p className="mt-1 text-sm text-stone-600">
              Upload/paste, live agent trace, result view, citations, and the
              MongoDB before/after diff land in the next build step.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white px-5 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-100"
          >
            Back to site
          </Link>
        </div>

        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-stone-500">
          ClaimCompass output is decision support for billing teams, not legal,
          clinical, or payer-policy advice. Recommendations are meant for human
          review before acting on a claim.
        </p>
      </div>
    </main>
  );
}
