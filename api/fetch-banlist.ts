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
  const batchSize = 2500; // Smaller batches for reliability
  let offset = 0;
  let totalFetched = 0;
  const maxCards = 50000; // Safety limit
  const maxRetries = 3;

  console.log('Starting TCG banlist fetch from YGOPRODECK...');
  
  while (totalFetched < maxCards) {
    let retryCount = 0;
    let batchSuccess = false;
    let lastError: Error | null = null;

    while (retryCount < maxRetries && !batchSuccess) {
      try {
        const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${batchSize}&offset=${offset}`;
        if (retryCount > 0) {
          console.log(`[Batch ${Math.floor(offset / batchSize) + 1}] Retry ${retryCount}/${maxRetries - 1} - Requesting: ${url}`);
        } else {
          console.log(`[Batch ${Math.floor(offset / batchSize) + 1}] Requesting: ${url}`);
        }

        // Create fetch request with timeout
        const abortController = new AbortController();
        const timeoutHandle = setTimeout(() => abortController.abort(), 45000); // 45 second timeout per batch

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
          const errorMsg = `HTTP ${response.status}: ${errorBody.substring(0, 150)}`;
          console.error(`[Batch ${Math.floor(offset / batchSize) + 1}] ${errorMsg}`);
          lastError = new Error(errorMsg);
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`[Batch] Waiting 2 seconds before retry...`);
            await new Promise(r => setTimeout(r, 2000)); // Wait before retry
          }
          continue;
        }

        const responseText = await response.text();
        if (!responseText || responseText.trim().length === 0) {
          console.warn(`[Batch ${Math.floor(offset / batchSize) + 1}] Empty response, stopping pagination`);
          batchSuccess = true; // End pagination
          break;
        }

        // Debug: Log first 100 characters of response to check if it's HTML or JSON
        const responseStart = responseText.substring(0, 100);
        console.log(`[Batch ${Math.floor(offset / batchSize) + 1}] Response starts with: ${responseStart.substring(0, 50)}...`);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          // Check if it's HTML error response
          if (responseText.substring(0, 200).includes('<html') || 
              responseText.substring(0, 200).includes('<!DOCTYPE') || 
              responseText.substring(0, 200).includes('A server') ||
              responseText.substring(0, 200).includes('error')) {
            console.error(`[Batch ${Math.floor(offset / batchSize) + 1}] ❌ Received HTML/error instead of JSON`);
            console.error(`Response: ${responseText.substring(0, 300)}`);
            lastError = new Error(`API returned HTML/error page: ${responseText.substring(0, 100)}`);
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`[Batch] Waiting 3 seconds before retry...`);
              await new Promise(r => setTimeout(r, 3000));
            }
            continue;
          }
          console.error(`[Batch ${Math.floor(offset / batchSize) + 1}] JSON parse failed. Response length: ${responseText.length}`);
          lastError = new Error(`Invalid JSON: ${responseText.substring(0, 100)}`);
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`[Batch] Waiting 2 seconds before retry...`);
            await new Promise(r => setTimeout(r, 2000));
          }
          continue;
        }

        if (!data || !Array.isArray(data.data)) {
          console.error(`[Batch ${Math.floor(offset / batchSize) + 1}] Invalid response format - no data array`);
          lastError = new Error(`API response missing data array`);
          retryCount++;
          continue;
        }

        const cardsInBatch = data.data.length;
        console.log(`[Batch ${Math.floor(offset / batchSize) + 1}] ✅ Success - ${cardsInBatch} cards received`);

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
          batchSuccess = true;
          break;
        }

        totalFetched += cardsInBatch;
        offset += batchSize;
        batchSuccess = true;

      } catch (error) {
        console.error(`[Batch] Fetch error (retry ${retryCount}):`, error instanceof Error ? error.message : error);
        lastError = error instanceof Error ? error : new Error(String(error));
        retryCount++;
      }
    }

    // If batch failed after all retries, decide whether to continue
    if (!batchSuccess) {
      console.error(`[Batch ${Math.floor(offset / batchSize) + 1}] ❌ Failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
      if (bannedCards.length === 0) {
        // No data at all, throw the error
        throw lastError || new Error('Failed to fetch banlist');
      }
      // We have some data, so return it
      console.log('Stopping pagination due to repeated failures');
      break;
    }
  }

  console.log(`✅ Banlist fetch complete: ${bannedCards.length} banned cards found (from ${totalFetched} total cards)`);
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

  try {
    // Validate environment first
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase environment variables missing');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Missing Supabase environment variables',
        timestamp: new Date().toISOString(),
      });
    }

    console.log('Starting banlist fetch request...');

    // Fetch latest TCG banlist
    const bannedCards = await fetchTCGBanlist();
    console.log(`✅ Successfully fetched ${bannedCards.length} banned cards`);

    // Update database with TCG banlist (source: 'tcg')
    const records = bannedCards.map((card) => ({
      card_name: card.name,
      ban_status: card.status,
      last_updated: new Date().toISOString(),
      source: 'tcg' as const,
    }));

    console.log(`Upserting ${records.length} records to Supabase...`);
    
    const { error } = await supabase
      .from('banlist')
      .upsert(records, { onConflict: 'card_name' });

    if (error) {
      console.error('❌ Supabase upsert error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`✅ Successfully updated banlist in database`);

    return res.status(200).json({
      success: true,
      message: `Updated banlist with ${bannedCards.length} cards`,
      cardsUpdated: bannedCards.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('❌ Error in fetch-banlist handler:', errorMessage);
    console.error('Stack:', errorStack);

    return res.status(500).json({
      error: 'Failed to fetch and update banlist',
      details: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
