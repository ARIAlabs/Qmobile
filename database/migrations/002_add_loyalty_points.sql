-- Add loyalty_points column to user_wallets table
-- Points are earned on wallet top-up (1 point per ₦100)
-- Points are NOT deducted on spend - only when rewards feature is active

ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0;

-- Create index for querying users by points (for leaderboards, etc.)
CREATE INDEX IF NOT EXISTS idx_user_wallets_loyalty_points ON user_wallets(loyalty_points DESC);
