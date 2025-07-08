import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Create the knowledge_base table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        question TEXT,
        content TEXT NOT NULL,
        source VARCHAR(100),
        metadata JSONB,
        is_active BOOLEAN DEFAULT true,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_knowledge_base_type ON knowledge_base(type);
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON knowledge_base(is_active);
    `;

    // Execute the SQL using a raw query
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableQuery });
    
    if (createError) {
      console.error('Error creating knowledge_base table:', createError);
      // Table might already exist, try to query it
      const { data: testData, error: testError } = await supabase
        .from('knowledge_base')
        .select('count')
        .limit(1);
      
      if (testError) {
        return NextResponse.json({
          error: 'Failed to create or access knowledge_base table',
          details: createError.message,
          testError: testError.message
        }, { status: 500 });
      }
    }

    console.log('✅ Knowledge base table ready');

    return NextResponse.json({
      success: true,
      message: 'Knowledge base table created/verified successfully'
    });

  } catch (error) {
    console.error('Error in setup-knowledge-base:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Check if knowledge_base table exists and get count
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        exists: false,
        error: error.message,
        code: error.code
      });
    }

    const { count } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      exists: true,
      count: count || 0,
      message: `Knowledge base table exists with ${count || 0} entries`
    });

  } catch (error) {
    return NextResponse.json({
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}