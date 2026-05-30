import { MongoClient } from "mongodb";
import { requireMongoEnv } from "../mongodb/env.mjs";

const indexName = "playbook_vec";
const collectionName = "payer_playbooks";

const definition = {
  fields: [
    {
      type: "vector",
      path: "embedding",
      numDimensions: 1536,
      similarity: "cosine",
    },
    {
      type: "filter",
      path: "payer_id",
    },
    {
      type: "filter",
      path: "scope.cpt_family",
    },
  ],
};

async function listSearchIndexes(collection) {
  return await collection.listSearchIndexes().toArray();
}

async function main() {
  const { uri, database } = requireMongoEnv();
  const mongo = new MongoClient(uri);

  await mongo.connect();
  try {
    const collection = mongo.db(database).collection(collectionName);
    const existing = await listSearchIndexes(collection);
    const current = existing.find((index) => index.name === indexName);

    let action = "already_exists";
    if (!current) {
      await collection.createSearchIndex({
        name: indexName,
        type: "vectorSearch",
        definition,
      });
      action = "created";
    }

    const indexes = await listSearchIndexes(collection);
    const index = indexes.find((item) => item.name === indexName);

    console.log(
      JSON.stringify(
        {
          ok: true,
          database,
          collection: collectionName,
          index: indexName,
          action,
          status: index?.status,
          queryable: index?.queryable,
          latestDefinition: index?.latestDefinition || index?.definition,
        },
        null,
        2,
      ),
    );
  } finally {
    await mongo.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
