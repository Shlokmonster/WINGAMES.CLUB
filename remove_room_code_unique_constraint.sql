-- Remove the unique constraint on room_code if it exists
ALTER TABLE match_verifications DROP CONSTRAINT IF EXISTS match_verifications_room_code_key;

-- Add a unique constraint on (user_id, room_code) to prevent duplicate claims by the same user
ALTER TABLE match_verifications ADD CONSTRAINT unique_user_room UNIQUE (user_id, room_code);
