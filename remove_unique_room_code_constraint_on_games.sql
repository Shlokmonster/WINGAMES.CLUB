-- Remove the unique constraint on room_code in the games table if it exists
ALTER TABLE games DROP CONSTRAINT IF EXISTS unique_room_code;
-- Optionally, add a unique constraint on (room_code, game_type) if needed for multi-game support
-- ALTER TABLE games ADD CONSTRAINT unique_room_code_game_type UNIQUE (room_code, game_type);
