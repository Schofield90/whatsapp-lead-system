import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Create calendar_config table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create calendar_config table for storing Google Calendar API credentials
        CREATE TABLE IF NOT EXISTS calendar_config (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            organization_id UUID NOT NULL,
            google_client_id TEXT NOT NULL,
            google_client_secret TEXT NOT NULL,
            google_refresh_token TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(organization_id)
        );

        -- Enable RLS
        ALTER TABLE calendar_config ENABLE ROW LEVEL SECURITY;
      `
    });

    if (error) {
      console.error('Error creating calendar table:', error);
      return NextResponse.json({
        error: 'Failed to create calendar table',
        details: error.message
      }, { status: 500 });
    }

    // Try to create RLS policies (may fail if they already exist)
    await supabase.rpc('exec_sql', {
      sql: `
        -- Create RLS policies
        CREATE POLICY IF NOT EXISTS "Users can view their organization's calendar config"
            ON calendar_config FOR SELECT
            USING (
                organization_id IN (
                    SELECT p.organization_id 
                    FROM profiles p 
                    WHERE p.id = auth.uid()
                )
            );

        CREATE POLICY IF NOT EXISTS "Users can insert their organization's calendar config"
            ON calendar_config FOR INSERT
            WITH CHECK (
                organization_id IN (
                    SELECT p.organization_id 
                    FROM profiles p 
                    WHERE p.id = auth.uid()
                )
            );

        CREATE POLICY IF NOT EXISTS "Users can update their organization's calendar config"
            ON calendar_config FOR UPDATE
            USING (
                organization_id IN (
                    SELECT p.organization_id 
                    FROM profiles p 
                    WHERE p.id = auth.uid()
                )
            );

        CREATE POLICY IF NOT EXISTS "Users can delete their organization's calendar config"
            ON calendar_config FOR DELETE
            USING (
                organization_id IN (
                    SELECT p.organization_id 
                    FROM profiles p 
                    WHERE p.id = auth.uid()
                )
            );
      `
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar config table created successfully',
      data
    });

  } catch (error) {
    console.error('Error in create calendar table API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}