"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RunState = "idle" | "running" | "error";

const runningSteps = [
  "Load synthetic EOB and denial record",
  "Run RootAgent retrieval and classification",
  "Generate corrected-claim guidance",
  "Write artifact and trace back to MongoDB",
];

export function DemoRunner() {
  const router = useRouter();
  const [state, setState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");

  async function startRun() {
    setState("running");
    setError(null);

    const response = await fetch("/api/demo/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        denialId: "demo_denial_001",
        mode: pasteText.trim() ? "paste_fallback" : "golden_pdf",
      }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      setState("error");
      setError(payload.error || "The demo run failed.");
      return;
    }

    router.push(payload.redirect_to);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <section className="flex flex-col rounded-2xl border border-dashed border-stone-300 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-brand-700">
              1
            </span>
            Synthetic EOB route
          </div>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Runs the already-seeded BCBS-TX demo denial through Document AI
            context, Gemini retrieval/classification, MongoDB MCP write-back,
            and DrafterAgent citation validation.
          </p>
          <button
            type="button"
            onClick={startRun}
            disabled={state === "running"}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {state === "running" ? "Running agent..." : "Run golden demo"}
          </button>
        </section>

        <section className="flex flex-col rounded-2xl border border-stone-200 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-brand-700">
              2
            </span>
            Paste fallback marker
          </div>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Optional for the demo script. Do not paste real PHI. System 16 keeps
            the backend fixed to the synthetic golden claim for safety.
          </p>
          <textarea
            value={pasteText}
            onChange={(event) => setPasteText(event.target.value)}
            placeholder="Synthetic paste fallback text only..."
            className="mt-4 min-h-28 resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700 outline-none transition-colors placeholder:text-stone-400 focus:border-brand-300 focus:bg-white"
          />
        </section>
      </div>

      {state === "running" ? (
        <section className="rounded-2xl border border-brand-200 bg-brand-50/70 p-5">
          <p className="text-sm font-semibold text-stone-900">
            Agent run in progress
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-4">
            {runningSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-xl border border-brand-200 bg-white px-3 py-3 text-xs text-stone-600"
              >
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                  Step {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {state === "error" ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p className="font-semibold">The demo run failed.</p>
          <p className="mt-2 break-words">{error}</p>
        </section>
      ) : null}
    </div>
  );
}
