import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBillingRuleCount,
  getDemoDenial,
  getLatestArtifact,
  getLatestDemoRun,
  getTraceEvents,
  summarizeDenialForDiff,
} from "@/lib/demo-records";
import { SaveRuleButton } from "@/components/demo/save-rule-button";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Denial result — ClaimCompass demo",
  description:
    "ClaimCompass demo result with agent trace, citations, and MongoDB before/after write-back.",
};

function formatStep(step?: string) {
  if (!step) return "Unknown step";
  return step
    .replace(/^root_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toolLabel(event: Record<string, unknown>) {
  const step = String(event.step || "");
  const tool = String(event.tool || "");
  if (step.includes("document_ai")) return "Google Document AI";
  if (step.includes("policy") || tool.includes("policy")) {
    return "Gemini + MongoDB MCP aggregate/find";
  }
  if (step.includes("classification")) return "Gemini reasoning";
  if (step.includes("drafter")) return "Gemini generation + MongoDB MCP insert";
  if (tool.includes("mongodb")) return tool.replace(/_/g, " ");
  return tool || "Agent runtime";
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function renderMarkdown(markdown?: string) {
  if (!markdown) return null;
  return markdown.split(/\n{2,}/).map((block) => {
    if (block.startsWith("## ")) {
      return (
        <h3 key={block} className="mt-5 text-sm font-semibold text-stone-900">
          {block.replace(/^## /, "")}
        </h3>
      );
    }
    if (block.startsWith("- ")) {
      return (
        <ul key={block} className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
          {block.split("\n").map((item) => (
            <li key={item}>{item.replace(/^- /, "")}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={block} className="mt-2 text-sm leading-relaxed text-stone-700">
        {block}
      </p>
    );
  });
}

export default async function DenialResultPage({
  params,
}: {
  params: Promise<{ denialId: string }>;
}) {
  const { denialId } = await params;
  const [denial, artifact, traceEvents, demoRun, ruleCount] = await Promise.all([
    getDemoDenial(denialId),
    getLatestArtifact(denialId),
    getTraceEvents(denialId),
    getLatestDemoRun(denialId),
    getBillingRuleCount(denialId),
  ]);

  if (!denial) {
    notFound();
  }

  const chunks = denial.policy_context?.chunks || [];
  const beforeDiff = summarizeDenialForDiff(demoRun?.before || null);
  const afterDiff = summarizeDenialForDiff(demoRun?.after || denial);

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-stone-50/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="ClaimCompass home">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/demo/denials/new"
              className="hidden text-sm font-medium text-stone-600 hover:text-stone-900 sm:block"
            >
              New run
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Demo data - not real PHI
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Metric label="Workflow health" value="Good" tone="green" />
          <Metric label="Bucket" value={String(denial.bucket || "Pending")} />
          <Metric
            label="Confidence"
            value={
              typeof denial.bucket_confidence === "number"
                ? `${Math.round(denial.bucket_confidence * 100)}%`
                : "n/a"
            }
          />
          <Metric label="Rules saved" value={String(ruleCount)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Agent trace
                </p>
                <h1 className="mt-2 font-serif text-3xl tracking-tight text-stone-900">
                  Denial {denialId}
                </h1>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                {String(denial.status || "unknown")}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <TraceRow
                title="Document AI extraction"
                tool="Google Document AI Form Parser"
                status="done"
                note="Extraction fields are present for the synthetic EOB."
              />
              {traceEvents.map((event, index) => (
                <TraceRow
                  key={`${event.created_at || index}-${event.step || index}`}
                  title={formatStep(event.step)}
                  tool={toolLabel(event)}
                  status={String(event.status || "done")}
                  note={
                    event.created_at
                      ? new Date(event.created_at).toLocaleTimeString()
                      : undefined
                  }
                />
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Result
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">
                {String(denial.plain_english || "ClaimCompass classified the denial.")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                {String(
                  denial.recommended_action ||
                    "Review the generated artifact and retrieved playbook citations before taking action.",
                )}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {chunks.map((chunk) => (
                  <span
                    key={chunk._id}
                    title={chunk.title || chunk._id}
                    className="inline-flex max-w-full items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800"
                  >
                    {chunk._id}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Corrected-claim guidance
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-900">
                    Generated artifact
                  </h2>
                </div>
                <SaveRuleButton
                  denialId={denialId}
                  artifactId={artifact?.artifact_id}
                />
              </div>
              <div className="mt-4 rounded-xl bg-stone-50 p-4">
                {artifact ? (
                  renderMarkdown(artifact.markdown)
                ) : (
                  <p className="text-sm text-stone-600">
                    No generated artifact found yet. Run the demo again from the
                    upload page.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                MongoDB write-back proof
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">
                Before / after denial document
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Snapshot from `demo_runs`; generated by the System 16 run API.
            </p>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <JsonPanel label="Before" value={beforeDiff} />
            <JsonPanel label="After" value={afterDiff} highlight />
          </div>
        </section>

        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-stone-500">
          DEMO DATA - NOT REAL PHI. ClaimCompass output is decision support for
          billing teams, not legal, clinical, or payer-policy advice. Human
          review is required before acting on any claim.
        </p>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green";
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          tone === "green" ? "text-emerald-700" : "text-stone-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TraceRow({
  title,
  tool,
  status,
  note,
}: {
  title: string;
  tool: string;
  status: string;
  note?: string;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
      <div>
        <p className="text-sm font-semibold text-stone-900">{title}</p>
        {note ? <p className="mt-1 text-xs text-stone-500">{note}</p> : null}
      </div>
      <p className="text-xs text-stone-600">{tool}</p>
      <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
        {status}
      </span>
    </div>
  );
}

function JsonPanel({
  label,
  value,
  highlight,
}: {
  label: string;
  value: unknown;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "border-brand-200 bg-brand-50/60" : "border-stone-200 bg-stone-50"
      }`}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-stone-700">
        {formatJson(value)}
      </pre>
    </div>
  );
}
