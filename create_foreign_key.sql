-- First, add a game_id column to the match_verifications table if it doesn't exist
ALTER TABLE match_verifications 
ADD COLUMN IF NOT EXISTS game_id UUID;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_match_verifications_game_id 
ON match_verifications(game_id);

-- Add foreign key constraint
ALTER TABLE match_verifications
ADD CONSTRAINT fk_match_verifications_game_id
FOREIGN KEY (game_id) 
REFERENCES games(id)
ON DELETE SET NULL;

-- Update any existing match verifications to link to games with the same room_code
-- This is a best-effort approach to link existing records
UPDATE match_verifications mv
SET game_id = g.id
FROM games g
WHERE mv.room_code = g.room_code
AND mv.game_id IS NULL
AND g.id IS NOT NULL;
