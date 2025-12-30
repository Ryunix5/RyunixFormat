import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { BanStatus } from '@/data/banlist';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface YGOProdeckBanlistCard {
  id: number;
  name: string;
  desc: string;
  type: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  attribute?: string;
  card_sets?: Array<{ set_name: string; set_code: string; set_rarity: string; set_price: string }>;
  card_images?: Array<{ id: number; image_url: string; image_url_small: string; image_url_cropped: string }>;
  card_prices?: Array<{ cardmarket_price: string; tcgplayer_price: string; ebay_price: string; amazon_price: string; coolstuffinc_price: string }>;
}

// Parse banlist from YGOPRODECK
// Fetches cards in batches and extracts their TCG banlist status
async function fetchTCGBanlist(): Promise<Array<{ name: string; status: BanStatus }>> {
  const bannedCards: Array<{ name: string; status: BanStatus }> = [];
  const batchSize = 5000;
  let offset = 0;
  let totalFetched = 0;
  const maxCards = 50000; // Safety limit to prevent infinite loops

  console.log('Starting TCG banlist fetch from YGOPRODECK...');
  
  while (totalFetched < maxCards) {
    try {
      const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${batchSize}&offset=${offset}`;
      console.log(`[Batch ${Math.floor(offset / batchSize) + 1}] Requesting: ${url}`);

      // Create fetch request with reasonable timeout via AbortController
      const abortController = new AbortController();
      const timeoutHandle = setTimeout(() => abortController.abort(), 60000); // 60 second timeout per batch

      let response;
      try {
        response = await fetch(url, {
          signal: abortController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
      } finally {
        clearTimeout(timeoutHandle);
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[Batch ${Math.floor(offset / batchSize) + 1}] HTTP ${response.status} error. Response: ${errorBody.substring(0, 200)}`);
        // If this is the first batch and we get an error, throw. Otherwise stop pagination.
        if (offset === 0) {
          throw new Error(`API returned HTTP ${response.status}`);
        } else {
          console.log('Stopping pagination due to error on subsequent batch');
          break;
        }
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim().length === 0) {
        console.warn(`[Batch ${Math.floor(offset / batchSize) + 1}] Empty response, stopping pagination`);
        break;
      }

      // Debug: Log first 500 characters of response to check if it's HTML or JSON
      const responseStart = responseText.substring(0, 100);
      console.log(`[Batch ${Math.floor(offset / batchSize) + 1}] Response starts with: ${responseStart}`);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // Check if it's HTML error response
        if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
          console.error(`[Batch ${Math.floor(offset / batchSize) + 1}] Received HTML instead of JSON. This likely means the API returned an error page.`);
          console.error(`First 500 chars: ${responseText.substring(0, 500)}`);
          throw new Error(`API returned HTML error page instead of JSON. First part: ${responseText.substring(0, 200)}`);
        }
        console.error(`[Batch ${Math.floor(offset / batchSize) + 1}] JSON parse error. Response: ${responseText.substring(0, 500)}`);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }

      if (!data || !Array.isArray(data.data)) {
        console.error(`[Batch ${Math.floor(offset / batchSize) + 1}] Invalid response format`);
        break;
      }

      const cardsInBatch = data.data.length;
      console.log(`[Batch ${Math.floor(offset / batchSize) + 1}] Received ${cardsInBatch} cards`);

      // Extract banned cards from this batch
      let batchBans = 0;
      for (const card of data.data) {
        if (card.banlist_info?.ban_tcg) {
          const banStatus = card.banlist_info.ban_tcg;
          let status: BanStatus = 'unlimited';
          
          if (banStatus === 'Forbidden') {
            status = 'forbidden';
          } else if (banStatus === 'Limited') {
            status = 'limited';
          } else if (banStatus === 'Semi-Limited') {
            status = 'semi-limited';
          }
          
          if (status !== 'unlimited') {
            bannedCards.push({ name: card.name, status });
            batchBans++;
          }
        }
      }
      
      console.log(`[Batch ${Math.floor(offset / batchSize) + 1}] Found ${batchBans} banned cards`);

      // If we got fewer cards than requested, we've reached the end
      if (cardsInBatch < batchSize) {
        console.log('Reached end of database (fewer cards than batch size)');
        break;
      }

      totalFetched += cardsInBatch;
      offset += batchSize;

    } catch (error) {
      console.error(`Error fetching batch at offset ${offset}:`, error instanceof Error ? error.message : error);
      // If we haven't fetched anything yet, this is a critical error
      if (bannedCards.length === 0) {
        throw error;
      }
      // Otherwise, return what we have so far
      break;
    }
  }

  console.log(`✅ Banlist fetch complete: ${bannedCards.length} banned cards found (from ${totalFetched} total cards)`);
  return bannedCards;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch latest TCG banlist
    const bannedCards = await fetchTCGBanlist();

    // Update database with TCG banlist (source: 'tcg')
    const records = bannedCards.map((card) => ({
      card_name: card.name,
      ban_status: card.status,
      last_updated: new Date().toISOString(),
      source: 'tcg' as const,
    }));

    const { error } = await supabase
      .from('banlist')
      .upsert(records, { onConflict: 'card_name' });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `Updated banlist with ${bannedCards.length} cards`,
      cardsUpdated: bannedCards.length,
    });
  } catch (error) {
    console.error('Error in fetch-banlist:', error);
    return res.status(500).json({
      error: 'Failed to fetch and update banlist',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
