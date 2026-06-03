"use client";

import { useState } from "react";

export function SaveRuleButton({
  denialId,
  artifactId,
}: {
  denialId: string;
  artifactId?: string;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function saveRule() {
    if (!artifactId) return;
    setState("saving");
    setMessage(null);

    const response = await fetch("/api/demo/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ denialId, artifactId }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      setState("error");
      setMessage(payload.error || "Could not save the billing rule.");
      return;
    }

    setState("saved");
    setMessage(`Saved rule ${payload.rule_id}`);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={saveRule}
        disabled={!artifactId || state === "saving" || state === "saved"}
        className="inline-flex h-10 items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "saving"
          ? "Saving rule..."
          : state === "saved"
            ? "Rule saved"
            : "Save as billing rule"}
      </button>
      {message ? (
        <p
          className={`text-xs ${
            state === "error" ? "text-red-700" : "text-emerald-700"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
