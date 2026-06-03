import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { DemoGateButton } from "@/components/demo-gate-button";

export const metadata: Metadata = {
  title: "Demo sign-in — ClaimCompass",
  description:
    "Continue into the ClaimCompass demo workspace. Synthetic data only — not real PHI.",
};

const DEFAULT_NEXT = "/demo/denials/new";

/**
 * Only allow internal demo paths so the `next` param can never become an
 * open redirect. Anything else falls back to the upload flow.
 */
export function safeNext(value?: string): string {
  if (value === "/demo" || value?.startsWith("/demo/")) return value;
  return DEFAULT_NEXT;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNext(next);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-radial" aria-hidden />
      <div className="absolute inset-0 grain opacity-60" aria-hidden />

      <header className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <Link href="/" aria-label="ClaimCompass home">
          <Logo />
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
        >
          Back to site
        </Link>
      </header>

      <div className="relative flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-2xl shadow-stone-900/10 ring-1 ring-stone-900/5 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 pulse-dot" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Demo workspace · synthetic data
          </div>

          <h1 className="mt-5 font-serif text-3xl leading-tight tracking-tight text-stone-900">
            Continue to the ClaimCompass demo
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            This is a hackathon demo, not a real account. There&apos;s no
            sign-up and no password — one click opens a deterministic workspace
            running on synthetic claim data so you can watch the agent resolve a
            denial end to end.
          </p>

          <div className="mt-7">
            <DemoGateButton next={target} />
          </div>

          <p className="mt-4 text-center text-xs text-stone-500">
            No credit card, no Firebase, no real authentication.
          </p>

          <div className="mt-7 border-t border-stone-200 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              DEMO DATA · NOT REAL PHI
            </p>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">
              ClaimCompass output is decision support for billing teams, not
              legal, clinical, or payer-policy advice. Every recommendation is
              meant for human review before you act on a claim.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
