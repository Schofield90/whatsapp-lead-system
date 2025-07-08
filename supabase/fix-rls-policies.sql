-- Fix RLS policies for the knowledge table
-- This script addresses common issues with inserting data

-- First, check if the table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'knowledge'
);

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity, policies 
FROM pg_tables 
LEFT JOIN (
    SELECT schemaname, tablename, COUNT(*) as policies 
    FROM pg_policies 
    GROUP BY schemaname, tablename
) pol USING (schemaname, tablename)
WHERE tablename = 'knowledge';

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow all operations on knowledge" ON knowledge;
DROP POLICY IF EXISTS "Enable all operations for service role" ON knowledge;
DROP POLICY IF EXISTS "Enable read access for anon users" ON knowledge;
DROP POLICY IF EXISTS "Enable insert access for anon users" ON knowledge;

-- Option 1: Disable RLS entirely (simpler, less secure)
-- Uncomment the next line if you want to completely disable RLS
-- ALTER TABLE knowledge DISABLE ROW LEVEL SECURITY;

-- Option 2: Create proper RLS policies (recommended)
-- Keep RLS enabled but allow operations for both service role and anon users

-- Enable RLS
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Enable all operations for service role" ON knowledge
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Allow anon users to read all records
CREATE POLICY "Enable read access for anon users" ON knowledge
    FOR SELECT 
    TO anon 
    USING (true);

-- Allow anon users to insert records
CREATE POLICY "Enable insert access for anon users" ON knowledge
    FOR INSERT 
    TO anon 
    WITH CHECK (true);

-- Allow anon users to update records (if needed)
CREATE POLICY "Enable update access for anon users" ON knowledge
    FOR UPDATE 
    TO anon 
    USING (true) 
    WITH CHECK (true);

-- Test the policies by attempting an insert
-- (This will only work if run with appropriate permissions)
INSERT INTO knowledge (type, content) VALUES 
('test', 'Test entry to verify RLS policies are working correctly')
RETURNING id, type, created_at;

-- Clean up the test entry
DELETE FROM knowledge WHERE type = 'test' AND content = 'Test entry to verify RLS policies are working correctly';

-- Show final policy status
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'knowledge'
ORDER BY policyname;