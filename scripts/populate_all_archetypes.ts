import { ARCHETYPE_DECKS } from '../src/data/yugioh-catalog.js';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface CardData {
  id: number;
  name: string;
  type: string;
  desc: string;
  archetype?: string;
  card_sets?: Array<any>;
  card_images: Array<{
    id: number;
    image_url: string;
    image_url_small: string;
    image_url_cropped: string;
  }>;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: string;
}

async function fetchArchetypeCards(archetypeName: string): Promise<CardData[]> {
  try {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(archetypeName)}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    }
  } catch (error) {
    console.error(`  Error fetching ${archetypeName}:`, error);
  }
  
  return [];
}

async function ensureArchetypeInDB(archetypeName: string, cards: CardData[]): Promise<number> {
  if (cards.length === 0) return 0;
  
  let savedCount = 0;
  
  for (const card of cards) {
    try {
      // Check if card exists
      const { data: existing } = await supabase
        .from('cards')
        .select('id, data')
        .eq('name', card.name)
        .single();
      
      if (existing) {
        // Update to add archetype
        const currentData = typeof existing.data === 'string' 
          ? JSON.parse(existing.data) 
          : existing.data || {};
        
        const archetypes = currentData.archetypes || [];
        if (!archetypes.includes(archetypeName)) {
          archetypes.push(archetypeName);
          currentData.archetypes = archetypes;
          
          await supabase
            .from('cards')
            .update({ data: currentData })
            .eq('id', existing.id);
          
          savedCount++;
        }
      } else {
        // Insert new card with archetype
        const cardData = {
          name: card.name,
          type: card.type,
          desc: card.desc,
          race: card.race,
          archetype: card.archetype,
          card_sets: card.card_sets,
          card_images: card.card_images,
          atk: card.atk,
          def: card.def,
          level: card.level,
          attribute: card.attribute,
          data: { archetypes: [archetypeName] }
        };
        
        await supabase
          .from('cards')
          .insert(cardData);
        
        savedCount++;
      }
      
      await delay(50); // Small delay between operations
    } catch (error) {
      console.error(`    Failed to save ${card.name}:`, error);
    }
  }
  
  return savedCount;
}

async function populateAllArchetypes() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('POPULATING ALL ARCHETYPE CARDS TO DATABASE');
  console.log(`${'='.repeat(80)}\n`);
  console.log(`Total archetypes to process: ${ARCHETYPE_DECKS.length}\n`);
  console.log('This will take approximately 30-60 minutes due to API rate limiting...\n');
  
  const results: Array<{ archetype: string; cardsFound: number; cardsSaved: number }> = [];
  let totalCards = 0;
  let totalSaved = 0;
  let processed = 0;
  
  for (const archetype of ARCHETYPE_DECKS) {
    processed++;
    const startTime = Date.now();
    
    console.log(`[${processed}/${ARCHETYPE_DECKS.length}] Processing: ${archetype.name}`);
    
    const cards = await fetchArchetypeCards(archetype.name);
    console.log(`  Found ${cards.length} cards`);
    
    if (cards.length > 0) {
      const saved = await ensureArchetypeInDB(archetype.name, cards);
      console.log(`  Saved/Updated ${saved} cards`);
      
      results.push({
        archetype: archetype.name,
        cardsFound: cards.length,
        cardsSaved: saved
      });
      
      totalCards += cards.length;
      totalSaved += saved;
    } else {
      console.log(`  ⚠ No cards found (archetype may not exist in API)`);
      results.push({
        archetype: archetype.name,
        cardsFound: 0,
        cardsSaved: 0
      });
    }
    
    const elapsed = Date.now() - startTime;
    const avgTime = elapsed;
    const remaining = (ARCHETYPE_DECKS.length - processed) * avgTime;
    const remainingMin = Math.ceil(remaining / 60000);
    
    console.log(`  Time: ${elapsed}ms | Est. remaining: ~${remainingMin} min\n`);
    
    // Progress checkpoint every 50 archetypes
    if (processed % 50 === 0) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`CHECKPOINT: ${processed}/${ARCHETYPE_DECKS.length} archetypes processed`);
      console.log(`Total cards found: ${totalCards} | Total saved/updated: ${totalSaved}`);
      console.log(`${'─'.repeat(80)}\n`);
    }
    
    await delay(300); // Rate limit: ~200 requests/minute
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('FINAL SUMMARY');
  console.log(`${'='.repeat(80)}\n`);
  console.log(`Total archetypes processed: ${ARCHETYPE_DECKS.length}`);
  console.log(`Total cards found: ${totalCards}`);
  console.log(`Total cards saved/updated: ${totalSaved}`);
  console.log(`Archetypes with no cards: ${results.filter(r => r.cardsFound === 0).length}\n`);
  
  // Top 10 largest archetypes
  const top10 = results
    .filter(r => r.cardsFound > 0)
    .sort((a, b) => b.cardsFound - a.cardsFound)
    .slice(0, 10);
  
  console.log('TOP 10 LARGEST ARCHETYPES:');
  top10.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.archetype}: ${r.cardsFound} cards`);
  });
  
  // Archetypes with no cards
  const noCards = results.filter(r => r.cardsFound === 0);
  if (noCards.length > 0) {
    console.log(`\n\nARCHETYPES WITH NO CARDS (${noCards.length}):`);
    noCards.forEach(r => console.log(`  - ${r.archetype}`));
  }
  
  console.log(`\n✅ Database population complete!\n`);
}

populateAllArchetypes().catch(console.error);
