import { ARCHETYPE_DECKS } from '../src/data/yugioh-catalog.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface CardData {
  id: number;
  name: string;
  card_images: Array<{ image_url_small: string }>;
}

async function fetchCardId(archetypeName: string): Promise<number | null> {
  const searchQueries = [
    archetypeName,
    archetypeName.replace(/[^a-zA-Z0-9\s]/g, ''), // Remove special chars
    archetypeName.split(' ')[0], // First word only
  ];

  for (const query of searchQueries) {
    try {
      const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}&num=5&offset=0`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          // Find card that best matches the archetype name
          const card = data.data.find((c: CardData) => 
            c.name.toLowerCase().includes(archetypeName.toLowerCase())
          ) || data.data[0];
          
          console.log(`  ✓ ${archetypeName} -> ${card.name} (ID: ${card.id})`);
          return card.id;
        }
      }
    } catch (error) {
      // Continue to next query
    }
    
    await delay(100); // Small delay between attempts
  }
  
  console.log(`  ✗ ${archetypeName} - No match found`);
  return null;
}

async function fixAllImages() {
  console.log('Checking and fixing broken archetype images...\n');
  
  const fixes: Array<{ name: string; oldId: number; newId: number }> = [];
  const stillBroken: string[] = [];
  let checkedCount = 0;
  
  for (const archetype of ARCHETYPE_DECKS) {
    if (!archetype.imageUrl) continue;
    
    checkedCount++;
    const match = archetype.imageUrl.match(/\/(\d+)\.jpg$/);
    if (!match) continue;
    
    const currentId = parseInt(match[1]);
    
    // Test if current image works
    try {
      const response = await fetch(archetype.imageUrl, { method: 'HEAD' });
      if (response.ok) {
        continue; // Image works, skip
      }
    } catch (error) {
      // Image broken, try to fix
    }
    
    // Image is broken, find correct ID
    console.log(`Fixing: ${archetype.name}...`);
    const newId = await fetchCardId(archetype.name);
    
    if (newId && newId !== currentId) {
      fixes.push({ name: archetype.name, oldId: currentId, newId });
    } else if (!newId) {
      stillBroken.push(archetype.name);
    }
    
    await delay(200); // Rate limit API calls
    
    if (checkedCount % 10 === 0) {
      console.log(`\nProgress: ${checkedCount}/${ARCHETYPE_DECKS.length}\n`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\nFixed: ${fixes.length}`);
  console.log(`Still broken: ${stillBroken.length}\n`);
  
  if (fixes.length > 0) {
    // Generate replacement code
    const catalogPath = path.join(__dirname, '..', 'src', 'data', 'yugioh-catalog.ts');
    let content = fs.readFileSync(catalogPath, 'utf-8');
    
    for (const fix of fixes) {
      const oldPattern = `getCardImageUrl(${fix.oldId})`;
      const newPattern = `getCardImageUrl(${fix.newId})`;
      content = content.replace(oldPattern, newPattern);
    }
    
    fs.writeFileSync(catalogPath, content, 'utf-8');
    console.log(`\n✅ Updated ${fixes.length} card IDs in yugioh-catalog.ts\n`);
    
    // Print summary
    console.log('FIXES APPLIED:');
    fixes.forEach(f => console.log(`  ${f.name}: ${f.oldId} → ${f.newId}`));
  }
  
  if (stillBroken.length > 0) {
    console.log('\n\nSTILL BROKEN (no match found):');
    stillBroken.forEach(name => console.log(`  - ${name}`));
  }
}

fixAllImages().catch(console.error);
