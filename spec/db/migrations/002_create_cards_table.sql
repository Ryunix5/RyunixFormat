-- Migration: create cards table
-- Stores full card objects fetched from YGOPRODECK for fast player lookups

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  archetypes text[] DEFAULT ARRAY[]::text[],
  create_time bigint DEFAULT (extract(epoch from now())::bigint),
  update_time bigint DEFAULT (extract(epoch from now())::bigint)
);

CREATE INDEX IF NOT EXISTS idx_cards_name_lower ON cards (lower(name));
CREATE INDEX IF NOT EXISTS idx_cards_archetypes ON cards USING GIN (archetypes);
