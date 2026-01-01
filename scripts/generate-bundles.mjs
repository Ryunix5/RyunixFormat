#!/usr/bin/env node
/**
 * Generate card bundles from YGOProDeck API
 * Fetches all cards without archetypes and groups them into 30-card bundles by type
 */

import fs from 'fs';
import path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'card-bundles.ts');
const BUNDLE_SIZE = 30;
const BATCH_SIZE = 5000;
const MAX_BATCHES = 3;

console.log('🎴 Starting bundle generation...\n');

async function fetchAllCards() {
  const allCards = [];
  
  for (let batchNum = 0; batchNum < MAX_BATCHES; batchNum++) {
    const offset = batchNum * BATCH_SIZE;
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${BATCH_SIZE}&offset=${offset}`;
    
    console.log(`📡 Fetching batch ${batchNum + 1}/${MAX_BATCHES} (offset: ${offset})...`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      if (!response.ok) {
        console.log(`⚠️  Batch ${batchNum + 1} returned ${response.status}, stopping`);
        break;
      }
      
      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        console.log(`✅ No more cards in batch ${batchNum + 1}, stopping`);
        break;
      }
      
      allCards.push(...data.data);
      console.log(`   Added ${data.data.length} cards (total: ${allCards.length})`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`❌ Error fetching batch ${batchNum + 1}:`, err.message);
      break;
    }
  }
  
  return allCards;
}

function filterNonArchetypeCards(cards) {
  return cards.filter(card => !card.archetype);
}

function groupCardsByType(cards) {
  const groups = {};
  
  for (const card of cards) {
    let groupKey;
    
    // Determine card category
    if (card.type.includes('Monster')) {
      // Group by race (Machine, Dragon, Spellcaster, etc.)
      groupKey = card.race;
    } else if (card.type.includes('Spell')) {
      // Group by spell type
      if (card.type.includes('Continuous')) {
        groupKey = 'Continuous Spell';
      } else if (card.type.includes('Quick-Play')) {
        groupKey = 'Quick-Play Spell';
      } else if (card.type.includes('Equip')) {
        groupKey = 'Equip Spell';
      } else if (card.type.includes('Field')) {
        groupKey = 'Field Spell';
      } else if (card.type.includes('Ritual')) {
        groupKey = 'Ritual Spell';
      } else {
        groupKey = 'Normal Spell';
      }
    } else if (card.type.includes('Trap')) {
      // Group by trap type
      if (card.type.includes('Continuous')) {
        groupKey = 'Continuous Trap';
      } else if (card.type.includes('Counter')) {
        groupKey = 'Counter Trap';
      } else {
        groupKey = 'Normal Trap';
      }
    } else {
      groupKey = 'Other';
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push({
      id: card.id,
      name: card.name,
      type: card.type,
      desc: card.desc,
      imageUrl: card.card_images?.[0]?.image_url_small || '',
    });
  }
  
  return groups;
}

function createBundles(groups) {
  const bundles = [];
  
  for (const [typeName, cards] of Object.entries(groups)) {
    if (cards.length === 0) continue;
    
    // Split into chunks of BUNDLE_SIZE
    const numBundles = Math.ceil(cards.length / BUNDLE_SIZE);
    
    for (let i = 0; i < numBundles; i++) {
      const startIdx = i * BUNDLE_SIZE;
      const bundleCards = cards.slice(startIdx, startIdx + BUNDLE_SIZE);
      
      bundles.push({
        name: `${typeName} Bundle ${i + 1}`,
        type: typeName,
        bundleNumber: i + 1,
        rating: 'A',
        price: 50,
        cards: bundleCards,
        imageUrl: bundleCards[0]?.imageUrl || '',
      });
    }
  }
  
  return bundles;
}

function generateTypeScriptFile(bundles) {
  const sortedBundles = bundles.sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.bundleNumber - b.bundleNumber;
  });
  
  const bundleData = JSON.stringify(sortedBundles, null, 2);
  
  const content = `// Auto-generated bundle data from YGOProDeck API
// DO NOT EDIT MANUALLY - Run: node scripts/generate-bundles.mjs

export interface BundleCard {
  id: number;
  name: string;
  type: string;
  desc: string;
  imageUrl: string;
}

export interface CardBundle {
  name: string;
  type: string;
  bundleNumber: number;
  rating: 'A';
  price: number;
  cards: BundleCard[];
  imageUrl: string;
}

export const CARD_BUNDLES: CardBundle[] = ${bundleData};

// Get bundles by type
export function getBundlesByType(type: string): CardBundle[] {
  return CARD_BUNDLES.filter(bundle => bundle.type === type);
}

// Get all unique types
export function getAllBundleTypes(): string[] {
  const types = new Set(CARD_BUNDLES.map(b => b.type));
  return Array.from(types).sort();
}

// Get bundle by name
export function getBundleByName(name: string): CardBundle | undefined {
  return CARD_BUNDLES.find(bundle => bundle.name === name);
}
`;
  
  return content;
}

async function main() {
  try {
    console.log('📡 Fetching all cards from YGOProDeck API...\n');
    const allCards = await fetchAllCards();
    console.log(`\n✅ Fetched ${allCards.length} total cards\n`);
    
    console.log('🔍 Filtering cards without archetypes...');
    const nonArchetypeCards = filterNonArchetypeCards(allCards);
    console.log(`✅ Found ${nonArchetypeCards.length} non-archetype cards\n`);
    
    console.log('📊 Grouping cards by type...');
    const groups = groupCardsByType(nonArchetypeCards);
    const groupSummary = Object.entries(groups)
      .map(([type, cards]) => `   ${type}: ${cards.length} cards`)
      .join('\n');
    console.log(groupSummary);
    console.log(`✅ Created ${Object.keys(groups).length} type groups\n`);
    
    console.log('📦 Creating bundles (30 cards each)...');
    const bundles = createBundles(groups);
    console.log(`✅ Generated ${bundles.length} bundles\n`);
    
    console.log('💾 Writing to file...');
    const tsContent = generateTypeScriptFile(bundles);
    fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf8');
    console.log(`✅ Wrote ${OUTPUT_FILE}\n`);
    
    console.log('📊 Summary:');
    console.log(`   Total cards: ${nonArchetypeCards.length}`);
    console.log(`   Total bundles: ${bundles.length}`);
    console.log(`   Types: ${Object.keys(groups).length}`);
    console.log(`   Average cards per bundle: ${(nonArchetypeCards.length / bundles.length).toFixed(1)}`);
    
    console.log('\n🎉 Bundle generation complete!');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

main();
