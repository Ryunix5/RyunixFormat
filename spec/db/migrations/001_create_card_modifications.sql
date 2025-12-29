-- Migration: create card_modifications table
-- Stores admin modifications to card catalog in JSON form

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS card_modifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  data_creator text NULL,
  data_updater text NULL,
  create_time bigint DEFAULT (extract(epoch from now())::bigint),
  update_time bigint DEFAULT (extract(epoch from now())::bigint)
);

CREATE INDEX IF NOT EXISTS idx_card_modifications_key ON card_modifications (key);
