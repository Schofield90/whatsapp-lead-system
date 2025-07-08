-- Test query to verify the knowledge table is working correctly
-- Run this in your Supabase SQL editor after creating the table

-- Check if the table exists and has the correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'knowledge' 
ORDER BY ordinal_position;

-- Check if the indexes were created
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'knowledge';

-- Verify data was inserted correctly
SELECT 
  type,
  COUNT(*) as count,
  MIN(created_at) as first_entry,
  MAX(created_at) as last_entry
FROM knowledge 
GROUP BY type 
ORDER BY type;

-- Sample the first few entries
SELECT 
  id,
  type,
  LEFT(content, 100) as content_preview,
  created_at
FROM knowledge 
ORDER BY created_at DESC 
LIMIT 10;