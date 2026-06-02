import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { requireMongoEnv } from "../mongodb/env.mjs";

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
    .join("\n");
}

function parseMcpDocuments(result) {
  const structuredRows = result.structuredContent?.result;
  if (Array.isArray(structuredRows)) {
    return structuredRows;
  }

  const text = textFromResult(result);
  const matches = [
    ...text.matchAll(
      /<untrusted-user-data-[^>]+>\s*([\s\S]*?)\s*<\/untrusted-user-data-[^>]+>/g,
    ),
  ];
  const jsonMatch = matches.find((match) => match[1].trim().startsWith("["));
  const source = jsonMatch?.[1] || text;
  const firstBrace = source.indexOf("[");
  const lastBrace = source.lastIndexOf("]");
  if (firstBrace === -1 || lastBrace <= firstBrace) {
    return [];
  }
  return JSON.parse(source.slice(firstBrace, lastBrace + 1));
}

async function call(client, name, args) {
  const result = await client.callTool({ name, arguments: args });
  const text = textFromResult(result);
  if (
    result.isError ||
    /connection string is not valid|not authorized|server selection timed out|could not connect|index.*not.*found/i.test(
      text,
    )
  ) {
    throw new Error(`MongoDB MCP ${name} failed: ${text.slice(0, 1000)}`);
  }
  return result;
}

async function embedQuery(ai, query) {
  const response = await ai.models.embedContent({
    model: embeddingModel,
    contents: query,
    config: {
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: embeddingDimensions,
    },
  });
  const values = response.embeddings?.[0]?.values;
  if (!Array.isArray(values) || values.length !== embeddingDimensions) {
    throw new Error(`Unexpected query embedding dimensions: ${values?.length ?? "missing"}`);
  }
  return values;
}

async function main() {
  const { uri, database } = requireMongoEnv();
  const project = getProjectId();
  const location = process.env.GOOGLE_CLOUD_LOCATION || "global";
  const ai = new GoogleGenAI({ vertexai: true, project, location });
  const query = {
    payer_id: "bcbs_tx_demo",
    cpt: "90837",
    cpt_family: "psychotherapy_90_codes",
    carc: ["CO-45"],
    rarc: ["N179"],
    raw_text:
      "BCBS Texas demo denial for CPT 90837 telehealth service. The claim used POS 10 but no modifier 95. Denial codes CO-45 and N179 are present.",
  };
  const queryVector = await embedQuery(
    ai,
    [
      `payer_id: ${query.payer_id}`,
      `cpt: ${query.cpt}`,
      `carc: ${query.carc.join(", ")}`,
      `rarc: ${query.rarc.join(", ")}`,
      query.raw_text,
    ].join("\n"),
  );

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
    name: "claimcompass-policy-smoke",
    version: "0.1.0",
  });

  await client.connect(transport);
  try {
    const chunkResult = await call(client, "aggregate", {
      database,
      collection: "payer_playbooks",
      pipeline: [
        {
          $vectorSearch: {
            index: "playbook_vec",
            path: "embedding",
            queryVector,
            numCandidates: 100,
            limit: 8,
            filter: {
              payer_id: query.payer_id,
              "scope.cpt_family": query.cpt_family,
            },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            body: 1,
            source_url: 1,
            scope: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ],
    });
    const carcResult = await call(client, "find", {
      database,
      collection: "carc",
      filter: { code: { $in: query.carc } },
      limit: query.carc.length,
    });
    const rarcResult = await call(client, "find", {
      database,
      collection: "rarc",
      filter: { code: { $in: query.rarc } },
      limit: query.rarc.length,
    });

    const chunks = parseMcpDocuments(chunkResult);
    const carcDescriptions = parseMcpDocuments(carcResult);
    const rarcDescriptions = parseMcpDocuments(rarcResult);

    if (chunks.length === 0) {
      throw new Error("Policy smoke returned no playbook chunks.");
    }
    const joined = JSON.stringify(chunks).toLowerCase();
    if (!joined.includes("modifier") || !joined.includes("corrected_claim")) {
      throw new Error("Policy smoke did not retrieve corrected-claim modifier guidance.");
    }
    if (!carcDescriptions.some((doc) => doc.code === "CO-45")) {
      throw new Error("Policy smoke did not retrieve CARC CO-45.");
    }
    if (!rarcDescriptions.some((doc) => doc.code === "N179")) {
      throw new Error("Policy smoke did not retrieve RARC N179.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          query,
          chunks: chunks.map((chunk) => ({
            _id: chunk._id,
            title: chunk.title,
            source_url: chunk.source_url,
            score: chunk.score,
            scope: chunk.scope,
          })),
          carc_descriptions: carcDescriptions,
          rarc_descriptions: rarcDescriptions,
          fallback_reason: null,
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
