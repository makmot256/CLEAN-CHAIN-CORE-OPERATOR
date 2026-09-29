-- CleanChain Core Operator — Admin hub tables
-- Run this in the Supabase SQL Editor (safe to re-run).

-- Extra verification columns on waste submissions
ALTER TABLE waste_table ADD COLUMN IF NOT EXISTS tokens_awarded boolean DEFAULT false;
ALTER TABLE waste_table ADD COLUMN IF NOT EXISTS tokens_amount numeric DEFAULT 0;
ALTER TABLE waste_table ADD COLUMN IF NOT EXISTS verified_by text;
ALTER TABLE waste_table ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE waste_table ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE waste_table ADD COLUMN IF NOT EXISTS is_duplicate boolean DEFAULT false;
ALTER TABLE waste_table ADD COLUMN IF NOT EXISTS is_prominent_location boolean DEFAULT false;
ALTER TABLE waste_table ADD COLUMN IF NOT EXISTS tx_hash text;
ALTER TABLE waste_table ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- If an older wallet-address-based app_users table already exists, migrate it in place.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_users' AND column_name = 'wallet_address'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_users' AND column_name = 'blink_username'
  ) THEN
    ALTER TABLE app_users RENAME COLUMN wallet_address TO blink_username;
  END IF;
END $$;

-- Registered / logged-in Blink (Lightning wallet) accounts with admin-managed roles
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blink_username text UNIQUE NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'active',
  notes text,
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Off-chain sats ("Plastic Pennies") ledger — lifetime sats earned per Blink username.
-- Real payouts are sent by the blink-approve-submission Edge Function directly to the
-- user's Blink Lightning Address; this table just tracks totals for the UI.
CREATE TABLE IF NOT EXISTS user_wallet (
  account text PRIMARY KEY,
  token_balance numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallet ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access" ON app_users;
DROP POLICY IF EXISTS "Enable all access" ON user_wallet;

CREATE POLICY "Enable all access" ON app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON user_wallet FOR ALL USING (true) WITH CHECK (true);
