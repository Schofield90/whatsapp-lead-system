-- Fix RLS policies to allow service role (webhook) operations
-- Service role should bypass RLS, but adding explicit policies as backup

-- Allow service role to insert lead sources
CREATE POLICY "Allow service role lead source operations" ON lead_sources
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service role to insert leads  
CREATE POLICY "Allow service role lead operations" ON leads
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service role to insert conversations
CREATE POLICY "Allow service role conversation operations" ON conversations
  FOR ALL TO service_role  
  USING (true)
  WITH CHECK (true);

-- Allow service role to insert messages
CREATE POLICY "Allow service role message operations" ON messages
  FOR ALL TO service_role
  USING (true) 
  WITH CHECK (true);

-- Allow service role to read organizations
CREATE POLICY "Allow service role organization read" ON organizations
  FOR SELECT TO service_role
  USING (true);

-- Allow service role to read training data
CREATE POLICY "Allow service role training data read" ON training_data
  FOR SELECT TO service_role
  USING (true);

-- Allow service role to read call transcripts  
CREATE POLICY "Allow service role call transcripts read" ON call_transcripts
  FOR SELECT TO service_role
  USING (true);

-- Check if service role has proper permissions
SELECT 
  'Service role setup check' as status,
  current_setting('request.jwt.claims', true)::json->>'role' as current_role;