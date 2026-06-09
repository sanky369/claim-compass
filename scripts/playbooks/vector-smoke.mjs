import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import {
  embeddingDimensions,
  embeddingModel,
  retrievalQueryConfig,
  retrievalQueryContent,
} from "../lib/gemini-embeddings.mjs";
import { requireMongoEnv } from "../mongodb/env.mjs";

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

  return { text, structuredContent: result.structuredContent };
}

async function embedQuery(ai, query) {
  const response = await ai.models.embedContent({
    model: embeddingModel,
    contents: retrievalQueryContent(query),
    config: retrievalQueryConfig(),
  });
  const values = response.embeddings?.[0]?.values;
  if (!Array.isArray(values) || values.length !== embeddingDimensions) {
    throw new Error(`Unexpected query embedding dimensions: ${values?.length ?? "missing"}`);
  }
  return values;
}

function parseMcpText(text) {
  const untrustedMatches = [
    ...text.matchAll(
      /<untrusted-user-data-[^>]+>\s*([\s\S]*?)\s*<\/untrusted-user-data-[^>]+>/g,
    ),
  ];
  const jsonMatch = untrustedMatches.find((match) => match[1].trim().startsWith("["));
  const source = jsonMatch?.[1] || text;
  const firstBrace = source.indexOf("[");
  const lastBrace = source.lastIndexOf("]");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return [];
  try {
    return JSON.parse(source.slice(firstBrace, lastBrace + 1));
  } catch {
    return [];
  }
}

async function main() {
  const { uri, database } = requireMongoEnv();
  const project = getProjectId();
  const location = process.env.GOOGLE_CLOUD_LOCATION || "global";
  const ai = new GoogleGenAI({ vertexai: true, project, location });
  const query =
    "BCBS Texas CPT 90837 telehealth claim denied CO-45 N179 because modifier 95 is missing. Should this be a corrected claim?";
  const queryVector = await embedQuery(ai, query);

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
    name: "claimcompass-vector-smoke",
    version: "0.1.0",
  });

  await client.connect(transport);
  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: "playbook_vec",
          path: "embedding",
          queryVector,
          numCandidates: 30,
          limit: 5,
          filter: {
            payer_id: "bcbs_tx_demo",
            "scope.cpt_family": "psychotherapy_90_codes",
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          body: 1,
          source_url: 1,
          payer_id: 1,
          scope: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ];

    const result = await call(client, "aggregate", {
      database,
      collection: "payer_playbooks",
      pipeline,
    });
    const structuredRows = result.structuredContent?.result;
    const rows =
      Array.isArray(structuredRows) && structuredRows.length > 0
        ? structuredRows
        : parseMcpText(result.text);
    if (process.env.DEBUG_VECTOR_SMOKE === "true") {
      console.error(
        JSON.stringify(
          {
            structuredRowsType: typeof structuredRows,
            structuredRowsLength: Array.isArray(structuredRows)
              ? structuredRows.length
              : undefined,
            textPreview: result.text.slice(0, 500),
            parsedRowsLength: rows.length,
          },
          null,
          2,
        ),
      );
    }
    const topTitles = rows.map((row) => row.title).slice(0, 5);
    const topResult = rows[0];

    if (!topResult) {
      throw new Error("Vector smoke returned zero playbook chunks.");
    }

    const joined = JSON.stringify(rows).toLowerCase();
    if (!joined.includes("telehealth") || !joined.includes("modifier")) {
      throw new Error("Vector smoke did not return telehealth modifier guidance.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          database,
          collection: "payer_playbooks",
          query,
          pipeline: [
            {
              $vectorSearch: {
                index: "playbook_vec",
                path: "embedding",
                queryVector: `<${embeddingDimensions}-dim ${embeddingModel} vector>`,
                numCandidates: 30,
                limit: 5,
                filter: {
                  payer_id: "bcbs_tx_demo",
                  "scope.cpt_family": "psychotherapy_90_codes",
                },
              },
            },
            pipeline[1],
          ],
          result_count: rows.length,
          top_titles: topTitles,
          top_result: {
            _id: topResult._id,
            title: topResult.title,
            score: topResult.score,
            scope: topResult.scope,
            source_url: topResult.source_url,
          },
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
