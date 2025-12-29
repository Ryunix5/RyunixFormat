import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const REMAINING_ARCHETYPES = [
  "Charmer",
  "Fossil", 
  "Gaia",
  "Ganbara",
  "Gearfried",
  "Goblin Biker",
  "Goyo",
  "Gunkan",
  "Hazy Flame",
  "Heraldic",
  "Mystical Beast",
  "Phantom Knights",
  "ZW",
  "Celtic Guard",
  "Train",
  "Earthbound Servant",
  "Gaia The Fierce Knight"
];

async function fetchArchetypeCards(archetype: string) {
  try {
    const response = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(archetype)}`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function saveCard(card: any, archetype: string) {
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
    image_url: card.card_images?.[0]?.image_url || null,
    data: {
      ...card,
      archetype: archetype
    }
  };

  const { error } = await supabase
    .from('cards')
    .upsert(cardData, { onConflict: 'id' });

  return !error;
}

async function populate() {
  console.log('\nPopulating remaining archetypes...\n');
  
  let totalCards = 0;
  let totalSaved = 0;
  
  for (const archetype of REMAINING_ARCHETYPES) {
    process.stdout.write(`[${archetype}] `);
    
    const cards = await fetchArchetypeCards(archetype);
    
    if (cards.length === 0) {
      console.log('✗ No cards found');
      continue;
    }
    
    let saved = 0;
    for (const card of cards) {
      if (await saveCard(card, archetype)) saved++;
    }
    
    totalCards += cards.length;
    totalSaved += saved;
    console.log(`✓ ${saved}/${cards.length} cards`);
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log(`\n✅ Total: ${totalSaved}/${totalCards} cards saved\n`);
}

populate().catch(console.error);
