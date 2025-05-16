-- Create referrals table to track user referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_id)
);

-- Create referral_rewards table to track rewards earned from referrals
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('referrer_bonus', 'referred_bonus')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'credited')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  credited_at TIMESTAMP WITH TIME ZONE
);

-- Add referral_code field to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Add foreign key relationship between match_verifications and profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'match_verifications' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_match_verifications_profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'match_verifications' AND column_name = 'user_id') THEN
    ALTER TABLE match_verifications ADD COLUMN user_id UUID;
  END IF;
    ALTER TABLE match_verifications ADD CONSTRAINT fk_match_verifications_profiles FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create RLS policies for referrals table if they don't exist
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Check if policies exist before creating them
DO $$ 
BEGIN
  -- Drop existing policies to avoid errors
  DROP POLICY IF EXISTS "Users can view their own referrals" ON referrals;
  DROP POLICY IF EXISTS "Users can insert their own referrals" ON referrals;
  DROP POLICY IF EXISTS "Users can update their own referrals" ON referrals;
  
  -- Create policies
  DO $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view their own referrals' AND tablename = 'referrals') INTO policy_exists;
  IF NOT policy_exists THEN
    EXECUTE 'CREATE POLICY "Users can view their own referrals" ON referrals FOR SELECT USING ((auth.uid() = referrer_id) OR (auth.uid() = referred_id));';
  END IF;
END $$;
    
  CREATE POLICY "Users can insert their own referrals" 
    ON referrals FOR INSERT 
    WITH CHECK (auth.uid() = referrer_id);
    
  CREATE POLICY "Users can update their own referrals" 
    ON referrals FOR UPDATE 
    USING (auth.uid() = referrer_id);
END $$;

CREATE POLICY "Users can view their own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policies for referral_rewards table
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = user_id);

-- Create function to generate unique referral code for new users
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a random 8-character alphanumeric code
  NEW.referral_code = UPPER(SUBSTRING(MD5(NEW.id::text || RANDOM()::text) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate referral code for new profiles
CREATE TRIGGER generate_profile_referral_code
BEFORE INSERT ON profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION generate_referral_code();
