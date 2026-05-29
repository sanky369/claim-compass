import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) {
      continue;
    }

    const lines = readFileSync(path, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, equalsIndex).trim();
      let value = trimmed.slice(equalsIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

export function requireMongoEnv() {
  loadLocalEnv();

  const uri = process.env.MONGODB_URI || process.env.MDB_MCP_CONNECTION_STRING;
  const database = process.env.MONGODB_DATABASE || "claimcompass";

  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI. Add it to .env.local, export it in the shell, or store it as a Secret Manager value before running this script.",
    );
  }

  return { uri, database };
}
