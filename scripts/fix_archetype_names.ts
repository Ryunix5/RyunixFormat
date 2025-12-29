import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ARCHETYPE_NAME_MAPPING, ARCHETYPES_TO_REMOVE } from './archetype_mappings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const catalogPath = path.join(__dirname, '..', 'src', 'data', 'yugioh-catalog.ts');

async function fixArchetypeNames() {
  console.log('Reading catalog file...\n');
  
  let content = fs.readFileSync(catalogPath, 'utf-8');
  
  let fixCount = 0;
  let removeCount = 0;
  
  // First, remove duplicate archetypes
  console.log('Removing duplicate archetypes...\n');
  for (const archetypeName of ARCHETYPES_TO_REMOVE) {
    const regex = new RegExp(`  \\{ name: "${archetypeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}", rating: "[^"]+", price: \\d+.*?\\},?\n`, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, '');
      removeCount += matches.length;
      console.log(`  ✓ Removed: ${archetypeName}`);
    }
  }
  
  console.log(`\nRemoved ${removeCount} duplicate entries\n`);
  console.log('Fixing archetype name mismatches...\n');
  
  // Then fix name mismatches
  for (const [oldName, newName] of Object.entries(ARCHETYPE_NAME_MAPPING)) {
    // Skip if it's in the remove list
    if (ARCHETYPES_TO_REMOVE.includes(oldName)) continue;
    
    const oldPattern = `name: "${oldName}"`;
    const newPattern = `name: "${newName}"`;
    
    if (content.includes(oldPattern)) {
      content = content.replace(new RegExp(oldPattern, 'g'), newPattern);
      fixCount++;
      console.log(`  ✓ ${oldName} → ${newName}`);
    }
  }
  
  console.log(`\n✅ Fixed ${fixCount} archetype names`);
  console.log(`✅ Removed ${removeCount} duplicates\n`);
  
  // Write back
  fs.writeFileSync(catalogPath, content, 'utf-8');
  console.log('✅ Catalog file updated successfully!\n');
}

fixArchetypeNames().catch(console.error);
