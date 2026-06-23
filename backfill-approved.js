// One-off: mark all EXISTING users as approved so the new approval gate
// doesn't lock out accounts created before this feature.
// New signups still default to approved: false (pending admin approval).
// Run once:  node backfill-approved.js
const { MongoClient } = require("mongodb");
require("dotenv").config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(); // db name comes from the connection string
    const res = await db
      .collection("User")
      .updateMany({ approved: { $exists: false } }, { $set: { approved: true } });
    console.log(`Backfilled ${res.modifiedCount} existing user(s) to approved: true`);
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
