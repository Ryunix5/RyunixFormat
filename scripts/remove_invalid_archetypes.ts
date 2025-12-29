import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ARCHETYPES_TO_REMOVE } from './archetype_mappings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const catalogPath = path.join(__dirname, '..', 'src', 'data', 'yugioh-catalog.ts');

async function removeInvalidEntries() {
  console.log('Reading catalog file...\n');
  
  let content = fs.readFileSync(catalogPath, 'utf-8');
  let removeCount = 0;
  
  console.log('Removing invalid archetype entries...\n');
  
  for (const archetypeName of ARCHETYPES_TO_REMOVE) {
    // Escape special regex characters
    const escapedName = archetypeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Match the entire line including the comma and newline
    const regex = new RegExp(`  \\{ name: "${escapedName}", rating: "[^"]+", price: \\d+, imageUrl: getCardImageUrl\\(\\d+\\) \\},? \\/\\/ [^\\n]+\\n`, 'g');
    
    const beforeCount = (content.match(regex) || []).length;
    if (beforeCount > 0) {
      content = content.replace(regex, '');
      removeCount += beforeCount;
      console.log(`  ✓ Removed: ${archetypeName} (${beforeCount} instance${beforeCount > 1 ? 's' : ''})`);
    }
  }
  
  console.log(`\n✅ Removed ${removeCount} invalid entries\n`);
  
  // Write back
  fs.writeFileSync(catalogPath, content, 'utf-8');
  console.log('✅ Catalog file updated successfully!\n');
}

removeInvalidEntries().catch(console.error);
