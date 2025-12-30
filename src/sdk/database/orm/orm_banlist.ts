import { supabase } from '@/lib/supabase';
import type { BannedCard, BanStatus } from '@/data/banlist';

export class BanlistORM {
  private static instance: BanlistORM;

  private constructor() {}

  static getInstance(): BanlistORM {
    if (!BanlistORM.instance) {
      BanlistORM.instance = new BanlistORM();
    }
    return BanlistORM.instance;
  }

  // Get all banned cards
  async getBanlist(): Promise<Record<string, BannedCard>> {
    try {
      const { data, error } = await supabase
        .from('banlist')
        .select('*');

      if (error) throw error;

      const banlist: Record<string, BannedCard> = {};
      if (data) {
        data.forEach((card: any) => {
          banlist[card.card_name] = {
            cardName: card.card_name,
            banStatus: card.ban_status as BanStatus,
            lastUpdated: card.last_updated,
            source: card.source as 'tcg' | 'manual',
          };
        });
      }
      return banlist;
    } catch (error) {
      console.error('Error fetching banlist:', error);
      return {};
    }
  }

  // Get single banned card
  async getBannedCard(cardName: string): Promise<BannedCard | null> {
    try {
      const { data, error } = await supabase
        .from('banlist')
        .select('*')
        .eq('card_name', cardName)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

      return data
        ? {
            cardName: data.card_name,
            banStatus: data.ban_status as BanStatus,
            lastUpdated: data.last_updated,
            source: data.source as 'tcg' | 'manual',
          }
        : null;
    } catch (error) {
      console.error('Error fetching banned card:', error);
      return null;
    }
  }

  // Add or update a banned card
  async setBanStatus(
    cardName: string,
    banStatus: BanStatus,
    source: 'tcg' | 'manual' = 'manual'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('banlist')
        .upsert(
          {
            card_name: cardName,
            ban_status: banStatus,
            last_updated: new Date().toISOString(),
            source: source,
          },
          { onConflict: 'card_name' }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error setting ban status:', error);
      throw error;
    }
  }

  // Remove a card from banlist (set to unlimited)
  async unbanCard(cardName: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('banlist')
        .delete()
        .eq('card_name', cardName);

      if (error) throw error;
    } catch (error) {
      console.error('Error unbanning card:', error);
      throw error;
    }
  }

  // Batch update from TCG API
  async updateFromTCG(bannedCards: Array<{ name: string; status: BanStatus }>): Promise<void> {
    try {
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
    } catch (error) {
      console.error('Error updating banlist from TCG:', error);
      throw error;
    }
  }
}
