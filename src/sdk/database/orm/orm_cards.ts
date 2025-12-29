import { supabase } from '@/lib/supabaseClient';

export interface CardRow {
  id?: string;
  name: string;
  data: Record<string, any>;
  archetypes?: string[];
  create_time?: number;
  update_time?: number;
}

export class CardCatalogORM {
  private static instance: CardCatalogORM | null = null;
  public static getInstance(): CardCatalogORM {
    if (!CardCatalogORM.instance) CardCatalogORM.instance = new CardCatalogORM();
    return CardCatalogORM.instance;
  }

  private table = 'cards';

  async getByName(name: string): Promise<CardRow | null> {
    const { data, error } = await supabase.from(this.table).select('*').ilike('name', name).limit(1).maybeSingle();
    if (error) {
      console.warn('CardCatalogORM.getByName error', { error, name });
      return null;
    }
    if (!data) return null;
    // normalize data: ensure data.data is an object (not JSON string)
    try {
      if (typeof data.data === 'string') {
        data.data = JSON.parse(data.data);
      }
    } catch (e) {
      console.warn('CardCatalogORM.getByName: failed to parse stored data JSON string', { name, err: e });
    }
    return data ?? null;
  }

  async getByArchetype(archetype: string, limit = 200): Promise<CardRow[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .contains('archetypes', [archetype])
      .limit(limit);
    if (error) {
      console.warn('CardCatalogORM.getByArchetype error', { error, archetype });
      return [];
    }
    const rows: CardRow[] = (data ?? []).map((row: any) => {
      try {
        if (typeof row.data === 'string') row.data = JSON.parse(row.data);
      } catch (e) {
        console.warn('CardCatalogORM.getByArchetype: failed to parse stored data JSON string', { archetype, id: row.id, name: row.name, err: e });
      }
      return row as CardRow;
    });
    return rows;
  }

  async bulkUpsert(cards: Array<{ name: string; data: Record<string, any> | string; archetypes?: string[] }>) {
    if (!cards || cards.length === 0) return;
    const payload = cards.map((c) => {
      // Ensure data is an object, not a JSON string
      let normalizedData: any = c.data;
      if (typeof normalizedData === 'string') {
        try {
          normalizedData = JSON.parse(normalizedData);
        } catch (e) {
          // If parsing fails, store as-is but warn
          console.warn('CardCatalogORM.bulkUpsert: data is a string and failed to parse, storing as-is', { name: c.name });
        }
      }
      return {
        name: c.name,
        data: normalizedData,
        archetypes: c.archetypes ?? [],
        update_time: Math.floor(Date.now() / 1000),
      };
    });

    const { error } = await supabase.from(this.table).upsert(payload, { onConflict: 'name' }).select();
    if (error) {
      console.error('CardCatalogORM.bulkUpsert error', { error });
      throw error;
    }
  }

  /**
   * Ensure the given archetype is present on the named card.
   * If the card exists, append archetype to its archetypes array (if missing).
   * If the card does not exist, insert a minimal record (or use provided data) that lists the archetype.
   */
  async ensureArchetypeOnCard(name: string, archetype: string, data?: Record<string, any>) {
    try {
      const existing = await this.getByName(name);
      if (existing) {
        const existingArches = existing.archetypes || [];
        if (!existingArches.includes(archetype)) {
          const newArches = Array.from(new Set([...existingArches, archetype]));
          const payload = [{ name, data: existing.data ?? data ?? { name }, archetypes: newArches, update_time: Math.floor(Date.now() / 1000) }];
          await this.bulkUpsert(payload);
        }
      } else {
        const payload = [{ name, data: data ?? { name }, archetypes: [archetype], update_time: Math.floor(Date.now() / 1000) }];
        await this.bulkUpsert(payload);
      }
    } catch (err) {
      console.warn('CardCatalogORM.ensureArchetypeOnCard error', { name, archetype, err });
      throw err;
    }
  }

  async ping(): Promise<{ ok: boolean; error?: any }> {
    const { data, error } = await supabase.from(this.table).select('name').limit(1);
    return { ok: !error, error };
  }
}
