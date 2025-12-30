import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { archetypeName, rating, price } = req.body;

  if (!archetypeName || !rating || price === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update the archetype_modifications table
    const { data, error } = await supabase
      .from('archetype_modifications')
      .upsert(
        {
          archetype_name: archetypeName,
          rating: rating,
          price: price,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'archetype_name',
        }
      )
      .select();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`✅ Updated ${archetypeName} in database: rating=${rating}, price=${price}`);
    return res.status(200).json({
      success: true,
      message: `Updated ${archetypeName} to ${rating} (${price} coins)`,
      data: data,
    });
  } catch (error) {
    console.error('Catalog update error:', error);
    return res.status(500).json({
      error: 'Failed to update catalog',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

