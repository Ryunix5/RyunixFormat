import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { STAPLE_PACKAGES } from './archetype_mappings.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DELAY = 300; // 300ms between requests

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCardsBySearch(searchTerm: string) {
  try {
    const response = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(searchTerm)}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    return [];
  }
}

async function saveCard(card: any, packageName: string) {
  const cardData = {
    id: card.id.toString(),
    name: card.name,
    type: card.type,
    desc: card.desc,
    atk: card.atk,
    def: card.def,
    level: card.level,
    race: card.race,
    attribute: card.attribute,
    archetype: card.archetype || null,
    image_url: card.card_images?.[0]?.image_url || null,
    data: {
      ...card,
      staple_package: packageName
    }
  };

  const { error } = await supabase
    .from('cards')
    .upsert(cardData, { onConflict: 'id' });

  if (error) {
    console.error(`  ✗ Error saving ${card.name}:`, error.message);
    return false;
  }
  return true;
}

async function populateStaplePackages() {
  console.log('\n================================================================================');
  console.log('POPULATING STAPLE CARD PACKAGES');
  console.log('================================================================================\n');
  
  let totalCards = 0;
  let totalSaved = 0;

  for (const pkg of STAPLE_PACKAGES) {
    console.log(`\n[${pkg.name}] ${pkg.description}`);
    const startTime = Date.now();
    
    const cards = await fetchCardsBySearch(pkg.searchTerm);
    console.log(`  Found ${cards.length} cards`);
    
    if (cards.length > 0) {
      let saved = 0;
      for (const card of cards) {
        const success = await saveCard(card, pkg.name);
        if (success) saved++;
      }
      console.log(`  Saved/Updated ${saved} cards`);
      totalCards += cards.length;
      totalSaved += saved;
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`  Time: ${elapsed}ms`);
    
    await delay(DELAY);
  }

  console.log('\n================================================================================');
  console.log('SUMMARY');
  console.log('================================================================================\n');
  console.log(`Total packages: ${STAPLE_PACKAGES.length}`);
  console.log(`Total cards found: ${totalCards}`);
  console.log(`Total cards saved: ${totalSaved}`);
  console.log('\n✅ Staple packages population complete!\n');
}

populateStaplePackages().catch(console.error);
