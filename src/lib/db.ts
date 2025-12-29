import { supabase } from "./supabaseClient";

export type UserRow = {
  id: string;
  username: string;
  password_hash: string;
  coin: number;
  is_admin: boolean;
  created_at: string;
};

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from("user")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function createUser(input: {
  username: string;
  password_hash: string;
  coin?: number | string;
  is_admin?: boolean;
}): Promise<UserRow> {
  if (!input.username || input.username.trim().length === 0) {
    throw new Error('username is required');
  }

  const coinVal = typeof input.coin === 'string' ? (Number(input.coin) || 0) : (input.coin ?? 0);

  const { data, error } = await supabase
    .from("user")
    .insert({
      username: input.username,
      password_hash: input.password_hash,
      coin: coinVal,
      is_admin: input.is_admin ?? false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as UserRow;
}
