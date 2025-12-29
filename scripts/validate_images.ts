import { ARCHETYPE_DECKS } from '../src/data/yugioh-catalog.js';

async function validateImages() {
  console.log(`Checking ${ARCHETYPE_DECKS.length} archetype images...\n`);
  
  const broken: string[] = [];
  const working: string[] = [];
  
  for (const archetype of ARCHETYPE_DECKS) {
    if (!archetype.imageUrl) {
      broken.push(`${archetype.name}: No image URL`);
      continue;
    }
    
    try {
      const response = await fetch(archetype.imageUrl, { method: 'HEAD' });
      if (response.ok) {
        working.push(archetype.name);
      } else {
        broken.push(`${archetype.name}: ${response.status} - ${archetype.imageUrl}`);
      }
    } catch (error) {
      broken.push(`${archetype.name}: ERROR - ${archetype.imageUrl}`);
    }
  }
  
  console.log(`\n✓ Working: ${working.length}`);
  console.log(`✗ Broken: ${broken.length}\n`);
  
  if (broken.length > 0) {
    console.log('BROKEN IMAGES:\n');
    broken.forEach(b => console.log(`  ✗ ${b}`));
  }
}

validateImages();
