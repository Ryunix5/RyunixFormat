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
// Fetches all cards and extracts their TCG banlist status
async function fetchTCGBanlist(): Promise<Array<{ name: string; status: BanStatus }>> {
  try {
    const bannedCards: Array<{ name: string; status: BanStatus }> = [];
    
    console.log('Fetching TCG banlist from YGOPRODECK (14000+ cards)...');
    
    // Fetch all cards - YGOPRODECK returns all cards by default
    // Must include User-Agent header to avoid 400 Bad Request
    const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.statusText} (${response.status})`);
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('API returned empty response');
    }
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse JSON:', text.substring(0, 200));
      throw new Error('Invalid JSON response from API');
    }
    
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error(`Invalid API response format: ${JSON.stringify(data).substring(0, 200)}`);
    }

    console.log(`Received ${data.data.length} cards from API`);

    // Parse banlist from cards
    data.data.forEach((card: any) => {
      if (card.banlist_info && card.banlist_info.ban_tcg) {
        const status = card.banlist_info.ban_tcg;
        let banStatus: BanStatus = 'unlimited';
        
        if (status === 'Forbidden') {
          banStatus = 'forbidden';
        } else if (status === 'Limited') {
          banStatus = 'limited';
        } else if (status === 'Semi-Limited') {
          banStatus = 'semi-limited';
        }
        
        if (banStatus !== 'unlimited') {
          bannedCards.push({ name: card.name, status: banStatus });
        }
      }
    });

    console.log(`Extracted ${bannedCards.length} banned cards from YGOPRODECK`);
    return bannedCards;
  } catch (error) {
    console.error('Error fetching TCG banlist:', error);
    throw error;
  }
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
