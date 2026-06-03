import type { Metadata } from "next";
import Link from "next/link";
import { DemoRunner } from "@/components/demo/demo-runner";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "New denial — ClaimCompass demo",
  description:
    "Run the synthetic ClaimCompass golden path. Demo data only — not real PHI.",
};

export default function NewDenialPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-stone-50/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" aria-label="ClaimCompass home">
            <Logo />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Demo data - not real PHI
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Demo workspace - Step 1 of 2
            </p>
            <h1 className="mt-3 font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">
              Start the golden denial run
            </h1>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              One click runs the synthetic BCBS-TX denial through the existing
              ClaimCompass agent path: MongoDB MCP reads, Gemini embeddings,
              Atlas Vector Search, RootAgent classification, DrafterAgent, and
              MongoDB write-back.
            </p>

            <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Synthetic golden path
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-stone-500">Payer</dt>
                  <dd className="font-medium text-stone-900">BCBS Texas Demo</dd>
                </div>
                <div>
                  <dt className="text-stone-500">CPT</dt>
                  <dd className="font-medium text-stone-900">90837</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Issue</dt>
                  <dd className="font-medium text-stone-900">Missing modifier 95</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Codes</dt>
                  <dd className="font-medium text-stone-900">CO-45 + N179</dd>
                </div>
              </dl>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-stone-500">
              Keep this route synthetic. Do not upload or paste real EOBs,
              subscriber IDs, payer portal screenshots, patient names, or other
              PHI. ClaimCompass output is decision support for human billing
              review, not legal, clinical, billing, or payer-policy advice.
            </p>
          </section>

          <DemoRunner />
        </div>
      </div>
    </main>
  );
}
