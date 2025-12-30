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

// Fetch official Konami TCG banlist from YGOProDeck
// YGOProDeck maintains the official banlist data
async function fetchTCGBanlist(): Promise<Array<{ name: string; status: BanStatus }>> {
  const bannedCards: Array<{ name: string; status: BanStatus }> = [];
  
  console.log('[BANLIST] Fetching official Konami TCG banlist from YGOProDeck...');
  
  const requestTimeoutMs = 10000; // 10 seconds for banlist fetch
  const maxRetries = 2;
  
  // Try multiple possible endpoints
  const endpoints = [
    'https://db.ygoprodeck.com/api/v7/bans.php',
    'https://db.ygoprodeck.com/api/v7/banlist',
    'https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=1',
  ];
  
  for (const baseUrl of endpoints) {
    for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
      try {
        if (retryCount > 0) {
          console.log(`[BANLIST] Retry ${retryCount}/${maxRetries - 1} with ${baseUrl}`);
        } else {
          console.log(`[BANLIST] Trying endpoint: ${baseUrl}`);
        }

        const abortController = new AbortController();
        const timeoutHandle = setTimeout(() => {
          console.log(`[BANLIST] Timeout after ${requestTimeoutMs}ms, aborting`);
          abortController.abort();
        }, requestTimeoutMs);

        let response: Response;
        try {
          response = await fetch(baseUrl, {
            signal: abortController.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
        } catch (fetchError) {
          clearTimeout(timeoutHandle);
          const fetchErrorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
          console.error(`[BANLIST] Fetch failed: ${fetchErrorMsg}`);
          continue;
        }

        clearTimeout(timeoutHandle);
        console.log(`[BANLIST] Response status: ${response.status}`);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          console.error(`[BANLIST] HTTP ${response.status}: ${errorBody.substring(0, 200)}`);
          continue;
        }

        const responseText = await response.text();
        if (!responseText || responseText.trim().length === 0) {
          console.error(`[BANLIST] Empty response from ${baseUrl}`);
          continue;
        }

        console.log(`[BANLIST] Response size: ${responseText.length} bytes, first 500 chars: ${responseText.substring(0, 500)}`);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`[BANLIST] JSON parse failed`);
          continue;
        }

        if (!data) {
          console.error(`[BANLIST] No data in response`);
          continue;
        }

        // Handle different response formats
        let forbidden: any[] = [];
        let limited: any[] = [];
        let semiLimited: any[] = [];

        // Format 1: { forbidden: [...], limited: [...], semi_limited: [...] }
        if (data.forbidden || data.limited || data.semi_limited) {
          forbidden = Array.isArray(data.forbidden) ? data.forbidden : [];
          limited = Array.isArray(data.limited) ? data.limited : [];
          semiLimited = Array.isArray(data.semi_limited) ? data.semi_limited : [];
        }
        // Format 2: { banlist: { forbidden: [...], ... } }
        else if (data.banlist) {
          forbidden = Array.isArray(data.banlist.forbidden) ? data.banlist.forbidden : [];
          limited = Array.isArray(data.banlist.limited) ? data.banlist.limited : [];
          semiLimited = Array.isArray(data.banlist.semi_limited) ? data.banlist.semi_limited : [];
        }
        // Format 3: Array of cards with ban status
        else if (Array.isArray(data)) {
          const response = data as any[];
          for (const item of response) {
            if (item.banlist_info) {
              const banStatus = item.banlist_info.ban_tcg;
              if (banStatus === 'Forbidden') forbidden.push(item);
              else if (banStatus === 'Limited') limited.push(item);
              else if (banStatus === 'Semi-Limited') semiLimited.push(item);
            }
          }
        }

        if (forbidden.length === 0 && limited.length === 0 && semiLimited.length === 0) {
          console.error(`[BANLIST] No banned cards found in response`);
          continue;
        }

        console.log(`[BANLIST] ✅ Forbidden: ${forbidden.length}, Limited: ${limited.length}, Semi-Limited: ${semiLimited.length}`);

        for (const card of forbidden) {
          bannedCards.push({ name: card.name || card.card_name, status: 'forbidden' });
        }
        for (const card of limited) {
          bannedCards.push({ name: card.name || card.card_name, status: 'limited' });
        }
        for (const card of semiLimited) {
          bannedCards.push({ name: card.name || card.card_name, status: 'semi-limited' });
        }

        console.log(`[BANLIST] ✅ Fetched official Konami banlist: ${bannedCards.length} banned cards`);
        return bannedCards;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[BANLIST] Error with ${baseUrl}: ${errorMsg}`);
      }
    }
  }

  throw new Error('Failed to fetch banlist from all endpoints');
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
  const overallTimeoutMs = 20000; // 20 second overall limit (banlist endpoint is fast)
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
      console.log(`[API-${requestId}] Time remaining: ${timeRemaining}ms`);
      
      if (timeRemaining < 8000) {
        // Not enough time even for one batch
        throw new Error(`Not enough time to complete request (${timeRemaining}ms remaining, need ~10s)`);
      }
      
      const fetchPromise = fetchTCGBanlist();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Overall request timeout after ${timeRemaining}ms`)),
          Math.max(5000, timeRemaining - 2000) // Leave 2s buffer for DB save
        )
      );
      
      console.log(`[API-${requestId}] Racing fetch against ${timeRemaining}ms timeout...`);
      bannedCards = await Promise.race([fetchPromise, timeoutPromise]);
      console.log(`[API-${requestId}] ✅ Fetch race completed, got ${bannedCards.length} cards`);
    } catch (fetchError) {
      const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      const stack = fetchError instanceof Error ? fetchError.stack : '';
      console.error(`[API-${requestId}] ❌ Failed to fetch banlist: ${msg}`);
      if (stack) {
        console.error(`[API-${requestId}] Stack: ${stack.substring(0, 500)}`);
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
