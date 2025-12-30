import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { BanStatus } from '@/data/banlist';

// Lazy initialization - only create client when needed
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  // Try multiple environment variable names
  const supabaseUrl = 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.VITE_SUPABASE_URL ||
    '';
  
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  console.log('[INIT] Environment check:');
  console.log('[INIT] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.log('[INIT] SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'SET' : 'NOT SET');
  console.log('[INIT] Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('supabase')).join(', '));

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  }

  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

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
  const batchSize = 1000; // Reduced from 2500 for faster responses
  let offset = 0;
  let totalFetched = 0;
  const maxCards = 50000;
  const maxRetries = 3;
  const requestTimeoutMs = 25000; // 25 seconds per batch (Vercel: 30-60s timeout)

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
          console.log(`[BANLIST] Batch ${batchNum} - Timeout after ${requestTimeoutMs}ms, aborting`);
          abortController.abort();
        }, requestTimeoutMs);

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
  const startTime = Date.now();
  const overallTimeoutMs = 50000; // 50 second overall limit (Vercel Pro: 60s)
  const testMode = req.query.test === 'true' || req.body?.test === true; // Allow testing without DB save
  
  console.log(`\n[API-${requestId}] ===== FETCH BANLIST REQUEST =====`);
  console.log(`[API-${requestId}] Method: ${req.method}`);
  console.log(`[API-${requestId}] Test mode: ${testMode}`);
  console.log(`[API-${requestId}] Timestamp: ${new Date().toISOString()}`);

  try {
    // Initialize Supabase client
    let supabase;
    try {
      supabase = getSupabaseClient();
      console.log(`[API-${requestId}] ✅ Supabase client initialized`);
    } catch (initError) {
      const msg = initError instanceof Error ? initError.message : String(initError);
      console.error(`[API-${requestId}] ❌ Failed to initialize Supabase: ${msg}`);
      
      // Include diagnostic info about env vars
      const diagnostics = {
        has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        env_vars_available: Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('supabase')),
      };
      
      return res.status(500).json({
        error: 'Server configuration error',
        details: msg,
        diagnostics,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[API-${requestId}] Starting TCG banlist fetch...`);

    // Fetch latest TCG banlist with timeout protection
    let bannedCards;
    try {
      const timeRemaining = overallTimeoutMs - (Date.now() - startTime);
      if (timeRemaining < 30000) {
        throw new Error(`Not enough time to complete request (${timeRemaining}ms remaining)`);
      }
      
      bannedCards = await Promise.race([
        fetchTCGBanlist(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Overall request timeout after ${overallTimeoutMs}ms`)),
            timeRemaining
          )
        ),
      ]);
    } catch (fetchError) {
      const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      const stack = fetchError instanceof Error ? fetchError.stack : '';
      console.error(`[API-${requestId}] ❌ Failed to fetch banlist: ${msg}`);
      if (stack) {
        console.error(`[API-${requestId}] Stack: ${stack}`);
      }
      return res.status(500).json({
        error: 'Failed to fetch TCG banlist',
        details: msg,
        timestamp: new Date().toISOString(),
      });
    }
    
    console.log(`[API-${requestId}] ✅ Fetched ${bannedCards.length} banned cards`);

    // Prepare records for database
    const records = bannedCards.map((card) => ({
      card_name: card.name,
      ban_status: card.status,
      last_updated: new Date().toISOString(),
      source: 'tcg' as const,
    }));

    // If test mode, skip database save
    if (testMode) {
      const elapsed = Date.now() - startTime;
      console.log(`[API-${requestId}] ✅ Test mode - skipped database save (${elapsed}ms)`);
      return res.status(200).json({
        success: true,
        message: `Fetched ${bannedCards.length} cards (test mode - not saved)`,
        cardsUpdated: 0,
        cardsFetched: bannedCards.length,
        sampleCards: bannedCards.slice(0, 5),
        timestamp: new Date().toISOString(),
        duration_ms: elapsed,
      });
    }

    console.log(`[API-${requestId}] Saving ${records.length} records to Supabase...`);
    
    try {
      const { error } = await supabase
        .from('banlist')
        .upsert(records as any, { onConflict: 'card_name' });

      if (error) {
        console.error(`[API-${requestId}] ❌ Supabase error:`, error.message);
        console.error(`[API-${requestId}] Supabase error details:`, error);
        throw new Error(`Database error: ${error.message}`);
      }
    } catch (dbError) {
      const dbMsg = dbError instanceof Error ? dbError.message : String(dbError);
      console.error(`[API-${requestId}] ⚠️ Failed to save to database: ${dbMsg}`);
      // Still return success with the fetched cards, even if DB save failed
      const elapsed = Date.now() - startTime;
      return res.status(200).json({
        success: true,
        message: `Fetched ${bannedCards.length} cards but failed to save to database`,
        cardsUpdated: 0,
        cardsFetched: bannedCards.length,
        databaseError: dbMsg,
        timestamp: new Date().toISOString(),
        duration_ms: elapsed,
      });
    }

    const elapsed = Date.now() - startTime;
    console.log(`[API-${requestId}] ✅ Successfully saved to database (${elapsed}ms)`);
    console.log(`[API-${requestId}] ===== REQUEST COMPLETE ====\n`);

    return res.status(200).json({
      success: true,
      message: `Updated banlist with ${bannedCards.length} cards`,
      cardsUpdated: bannedCards.length,
      timestamp: new Date().toISOString(),
      duration_ms: elapsed,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    const elapsed = Date.now() - startTime;
    
    console.error(`[API-${requestId}] ❌ ERROR (${elapsed}ms): ${errorMessage}`);
    if (errorStack) {
      console.error(`[API-${requestId}] Stack trace:\n${errorStack}`);
    }
    console.error(`[API-${requestId}] ===== REQUEST FAILED ====\n`);

    return res.status(500).json({
      error: 'Failed to fetch and update banlist',
      details: errorMessage,
      timestamp: new Date().toISOString(),
      elapsed_ms: elapsed,
    });
  }
}
