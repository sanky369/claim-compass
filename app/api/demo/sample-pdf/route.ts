import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const dynamic = "force-static";
export const runtime = "nodejs";

const samplePdfPath = resolve(
  process.cwd(),
  "docs/test-documents/pdf/golden-bcbs-tx-90837-missing-modifier-eob.pdf",
);

export async function GET() {
  const file = await readFile(samplePdfPath);
  return new Response(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'inline; filename="golden-bcbs-tx-90837-missing-modifier-eob.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
