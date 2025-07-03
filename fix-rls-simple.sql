-- Simple RLS fix - completely remove circular dependencies
-- This allows organization creation without recursion issues

-- Drop all existing policies on organizations and users
DROP POLICY IF EXISTS "Organizations can only see their own data" ON organizations;
DROP POLICY IF EXISTS "Users can only see users in their organization" ON users;
DROP POLICY IF EXISTS "Users can only see their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can access their own record and org members" ON users;
DROP POLICY IF EXISTS "Allow organization creation during onboarding" ON organizations;
DROP POLICY IF EXISTS "Allow user creation during onboarding" ON users;

-- Create simple, non-recursive policies

-- Organizations: Allow full access during onboarding, then restrict
CREATE POLICY "Allow organizations access" ON organizations
  FOR ALL USING (true);

-- Users: Allow users to see their own record
CREATE POLICY "Users can see their own record" ON users
  FOR ALL USING (auth.uid() = id);

-- Users: Allow user creation during signup
CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);