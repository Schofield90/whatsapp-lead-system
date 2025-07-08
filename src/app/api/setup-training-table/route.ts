import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Create the training_data table with proper schema
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS training_data (
        id SERIAL PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id),
        data_type VARCHAR(100) NOT NULL,
        category VARCHAR(100),
        content TEXT NOT NULL,
        question TEXT,
        is_active BOOLEAN DEFAULT true,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_training_data_org_id ON training_data(organization_id);
      CREATE INDEX IF NOT EXISTS idx_training_data_category ON training_data(category);
      CREATE INDEX IF NOT EXISTS idx_training_data_active ON training_data(is_active);

      -- Enable RLS
      ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

      -- Create RLS policy to allow users to see only their organization's data
      DROP POLICY IF EXISTS "Users can view their organization's training data" ON training_data;
      CREATE POLICY "Users can view their organization's training data" ON training_data
        FOR SELECT USING (
          organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
          )
        );

      -- Create RLS policy to allow users to insert training data for their organization
      DROP POLICY IF EXISTS "Users can insert training data for their organization" ON training_data;
      CREATE POLICY "Users can insert training data for their organization" ON training_data
        FOR INSERT WITH CHECK (
          organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
          )
        );

      -- Create RLS policy to allow users to update their organization's training data
      DROP POLICY IF EXISTS "Users can update their organization's training data" ON training_data;
      CREATE POLICY "Users can update their organization's training data" ON training_data
        FOR UPDATE USING (
          organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
          )
        );
    `;

    // Execute the SQL to create table and policies
    const { error: setupError } = await supabase.rpc('exec_sql', { 
      sql: createTableQuery 
    });

    if (setupError) {
      console.error('Error setting up training table:', setupError);
      return NextResponse.json({
        error: 'Failed to set up training table',
        details: setupError.message
      }, { status: 500 });
    }

    console.log('✅ Training data table and policies created successfully');

    return NextResponse.json({
      success: true,
      message: 'Training data table and RLS policies created successfully'
    });

  } catch (error) {
    console.error('Error in setup-training-table:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}