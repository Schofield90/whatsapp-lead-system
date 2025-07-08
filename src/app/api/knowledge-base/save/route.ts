import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { type, category, question, content, source, metadata } = await request.json();
    
    if (!type || !content) {
      return NextResponse.json({
        error: 'Missing required fields: type and content'
      }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Create unified knowledge base table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL, -- 'sop', 'call_transcript', 'training_data', 'business_info', etc.
        category VARCHAR(100), -- 'pricing', 'location', 'services', etc.
        question TEXT, -- The question this knowledge answers (if applicable)
        content TEXT NOT NULL, -- The actual knowledge content
        source VARCHAR(100), -- Where this knowledge came from ('manual_entry', 'call_transcript', 'imported', etc.)
        metadata JSONB, -- Any additional data (call_id, user_id, etc.)
        is_active BOOLEAN DEFAULT true,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_type ON knowledge_base(type);
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON knowledge_base(is_active);
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_search ON knowledge_base USING gin(to_tsvector('english', content));
    `;

    // Create the table
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableQuery });
    
    if (tableError) {
      console.log('Table may already exist, continuing with insert...');
    }

    // Insert the knowledge
    const { data: savedEntry, error: saveError } = await supabase
      .from('knowledge_base')
      .insert({
        type,
        category: category || 'general',
        question: question || null,
        content: content.trim(),
        source: source || 'manual_entry',
        metadata: metadata || {},
        is_active: true,
        version: 1
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving to knowledge base:', saveError);
      return NextResponse.json({
        error: 'Failed to save knowledge',
        details: saveError.message,
        code: saveError.code
      }, { status: 500 });
    }

    // Get total count
    const { data: allEntries } = await supabase
      .from('knowledge_base')
      .select('id')
      .eq('is_active', true);

    const totalCount = allEntries?.length || 1;

    console.log('🧠 Knowledge saved to unified knowledge base:', {
      id: savedEntry.id,
      type,
      category,
      content: content.substring(0, 100) + '...',
      total_entries: totalCount
    });

    return NextResponse.json({
      success: true,
      message: `Knowledge saved! You now have ${totalCount} entries in your knowledge base.`,
      data: {
        id: savedEntry.id,
        type,
        category: category || 'general',
        content: content,
        question: question || '',
        saved_at: savedEntry.created_at
      },
      total_count: totalCount
    });

  } catch (error) {
    console.error('Error in save knowledge base:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}