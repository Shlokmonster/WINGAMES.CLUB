-- Add missing columns to match_verifications table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'match_verifications' AND column_name = 'verified_at') THEN
    ALTER TABLE match_verifications ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'match_verifications' AND column_name = 'reviewer_notes') THEN
    ALTER TABLE match_verifications ADD COLUMN reviewer_notes TEXT;
  END IF;
END $$;

-- Add is_admin column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Let's skip the ENUM type for now and just make sure the status column exists
DO $$ 
BEGIN
  -- Check if status column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'match_verifications' AND column_name = 'status') THEN
    ALTER TABLE match_verifications ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add foreign key relationship between match_verifications and profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'match_verifications' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_match_verifications_profiles') THEN
    ALTER TABLE match_verifications ADD COLUMN user_id UUID;
    ALTER TABLE match_verifications ADD CONSTRAINT fk_match_verifications_profiles FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Make sure we have the correct status values in the database
UPDATE match_verifications SET status = 'pending' WHERE status IS NULL;

-- Create an index on the status column for faster queries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'match_verifications' AND indexname = 'match_verifications_status_idx'
  ) THEN
    CREATE INDEX match_verifications_status_idx ON match_verifications(status);
  END IF;
END $$;
