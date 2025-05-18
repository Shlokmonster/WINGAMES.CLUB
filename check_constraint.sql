-- Check the constraint definition for match_verifications table
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'match_verifications_status_check';
