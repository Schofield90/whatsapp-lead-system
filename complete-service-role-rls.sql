-- Complete RLS bypass for service role on ALL tables
-- This ensures the webhook can perform all necessary operations

-- Drop existing service role policies to avoid conflicts
DROP POLICY IF EXISTS "Allow service role organization read" ON organizations;
DROP POLICY IF EXISTS "Allow service role lead source operations" ON lead_sources;
DROP POLICY IF EXISTS "Allow service role lead operations" ON leads;
DROP POLICY IF EXISTS "Allow service role conversation operations" ON conversations;
DROP POLICY IF EXISTS "Allow service role message operations" ON messages;
DROP POLICY IF EXISTS "Allow service role training data read" ON training_data;
DROP POLICY IF EXISTS "Allow service role call transcripts read" ON call_transcripts;
DROP POLICY IF EXISTS "Allow service role bookings operations" ON bookings;

-- Organizations - service role full access
CREATE POLICY "Service role organizations access" ON organizations
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Users - service role full access  
CREATE POLICY "Service role users access" ON users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Lead sources - service role full access
CREATE POLICY "Service role lead_sources access" ON lead_sources
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Leads - service role full access
CREATE POLICY "Service role leads access" ON leads
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Conversations - service role full access
CREATE POLICY "Service role conversations access" ON conversations
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Messages - service role full access
CREATE POLICY "Service role messages access" ON messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Bookings - service role full access
CREATE POLICY "Service role bookings access" ON bookings
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Training data - service role full access
CREATE POLICY "Service role training_data access" ON training_data
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Organization secrets - service role full access
CREATE POLICY "Service role organization_secrets access" ON organization_secrets
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Call transcripts - service role full access (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'call_transcripts') THEN
    EXECUTE 'CREATE POLICY "Service role call_transcripts access" ON call_transcripts FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Call recordings - service role full access (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'call_recordings') THEN
    EXECUTE 'CREATE POLICY "Service role call_recordings access" ON call_recordings FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Verify service role setup
SELECT 
  'Service role RLS policies created for all tables' as status,
  current_user as current_user_check;