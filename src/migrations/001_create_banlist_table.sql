-- Create banlist table for storing card ban statuses
CREATE TABLE IF NOT EXISTS banlist (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  card_name VARCHAR(255) NOT NULL UNIQUE,
  ban_status VARCHAR(20) NOT NULL CHECK (ban_status IN ('forbidden', 'limited', 'semi-limited', 'unlimited')),
  source VARCHAR(20) NOT NULL CHECK (source IN ('tcg', 'manual')),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on card_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_banlist_card_name ON banlist(card_name);

-- Create index on ban_status for filtering
CREATE INDEX IF NOT EXISTS idx_banlist_ban_status ON banlist(ban_status);

-- Create index on source to differentiate between TCG and manual entries
CREATE INDEX IF NOT EXISTS idx_banlist_source ON banlist(source);
