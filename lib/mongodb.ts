import { MongoClient, type Db } from "mongodb";

declare global {
  var __claimCompassMongoClient: Promise<MongoClient> | undefined;
}

export function getMongoUri() {
  const uri = process.env.MONGODB_URI || process.env.MDB_MCP_CONNECTION_STRING;
  if (!uri) {
    throw new Error("Missing MONGODB_URI for server-side demo data access.");
  }
  return uri;
}

export function getMongoDatabaseName() {
  return process.env.MONGODB_DATABASE || "claimcompass";
}

export async function getMongoClient() {
  if (!globalThis.__claimCompassMongoClient) {
    globalThis.__claimCompassMongoClient = new MongoClient(getMongoUri()).connect();
  }
  return globalThis.__claimCompassMongoClient;
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(getMongoDatabaseName());
}

export function toPlainDocument<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}
