import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { dirname } from "node:path";

type McpTextPart = {
  type?: string;
  text?: string;
};

type McpResult = {
  content?: McpTextPart[];
  structuredContent?: {
    result?: unknown;
  };
  isError?: boolean;
};

type McpClient = InstanceType<typeof Client>;

export function textFromMcpResult(result: McpResult) {
  return (result.content || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text || "")
    .join("\n");
}

export function parseMcpDocuments(result: McpResult): Record<string, unknown>[] {
  const structuredRows = result.structuredContent?.result;
  if (Array.isArray(structuredRows)) {
    return structuredRows as Record<string, unknown>[];
  }

  const text = textFromMcpResult(result);
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
  return JSON.parse(source.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>[];
}

export async function callMcp(
  client: McpClient,
  name: string,
  args: Record<string, unknown>,
) {
  const startedAt = Date.now();
  const result = (await client.callTool({
    name,
    arguments: args,
  })) as McpResult;
  const text = textFromMcpResult(result);
  if (
    result.isError ||
    /connection string is not valid|not authorized|server selection timed out|could not connect|index.*not.*found/i.test(
      text,
    )
  ) {
    throw new Error(`MongoDB MCP ${name} failed: ${text.slice(0, 1000)}`);
  }
  return {
    result,
    text,
    elapsed_ms: Date.now() - startedAt,
  };
}

export async function withMcp<T>(
  uri: string,
  name: string,
  run: (client: McpClient) => Promise<T>,
) {
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
    name,
    version: "0.1.0",
  });

  await client.connect(transport);
  try {
    return await run(client);
  } finally {
    await client.close();
    await transport.close();
  }
}
