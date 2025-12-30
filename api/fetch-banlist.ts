import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { BanStatus } from '@/data/banlist';

// Validate environment variables
// Try both NEXT_PUBLIC and VITE prefixes since user might use either
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing Supabase URL');
  console.error('Expected: NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL');
}

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('This is a REQUIRED environment variable for the API to work');
  console.error('Get it from: Supabase Dashboard → Settings → API → Service Role Secret Key');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

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
  const batchSize = 2500;
  let offset = 0;
  let totalFetched = 0;
  const maxCards = 50000;
  const maxRetries = 3;

  console.log('[BANLIST] Starting TCG banlist fetch from YGOPRODECK...');
  
  while (totalFetched < maxCards) {
    let retryCount = 0;
    let batchSuccess = false;
    let lastError: Error | null = null;

    while (retryCount < maxRetries && !batchSuccess) {
      try {
        const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${batchSize}&offset=${offset}`;
        const batchNum = Math.floor(offset / batchSize) + 1;
        
        if (retryCount > 0) {
          console.log(`[BANLIST] Batch ${batchNum} - Retry ${retryCount}/${maxRetries - 1}`);
        } else {
          console.log(`[BANLIST] Batch ${batchNum} - Fetching ${batchSize} cards from offset ${offset}`);
        }

        const abortController = new AbortController();
        const timeoutHandle = setTimeout(() => {
          console.log(`[BANLIST] Batch ${batchNum} - Timeout after 45s, aborting`);
          abortController.abort();
        }, 45000);

        let response: Response;
        try {
          response = await fetch(url, {
            signal: abortController.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
        } catch (fetchError) {
          clearTimeout(timeoutHandle);
          const fetchErrorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
          console.error(`[BANLIST] Batch ${batchNum} - Fetch failed: ${fetchErrorMsg}`);
          lastError = new Error(`Fetch failed: ${fetchErrorMsg}`);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(r => setTimeout(r, 2000 * retryCount));
          }
          continue;
        }

        clearTimeout(timeoutHandle);

        console.log(`[BANLIST] Batch ${batchNum} - Response status: ${response.status}`);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          console.error(`[BANLIST] Batch ${batchNum} - HTTP ${response.status}: ${errorBody.substring(0, 200)}`);
          lastError = new Error(`HTTP ${response.status}`);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(r => setTimeout(r, 2000 * retryCount));
          }
          continue;
        }

        const responseText = await response.text().catch((e) => {
          console.error(`[BANLIST] Batch ${batchNum} - Failed to read response: ${e}`);
          throw e;
        });

        if (!responseText || responseText.trim().length === 0) {
          console.log(`[BANLIST] Batch ${batchNum} - Empty response, stopping pagination`);
          batchSuccess = true;
          break;
        }

        console.log(`[BANLIST] Batch ${batchNum} - Response size: ${responseText.length} bytes`);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`[BANLIST] Batch ${batchNum} - JSON parse failed. First 200 chars: ${responseText.substring(0, 200)}`);
          lastError = new Error(`Invalid JSON`);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(r => setTimeout(r, 2000 * retryCount));
          }
          continue;
        }

        if (!data || !Array.isArray(data.data)) {
          console.error(`[BANLIST] Batch ${batchNum} - Invalid response format (no data array)`);
          lastError = new Error(`Invalid response format`);
          retryCount++;
          continue;
        }

        const cardsInBatch = data.data.length;
        console.log(`[BANLIST] Batch ${batchNum} - ✅ Received ${cardsInBatch} cards`);

        // Extract banned cards
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
        
        console.log(`[BANLIST] Batch ${batchNum} - Found ${batchBans} banned cards`);

        if (cardsInBatch < batchSize) {
          console.log('[BANLIST] Reached end of database');
          batchSuccess = true;
          break;
        }

        totalFetched += cardsInBatch;
        offset += batchSize;
        batchSuccess = true;

      } catch (error) {
        const batchNum = Math.floor(offset / batchSize) + 1;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[BANLIST] Batch ${batchNum} - Unexpected error: ${errorMsg}`);
        lastError = error instanceof Error ? error : new Error(errorMsg);
        retryCount++;
      }
    }

    if (!batchSuccess) {
      const batchNum = Math.floor(offset / batchSize) + 1;
      console.error(`[BANLIST] Batch ${batchNum} - Failed after ${maxRetries} attempts`);
      if (bannedCards.length === 0) {
        throw lastError || new Error('Failed to fetch any cards from YGOPRODECK');
      }
      console.log('[BANLIST] Returning partial results');
      break;
    }
  }

  console.log(`[BANLIST] ✅ Fetch complete: ${bannedCards.length} banned cards from ${totalFetched} total`);
  return bannedCards;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n[API-${requestId}] ===== FETCH BANLIST REQUEST =====`);
  console.log(`[API-${requestId}] Method: ${req.method}`);
  console.log(`[API-${requestId}] Timestamp: ${new Date().toISOString()}`);

  try {
    // Validate environment first
    if (!supabaseUrl || !supabaseKey) {
      console.error(`[API-${requestId}] ❌ Supabase config missing`);
      console.error(`[API-${requestId}] URL set: ${!!supabaseUrl}, Key set: ${!!supabaseKey}`);
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Missing Supabase environment variables',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[API-${requestId}] ✅ Supabase config OK`);
    console.log(`[API-${requestId}] Starting TCG banlist fetch...`);

    // Fetch latest TCG banlist
    const bannedCards = await fetchTCGBanlist();
    console.log(`[API-${requestId}] ✅ Fetched ${bannedCards.length} banned cards`);

    // Prepare records for database
    const records = bannedCards.map((card) => ({
      card_name: card.name,
      ban_status: card.status,
      last_updated: new Date().toISOString(),
      source: 'tcg' as const,
    }));

    console.log(`[API-${requestId}] Saving ${records.length} records to Supabase...`);
    
    const { error } = await supabase
      .from('banlist')
      .upsert(records, { onConflict: 'card_name' });

    if (error) {
      console.error(`[API-${requestId}] ❌ Supabase error:`, error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`[API-${requestId}] ✅ Successfully saved to database`);
    console.log(`[API-${requestId}] ===== REQUEST COMPLETE ====\n`);

    return res.status(200).json({
      success: true,
      message: `Updated banlist with ${bannedCards.length} cards`,
      cardsUpdated: bannedCards.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error(`[API-${requestId}] ❌ ERROR: ${errorMessage}`);
    if (errorStack) {
      console.error(`[API-${requestId}] Stack trace:\n${errorStack}`);
    }
    console.error(`[API-${requestId}] ===== REQUEST FAILED ====\n`);

    return res.status(500).json({
      error: 'Failed to fetch and update banlist',
      details: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
