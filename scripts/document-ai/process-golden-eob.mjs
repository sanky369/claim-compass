import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { requireMongoEnv } from "../mongodb/env.mjs";

const projectId = process.env.GOOGLE_CLOUD_PROJECT || "claimcompass-497412";
const denialId = process.env.DENIAL_ID || "demo_denial_001";
const database = process.env.MONGODB_DATABASE || "claimcompass";
const localPdf = resolve(
  process.cwd(),
  "docs/test-documents/pdf/golden-bcbs-tx-90837-missing-modifier-eob.pdf",
);

function gcloud(args, options = {}) {
  return execFileSync("gcloud", args, {
    encoding: "utf8",
    stdio: options.stdio || ["ignore", "pipe", "pipe"],
  }).trim();
}

function getSecret(name) {
  const envName = name.toUpperCase().replaceAll("-", "_");
  if (process.env[envName]) {
    return process.env[envName];
  }

  return gcloud([
    "secrets",
    "versions",
    "access",
    "latest",
    `--secret=${name}`,
    `--project=${projectId}`,
  ]);
}

async function getAccessToken() {
  if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) {
    return process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
  }

  try {
    const response = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      {
        headers: { "Metadata-Flavor": "Google" },
        signal: AbortSignal.timeout(2000),
      },
    );
    if (response.ok) {
      const body = await response.json();
      if (body.access_token) {
        return body.access_token;
      }
    }
  } catch {
    // Local development falls through to gcloud ADC.
  }

  return gcloud(["auth", "print-access-token"]);
}

function extractFields(rawText) {
  const text = rawText.replace(/\r/g, "");
  const compact = text.replace(/\s+/g, " ");

  const cpt = compact.match(/\b(90837)\b/)?.[1] || null;
  const pos = compact.match(/Place of service\s+(\d{2})/i)?.[1] || compact.match(/\bPOS\s*(\d{2})\b/i)?.[1] || null;
  const dx = [...new Set([...compact.matchAll(/\bF\d{2}\.\d\b/g)].map((match) => match[0]))];
  const carc = [...new Set([...compact.matchAll(/\b(?:CARC[:\s]*)?(CO-\d{1,3})\b/gi)].map((match) => match[1].toUpperCase()))];
  const rarc = [...new Set([...compact.matchAll(/\b(?:RARC[:\s]*)?(N\d{2,4})\b/gi)].map((match) => match[1].toUpperCase()))];
  const amounts = {
    billed: compact.match(/Total billed\s+\$?([\d.]+)/i)?.[1] || compact.match(/\$185\.00/)?.[0]?.replace("$", "") || null,
    allowed: compact.match(/Total allowed\s+\$?([\d.]+)/i)?.[1] || null,
    paid: compact.match(/Plan paid\s+\$?([\d.]+)/i)?.[1] || null,
    patient_responsibility: compact.match(/You may owe\s+\$?([\d.]+)/i)?.[1] || null,
  };

  const modifierText = compact.match(/Modifiers\s+Units\s+Billed/i)
    ? compact.match(/10\s+(None submitted|[A-Z0-9, ]+)\s+1\s+\$185/i)?.[1]
    : compact.match(/Submitted modifiers:\s*([^.\n]+)/i)?.[1];
  const modifiers = !modifierText || /none/i.test(modifierText)
    ? []
    : modifierText.split(/[, ]+/).map((value) => value.trim()).filter(Boolean);

  return {
    carc,
    rarc,
    cpt,
    modifiers,
    pos,
    dx,
    payer_hint: /Blue Cross Blue Shield of Texas/i.test(text) ? "bcbs_tx" : null,
    amounts,
    missing_modifier_hint: /modifier was not present|required telehealth modifier/i.test(text) ? "95" : null,
    raw_text: rawText,
  };
}

