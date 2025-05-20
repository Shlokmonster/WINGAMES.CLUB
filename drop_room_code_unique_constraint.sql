-- Migration: Drop unique constraint from games.room_code
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_room_code_key;
