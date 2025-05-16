-- Create a function to check if a column exists in a table
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS TABLE (exists boolean) AS $$
BEGIN
  RETURN QUERY 
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = check_column_exists.table_name 
    AND column_name = check_column_exists.column_name
  );
END;
$$ LANGUAGE plpgsql;
