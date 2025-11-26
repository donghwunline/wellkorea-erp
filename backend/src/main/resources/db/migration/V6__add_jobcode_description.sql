-- Add description field to jobcodes table
ALTER TABLE jobcodes ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment to the new column
COMMENT ON COLUMN jobcodes.description IS 'Detailed description of the project or JobCode';
