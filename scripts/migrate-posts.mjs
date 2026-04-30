/**
 * Migration script — run once to clean up Firestore posts:
 *   • Remove `mediumUrl` field
 *   • Remove `views` field
 *   • Recalculate `wordCount` and `readTime` from stored HTML content
 *
 * Usage:
 *   node scripts/migrate-posts.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createRequire } from 'module';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('/Users/baljeet/Downloads/techwithbaljeet-firebase-adminsdk-fbsvc-70b775b8f5.json', 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function countWords(html) {
  return html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
}

function estimateReadTime(wordCount) {
  return Math.max(1, Math.ceil(wordCount / 200));
}

async function migrate() {
  const snapshot = await db.collection('posts').get();
  console.log(`Found ${snapshot.size} posts. Migrating…`);

  const BATCH_SIZE = 400; // Firestore batch limit is 500
  let batch = db.batch();
  let count = 0;
  let batchCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const content = data.content ?? '';
    const wordCount = countWords(content);
    const readTime = estimateReadTime(wordCount);

    const update = {
      wordCount,
      readTime,
      mediumUrl: FieldValue.delete(),
      views: FieldValue.delete(),
    };

    batch.update(docSnap.ref, update);
    count++;
    batchCount++;

    if (batchCount === BATCH_SIZE) {
      await batch.commit();
      console.log(`  Committed batch (${count} total so far)`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`  Committed final batch`);
  }

  console.log(`✅ Migration complete — updated ${count} posts.`);
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
