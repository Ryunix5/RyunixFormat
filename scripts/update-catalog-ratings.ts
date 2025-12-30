#!/usr/bin/env tsx
/**
 * Script to update yugioh-catalog.ts with ratings/prices from database
 * Run: npx tsx scripts/update-catalog-ratings.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { CardModificationsORM } from '../src/sdk/database/orm/orm_card_modifications';

async function main() {
  console.log('🔄 Syncing catalog ratings from database...\n');

  // Load modifications from database
  const orm = CardModificationsORM.getInstance();
  const mods = await orm.getMods();
  
  if (!mods?.archetypes) {
    console.log('❌ No archetype modifications found in database');
    return;
  }

  const archetypeMods = mods.archetypes as Record<string, { rating?: string; price?: number; is_removed?: boolean }>;
  console.log(`📊 Found ${Object.keys(archetypeMods).length} archetype modifications\n`);

  // Read catalog file
  const catalogPath = path.join(__dirname, '../src/data/yugioh-catalog.ts');
  let content = fs.readFileSync(catalogPath, 'utf-8');
  
  let updatedCount = 0;

  // Update each archetype in catalog
  for (const [archetypeName, mod] of Object.entries(archetypeMods)) {
    if (!mod.rating || mod.price === undefined) continue;

    // Pattern: { name: "ArchetypeName", rating: "X", price: 123, imageUrl: ... },
    const escapedName = archetypeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      `(\\{\\s*name:\\s*"${escapedName}"\\s*,\\s*rating:\\s*)"[^"]*"(\\s*,\\s*price:\\s*)\\d+`,
      'g'
    );

    const oldContent = content;
    content = content.replace(pattern, `$1"${mod.rating}"$2${mod.price}`);

    if (content !== oldContent) {
      console.log(`✅ Updated ${archetypeName}: rating=${mod.rating}, price=${mod.price}`);
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    // Write back to file
    fs.writeFileSync(catalogPath, content, 'utf-8');
    console.log(`\n✨ Successfully updated ${updatedCount} archetypes in yugioh-catalog.ts`);
  } else {
    console.log('\n✨ No changes needed - catalog is up to date');
  }
}

main().catch(console.error);
