#!/usr/bin/env tsx
/*
  Standalone card import script
  Imports all Yu-Gi-Oh cards from YGOPRODECK API into Supabase
*/

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH_SIZE = 100;
const MAX_RETRIES = 5;
const UPSERT_CHUNK = 50;

async function fetchBatch(offset: number): Promise<any[]> {
  const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${BATCH_SIZE}&offset=${offset}`;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        // HTTP 400 likely means we've reached the end of available data
        if (response.status === 400) {
          return []; // Return empty array to signal end of data
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      return json.data || [];
    } catch (err: any) {
      const backoff = 500 * Math.pow(2, attempt);
      console.warn(`⚠️  Retry ${attempt + 1}/${MAX_RETRIES} for offset ${offset}: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
  
  // After all retries, return empty to end gracefully
  return [];
}

async function upsertCards(cards: any[]) {
  const payload = cards.map(card => ({
    name: card.name,
    data: card,
    archetypes: card.archetype ? [card.archetype] : [],
    update_time: Math.floor(Date.now() / 1000),
  }));

  const { error } = await supabase
    .from('cards')
    .upsert(payload, { onConflict: 'name' });

  if (error) {
    throw error;
  }
}

async function main() {
  console.log('🎴 Yu-Gi-Oh Card Import Started');
  console.log('📡 Fetching from YGOPRODECK API...\n');

  let offset = 0;
  let totalImported = 0;

  while (true) {
    try {
      const batch = await fetchBatch(offset);
      
      if (!batch || batch.length === 0) {
        console.log('\n✅ Reached end of card catalog');
        break;
      }

      // Upsert in chunks to avoid large payloads
      for (let i = 0; i < batch.length; i += UPSERT_CHUNK) {
        const chunk = batch.slice(i, i + UPSERT_CHUNK);
        await upsertCards(chunk);
        
        const chunkEnd = Math.min(i + UPSERT_CHUNK, batch.length);
        totalImported += chunk.length;
        
        console.log(`✓ Imported ${chunkEnd}/${batch.length} from batch | Total: ${totalImported} cards`);
      }

      offset += BATCH_SIZE;
      
      // Small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err: any) {
      console.error(`\n❌ Error at offset ${offset}:`, err.message);
      throw err;
    }
  }

  console.log(`\n🎉 Import complete! ${totalImported} cards imported to database`);
}

main().catch(err => {
  console.error('\n💥 Import failed:', err);
  process.exit(1);
});
