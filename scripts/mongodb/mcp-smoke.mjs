import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { dirname } from "node:path";
import { requireMongoEnv } from "./env.mjs";

const requiredReadTools = ["find", "aggregate", "count"];
const requiredWriteTools = ["insert-many"];
const preferredUpdateTools = ["update-one", "update-many"];

function textFromResult(result) {
  return (result.content || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .slice(0, 500);
}

function assertTool(toolsByName, name) {
  if (!toolsByName.has(name)) {
    throw new Error(`MongoDB MCP tool is missing: ${name}`);
  }
}

async function call(client, name, args) {
  const startedAt = Date.now();
  const result = await client.callTool({
    name,
    arguments: args,
  });
  const preview = textFromResult(result);

  if (
    result.isError ||
    /connection string is not valid|not authorized|server selection timed out|could not connect/i.test(preview)
  ) {
    throw new Error(`MongoDB MCP ${name} failed: ${preview}`);
  }

  return {
    tool: name,
    elapsed_ms: Date.now() - startedAt,
    preview,
    structuredContent: result.structuredContent,
  };
}

async function main() {
  const { uri, database } = requireMongoEnv();
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
    name: "claimcompass-mongodb-mcp-smoke",
    version: "0.1.0",
  });

  const stderrChunks = [];
  transport.stderr?.on("data", (chunk) => {
    stderrChunks.push(String(chunk));
  });

  await client.connect(transport);
  try {
    const toolList = await client.listTools();
    const toolsByName = new Map(toolList.tools.map((tool) => [tool.name, tool]));

    for (const tool of [...requiredReadTools, ...requiredWriteTools]) {
      assertTool(toolsByName, tool);
    }

    const updateTool = preferredUpdateTools.find((tool) => toolsByName.has(tool));
    if (!updateTool) {
      throw new Error(
        `MongoDB MCP update tool is missing. Expected one of: ${preferredUpdateTools.join(", ")}`,
      );
    }

    const denialId = `mcp_smoke_${Date.now()}`;
    const traceId = `trace_${denialId}`;
    const calls = [];

    calls.push(
      await call(client, "insert-many", {
        database,
        collection: "denials",
        documents: [
          {
            denial_id: denialId,
            demo_data_notice: "DEMO DATA - NOT REAL PHI",
            payer_id: "bcbs_tx_demo",
            cpt: "90837",
            denial_codes: ["CO-45", "N179"],
            status: "mcp_smoke_received",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      }),
    );

    calls.push(
      await call(client, "find", {
        database,
        collection: "denials",
        filter: { denial_id: denialId },
        limit: 1,
      }),
    );

    calls.push(
      await call(client, "aggregate", {
        database,
        collection: "denials",
        pipeline: [
          { $match: { payer_id: "bcbs_tx_demo" } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
      }),
    );

    calls.push(
      await call(client, updateTool, {
        database,
        collection: "denials",
        filter: { denial_id: denialId },
        update: {
          $set: {
            status: "mcp_smoke_updated",
            updated_at: new Date().toISOString(),
          },
        },
      }),
    );

    calls.push(
      await call(client, "count", {
        database,
        collection: "denials",
        query: { denial_id: denialId },
      }),
    );

    calls.push(
      await call(client, "insert-many", {
        database,
        collection: "trace_events",
        documents: [
          {
            trace_id: traceId,
            denial_id: denialId,
            tool: "mongodb-mcp-smoke",
            status: "ok",
            created_at: new Date().toISOString(),
          },
        ],
      }),
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          database,
          denial_id: denialId,
          installed_tools: toolList.tools.map((tool) => tool.name).sort(),
          update_tool_used: updateTool,
          calls,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
    await transport.close();
  }

  if (stderrChunks.length > 0 && process.env.DEBUG_MCP_STDERR === "true") {
    console.error(stderrChunks.join(""));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