async function createMcpClient(uri) {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["mongodb-mcp-server"],
    env: {
      ...process.env,
      MDB_MCP_CONNECTION_STRING: uri,
      MDB_MCP_READ_ONLY: "false",
      MDB_MCP_TELEMETRY: "disabled",
      MDB_MCP_LOGGERS: "mcp",
      PATH: [dirname(process.execPath), process.env.PATH].filter(Boolean).join(":"),
    },
    stderr: "pipe",
  });

  const client = new Client({
    name: "claimcompass-document-ai-smoke",
    version: "0.1.0",
  });

  await client.connect(transport);
  return { client, transport };
}

async function updateDenialWithMcp(client, update, status) {
  const result = await client.callTool({
    name: "update-many",
    arguments: {
      database,
      collection: "denials",
      filter: { denial_id: denialId },
      update: {
        $set: {
          ...update,
          ocr_status: status,
          updated_at: new Date().toISOString(),
        },
      },
    },
  });

  assertMcpOk(result, "update-many denials");
  return result.structuredContent;
}

async function insertTraceWithMcp(client, event) {
  const result = await client.callTool({
    name: "insert-many",
    arguments: {
      database,
      collection: "trace_events",
      documents: [
        {
          denial_id: denialId,
          step: "document_ai_form_parser",
          created_at: new Date().toISOString(),
          ...event,
        },
      ],
    },
  });

  assertMcpOk(result, "insert-many trace_events");
}

function assertMcpOk(result, label) {
  const text = (result.content || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");

  if (
    result.isError ||
    /connection string is not valid|not authorized|server selection timed out|could not connect/i.test(text)
  ) {
    throw new Error(`MongoDB MCP ${label} failed: ${text.slice(0, 600)}`);
  }
}

async function processDocument(gcsUri) {
  const processorId = getSecret("documentai-processor-id");
  const location = getSecret("documentai-location");
  const token = await getAccessToken();
  const endpoint = `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      skipHumanReview: true,
      gcsDocument: {
        gcsUri,
        mimeType: "application/pdf",
      },
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Document AI failed (${response.status}): ${JSON.stringify(body)}`);
  }

  return body.document;
}

async function uploadObjectToGcs(bucket, objectName, filePath) {
  const token = await getAccessToken();
  const endpoint = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(objectName)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/pdf",
    },
    body: readFileSync(filePath),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`GCS upload failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  const { uri } = requireMongoEnv();
  const bucket = getSecret("gcs-upload-bucket");
  const objectName = `synthetic-eobs/${Date.now()}-${basename(localPdf)}`;
  const gcsUri = `gs://${bucket}/${objectName}`;

  await uploadObjectToGcs(bucket, objectName, localPdf);

  const { client, transport } = await createMcpClient(uri);
  try {
    await updateDenialWithMcp(
      client,
      {
        gcs_uri: gcsUri,
        source_document: "golden-bcbs-tx-90837-missing-modifier-eob.pdf",
      },
      "pending",
    );

    const document = await processDocument(gcsUri);
    const extracted = extractFields(document.text || "");
    const structuredContent = await updateDenialWithMcp(
      client,
      {
        extracted,
        raw_text: extracted.raw_text,
        extraction_provider: "google_document_ai_form_parser",
        extraction_processor_location: getSecret("documentai-location"),
      },
      "done",
    );

    await insertTraceWithMcp(client, {
      status: "done",
      tool: "document_ai_form_parser",
      gcs_uri: gcsUri,
      extracted_summary: {
        cpt: extracted.cpt,
        carc: extracted.carc,
        rarc: extracted.rarc,
        payer_hint: extracted.payer_hint,
        missing_modifier_hint: extracted.missing_modifier_hint,
      },
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          denial_id: denialId,
          gcs_uri: gcsUri,
          extracted: {
            cpt: extracted.cpt,
            carc: extracted.carc,
            rarc: extracted.rarc,
            pos: extracted.pos,
            dx: extracted.dx,
            modifiers: extracted.modifiers,
            payer_hint: extracted.payer_hint,
            missing_modifier_hint: extracted.missing_modifier_hint,
            raw_text_chars: extracted.raw_text.length,
          },
          update: structuredContent,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await updateDenialWithMcp(
      client,
      {
        extraction_error: error instanceof Error ? error.message : String(error),
      },
      "failed",
    );
    throw error;
  } finally {
    await client.close();
    await transport.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
