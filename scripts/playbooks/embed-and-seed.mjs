import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { requireMongoEnv } from "../mongodb/env.mjs";
import { buildPlaybookChunks } from "./corpus.mjs";

const embeddingModel = "gemini-embedding-001";
const embeddingDimensions = 1536;

function gcloud(args) {
  return execFileSync("gcloud", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function getProjectId() {
  return (
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    gcloud(["config", "get-value", "project"])
  );
}

function textFromResult(result) {
  return (result.content || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .slice(0, 800);
}

async function call(client, name, args) {
  const result = await client.callTool({ name, arguments: args });
  const preview = textFromResult(result);

  if (
    result.isError ||
    /connection string is not valid|not authorized|server selection timed out|could not connect/i.test(preview)
  ) {
    throw new Error(`MongoDB MCP ${name} failed: ${preview}`);
  }

  return {
    tool: name,
    preview,
    structuredContent: result.structuredContent,
  };
}

async function connectMcp(uri) {
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
    name: "claimcompass-playbook-seed",
    version: "0.1.0",
  });

  await client.connect(transport);
  return { client, transport };
}

async function embedChunk(ai, chunk) {
  const response = await ai.models.embedContent({
    model: embeddingModel,
    contents: `${chunk.title}\n\n${chunk.body}`,
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
      title: chunk.title,
      outputDimensionality: embeddingDimensions,
    },
  });

  const values = response.embeddings?.[0]?.values;
  if (!Array.isArray(values) || values.length !== embeddingDimensions) {
    throw new Error(
      `Unexpected embedding dimensions for ${chunk._id}: ${values?.length ?? "missing"}`,
    );
  }

  return values;
}

async function main() {
  const { uri, database } = requireMongoEnv();
  const project = getProjectId();
  const location = process.env.GOOGLE_CLOUD_LOCATION || "global";
  const ai = new GoogleGenAI({ vertexai: true, project, location });
  const chunks = buildPlaybookChunks();

  const embeddedChunks = [];
  for (const [index, chunk] of chunks.entries()) {
    const embedding = await embedChunk(ai, chunk);
    embeddedChunks.push({
      ...chunk,
      embedding,
      updated_at: new Date().toISOString(),
    });
    process.stderr.write(`embedded ${index + 1}/${chunks.length}: ${chunk._id}\n`);
  }

  const { client, transport } = await connectMcp(uri);
  try {
    await call(client, "delete-many", {
      database,
      collection: "payer_playbooks",
      filter: { demo_only: true },
    });

    const insertResult = await call(client, "insert-many", {
      database,
      collection: "payer_playbooks",
      documents: embeddedChunks,
    });

    const countResult = await call(client, "count", {
      database,
      collection: "payer_playbooks",
      query: {
        demo_only: true,
        embedding_model: embeddingModel,
        embedding_dimensions: embeddingDimensions,
      },
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          database,
          collection: "payer_playbooks",
          project,
          location,
          model: embeddingModel,
          dimensions: embeddingDimensions,
          chunks_authored: chunks.length,
          chunks_inserted_via_mcp: embeddedChunks.length,
          inserted_preview: insertResult.preview,
          count_preview: countResult.preview,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
    await transport.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
