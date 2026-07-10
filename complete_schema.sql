-- =====================================================================
-- WINGAMES.CLUB COMPLETE DATABASE SCHEMA
-- Execute this script in the Supabase SQL Editor to initialize all tables, 
-- constraints, triggers, RPC functions, indexes, storage buckets, and RLS policies.
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLES & CONSTRAINTS
-- ==========================================

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  referral_code TEXT UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0.00,
  total_deposited NUMERIC NOT NULL DEFAULT 0.00,
  total_bet_amount NUMERIC NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Games Table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL, 
  bet_amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'active', 'completed', 'abandoned', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  winner_id UUID REFERENCES auth.users(id),
  game_data JSONB,
  game_type TEXT
);

-- Game Players Table
CREATE TABLE IF NOT EXISTS public.game_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  position INTEGER NOT NULL,
  ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Game Moves Table
CREATE TABLE IF NOT EXISTS public.game_moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  move_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Match Verifications Table
CREATE TABLE IF NOT EXISTS public.match_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_code TEXT NOT NULL,
  screenshot_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'verified', 'rejected')) DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  bet_amount INTEGER DEFAULT 0,
  CONSTRAINT unique_user_room UNIQUE (user_id, room_code)
);

-- Match Loser Confirmations Table
CREATE TABLE IF NOT EXISTS public.match_loser_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, room_code)
);

-- Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_id)
);

-- Referral Rewards Table
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('referrer_bonus', 'referred_bonus')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'credited', 'completed')),
  referral_code TEXT,
  win_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  credited_at TIMESTAMP WITH TIME ZONE
);

-- Deposit Requests Table
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  upi_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  proof_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Withdraw Requests Table
CREATE TABLE IF NOT EXISTS public.withdraw_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  upi_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'win', 'referral', 'referral_bonus', 'admin_adjust', 'withdrawal_reversal', 'bet')),
  amount NUMERIC NOT NULL,
  balance_after NUMERIC,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- KYC Submissions Table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  aadhar_number TEXT NOT NULL,
  front_image_url TEXT NOT NULL,
  back_image_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- ==========================================
-- 2. HELPER FUNCTIONS & TRIGGERS
-- ==========================================

-- Admin Helper Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate Unique Referral Code for Profiles
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::text || RANDOM()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER generate_profile_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Auto-Create Wallet When Profile is Created
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, total_deposited, total_bet_amount)
  VALUES (NEW.id, 0.00, 0.00, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- Normalize Referral Rewards (user_id mapping and status normalization)
CREATE OR REPLACE FUNCTION public.normalize_referral_rewards()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := NEW.referrer_id;
  END IF;
  IF NEW.status = 'completed' THEN
    NEW.status := 'credited';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_normalize_referral_rewards
BEFORE INSERT ON public.referral_rewards
FOR EACH ROW
EXECUTE FUNCTION public.normalize_referral_rewards();

-- Update total_deposited on approved deposits
CREATE OR REPLACE FUNCTION public.update_total_deposited()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR
     (TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved') THEN
    UPDATE public.wallets
    SET total_deposited = total_deposited + NEW.amount
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_total_deposited
AFTER INSERT OR UPDATE ON public.deposit_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_total_deposited();

-- Update updated_at column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_games_updated_at
BEFORE UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: Update Wallet Balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance(user_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, total_deposited, total_bet_amount, updated_at)
  VALUES (user_id, amount, 0.00, 0.00, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET balance = public.wallets.balance + amount,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 3. INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_match_verifications_game_id ON public.match_verifications(game_id);
CREATE INDEX IF NOT EXISTS match_verifications_status_idx ON public.match_verifications(status);


-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Games Policies
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by players and admins" ON public.games
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.game_players WHERE game_id = id)
    OR public.is_admin()
  );

CREATE POLICY "Games can be created by authenticated users" ON public.games
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Games can be updated by players and admins" ON public.games
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.game_players WHERE game_id = id)
    OR public.is_admin()
  );

-- Game Players Policies
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game players are viewable by authenticated users" ON public.game_players
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Game players can be created by authenticated users" ON public.game_players
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Game players can be updated by the player themselves or admins" ON public.game_players
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Game Moves Policies
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game moves are viewable by players and admins" ON public.game_moves
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.game_players WHERE game_id = game_id)
    OR public.is_admin()
  );

CREATE POLICY "Game moves can be created by players" ON public.game_moves
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.game_players WHERE game_id = game_id)
  );

-- Profiles Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Wallets Policies
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wallets are viewable by owner or admin" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Wallets can be updated by owner or admin" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Wallets can be inserted by owner" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wallet Transactions Policies
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wallet transactions are viewable by owner or admin" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Wallet transactions can be inserted by authenticated users or admin" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Deposit Requests Policies
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deposit requests are viewable by owner or admin" ON public.deposit_requests
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Deposit requests can be created by authenticated users" ON public.deposit_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deposit requests can be updated by admin" ON public.deposit_requests
  FOR UPDATE USING (public.is_admin());

-- Withdraw Requests Policies
ALTER TABLE public.withdraw_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Withdraw requests are viewable by owner or admin" ON public.withdraw_requests
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Withdraw requests can be created by authenticated users" ON public.withdraw_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Withdraw requests can be updated by admin" ON public.withdraw_requests
  FOR UPDATE USING (public.is_admin());

-- Match Verifications Policies
ALTER TABLE public.match_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match verifications are viewable by owner or admin" ON public.match_verifications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Match verifications can be created by owner" ON public.match_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Match verifications can be updated by owner or admin" ON public.match_verifications
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Match Loser Confirmations Policies
ALTER TABLE public.match_loser_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match loser confirmations are viewable by owner or admin" ON public.match_loser_confirmations
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Match loser confirmations can be created by owner" ON public.match_loser_confirmations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals Policies
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrals are viewable by referrer, referred, or admin" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.is_admin());

CREATE POLICY "Referrals can be created by authenticated users" ON public.referrals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Referrals can be updated by referrer or admin" ON public.referrals
  FOR UPDATE USING (auth.uid() = referrer_id OR public.is_admin());

-- Referral Rewards Policies
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referral rewards are viewable by user or admin" ON public.referral_rewards
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = referrer_id OR public.is_admin());

-- KYC Submissions Policies
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "KYC submissions are viewable by owner or admin" ON public.kyc_submissions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "KYC submissions can be created by owner" ON public.kyc_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "KYC submissions can be updated by admin" ON public.kyc_submissions
  FOR UPDATE USING (public.is_admin());


-- ==========================================
-- 5. STORAGE BUCKETS & STORAGE RLS POLICIES
-- ==========================================

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('match-screenshots', 'match-screenshots', true),
  ('avatars', 'avatars', true),
  ('deposit-proofs', 'deposit-proofs', true),
  ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 1. match-screenshots storage policies
CREATE POLICY "Users can upload their own screenshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'match-screenshots' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Anyone can view match screenshots" ON storage.objects
    FOR SELECT USING (bucket_id = 'match-screenshots');

-- 2. avatars storage policies
CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- 3. deposit-proofs storage policies
CREATE POLICY "Users can upload deposit proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'deposit-proofs' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Anyone can view deposit proofs" ON storage.objects
    FOR SELECT USING (bucket_id = 'deposit-proofs');

-- 4. kyc-documents storage policies
CREATE POLICY "Users can upload KYC documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'kyc-documents' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Only admins or owner can view KYC documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' AND
        (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
    );
