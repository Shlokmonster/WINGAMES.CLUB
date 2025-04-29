-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL UNIQUE,
  bet_amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'active', 'completed', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  winner_id UUID REFERENCES auth.users(id),
  game_data JSONB
);

-- Create game_players table for many-to-many relationship
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  position INTEGER NOT NULL,
  ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Create game_moves table to track game history
CREATE TABLE IF NOT EXISTS game_moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  move_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create RLS policies for games table
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by players" ON games
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM game_players WHERE game_id = id
    )
  );

CREATE POLICY "Games can be created by authenticated users" ON games
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Games can be updated by players" ON games
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM game_players WHERE game_id = id
    )
  );

-- Create RLS policies for game_players table
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game players are viewable by players" ON game_players
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM game_players WHERE game_id = game_id
    )
  );

CREATE POLICY "Game players can be created by authenticated users" ON game_players
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Game players can be updated by the player themselves" ON game_players
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for game_moves table
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game moves are viewable by players" ON game_moves
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM game_players WHERE game_id = game_id
    )
  );

CREATE POLICY "Game moves can be created by players" ON game_moves
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM game_players WHERE game_id = game_id
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for games table
CREATE TRIGGER update_games_updated_at
BEFORE UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 