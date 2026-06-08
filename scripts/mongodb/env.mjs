import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
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

  const uri =
    loadMongoUriFromSecretManager() ||
    process.env.MONGODB_URI ||
    process.env.MDB_MCP_CONNECTION_STRING;
  const database = process.env.MONGODB_DATABASE || "claimcompass";

  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI. Add it to .env.local, export it in the shell, or store it as a Secret Manager value before running this script.",
    );
  }

  return { uri, database };
}

function loadMongoUriFromSecretManager() {
  if (process.env.CLAIMCOMPASS_USE_SECRET_MANAGER !== "yes") {
    return null;
  }

  const project =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    "claimcompass-497412";

  try {
    return execFileSync(
      "gcloud",
      [
        "secrets",
        "versions",
        "access",
        "latest",
        "--secret",
        "mongodb-uri",
        "--project",
        project,
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    ).trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(
      `Unable to read mongodb-uri from Secret Manager for project ${project}: ${message}`,
    );
  }
}
