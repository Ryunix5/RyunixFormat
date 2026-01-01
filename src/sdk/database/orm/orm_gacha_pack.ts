/**
 * GachaPackORM - ORM for gacha_pack table
 * Manages custom gacha packs created by admin
 */

import { supabase } from '@/lib/supabase';

export interface GachaPackModel {
  id: string;
  name: string;
  description: string;
  pack_type: 'standard' | 'premium';
  single_cost: number;
  multi_cost: number;
  image_url: string;
  cards_archetypes: string[]; // Array of card names or archetype names
  is_active: boolean;
  data_creator: string;
  data_updater: string;
  create_time: string;
  update_time: string;
}

export class GachaPackORM {
  private static instance: GachaPackORM;
  private tableName = 'gacha_pack';

  private constructor() {}

  static getInstance(): GachaPackORM {
    if (!GachaPackORM.instance) {
      GachaPackORM.instance = new GachaPackORM();
    }
    return GachaPackORM.instance;
  }

  /**
   * Get all active gacha packs
   */
  async getActivePacks(): Promise<GachaPackModel[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return (data || []) as GachaPackModel[];
  }

  /**
   * Get all gacha packs (including inactive)
   */
  async getAllPacks(): Promise<GachaPackModel[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('create_time', { ascending: false });
    
    if (error) throw error;
    return (data || []) as GachaPackModel[];
  }

  /**
   * Get pack by ID
   */
  async getPackById(id: string): Promise<GachaPackModel | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as GachaPackModel;
  }

  /**
   * Create new gacha pack
   */
  async createPack(pack: Omit<GachaPackModel, 'id' | 'data_creator' | 'data_updater' | 'create_time' | 'update_time'>): Promise<void> {
    const newPack: Partial<GachaPackModel> = {
      ...pack,
      id: crypto.randomUUID(),
      data_creator: '',
      data_updater: '',
      create_time: String(Math.floor(Date.now() / 1000)),
      update_time: String(Math.floor(Date.now() / 1000)),
    };
    
    const { error } = await supabase
      .from(this.tableName)
      .insert([newPack]);
    
    if (error) throw error;
  }

  /**
   * Update gacha pack
   */
  async updatePack(id: string, updates: Partial<GachaPackModel>): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({
        ...updates,
        update_time: String(Math.floor(Date.now() / 1000)),
      })
      .eq('id', id);
    
    if (error) throw error;
  }

  /**
   * Delete gacha pack
   */
  async deletePack(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  /**
   * Toggle pack active status
   */
  async togglePackActive(id: string): Promise<void> {
    const pack = await this.getPackById(id);
    if (pack) {
      await this.updatePack(id, { is_active: !pack.is_active });
    }
  }
}
