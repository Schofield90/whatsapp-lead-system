-- Fix Supabase RLS infinite recursion issue
-- This script fixes the circular dependency between organizations and users tables

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Organizations can only see their own data" ON organizations;
DROP POLICY IF EXISTS "Users can only see users in their organization" ON users;

-- Create corrected policies that don't create circular dependencies

-- Organizations policy: Users can only see their own organization
CREATE POLICY "Users can only see their own organization" ON organizations
  FOR ALL USING (
    id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Users policy: Users can only see themselves and users in their organization
CREATE POLICY "Users can access their own record and org members" ON users
  FOR ALL USING (
    auth.uid() = id 
    OR organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Add a policy to allow organization creation during onboarding
CREATE POLICY "Allow organization creation during onboarding" ON organizations
  FOR INSERT WITH CHECK (true);

-- Add a policy to allow user creation during onboarding  
CREATE POLICY "Allow user creation during onboarding" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);