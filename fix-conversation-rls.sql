-- Add missing RLS policy for conversations table
-- The previous script may have missed this one

-- Check if the policy already exists and drop it if needed
DROP POLICY IF EXISTS "Allow service role conversation operations" ON conversations;

-- Create the policy for conversations
CREATE POLICY "Allow service role conversation operations" ON conversations
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Also ensure messages table has the correct policy
DROP POLICY IF EXISTS "Allow service role message operations" ON messages;

CREATE POLICY "Allow service role message operations" ON messages
  FOR ALL TO service_role
  USING (true) 
  WITH CHECK (true);

-- Test the conversation creation
SELECT 'Conversation RLS policy applied' as status;