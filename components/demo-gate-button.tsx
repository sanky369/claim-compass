"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Single-button demo gate action.
 *
 * This is intentionally NOT real authentication. It sets a lightweight,
 * non-sensitive demo marker cookie so the signed-in demo workspace can tell a
 * judge arrived through the gate, then routes to the first demo flow page.
 * No credentials, no PHI, no Firebase/OAuth. See System 15 in
 * docs/HACKATHON_BP_IMPLEMENTATION.md.
 */
export function DemoGateButton({ next }: { next: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleContinue() {
    setLoading(true);
    // Demo session marker only — 1 day, lax, not httpOnly, holds no real data.
    document.cookie = "cc_demo=1; path=/; max-age=86400; samesite=lax";
    router.push(next);
  }

  return (
    <button
      type="button"
      onClick={handleContinue}
      disabled={loading}
      className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-7 text-sm font-semibold text-white shadow-lg shadow-stone-900/10 transition-all hover:bg-stone-800 hover:shadow-xl hover:shadow-stone-900/20 disabled:opacity-70"
    >
      {loading ? "Opening demo workspace…" : "Continue to demo workspace"}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      >
        <path
          d="M5 12h14m0 0-5-5m5 5-5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
