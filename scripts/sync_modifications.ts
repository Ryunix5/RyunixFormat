import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchModifications() {
  console.log('Fetching card modifications from database...\n');
  
  const { data, error } = await supabase
    .from('card_modifications')
    .select('*')
    .eq('key', 'card_mods')
    .single();
  
  if (error) {
    console.error('Error fetching modifications:', error);
    return;
  }
  
  if (!data || !data.data || Object.keys(data.data).length === 0) {
    console.log('No modifications found in database.');
    return;
  }
  
  const mods = data.data;
  const archetypes = Object.keys(mods);
  
  console.log(`Found ${archetypes.length} modified entries:\n`);
  console.log('='.repeat(80));
  
  // Show full structure
  console.log(JSON.stringify(mods, null, 2));
  
  console.log('\n' + '='.repeat(80));
  console.log(`\nTotal modifications: ${archetypes.length}`);
  
  // Return the modifications for further processing
  return mods;
}

fetchModifications();
