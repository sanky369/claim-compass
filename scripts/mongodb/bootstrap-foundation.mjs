import { MongoClient } from "mongodb";
import { requireMongoEnv } from "./env.mjs";

const collections = [
  "denials",
  "claims",
  "payer_playbooks",
  "generated_artifacts",
  "billing_rules",
  "trace_events",
  "payers",
  "carc",
  "rarc",
];

const demoDenialId = "demo_denial_001";
const now = new Date().toISOString();

const seedDocs = {
  denials: [
    {
      denial_id: demoDenialId,
      claim_id: "claim_demo_90837_001",
      source: "synthetic_eob",
      demo_data_notice: "DEMO DATA - NOT REAL PHI",
      payer_id: "bcbs_tx_demo",
      payer_name: "BCBS Texas Demo",
      cpt: "90837",
      denial_codes: ["CO-45", "N179"],
      status: "received",
      at_risk_amount_usd: 185,
      intake_summary:
        "Synthetic behavioral health denial for CPT 90837 missing telehealth modifier guidance.",
      created_at: now,
      updated_at: now,
    },
  ],
  claims: [
    {
      claim_id: "claim_demo_90837_001",
      demo_data_notice: "DEMO DATA - NOT REAL PHI",
      payer_id: "bcbs_tx_demo",
      cpt: "90837",
      diagnosis_codes: ["F41.1"],
      place_of_service: "10",
      modifiers: [],
      billed_amount_usd: 185,
      status: "denied",
      created_at: now,
      updated_at: now,
    },
  ],
  payers: [
    {
      payer_id: "bcbs_tx_demo",
      display_name: "BCBS Texas Demo",
      demo_only: true,
      notes:
        "Synthetic payer profile for hackathon demo. Do not treat as payer policy.",
      created_at: now,
      updated_at: now,
    },
  ],
  carc: [
    {
      code: "CO-45",
      label: "Charge exceeds fee schedule/maximum allowable or contracted amount",
      demo_summary:
        "Often indicates allowed amount mismatch, contractual adjustment, or claim pricing issue.",
    },
  ],
  rarc: [
    {
      code: "N179",
      label: "Additional information has been requested from the member",
      demo_summary:
        "For this demo, the agent treats N179 as a signal to inspect documentation and payer-specific requirements.",
    },
  ],
  payer_playbooks: [
    {
      playbook_id: "playbook_bcbs_tx_demo_90837_telehealth",
      payer_id: "bcbs_tx_demo",
      title: "Demo 90837 telehealth modifier correction path",
      scope: {
        cpt_family: "90837",
        denial_codes: ["CO-45", "N179"],
      },
      chunk:
        "For the synthetic demo scenario, inspect whether CPT 90837 was submitted with the appropriate telehealth place of service and modifier. If the payer issue is claim formatting rather than clinical necessity, choose corrected_claim or fix_resubmit before true_appeal.",
      embedding: null,
      demo_only: true,
      created_at: now,
      updated_at: now,
    },
  ],
};

async function ensureCollection(db, name) {
  const existing = await db.listCollections({ name }).hasNext();
  if (!existing) {
    await db.createCollection(name);
  }
}

async function replaceSeeds(db) {
  for (const [collectionName, docs] of Object.entries(seedDocs)) {
    const collection = db.collection(collectionName);

    for (const doc of docs) {
      const key =
        doc.denial_id ||
        doc.claim_id ||
        doc.payer_id ||
        doc.code ||
        doc.playbook_id;

      const keyField = doc.denial_id
        ? "denial_id"
        : doc.claim_id
          ? "claim_id"
          : doc.payer_id
            ? "payer_id"
            : doc.code
              ? "code"
              : "playbook_id";

      await collection.updateOne(
        { [keyField]: key },
        { $set: doc },
        { upsert: true },
      );
    }
  }
}

async function createIndexes(db) {
  await db.collection("denials").createIndex({ denial_id: 1 }, { unique: true });
  await db.collection("denials").createIndex({ status: 1, payer_id: 1 });
  await db.collection("claims").createIndex({ claim_id: 1 }, { unique: true });
  await db.collection("payer_playbooks").createIndex({
    payer_id: 1,
    "scope.cpt_family": 1,
  });
  await db.collection("generated_artifacts").createIndex({ denial_id: 1 });
  await db.collection("trace_events").createIndex({ denial_id: 1, created_at: 1 });
  await db.collection("payers").createIndex({ payer_id: 1 }, { unique: true });
  await db.collection("carc").createIndex({ code: 1 }, { unique: true });
  await db.collection("rarc").createIndex({ code: 1 }, { unique: true });
}

async function main() {
  const { uri, database } = requireMongoEnv();
  const client = new MongoClient(uri);

  await client.connect();
  try {
    const db = client.db(database);
    for (const collection of collections) {
      await ensureCollection(db, collection);
    }

    await replaceSeeds(db);
    await createIndexes(db);

    const counts = Object.fromEntries(
      await Promise.all(
        collections.map(async (collection) => [
          collection,
          await db.collection(collection).estimatedDocumentCount(),
        ]),
      ),
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          database,
          collections,
          seeded_denial_id: demoDenialId,
          counts,
          note:
            "Atlas Vector Search index playbook_vec is created in System 9 after embeddings exist.",
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
