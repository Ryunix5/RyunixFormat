/*
  Script: import_ygo_catalog.ts
  Fetches the YGOPRODECK catalog in pages and bulk upserts into the local `cards` table.

  Usage:
    npx tsx scripts/import_ygo_catalog.ts
    or
    node dist/scripts/import_ygo_catalog.js (after build)

  Notes:
    - Uses fetch with pagination via num+offset
    - Respects simple retry/backoff
    - Upserts in chunks to avoid giant payloads
*/

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

import { CardCatalogORM } from '../src/sdk/database/orm/orm_cards';

const BATCH = 100;
const MAX_RETRIES = 5;

async function fetchBatch(offset: number, num = BATCH) {
  const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${num}&offset=${offset}`;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const r = await fetch(url);
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`HTTP ${r.status}: ${text}`);
      }
      const json = await r.json();
      return json.data || [];
    } catch (err) {
      const backoff = 500 * Math.pow(2, attempt);
      console.warn(`fetchBatch attempt ${attempt + 1} failed for offset=${offset}:`, err.message || err);
      await new Promise((res) => setTimeout(res, backoff));
    }
  }
  throw new Error(`Failed to fetch batch offset=${offset} after ${MAX_RETRIES} attempts`);
}

async function importAll() {
  console.log('Starting catalog import...');
  const orm = CardCatalogORM.getInstance();

  let offset = 0;
  let total = 0;
  while (true) {
    const batch = await fetchBatch(offset, BATCH);
    if (!batch || batch.length === 0) break;

    const payload = batch.map((card: any) => ({
      name: card.name,
      data: card,
      archetypes: card.archetype ? [card.archetype] : [],
    }));

    // chunk and upsert
    for (let i = 0; i < payload.length; i += 50) {
      const chunk = payload.slice(i, i + 50);
      await orm.bulkUpsert(chunk);
      console.log(`Upserted ${Math.min(i + 50, payload.length)} / ${payload.length} in batch offset=${offset}`);
    }

    offset += BATCH;
    total += batch.length;
    console.log(`Fetched ${batch.length} cards; total so far: ${total}`);
  }

  console.log('Import finished. Total cards imported/upserted:', total);
}

if (require.main === module) {
  importAll().catch((err) => {
    console.error('Import failed', err);
    process.exit(1);
  });
}
