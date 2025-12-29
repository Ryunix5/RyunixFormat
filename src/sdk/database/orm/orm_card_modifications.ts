import { supabase } from '@/lib/supabaseClient';

export interface CardModRow {
  id?: string;
  key: string;
  data: Record<string, any>;
  data_creator?: string;
  data_updater?: string;
  create_time?: number;
  update_time?: number;
}

export class CardModificationsORM {
  private static instance: CardModificationsORM | null = null;
  public static getInstance(): CardModificationsORM {
    if (!CardModificationsORM.instance) {
      CardModificationsORM.instance = new CardModificationsORM();
    }
    return CardModificationsORM.instance;
  }

  private table = 'card_modifications';
  private key = 'card_mods';

  async getMods(): Promise<Record<string, any>> {
    const { data, error } = await supabase.from(this.table).select('*').eq('key', this.key).limit(1).single();
    if (error) {
      // No data is not an error for caller
      console.warn('CardModificationsORM.getMods error', { error });
      return {};
    }
    return data?.data ?? {};
  }

  async upsertMods(mods: Record<string, any>, userId?: string): Promise<void> {
    const payload: Partial<CardModRow> = {
      key: this.key,
      data: mods,
      data_updater: userId ?? undefined,
      update_time: Math.floor(Date.now() / 1000),
    };

    const { error } = await supabase.from(this.table).upsert(payload, { onConflict: 'key' }).select();
    if (error) {
      // Provide a clearer message if table is missing (PGRST205)
      if (error.code === 'PGRST205') {
        const enhanced = new Error(`Supabase table '${this.table}' not found. Run migration file 'spec/db/migrations/001_create_card_modifications.sql' in Supabase SQL Editor or use the Supabase CLI: npx supabase db query --file spec/db/migrations/001_create_card_modifications.sql`);
        // attach original error
        (enhanced as any).original = error;
        console.error('CardModificationsORM.upsertMods error (missing table)', { error, payload });
        throw enhanced;
      }

      console.error('CardModificationsORM.upsertMods error', { error, payload });
      throw error;
    }
  }

  async ping(): Promise<{ ok: boolean; error?: any }> {
    const { data, error } = await supabase.from(this.table).select('key').limit(1);
    return { ok: !error, error };
  }
}
